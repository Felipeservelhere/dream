import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IAiProvider, AiToolCall } from './provider/ai-provider.interface';
import { AI_PROVIDER } from './provider/ai-provider.interface';
import { ContextBuilderService } from './context/context-builder.service';
import { AI_TOOLS } from './tools/ai-tools.registry';
import { AiConfig } from '../database/entities/ai-config.entity';
import { TenancyService } from '../core/tenancy/tenancy.service';

export interface ProcessMessageResult {
  text: string | null;
  toolCalls?: AiToolCall[];
  needsHuman: boolean;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(AI_PROVIDER) private readonly aiProvider: IAiProvider,
    @InjectRepository(AiConfig) private readonly aiConfigRepo: Repository<AiConfig>,
    private readonly contextBuilder: ContextBuilderService,
    private readonly tenancyService: TenancyService,
  ) {}

  async processMessage(opts: {
    tenantId: string;
    phone: string;
    message: string;
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<ProcessMessageResult> {
    const hasQuota = await this.tenancyService.hasRemainingQuota(opts.tenantId, 'aiCalls');
    if (!hasQuota) {
      return {
        text: 'No momento estou com alta demanda. Um atendente humano vai te ajudar! 🙋',
        needsHuman: true,
      };
    }

    const aiConfig = await this.aiConfigRepo.findOne({ where: { tenantId: opts.tenantId } });

    // Verificar se mensagem contém palavras-chave de transferência
    const humanKeywords = aiConfig?.humanHandoffKeywords || [];
    const lowerMessage = opts.message.toLowerCase();
    if (humanKeywords.some((kw) => lowerMessage.includes(kw.toLowerCase()))) {
      return { text: null, needsHuman: true };
    }

    const messages = await this.contextBuilder.buildMessages({
      tenantId: opts.tenantId,
      phone: opts.phone,
      userMessage: opts.message,
      conversationHistory: opts.conversationHistory,
    });

    try {
      const response = await this.aiProvider.complete({
        messages,
        tools: AI_TOOLS,
        temperature: aiConfig?.temperature ?? 0.7,
        maxTokens: aiConfig?.maxTokens ?? 500,
        model: aiConfig?.model,
      });

      await this.tenancyService.incrementUsage(opts.tenantId, 'aiCallsThisMonth');

      const needsHuman = response.toolCalls?.some(
        (tc) => tc.name === 'transfer_to_human',
      ) || false;

      return {
        text: response.content,
        toolCalls: response.toolCalls,
        needsHuman,
      };
    } catch (err) {
      this.logger.error(`AI processing failed for tenant ${opts.tenantId}`, err);
      return {
        text: 'Ops, tive uma dificuldade técnica. Vou chamar um atendente! 🙋',
        needsHuman: true,
      };
    }
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    return this.aiProvider.transcribeAudio({ audioBuffer, language: 'pt' });
  }

  async checkFaq(tenantId: string, message: string): Promise<string | null> {
    const aiConfig = await this.aiConfigRepo.findOne({ where: { tenantId } });
    if (!aiConfig?.faqs?.length) return null;

    const lowerMsg = message.toLowerCase();
    for (const faq of aiConfig.faqs) {
      const matches = faq.keywords.some((kw) => lowerMsg.includes(kw.toLowerCase()));
      if (matches) return faq.answer;
    }

    return null;
  }
}
