import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AutomationTriggerType {
  BOOKING_CREATED = 'booking_created',
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_COMPLETED = 'booking_completed',
  NO_SHOW = 'no_show',
  SCHEDULE = 'schedule',            // cron-based
  INACTIVITY = 'inactivity',        // cliente sem interagir por X dias
  WAITING_LIST = 'waiting_list',    // vaga abriu na fila
  CONVERSATION_OPENED = 'conversation_opened',
  CONVERSATION_RESOLVED = 'conversation_resolved',
  CUSTOM_EVENT = 'custom_event',
}

export enum AutomationActionType {
  SEND_MESSAGE = 'send_message',
  SEND_TEMPLATE = 'send_template',
  ADD_TAG = 'add_tag',
  REMOVE_TAG = 'remove_tag',
  UPDATE_CLIENT = 'update_client',
  ASSIGN_ATTENDANT = 'assign_attendant',
  START_FLOW = 'start_flow',
  CALL_WEBHOOK = 'call_webhook',
  CREATE_BOOKING = 'create_booking',
}

@Entity('automations')
export class Automation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'simple-json', nullable: true })
  trigger: {
    type: AutomationTriggerType;
    // Para SCHEDULE: cron expression
    cron?: string;
    // Para INACTIVITY: dias
    inactivityDays?: number;
    // Para SCHEDULE com delay relativo a evento
    delayMinutes?: number;
    delayFrom?: string; // campo de referência (ex: 'booking.scheduledAt')
  };

  @Column({ type: 'simple-json', nullable: true })
  conditions: Array<{
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'in' | 'not_in';
    value: any;
  }>;

  @Column({ type: 'simple-json', nullable: true })
  actions: Array<{
    type: AutomationActionType;
    config: Record<string, any>;
    // delay entre ações em segundos
    delaySeconds?: number;
  }>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  executionCount: number;

  @Column({ nullable: true })
  lastExecutedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


