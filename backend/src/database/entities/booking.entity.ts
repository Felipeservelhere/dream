import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, Index,
} from 'typeorm';

export enum BookingStatus {
  PENDING = 'pending',           // aguardando confirmação
  CONFIRMED = 'confirmed',       // confirmado
  CANCELLED = 'cancelled',       // cancelado
  RESCHEDULED = 'rescheduled',   // remarcado
  COMPLETED = 'completed',       // realizado
  NO_SHOW = 'no_show',           // faltou
}

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  name: string; // "Dra. Ana", "Sala 1", "Mesa 3"

  @Column()
  type: string; // "doctor", "room", "table", "mechanic"

  // Configuração de disponibilidade (grade de horários)
  @Column({ type: 'simple-json', nullable: true })
  availability: {
    weekdays: {
      [day: string]: Array<{ start: string; end: string; slotDuration: number }>;
    };
    exceptions: Array<{ date: string; available: boolean; reason?: string }>;
  };

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>; // especialidade, planos aceitos, etc

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tenantId: string;

  @Column()
  clientId: string;

  @Column()
  resourceId: string;

  @Column({ type: 'timestamp' })
  scheduledAt: Date;

  @Column({ type: 'int', default: 30 })
  durationMinutes: number;

  @Column({ type: 'varchar', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Referência ao agendamento anterior se foi remarcado
  @Column({ nullable: true })
  previousBookingId: string;

  // Lembretes já enviados
  @Column({ type: 'simple-json', nullable: true })
  remindersSent: Array<{ type: string; sentAt: string }>;

  // NPS pós-atendimento
  @Column({ nullable: true })
  npsScore: number;

  @Column({ nullable: true })
  npsFeedback: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


