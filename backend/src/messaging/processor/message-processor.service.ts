import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InboundMessage, EvolutionApiService } from '../whatsapp/evolution-api.service';
import { ConversationMemoryService } from '../../memory/conversation/conversation-memory.service';
import { ProfileMemoryService } from '../../memory/profile/profile-memory.service';
import { FlowEngineService } from '../../flows/engine/flow-engine.service';
import { AiService } from '../../ai/ai.service';
import { MessageDispatcherService } from '../dispatcher/message-dispatcher.service';
import { TenancyService } from '../../core/tenancy/tenancy.service';
import { Conversation, ConversationStatus } from '../../database/entities/conversation.entity';
import { Message, MessageDirection, MessageSender, MessageType } from '../../database/entities/message.entity';
import { Tenant } from '../../database/entities/tenant.entity';

@Injectable()
export class MessageProcessorService {
  private readonly logger = new Logger(MessageProcessorService.name);

  constructor(
    @InjectRepository(Conversation) private readonly convRepo: Repository<Conversation>,
    @InjectRepository(Message) private readonly msgRepo: Repository<Message>,
    private readonly memoryService: ConversationMemoryService,
    private readonly profileMemory: ProfileMemoryService,
    private readonly flowEngine: FlowEngineService,
    private readonly aiService: AiService,
    private readonly dispatcher: MessageDispatcherService,
    private readonly tenancyService: TenancyService,
    private readonly evolutionApi: EvolutionApiService,
  ) {}

  async process(tenant: Tenant, inbound: InboundMessage): Promise<void> {
    const tenantId = tenant.id;
    const phone = inbound.phone;

    try {
      // 1. Buscar ou criar perfil do cliente
      const client = await this.profileMemory.findOrCreate(tenantId, phone);
      await this.profileMemory.recordInteraction(client.id);

      // 2. Buscar ou criar conversa ativa
      const conversation = await this.findOrCreateConversation(tenantId, client.id);

      // 3. Carregar sessão da memória
      let session = await this.memoryService.get(tenantId, phone);
      if (!session) {
        session = {
          conversationId: conversation.id,
          clientId: client.id,
          tenantId,
          collectedData: {},
          contextWindow: [],
          lastMessageAt: Date.now(),
          isWithHuman: false,
          waitingForInput: false,
        };
      }

      // 4. Se atendente humano está ativo, não processar com IA/fluxo
      if (
        session.isWithHuman ||
        conversation.status === ConversationStatus.WITH_HUMAN
      ) {
        await this.saveMessage(tenantId, conversation.id, client.id, inbound, null);
        this.logger.debug(`[${phone}] Message forwarded to human inbox`);
        return;
      }

      // 5. Processar áudio se necessário
      let messageText = inbound.text || '';
      if (inbound.type === 'audio' && inbound.audioUrl) {
        try {
          const audioInstance = tenant?.whatsappInstance?.instanceName
            || process.env.EVOLUTION_INSTANCE_NAME || '';
          const audioBuffer = await this.evolutionApi.downloadMedia(
            audioInstance,
            inbound.messageId,
          );
          messageText = await this.aiService.transcribeAudio(audioBuffer);
          this.logger.debug(`[${phone}] Audio transcribed: "${messageText}"`);
        } catch (err) {
          this.logger.error(`[${phone}] Failed to transcribe audio`, err);
          messageText = '[Áudio não pôde ser transcrito]';
        }
      }

      if (!messageText.trim()) return;

      // 6. Salvar mensagem de entrada
      await this.saveMessage(tenantId, conversation.id, client.id, inbound, messageText);

      // 7. Verificar FAQ antes de chamar IA
      const faqAnswer = await this.aiService.checkFaq(tenantId, messageText);
      if (faqAnswer) {
        await this.dispatcher.send(tenantId, phone, { type: 'text', text: faqAnswer, delay: 800 });
        await this.memoryService.addToContextWindow(tenantId, phone, { role: 'user', content: messageText });
        await this.memoryService.addToContextWindow(tenantId, phone, { role: 'assistant', content: faqAnswer });
        await this.saveOutboundMessage(tenantId, conversation.id, client.id, faqAnswer, MessageSender.AI);
        return;
      }

      // 8. Tentar continuar fluxo ativo
      if (session.currentFlowId) {
        const result = await this.flowEngine.continueFlow({
          tenantId,
          phone,
          session,
          userInput: messageText,
        });

        if (result.handled && !result.shouldCallAi) return;
        if (result.flowEnded && !result.shouldCallAi) return;
        // Se shouldCallAi=true, cai para processamento IA abaixo
      } else {
        // 9. Tentar iniciar novo fluxo
        const matchingFlow = await this.flowEngine.findMatchingFlow(tenantId, messageText);
        if (matchingFlow) {
          const result = await this.flowEngine.startFlow(matchingFlow, {
            tenantId,
            phone,
            session,
            userInput: messageText,
          });
          if (result.handled && !result.shouldCallAi) return;
        }
      }

      // 10. Processar com IA
      session = await this.memoryService.get(tenantId, phone) || session;
      const aiResult = await this.aiService.processMessage({
        tenantId,
        phone,
        message: messageText,
        conversationHistory: session.contextWindow,
      });

      // 11. Executar tool calls se houver
      if (aiResult.toolCalls?.length) {
        await this.handleToolCalls(tenantId, phone, client.id, conversation.id, aiResult.toolCalls, session.collectedData);
      }

      // 12. Transferir para humano se necessário
      if (aiResult.needsHuman) {
        await this.transferToHuman(tenantId, conversation, phone);
        return;
      }

      // 13. Enviar resposta da IA
      if (aiResult.text) {
        this.logger.debug(`[${phone}] AI response: "${aiResult.text.substring(0, 60)}..."`);
        await this.dispatcher.send(tenantId, phone, {
          type: 'text',
          text: aiResult.text,
          delay: 500,
        });

        await this.memoryService.addToContextWindow(tenantId, phone, { role: 'user', content: messageText });
        await this.memoryService.addToContextWindow(tenantId, phone, { role: 'assistant', content: aiResult.text });
        await this.saveOutboundMessage(tenantId, conversation.id, client.id, aiResult.text, MessageSender.AI);
      }
    } catch (err) {
      this.logger.error(`[${phone}] Error processing message`, err);
    }
  }

