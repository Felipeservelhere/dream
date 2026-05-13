import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation, ConversationStatus } from '../database/entities/conversation.entity';
import { ConversationMemoryService } from '../memory/conversation/conversation-memory.service';
import { MessageDispatcherService } from '../messaging/dispatcher/message-dispatcher.service';

@Injectable()
export class HandoffService {
  private readonly logger = new Logger(HandoffService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly convRepo: Repository<Conversation>,
    private readonly memoryService: ConversationMemoryService,
    private readonly dispatcher: MessageDispatcherService,
  ) {}

  async humanTakeover(conversationId: string, attendantId: string, clientPhone: string): Promise<Conversation> {
    const conv = await this.convRepo.findOne({ where: { id: conversationId } });
    if (!conv) throw new Error('Conversation not found');

    await this.convRepo.update(conversationId, {
      status: ConversationStatus.WITH_HUMAN,
      assignedToId: attendantId,
      metadata: {
        ...conv.metadata,
        humanTookOverAt: new Date().toISOString(),
      },
    });

    await this.memoryService.update(conv.tenantId, clientPhone, { isWithHuman: true });

    this.logger.log(`Human ${attendantId} took over conversation ${conversationId}`);
    return this.convRepo.findOne({ where: { id: conversationId } }) as Promise<Conversation>;
  }

  async returnToAi(conversationId: string, clientPhone: string): Promise<Conversation> {
    const conv = await this.convRepo.findOne({ where: { id: conversationId } });
    if (!conv) throw new Error('Conversation not found');

    await this.convRepo.update(conversationId, {
      status: ConversationStatus.OPEN,
      assignedToId: undefined,
    });

    await this.memoryService.update(conv.tenantId, clientPhone, { isWithHuman: false });
    this.logger.log(`Conversation ${conversationId} returned to AI`);

    await this.dispatcher.send(conv.tenantId, clientPhone, {
      type: 'text',
      text: '✅ Obrigado pelo contato! Continuarei aqui para te ajudar. 😊',
    });

    return this.convRepo.findOne({ where: { id: conversationId } }) as Promise<Conversation>;
  }

  async resolve(conversationId: string, resolution?: string): Promise<Conversation> {
    const conv = await this.convRepo.findOne({ where: { id: conversationId } });
    if (!conv) throw new Error('Conversation not found');

    await this.convRepo.update(conversationId, {
      status: ConversationStatus.RESOLVED,
      resolvedAt: new Date(),
      metadata: {
        ...conv.metadata,
        resolvedAt: new Date().toISOString(),
        resolution,
      },
    });

    return this.convRepo.findOne({ where: { id: conversationId } }) as Promise<Conversation>;
  }

  async getPendingQueue(tenantId: string): Promise<Conversation[]> {
    return this.convRepo.find({
      where: { tenantId, status: ConversationStatus.WAITING_HUMAN },
      order: { updatedAt: 'ASC' },
    });
  }

  async getActiveByAttendant(attendantId: string): Promise<Conversation[]> {
    return this.convRepo.find({
      where: { assignedToId: attendantId, status: ConversationStatus.WITH_HUMAN },
      order: { updatedAt: 'DESC' },
    });
  }
}
