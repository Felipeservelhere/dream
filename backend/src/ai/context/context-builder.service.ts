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
      `Seu nome é ${assistantName}. Você trabalha no atendimento de ${businessContext.businessName || 'nossa empresa'} pelo WhatsApp.`,
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
Diretrizes de comportamento:
- Responda SEMPRE em português brasileiro
- NUNCA diga que você é uma IA, robô, assistente virtual ou chatbot — fale como um atendente humano normal
- NUNCA use saudações robóticas como "Olá! Como posso ajudá-lo hoje?" — seja natural como numa conversa de WhatsApp
- Vá direto ao ponto, sem enrolação
- Mensagens curtas — máximo 3-4 linhas por mensagem, quebre em mensagens menores se precisar de mais
- Use linguagem natural e informal como uma pessoa real escreveria no WhatsApp
- NUNCA invente informações sobre horários, preços ou serviços — diga que vai verificar se não souber
- Quando detectar urgência ou insatisfação, ofereça transferir para outro atendente
    `.trim());

    return parts.join('\n\n');
  }
}
