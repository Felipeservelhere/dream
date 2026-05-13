import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

export enum MessageDirection {
  INBOUND = 'inbound',   // cliente → plataforma
  OUTBOUND = 'outbound', // plataforma → cliente
}

export enum MessageType {
  TEXT = 'text',
  AUDIO = 'audio',
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
  LOCATION = 'location',
  BUTTON_REPLY = 'button_reply',
  LIST_REPLY = 'list_reply',
  STICKER = 'sticker',
}

export enum MessageSender {
  CLIENT = 'client',
  AI = 'ai',
  HUMAN = 'human',
  SYSTEM = 'system',
  AUTOMATION = 'automation',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tenantId: string;

  @Column()
  @Index()
  conversationId: string;

  @Column()
  clientId: string;

  @Column({ type: 'varchar', enum: MessageDirection })
  direction: MessageDirection;

  @Column({ type: 'varchar', enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Column({ type: 'varchar', enum: MessageSender })
  sender: MessageSender;

  // Conteúdo da mensagem
  @Column({ type: 'text', nullable: true })
  text: string;

  // Para mídias: URL no storage
  @Column({ nullable: true })
  mediaUrl: string;

  // Para áudio: transcrição do Whisper
  @Column({ type: 'text', nullable: true })
  transcription: string;

  // ID da mensagem no WhatsApp (para correlação)
  @Column({ nullable: true })
  externalId: string;

  // Intenção detectada pela IA
  @Column({ nullable: true })
  detectedIntent: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}


