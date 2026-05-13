import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, Index, ManyToOne, JoinColumn,
} from 'typeorm';
import { Client } from './client.entity';
import { User } from './user.entity';

export enum ConversationStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_HUMAN = 'waiting_human',
  WITH_HUMAN = 'with_human',
  RESOLVED = 'resolved',
  ABANDONED = 'abandoned',
}

export enum ConversationChannel {
  WHATSAPP = 'whatsapp',
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tenantId: string;

  @Column()
  clientId: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ type: 'varchar', enum: ConversationStatus, default: ConversationStatus.OPEN })
  status: ConversationStatus;

  @Column({ type: 'varchar', enum: ConversationChannel, default: ConversationChannel.WHATSAPP })
  channel: ConversationChannel;

  // Atendente humano responsável (quando transferido)
  @Column({ nullable: true })
  assignedToId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  // Fluxo ativo no momento
  @Column({ nullable: true })
  activeFlowId: string;

  @Column({ nullable: true })
  activeFlowNodeId: string;

  // Dados coletados durante o fluxo atual
  @Column({ type: 'simple-json', nullable: true })
  collectedData: Record<string, any>;

  // Contexto para a IA
  @Column({ type: 'simple-json', nullable: true })
  aiContext: Array<{ role: string; content: string }>;

  // Metadados
  @Column({ type: 'simple-json', nullable: true })
  metadata: {
    lastMessageAt?: string;
    messageCount?: number;
    humanTookOverAt?: string;
    resolvedAt?: string;
    resolution?: string;
    npsAsked?: boolean;
    npsScore?: number;
  };

  @Column({ nullable: true })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


