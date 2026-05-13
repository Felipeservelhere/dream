import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiConfig } from '../../database/entities/ai-config.entity';
import { ProfileMemoryService } from '../../memory/profile/profile-memory.service';
import { AiMessage } from '../provider/ai-provider.interface';

@Injectable()
export class ContextBuilderService {
  constructor(
    @InjectRepository(AiConfig)
    private readonly aiConfigRepo: Repository<AiConfig>,
    private readonly profileMemory: ProfileMemoryService,
  ) {}

  async buildMessages(opts: {
    tenantId: string;
    phone: string;
    userMessage: string;
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<AiMessage[]> {
    const [aiConfig, clientContext] = await Promise.all([
      this.aiConfigRepo.findOne({ where: { tenantId: opts.tenantId } }),
      this.profileMemory.getClientContext(opts.tenantId, opts.phone),
    ]);

    const systemPrompt = this.buildSystemPrompt(aiConfig, clientContext);

    const messages: AiMessage[] = [
      { role: 'system', content: systemPrompt },
      ...opts.conversationHistory.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: opts.userMessage },
    ];

    return messages;
  }

  private buildSystemPrompt(aiConfig: AiConfig | null, clientContext: string): string {
    const assistantName = aiConfig?.assistantName || 'Assistente';
    const tone = aiConfig?.tone || 'friendly';
    const businessContext = aiConfig?.businessContext || {};
    const basePrompt = aiConfig?.systemPrompt || '';

    const toneInstructions: Record<string, string> = {
      friendly: 'Seja amigável, próximo e use linguagem informal mas profissional.',
      formal: 'Mantenha tom formal e profissional.',
      professional: 'Use linguagem profissional e clara.',
      casual: 'Seja casual, descontraído e use emojis quando adequado.',
    };

    const parts = [
      `Você é ${assistantName}, assistente virtual de ${businessContext.businessName || 'nossa empresa'}.`,
      toneInstructions[tone] || toneInstructions.friendly,
    ];

    if (businessContext.businessType) {
      parts.push(`Tipo de negócio: ${businessContext.businessType}`);
    }

    if (businessContext.workingHours) {
      parts.push(`Horário de funcionamento: ${businessContext.workingHours}`);
    }

    if (businessContext.services?.length) {
      parts.push(`Serviços oferecidos: ${businessContext.services.join(', ')}`);
    }

    if (basePrompt) {
      parts.push(basePrompt);
    }

    if (clientContext) {
      parts.push(`\n--- Contexto do cliente ---\n${clientContext}`);
    }

    parts.push(`
Diretrizes importantes:
- Responda SEMPRE em português brasileiro
- Seja conciso — respostas curtas e objetivas para WhatsApp
- Use quebras de linha para facilitar leitura no mobile
- Se não souber algo, diga que vai verificar e ofereça ajuda
- NUNCA invente informações sobre horários, preços ou serviços
- Quando detectar urgência ou insatisfação, ofereça transferir para atendente humano
    `.trim());

    return parts.join('\n\n');
  }
}
