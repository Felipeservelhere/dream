import {
  Controller, Get, Post, Put, Body, Param,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../core/auth/guards/roles.guard';
import { CurrentUser } from '../core/auth/decorators/current-user.decorator';
import { TenancyService } from '../core/tenancy/tenancy.service';
import { Tenant, TenantNiche, TenantPlan } from '../database/entities/tenant.entity';
import { User, UserRole } from '../database/entities/user.entity';
import { AiConfig } from '../database/entities/ai-config.entity';
import { Client } from '../database/entities/client.entity';
import { Conversation } from '../database/entities/conversation.entity';
import { Message } from '../database/entities/message.entity';
import { IsString, IsOptional, IsEnum } from 'class-validator';

class CreateTenantDto {
  @IsString() name: string;
  @IsString() subdomain: string;
  @IsEnum(TenantNiche) @IsOptional() niche?: TenantNiche;
}

class UpdateAiConfigDto {
  @IsString() @IsOptional() assistantName?: string;
  @IsString() @IsOptional() systemPrompt?: string;
  @IsString() @IsOptional() tone?: string;
  @IsOptional() businessContext?: Record<string, any>;
  @IsOptional() faqs?: any[];
  @IsOptional() humanHandoffKeywords?: string[];
}

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly tenancyService: TenancyService,
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(AiConfig) private readonly aiConfigRepo: Repository<AiConfig>,
    @InjectRepository(Client) private readonly clientRepo: Repository<Client>,
    @InjectRepository(Conversation) private readonly convRepo: Repository<Conversation>,
    @InjectRepository(Message) private readonly msgRepo: Repository<Message>,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Dados do tenant atual' })
  async getMyTenant(@CurrentUser() user: User) {
    return this.tenancyService.findById(user.tenantId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Listar todos os tenants' })
  async findAll() {
    return this.tenancyService.findAll();
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[Admin] Criar novo tenant' })
  async create(@Body() dto: CreateTenantDto) {
    const tenant = await this.tenancyService.create({
      name: dto.name,
      subdomain: dto.subdomain,
      niche: dto.niche || TenantNiche.CLINIC,
    });

    // Cria config de IA padrão
    await this.aiConfigRepo.save(
      this.aiConfigRepo.create({
        tenantId: tenant.id,
        assistantName: 'Sofia',
        systemPrompt: `Você é Sofia, recepcionista virtual de ${tenant.name}. Seja sempre gentil e profissional.`,
        tone: 'friendly',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 500,
        businessContext: { businessName: tenant.name },
        faqs: [],
        humanHandoffKeywords: ['falar com atendente', 'humano', 'pessoa real'],
      } as any),
    );

    return tenant;
  }

  @Get('me/whatsapp-status')
  @ApiOperation({ summary: 'Status da conexão WhatsApp' })
  async getWhatsappStatus(@CurrentUser() user: User) {
    const tenant = await this.tenancyService.findById(user.tenantId);
    const instanceName = (tenant as any)?.whatsappInstance?.instanceName
      || process.env.EVOLUTION_INSTANCE_NAME;
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY;

    if (!evolutionUrl || !evolutionKey || !instanceName) {
      return { status: 'not_configured', instanceName: null };
    }
    try {
      const res = await fetch(`${evolutionUrl}/instance/connectionState/${instanceName}`, {
        headers: { apikey: evolutionKey },
        signal: AbortSignal.timeout(5000),
      });
      const data: any = await res.json();
      return { status: data?.instance?.state ?? 'unknown', instanceName };
    } catch {
      return { status: 'unreachable', instanceName };
    }
  }

  @Get('me/whatsapp-qr')
  @ApiOperation({ summary: 'QR code para conectar WhatsApp' })
  async getWhatsappQr(@CurrentUser() user: User) {
    const tenant = await this.tenancyService.findById(user.tenantId);
    const instanceName = (tenant as any)?.whatsappInstance?.instanceName
      || process.env.EVOLUTION_INSTANCE_NAME;
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY;
    if (!evolutionUrl || !evolutionKey || !instanceName) {
      return { qr: null, error: 'not_configured' };
    }
    try {
      const res = await fetch(`${evolutionUrl}/instance/connect/${instanceName}`, {
        headers: { apikey: evolutionKey },
        signal: AbortSignal.timeout(10000),
      });
      const data: any = await res.json();
      return { qr: data?.base64 ?? data?.qrcode?.base64 ?? null, code: data?.code ?? null };
    } catch {
      return { qr: null, error: 'unreachable' };
    }
  }

  @Post('me/whatsapp-sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Importar todas as conversas do WhatsApp para o banco' })
  async syncWhatsappChats(@CurrentUser() user: User) {
    const tenant = await this.tenancyService.findById(user.tenantId);
    const instanceName = (tenant as any)?.whatsappInstance?.instanceName
      || process.env.EVOLUTION_INSTANCE_NAME;
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY;

    if (!evolutionUrl || !evolutionKey || !instanceName) {
      return { synced: 0, total: 0, error: 'not_configured' };
    }

    try {
      // Fetch chat list from Evolution API
      const res = await fetch(`${evolutionUrl}/chat/findChats/${instanceName}`, {
        method: 'POST',
        headers: { apikey: evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(15000),
      });
      const chats: any[] = await res.json();
      const individualChats = (Array.isArray(chats) ? chats : [])
        .filter((c) => !c.remoteJid?.endsWith('@g.us'));

      // Clear all existing data for this tenant before reimporting
      await this.msgRepo.delete({ tenantId: user.tenantId });
      await this.convRepo.delete({ tenantId: user.tenantId });
      await this.clientRepo.delete({ tenantId: user.tenantId });

      let synced = 0;
      for (const chat of individualChats) {
        try {
          const phone = chat.remoteJid as string;
          const name = (chat.pushName && chat.pushName !== phone) ? chat.pushName : phone;

          const client = await this.clientRepo.save(
            this.clientRepo.create({ tenantId: user.tenantId, phone, name }),
          );

          const conv = this.convRepo.create({ tenantId: user.tenantId, clientId: client.id });
          if (chat.updatedAt) (conv as any).updatedAt = new Date(chat.updatedAt);
          await this.convRepo.save(conv);
          synced++;
        } catch { /* skip failed chats */ }
      }

      return { synced, total: individualChats.length };
    } catch {
      return { synced: 0, total: 0, error: 'unreachable' };
    }
  }

  @Post('me/whatsapp-disconnect')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Desconectar WhatsApp' })
  async disconnectWhatsapp(@CurrentUser() user: User) {
    const tenant = await this.tenancyService.findById(user.tenantId);
    const instanceName = (tenant as any)?.whatsappInstance?.instanceName
      || process.env.EVOLUTION_INSTANCE_NAME;
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY;
    if (!evolutionUrl || !evolutionKey || !instanceName) {
      return { success: false, error: 'not_configured' };
    }
    try {
      await fetch(`${evolutionUrl}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: { apikey: evolutionKey },
        signal: AbortSignal.timeout(8000),
      });
      return { success: true };
    } catch {
      return { success: false, error: 'unreachable' };
    }
  }

  @Get(':id/ai-config')
  @ApiOperation({ summary: 'Configuração de IA do tenant' })
  async getAiConfig(@Param('id') id: string) {
    return this.aiConfigRepo.findOne({ where: { tenantId: id } });
  }

  @Put(':id/ai-config')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Atualizar configuração de IA' })
  async updateAiConfig(@Param('id') id: string, @Body() dto: UpdateAiConfigDto) {
    const existing = await this.aiConfigRepo.findOne({ where: { tenantId: id } });
    if (existing) {
      await this.aiConfigRepo.update(existing.id, dto as any);
      return this.aiConfigRepo.findOne({ where: { tenantId: id } });
    }
    return this.aiConfigRepo.save(
      this.aiConfigRepo.create({ tenantId: id, ...dto } as any),
    );
  }
}
