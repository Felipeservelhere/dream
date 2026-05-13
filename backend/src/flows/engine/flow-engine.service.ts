import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flow, FlowNode, FlowNodeType } from '../../database/entities/flow.entity';
import { ConversationMemoryService, SessionData } from '../../memory/conversation/conversation-memory.service';
import { MessageDispatcherService } from '../../messaging/dispatcher/message-dispatcher.service';

export interface FlowExecutionContext {
  tenantId: string;
  phone: string;
  session: SessionData;
  userInput: string;
}

export interface FlowExecutionResult {
  handled: boolean;        // o motor de fluxo tratou esta mensagem
  shouldCallAi: boolean;   // precisa acionar a IA depois
  flowEnded: boolean;      // o fluxo terminou
}

@Injectable()
export class FlowEngineService {
  private readonly logger = new Logger(FlowEngineService.name);

  constructor(
    @InjectRepository(Flow)
    private readonly flowRepo: Repository<Flow>,
    private readonly memoryService: ConversationMemoryService,
    private readonly dispatcher: MessageDispatcherService,
  ) {}

  async findMatchingFlow(tenantId: string, message: string): Promise<Flow | null> {
    const flows = await this.flowRepo.find({
      where: { tenantId, isActive: true },
    });

    const lowerMsg = message.toLowerCase().trim();

    for (const flow of flows) {
      for (const trigger of flow.triggers) {
        if (trigger.type === 'first_message') return flow;

        if (trigger.type === 'keyword' && trigger.value) {
          if (lowerMsg === trigger.value.toLowerCase() || lowerMsg.includes(trigger.value.toLowerCase())) {
            return flow;
          }
        }
      }
    }

    return null;
  }

  async startFlow(
    flow: Flow,
    ctx: FlowExecutionContext,
  ): Promise<FlowExecutionResult> {
    await this.memoryService.update(ctx.tenantId, ctx.phone, {
      currentFlowId: flow.id,
      currentNodeId: flow.entryNodeId,
      collectedData: {},
    });

    const entryNode = flow.nodes.find((n) => n.id === flow.entryNodeId);
    if (!entryNode) {
      this.logger.warn(`Flow ${flow.id} entry node not found`);
      return { handled: false, shouldCallAi: true, flowEnded: false };
    }

    return this.executeNode(flow, entryNode, ctx);
  }

  async continueFlow(ctx: FlowExecutionContext): Promise<FlowExecutionResult> {
    const { currentFlowId, currentNodeId } = ctx.session;
    if (!currentFlowId || !currentNodeId) {
      return { handled: false, shouldCallAi: true, flowEnded: false };
    }

    const flow = await this.flowRepo.findOne({ where: { id: currentFlowId } });
    if (!flow) {
      await this.clearFlow(ctx.tenantId, ctx.phone);
      return { handled: false, shouldCallAi: true, flowEnded: false };
    }

    const currentNode = flow.nodes.find((n) => n.id === currentNodeId);
    if (!currentNode) {
      await this.clearFlow(ctx.tenantId, ctx.phone);
      return { handled: false, shouldCallAi: true, flowEnded: false };
    }

    // Resolve para qual nó ir com base na resposta do usuário
    const nextNodeId = this.resolveTransition(currentNode, ctx.userInput);
    if (!nextNodeId) {
      // Nenhuma transição match — manda para IA se permitido, senão repete
      return { handled: false, shouldCallAi: true, flowEnded: false };
    }

    // Coleta dado se o nó era uma pergunta
    if (currentNode.type === FlowNodeType.QUESTION && currentNode.config.variable) {
      await this.memoryService.update(ctx.tenantId, ctx.phone, {
        collectedData: {
          ...ctx.session.collectedData,
          [currentNode.config.variable]: ctx.userInput,
        },
      });
    }

    const nextNode = flow.nodes.find((n) => n.id === nextNodeId);
    if (!nextNode) {
      await this.clearFlow(ctx.tenantId, ctx.phone);
      return { handled: true, shouldCallAi: false, flowEnded: true };
    }

    return this.executeNode(flow, nextNode, ctx);
  }

