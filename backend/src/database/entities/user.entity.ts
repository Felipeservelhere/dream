import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin', // dono da plataforma SaaS
  OWNER = 'owner',             // dono da empresa cliente
  ADMIN = 'admin',
  MANAGER = 'manager',
  ATTENDANT = 'attendant',
  VIEWER = 'viewer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  tenantId: string;

  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'varchar', enum: UserRole, default: UserRole.ATTENDANT })
  role: UserRole;

  @Column({ type: 'simple-json', nullable: true })
  permissions: {
    canSeeAllConversations?: boolean;
    canEditFlows?: boolean;
    canEditAutomations?: boolean;
    canExportData?: boolean;
    canManageUsers?: boolean;
    canViewBilling?: boolean;
    canManageAI?: boolean;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


