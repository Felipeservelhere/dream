import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

export interface SessionData {
  conversationId: string;
  clientId: string;
  tenantId: string;
  currentFlowId?: string;
  currentNodeId?: string;
  collectedData: Record<string, any>;
  // Janela de contexto para a IA (últimas N mensagens)
  contextWindow: Array<{ role: 'user' | 'assistant'; content: string }>;
  lastMessageAt: number;
  isWithHuman: boolean;
  waitingForInput: boolean;
}

@Injectable()
export class ConversationMemoryService {
  private readonly ttlSeconds: number;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {
    this.ttlSeconds = (configService.get<number>('app.sessionTtlMinutes') || 30) * 60;
  }

  private key(tenantId: string, phone: string): string {
    return `session:${tenantId}:${phone}`;
  }

  async get(tenantId: string, phone: string): Promise<SessionData | null> {
    const raw = await this.redis.get(this.key(tenantId, phone));
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  }

  async set(tenantId: string, phone: string, data: SessionData): Promise<void> {
    await this.redis.setex(
      this.key(tenantId, phone),
      this.ttlSeconds,
      JSON.stringify(data),
    );
  }

  async update(
    tenantId: string,
    phone: string,
    patch: Partial<SessionData>,
  ): Promise<SessionData> {
    const current = await this.get(tenantId, phone) || this.createEmpty(tenantId, phone);
    const updated = { ...current, ...patch, lastMessageAt: Date.now() };
    await this.set(tenantId, phone, updated);
    return updated;
  }

  async addToContextWindow(
    tenantId: string,
    phone: string,
    message: { role: 'user' | 'assistant'; content: string },
    maxMessages = 10,
  ): Promise<void> {
    const session = await this.get(tenantId, phone) || this.createEmpty(tenantId, phone);
    session.contextWindow.push(message);
    // Mantém apenas as últimas N mensagens
    if (session.contextWindow.length > maxMessages) {
      session.contextWindow = session.contextWindow.slice(-maxMessages);
    }
    session.lastMessageAt = Date.now();
    await this.set(tenantId, phone, session);
  }

  async delete(tenantId: string, phone: string): Promise<void> {
    await this.redis.del(this.key(tenantId, phone));
  }

  async refresh(tenantId: string, phone: string): Promise<void> {
    await this.redis.expire(this.key(tenantId, phone), this.ttlSeconds);
  }

  private createEmpty(tenantId: string, _phone: string): SessionData {
    return {
      conversationId: '',
      clientId: '',
      tenantId,
      collectedData: {},
      contextWindow: [],
      lastMessageAt: Date.now(),
      isWithHuman: false,
      waitingForInput: false,
    };
  }
}
