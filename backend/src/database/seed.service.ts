import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantNiche, TenantPlan, TenantStatus } from '../database/entities/tenant.entity';
import { User, UserRole } from '../database/entities/user.entity';
import { AiConfig } from '../database/entities/ai-config.entity';
import { Flow } from '../database/entities/flow.entity';
import { CLINIC_FLOW_SEED } from '../niches/clinic/clinic-flow.seed';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(AiConfig) private readonly aiConfigRepo: Repository<AiConfig>,
    @InjectRepository(Flow) private readonly flowRepo: Repository<Flow>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedDemoData();
  }

  private async seedDemoData() {
    // Verifica se já foi criado
    const existingTenant = await this.tenantRepo.findOne({ where: { subdomain: 'demo-clinica' } });
    if (existingTenant) return;

    this.logger.log('🌱 Criando dados de demonstração...');

    // 1. Criar tenant demo (clínica)
    const tenantEntity = this.tenantRepo.create({
      name: 'Clínica Demo',
      subdomain: 'demo-clinica',
      niche: TenantNiche.CLINIC,
      plan: TenantPlan.TRIAL,
      status: TenantStatus.TRIAL,
    } as Tenant);
    const tenant = await this.tenantRepo.save(tenantEntity) as Tenant;

    // 2. Criar usuário owner
    const passwordHash = await bcrypt.hash('demo123', 12);
    await this.userRepo.save(
      this.userRepo.create({
        name: 'Felipe Demo',
        email: 'demo@clinica.com',
        passwordHash,
        tenantId: tenant.id,
        role: UserRole.OWNER,
        permissions: {
          canSeeAllConversations: true,
          canEditFlows: true,
          canEditAutomations: true,
          canExportData: true,
          canManageUsers: true,
          canViewBilling: true,
          canManageAI: true,
        },
      } as any),
    );

    // 3. Criar configuração de IA
    await this.aiConfigRepo.save(
      this.aiConfigRepo.create({
        tenantId: tenant.id,
        assistantName: 'Sofia',
        systemPrompt: 'Você é Sofia, recepcionista virtual da Clínica Demo. Seja sempre gentil, profissional e objetiva. Responda em português brasileiro.',
        tone: 'friendly',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 500,
        businessContext: {
          businessName: 'Clínica Demo',
          businessType: 'Clínica Médica',
          workingHours: 'Segunda a Sexta das 8h às 18h, Sábado das 8h às 12h',
          services: ['Clínico Geral', 'Cardiologia', 'Dermatologia', 'Ortopedia'],
        },
        faqs: [
          {
            question: 'Qual o endereço?',
            answer: '📍 Estamos na Rua das Flores, 123 - Centro. Fácil acesso por transporte público!',
            keywords: ['endereço', 'localização', 'onde', 'fica'],
          },
          {
            question: 'Aceita plano de saúde?',
            answer: '✅ Sim! Aceitamos os principais planos: Unimed, Amil, Bradesco Saúde, Sul América e outros. Confirme o seu pelo WhatsApp.',
            keywords: ['plano', 'convênio', 'saúde', 'aceita'],
          },
          {
            question: 'Como funciona o agendamento?',
            answer: '📅 Você pode agendar direto por aqui! Basta me dizer qual especialidade e a data preferida. Vou verificar os horários disponíveis para você.',
            keywords: ['como agendar', 'marcar', 'consulta', 'horário'],
          },
        ],
        humanHandoffKeywords: ['falar com atendente', 'atendente', 'pessoa real', 'humano', 'urgente', 'emergência'],
      } as any),
    );

    // 4. Criar fluxo da clínica
    await this.flowRepo.save(
      this.flowRepo.create({ ...CLINIC_FLOW_SEED, tenantId: tenant.id } as any),
    );

    this.logger.log('✅ Dados de demonstração criados!');
    this.logger.log('   👤 Login: demo@clinica.com | Senha: demo123');
    this.logger.log(`   🏥 Tenant ID: ${tenant.id}`);
  }
}
