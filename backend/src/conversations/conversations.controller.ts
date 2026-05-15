import {
  Controller, Get, Post, Param, Body, UseGuards, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '../core/auth/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';
import { Conversation, ConversationStatus } from '../database/entities/conversation.entity';
import { Message } from '../database/entities/message.entity';
import { Client } from '../database/entities/client.entity';
import { HandoffService } from '../handoff/handoff.service';
import { MessageDispatcherService } from '../messaging/dispatcher/message-dispatcher.service';
import { IsString } from 'class-validator';

class SendMessageDto {
  @IsString() text: string;
}

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(
    @InjectRepository(Conversation) private readonly convRepo: Repository<Conversation>,
    @InjectRepository(Message) private readonly msgRepo: Repository<Message>,
    @InjectRepository(Client) private readonly clientRepo: Repository<Client>,
    private readonly handoffService: HandoffService,
    private readonly dispatcher: MessageDispatcherService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar conversas do tenant' })
  async list(
    @CurrentUser() user: User,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const query = this.convRepo.createQueryBuilder('c')
      .leftJoinAndSelect('c.client', 'client')
      .leftJoinAndSelect('c.assignedTo', 'assignedTo')
      .where('c.tenantId = :tenantId', { tenantId: user.tenantId })
      .orderBy('c.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status && status !== 'all') {
      query.andWhere('c.status = :status', { status });
    }

    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de uma conversa' })
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.convRepo.findOne({
      where: { id, tenantId: user.tenantId },
      relations: ['client', 'assignedTo'],
    });
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Mensagens de uma conversa' })
  async messages(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query('limit') limit = 50,
  ) {
    const dbMessages = await this.msgRepo.find({
      where: { conversationId: id, tenantId: user.tenantId },
      order: { createdAt: 'ASC' },
      take: limit,
    });
    if (dbMessages.length > 0) return { data: dbMessages, total: dbMessages.length };

    // No DB messages — fetch live from Evolution API using the client's phone
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY;
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME;

    const conv = await this.convRepo.findOne({ where: { id, tenantId: user.tenantId } });
    const client = conv?.clientId
      ? await this.clientRepo.findOne({ where: { id: conv.clientId } })
      : null;

    if (!evolutionUrl || !evolutionKey || !instanceName || !client?.phone) {
      return { data: [], total: 0 };
    }

    try {
      const res = await fetch(`${evolutionUrl}/chat/findMessages/${instanceName}`, {
        method: 'POST',
        headers: { apikey: evolutionKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ where: { key: { remoteJid: client.phone } }, limit: Number(limit) }),
        signal: AbortSignal.timeout(10000),
      });
      const raw: any = await res.json();
      const records: any[] = raw?.messages?.records || [];

      const data = records
        .sort((a, b) => a.messageTimestamp - b.messageTimestamp)
        .map((msg) => ({
          id: msg.id,
          conversationId: id,
          tenantId: user.tenantId,
          direction: msg.key?.fromMe ? 'outbound' : 'inbound',
          sender: msg.key?.fromMe ? 'ai' : 'client',
          type: 'text',
          text: msg.message?.conversation
            ?? msg.message?.extendedTextMessage?.text
            ?? msg.message?.imageMessage?.caption
            ?? msg.message?.videoMessage?.caption
            ?? `[${msg.messageType}]`,
          createdAt: new Date(msg.messageTimestamp * 1000),
        }));

      return { data, total: data.length };
    } catch {
      return { data: [], total: 0 };
    }
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Enviar mensagem como atendente humano' })
  async send(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: User,
  ) {
    const conv = await this.convRepo.findOne({
      where: { id, tenantId: user.tenantId },
      relations: ['client'],
    });
    if (!conv) return { error: 'Not found' };

    await this.dispatcher.send(user.tenantId, conv.client.phone, {
      type: 'text',
      text: dto.text,
    });

    return { ok: true };
  }

  @Post(':id/takeover')
  @ApiOperation({ summary: 'Atendente assume a conversa' })
  async takeover(@Param('id') id: string, @CurrentUser() user: User) {
    const conv = await this.convRepo.findOne({ where: { id }, relations: ['client'] });
    if (!conv) return { error: 'Not found' };
    return this.handoffService.humanTakeover(id, user.id, conv.client?.phone || '');
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Marcar conversa como resolvida' })
  async resolve(@Param('id') id: string) {
    return this.handoffService.resolve(id, 'resolved by attendant');
  }

  @Post(':id/return-to-ai')
  @ApiOperation({ summary: 'Devolver conversa para a IA' })
  async returnToAi(@Param('id') id: string, @CurrentUser() user: User) {
    const conv = await this.convRepo.findOne({ where: { id }, relations: ['client'] });
    if (!conv) return { error: 'Not found' };
    return this.handoffService.returnToAi(id, conv.client?.phone || '');
  }
}
