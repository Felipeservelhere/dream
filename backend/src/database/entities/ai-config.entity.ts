import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ai_configs')
export class AiConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  tenantId: string;

  // Persona da IA
  @Column({ default: 'Assistente' })
  assistantName: string;

  // Instruções de sistema (prompt base)
  @Column({ type: 'text' })
  systemPrompt: string;

  // Tom da conversa
  @Column({ default: 'friendly' })
  tone: string; // 'formal' | 'friendly' | 'professional' | 'casual'

  // Provedor de IA preferido
  @Column({ default: 'openai' })
  provider: string; // 'openai' | 'anthropic'

  @Column({ default: 'gpt-4o-mini' })
  model: string;

  @Column({ type: 'float', default: 0.7 })
  temperature: number;

  // Contexto do negócio (injetado em todo prompt)
  @Column({ type: 'simple-json', nullable: true })
  businessContext: {
    businessName?: string;
    businessType?: string;
    address?: string;
    phone?: string;
    workingHours?: string;
    services?: string[];
    specialties?: string[];
    [key: string]: any;
  };

  // FAQ estático (fallback antes de chamar LLM)
  @Column({ type: 'simple-json', nullable: true })
  faqs: Array<{
    question: string;
    answer: string;
    keywords: string[];
  }>;

  // Respostas que forçam transferência para humano
  @Column({ type: 'simple-array', default: '' })
  humanHandoffKeywords: string[];

  // Número máximo de tokens por resposta
  @Column({ default: 500 })
  maxTokens: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