  private async findOrCreateConversation(tenantId: string, clientId: string): Promise<Conversation> {
    const open = await this.convRepo.findOne({
      where: {
        tenantId,
        clientId,
        status: ConversationStatus.OPEN,
      },
    });

    if (open) return open;

    const conv = this.convRepo.create({ tenantId, clientId, status: ConversationStatus.OPEN });
    return this.convRepo.save(conv);
  }

  private async saveMessage(
    tenantId: string,
    conversationId: string,
    clientId: string,
    inbound: InboundMessage,
    transcription: string | null,
  ): Promise<void> {
    const typeMap: Record<string, MessageType> = {
      text: MessageType.TEXT,
      audio: MessageType.AUDIO,
      image: MessageType.IMAGE,
      video: MessageType.VIDEO,
      document: MessageType.DOCUMENT,
      button_reply: MessageType.BUTTON_REPLY,
      list_reply: MessageType.LIST_REPLY,
    };

    const msgData: Partial<Message> = {
      tenantId,
      conversationId,
      clientId,
      direction: MessageDirection.INBOUND,
      type: typeMap[inbound.type] || MessageType.TEXT,
      sender: MessageSender.CLIENT,
      text: inbound.text || transcription || undefined,
      transcription: transcription || undefined,
      mediaUrl: inbound.mediaUrl || inbound.audioUrl,
      externalId: inbound.messageId,
    };
    await this.msgRepo.save(this.msgRepo.create(msgData as Message));
  }

  private async saveOutboundMessage(
    tenantId: string,
    conversationId: string,
    clientId: string,
    text: string,
    sender: MessageSender,
  ): Promise<void> {
    const out: Partial<Message> = {
      tenantId, conversationId, clientId,
      direction: MessageDirection.OUTBOUND,
      type: MessageType.TEXT,
      sender, text,
    };
    await this.msgRepo.save(this.msgRepo.create(out as Message));
  }

  private async handleToolCalls(
    tenantId: string,
    phone: string,
    clientId: string,
    conversationId: string,
    toolCalls: Array<{ name: string; arguments: Record<string, any> }>,
    collectedData: Record<string, any>,
  ): Promise<void> {
    for (const call of toolCalls) {
      this.logger.debug(`[${phone}] Tool call: ${call.name}`, call.arguments);
      // Tool handlers são registrados pelo módulo de scheduling/handoff
      // Emitindo evento para ser capturado pelo handler apropriado
    }
  }

  private async transferToHuman(
    tenantId: string,
    conversation: Conversation,
    phone: string,
  ): Promise<void> {
    await this.convRepo.update(conversation.id, {
      status: ConversationStatus.WAITING_HUMAN,
    });

    await this.memoryService.update(tenantId, phone, { isWithHuman: true });

    await this.dispatcher.send(tenantId, phone, {
      type: 'text',
      text: '🙋 Vou te conectar com um atendente agora. Aguarde um momento...',
      delay: 500,
    });
  }
}
