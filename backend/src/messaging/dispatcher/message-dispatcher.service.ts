import { Injectable, Logger } from '@nestjs/common';
import { EvolutionApiService } from '../whatsapp/evolution-api.service';
import { TenancyService } from '../../core/tenancy/tenancy.service';

export type OutboundPayload =
  | { type: 'text'; text: string; delay?: number }
  | { type: 'buttons'; text: string; buttons: Array<{ id: string; label: string }>; footer?: string }
  | { type: 'list'; title: string; description: string; buttonText: string; sections: any[] }
  | { type: 'media'; mediaUrl: string; caption?: string; mediaType: 'image' | 'video' | 'document' | 'audio' };

@Injectable()
export class MessageDispatcherService {
  private readonly logger = new Logger(MessageDispatcherService.name);

  constructor(
    private readonly evolutionApi: EvolutionApiService,
    private readonly tenancyService: TenancyService,
  ) {}

  async send(tenantId: string, phone: string, payload: OutboundPayload): Promise<void> {
    const tenant = await this.tenancyService.findById(tenantId);
    const instanceName = tenant.whatsappInstance?.instanceName;

    if (!instanceName) {
      this.logger.warn(`Tenant ${tenantId} has no WhatsApp instance configured`);
      return;
    }

    try {
      switch (payload.type) {
        case 'text':
          await this.evolutionApi.sendText({
            instanceName,
            phone,
            text: payload.text,
            delay: payload.delay || 1000,
          });
          break;

        case 'buttons':
          await this.evolutionApi.sendButtons({
            instanceName,
            phone,
            text: payload.text,
            buttons: payload.buttons,
            footer: payload.footer,
          });
          break;

        case 'list':
          await this.evolutionApi.sendList({
            instanceName,
            phone,
            title: payload.title,
            description: payload.description,
            buttonText: payload.buttonText,
            sections: payload.sections,
          });
          break;

        case 'media':
          await this.evolutionApi.sendMedia({
            instanceName,
            phone,
            mediaUrl: payload.mediaUrl,
            caption: payload.caption,
            type: payload.mediaType,
          });
          break;
      }

      await this.tenancyService.incrementUsage(tenantId, 'messagesThisMonth');
    } catch (err) {
      this.logger.error(`Failed to send message to ${phone} for tenant ${tenantId}`, err);
      throw err;
    }
  }

  // Envia múltiplas mensagens em sequência com delay entre elas
  async sendSequence(
    tenantId: string,
    phone: string,
    payloads: OutboundPayload[],
    delayBetween = 1500,
  ): Promise<void> {
    for (const payload of payloads) {
      await this.send(tenantId, phone, payload);
      if (delayBetween > 0) {
        await new Promise((r) => setTimeout(r, delayBetween));
      }
    }
  }
}
