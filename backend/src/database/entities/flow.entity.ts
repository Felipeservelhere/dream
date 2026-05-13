import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum FlowNodeType {
  MESSAGE = 'message',         // envia mensagem
  QUESTION = 'question',       // pergunta e aguarda resposta
  CONDITION = 'condition',     // bifurcação por condição
  ACTION = 'action',           // executa ação (API, DB)
  AI_HANDOVER = 'ai_handover', // passa para IA livre
  HUMAN_HANDOFF = 'human_handoff', // transfere para humano
  END = 'end',                 // fim do fluxo
}

export interface FlowNode {
  id: string;
  type: FlowNodeType;
  label: string;
  // Conteúdo depende do tipo
  config: {
    // MESSAGE / QUESTION
    text?: string;
    buttons?: Array<{ id: string; label: string }>;
    listItems?: Array<{ id: string; title: string; description?: string }>;
    waitTimeout?: number; // segundos antes de timeout
    timeoutNodeId?: string;
    // CONDITION
    variable?: string;
    operator?: string;
    value?: string;
    // ACTION
    actionType?: string; // 'create_booking' | 'send_file' | 'webhook' | ...
    actionConfig?: Record<string, any>;
  };
  // Mapa de resposta → próximo nó
  transitions: Array<{
    match?: string | string[]; // valor que ativa esta transição
    isDefault?: boolean;       // transição padrão se nenhum match
    nextNodeId: string;
  }>;
  position?: { x: number; y: number }; // para o editor visual
}

@Entity('flows')
export class Flow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  // Nó inicial do fluxo
  @Column()
  entryNodeId: string;

  // Grafo completo como JSONB
  @Column({ type: 'simple-json', nullable: true })
  nodes: FlowNode[];

  // Triggers que ativam este fluxo
  @Column({ type: 'simple-json', nullable: true })
  triggers: Array<{
    type: 'keyword' | 'first_message' | 'intent' | 'menu_option';
    value?: string;
  }>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  executionCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


