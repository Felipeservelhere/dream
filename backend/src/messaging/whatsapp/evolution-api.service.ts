import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface InboundMessage {
  instanceName: string;
  phone: string;           // remetente normalizado
  messageId: string;
  type: 'text' | 'audio' | 'image' | 'video' | 'document' | 'button_reply' | 'list_reply' | 'sticker';
  text?: string;
  audioUrl?: string;
  mediaUrl?: string;
  caption?: string;
  buttonReplyId?: string;
  listReplyId?: string;
  timestamp: number;
  rawPayload: Record<string, any>;
}

export interface SendTextOptions {
  instanceName: string;
  phone: string;
  text: string;
  delay?: number; // ms antes de enviar (simula digitação)
}

export interface SendButtonsOptions {
  instanceName: string;
  phone: string;
  text: string;
  buttons: Array<{ id: string; label: string }>;
  footer?: string;
}

export interface SendListOptions {
  instanceName: string;
  phone: string;
  title: string;
  description: string;
  buttonText: string;
  sections: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>;
}

export interface SendMediaOptions {
  instanceName: string;
  phone: string;
  mediaUrl: string;
  caption?: string;
  type: 'image' | 'video' | 'document' | 'audio';
}

@Injectable()
export class EvolutionApiService {
  private readonly http: AxiosInstance;
  private readonly logger = new Logger(EvolutionApiService.name);

  constructor(private readonly configService: ConfigService) {
    const baseURL = configService.get<string>('evolution.url');
    const apiKey = configService.get<string>('evolution.apiKey');

    this.http = axios.create({
      baseURL,
      headers: {
        apikey: apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  private normalizePhone(jid: string): string {
    return jid
      .replace('@s.whatsapp.net', '')
      .replace('@lid', '')
      .replace('@c.us', '')
      .replace('@g.us', '');
  }

  parseWebhookPayload(payload: Record<string, any>): InboundMessage | null {
    try {
      const event = payload.event;
      if (event !== 'messages.upsert') return null;

      const msg = payload.data?.message;
      if (!msg || msg.key?.fromMe) return null; // ignora mensagens próprias

      const rawJid = msg.key?.remoteJid;
      if (!rawJid) return null;
      // Ignorar grupos
      if (rawJid.endsWith('@g.us')) return null;
      const phone = this.normalizePhone(rawJid);
      if (!phone) return null;

      const base: Partial<InboundMessage> = {
        instanceName: payload.instance,
        phone,
        messageId: msg.key?.id,
        timestamp: msg.messageTimestamp,
        rawPayload: payload,
      };

      const content = msg.message;

      if (content?.conversation || content?.extendedTextMessage) {
        return {
          ...base,
          type: 'text',
          text: content.conversation || content.extendedTextMessage?.text,
        } as InboundMessage;
      }

      if (content?.audioMessage) {
        return {
          ...base,
          type: 'audio',
          audioUrl: content.audioMessage?.url,
        } as InboundMessage;
      }

      if (content?.imageMessage) {
        return {
          ...base,
          type: 'image',
          mediaUrl: content.imageMessage?.url,
          caption: content.imageMessage?.caption,
        } as InboundMessage;
      }

      if (content?.buttonsResponseMessage) {
        return {
          ...base,
          type: 'button_reply',
          buttonReplyId: content.buttonsResponseMessage?.selectedButtonId,
          text: content.buttonsResponseMessage?.selectedDisplayText,
        } as InboundMessage;
      }

      if (content?.listResponseMessage) {
        return {
          ...base,
          type: 'list_reply',
          listReplyId: content.listResponseMessage?.singleSelectReply?.selectedRowId,
          text: content.listResponseMessage?.title,
        } as InboundMessage;
      }

      return null;
    } catch (err) {
      this.logger.error('Failed to parse webhook payload', err);
      return null;
    }
  }

  async sendText(opts: SendTextOptions): Promise<void> {
    if (opts.delay) {
      try {
        await this.sendPresence(opts.instanceName, opts.phone, 'composing');
      } catch {
        // presence é decorativo — não bloqueia o envio
      }
      await new Promise((r) => setTimeout(r, Math.min(opts.delay!, 3000)));
    }
    await this.http.post(`/message/sendText/${opts.instanceName}`, {
      number: opts.phone,
      text: opts.text,
    });
  }

  async sendButtons(opts: SendButtonsOptions): Promise<void> {
    await this.http.post(`/message/sendButtons/${opts.instanceName}`, {
      number: opts.phone,
      buttonMessage: {
        text: opts.text,
        footer: opts.footer || '',
        buttons: opts.buttons.map((b) => ({
          buttonId: b.id,
          buttonText: { displayText: b.label },
          type: 1,
        })),
      },
    });
  }

  async sendList(opts: SendListOptions): Promise<void> {
    await this.http.post(`/message/sendList/${opts.instanceName}`, {
      number: opts.phone,
      listMessage: {
        title: opts.title,
        description: opts.description,
        buttonText: opts.buttonText,
        sections: opts.sections,
      },
    });
  }

  async sendMedia(opts: SendMediaOptions): Promise<void> {
    await this.http.post(`/message/sendMedia/${opts.instanceName}`, {
      number: opts.phone,
      mediatype: opts.type,
      caption: opts.caption,
      media: opts.mediaUrl,
    });
  }

  async downloadMedia(instanceName: string, messageId: string): Promise<Buffer> {
    const response = await this.http.post(
      `/chat/getBase64FromMediaMessage/${instanceName}`,
      { key: { id: messageId } },
    );
    return Buffer.from(response.data.base64, 'base64');
  }

  async createInstance(instanceName: string, webhookUrl: string): Promise<any> {
    const response = await this.http.post('/instance/create', {
      instanceName,
      qrcode: true,
      webhook: webhookUrl,
      webhookByEvents: false,
      events: ['messages.upsert', 'connection.update'],
    });
    return response.data;
  }

  async getQrCode(instanceName: string): Promise<string> {
    const response = await this.http.get(`/instance/connect/${instanceName}`);
    return response.data?.base64;
  }

  private async sendPresence(
    instanceName: string,
    phone: string,
    presence: 'composing' | 'recording' | 'available',
  ): Promise<void> {
    await this.http.post(`/chat/sendPresence/${instanceName}`, {
      number: phone,
      options: { presence },
    });
  }
}
