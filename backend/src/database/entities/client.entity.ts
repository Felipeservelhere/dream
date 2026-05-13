import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, Index,
} from 'typeorm';

@Entity('clients')
@Index(['tenantId', 'phone'], { unique: true })
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tenantId: string;

  @Column()
  phone: string; // número normalizado E.164: +5511999999999

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  email: string;

  // Dados extras do perfil (flexível por nicho)
  @Column({ type: 'simple-json', nullable: true })
  profile: {
    birthdate?: string;
    cpf?: string;
    address?: object;
    healthPlan?: string;    // clínica
    vehicleModel?: string;  // oficina
    preferences?: object;
    [key: string]: any;
  };

  @Column({ type: 'simple-array', default: '' })
  tags: string[];

  // Notas dos atendentes
  @Column({ type: 'text', nullable: true })
  notes: string;

  // Estatísticas de relacionamento
  @Column({ type: 'simple-json', nullable: true })
  stats: {
    totalConversations: number;
    lastInteractionAt: string;
    lastBookingAt?: string;
    totalBookings: number;
    npsScore?: number;
  };

  @Column({ default: false })
  isBlocked: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


