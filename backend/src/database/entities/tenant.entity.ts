import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';

export enum TenantPlan {
  TRIAL = 'trial',
  STARTER = 'starter',
  PRO = 'pro',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}

export enum TenantNiche {
  CLINIC = 'clinic',
  WORKSHOP = 'workshop',
  RESTAURANT = 'restaurant',
  AGRO = 'agro',
  RETAIL = 'retail',
  GENERAL = 'general',
}

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  CANCELLED = 'cancelled',
}

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  subdomain: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'varchar', enum: TenantPlan, default: TenantPlan.TRIAL })
  plan: TenantPlan;

  @Column({ type: 'varchar', enum: TenantNiche, default: TenantNiche.GENERAL })
  niche: TenantNiche;

  @Column({ type: 'varchar', enum: TenantStatus, default: TenantStatus.TRIAL })
  status: TenantStatus;

  // Limites do plano
  @Column({ type: 'simple-json', nullable: true })
  planLimits: {
    messagesPerMonth: number;
    aiCallsPerMonth: number;
    maxAttendants: number;
    maxAutomations: number;
    maxFlows: number;
  };

  // Uso atual do ciclo
  @Column({ type: 'simple-json', nullable: true })
  currentUsage: {
    messagesThisMonth: number;
    aiCallsThisMonth: number;
    cycleResetAt: string;
  };

  // Configurações gerais do tenant
  @Column({ type: 'simple-json', nullable: true })
  settings: {
    timezone?: string;
    language?: string;
    businessHours?: object;
    webhookUrl?: string;
  };

  // Configuração da instância WhatsApp
  @Column({ type: 'simple-json', nullable: true })
  whatsappInstance: {
    instanceName: string;
    instanceKey: string;
    connected: boolean;
    phone: string;
  };

  @Column({ type: 'datetime', nullable: true })
  trialEndsAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