  private async executeNode(
    flow: Flow,
    node: FlowNode,
    ctx: FlowExecutionContext,
  ): Promise<FlowExecutionResult> {
    await this.memoryService.update(ctx.tenantId, ctx.phone, {
      currentNodeId: node.id,
    });

    switch (node.type) {
      case FlowNodeType.MESSAGE: {
        await this.dispatcher.send(ctx.tenantId, ctx.phone, {
          type: 'text',
          text: this.interpolate(node.config.text || '', ctx.session.collectedData),
          delay: 800,
        });
        // Avança automaticamente para próxima transição padrão
        const nextId = node.transitions.find((t) => t.isDefault)?.nextNodeId;
        if (nextId) {
          const nextNode = flow.nodes.find((n) => n.id === nextId);
          if (nextNode) return this.executeNode(flow, nextNode, ctx);
        }
        return { handled: true, shouldCallAi: false, flowEnded: false };
      }

      case FlowNodeType.QUESTION: {
        if (node.config.buttons?.length) {
          await this.dispatcher.send(ctx.tenantId, ctx.phone, {
            type: 'buttons',
            text: this.interpolate(node.config.text || '', ctx.session.collectedData),
            buttons: node.config.buttons,
          });
        } else if (node.config.listItems?.length) {
          await this.dispatcher.send(ctx.tenantId, ctx.phone, {
            type: 'list',
            title: 'Selecione uma opção',
            description: this.interpolate(node.config.text || '', ctx.session.collectedData),
            buttonText: 'Ver opções',
            sections: [{ title: 'Opções', rows: node.config.listItems }],
          });
        } else {
          await this.dispatcher.send(ctx.tenantId, ctx.phone, {
            type: 'text',
            text: this.interpolate(node.config.text || '', ctx.session.collectedData),
          });
        }
        await this.memoryService.update(ctx.tenantId, ctx.phone, { waitingForInput: true });
        return { handled: true, shouldCallAi: false, flowEnded: false };
      }

      case FlowNodeType.AI_HANDOVER: {
        await this.clearFlow(ctx.tenantId, ctx.phone);
        return { handled: false, shouldCallAi: true, flowEnded: true };
      }

      case FlowNodeType.HUMAN_HANDOFF: {
        await this.clearFlow(ctx.tenantId, ctx.phone);
        return { handled: true, shouldCallAi: false, flowEnded: true };
      }

      case FlowNodeType.END: {
        if (node.config.text) {
          await this.dispatcher.send(ctx.tenantId, ctx.phone, {
            type: 'text',
            text: this.interpolate(node.config.text || '', ctx.session.collectedData),
          });
        }
        await this.clearFlow(ctx.tenantId, ctx.phone);
        return { handled: true, shouldCallAi: false, flowEnded: true };
      }

      default:
        return { handled: false, shouldCallAi: true, flowEnded: false };
    }
  }

  private resolveTransition(node: FlowNode, input: string): string | null {
    const lower = input.toLowerCase().trim();

    for (const transition of node.transitions) {
      if (transition.isDefault) continue;

      if (Array.isArray(transition.match)) {
        if (transition.match.some((m) => lower === m.toLowerCase() || lower.includes(m.toLowerCase()))) {
          return transition.nextNodeId;
        }
      } else if (transition.match) {
        if (lower === transition.match.toLowerCase() || lower.includes(transition.match.toLowerCase())) {
          return transition.nextNodeId;
        }
      }
    }

    // Fallback para transição padrão
    return node.transitions.find((t) => t.isDefault)?.nextNodeId || null;
  }

  private interpolate(template: string, data: Record<string, any>): string {
    if (!template) return '';
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
  }

  private async clearFlow(tenantId: string, phone: string): Promise<void> {
    await this.memoryService.update(tenantId, phone, {
      currentFlowId: undefined,
      currentNodeId: undefined,
      waitingForInput: false,
    });
  }
}
