import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../../database/entities/client.entity';

@Injectable()
export class ProfileMemoryService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
  ) {}

  async findOrCreate(tenantId: string, phone: string, name?: string): Promise<Client> {
    let client = await this.clientRepo.findOne({ where: { tenantId, phone } });

    if (!client) {
      const newClient: Partial<Client> = {
        tenantId,
        phone,
        name: name || phone,
        tags: [],
        stats: {
          totalConversations: 0,
          lastInteractionAt: new Date().toISOString(),
          lastBookingAt: undefined,
          totalBookings: 0,
          npsScore: undefined,
        },
      };
      client = this.clientRepo.create(newClient as Client);
      await this.clientRepo.save(client);
    }

    return client;
  }

  async updateProfile(
    tenantId: string,
    phone: string,
    patch: Partial<Pick<Client, 'name' | 'email' | 'profile' | 'tags' | 'notes'>>,
  ): Promise<Client> {
    const client = await this.findOrCreate(tenantId, phone);

    if (patch.profile) {
      patch.profile = { ...client.profile, ...patch.profile };
    }

    await this.clientRepo.update(client.id, patch);
    return this.clientRepo.findOne({ where: { id: client.id } }) as Promise<Client>;
  }

  async recordInteraction(clientId: string): Promise<void> {
    await this.clientRepo
      .createQueryBuilder()
      .update(Client)
      .set({
        stats: () =>
          `jsonb_set(jsonb_set(stats, '{lastInteractionAt}', '"${new Date().toISOString()}"'), '{totalConversations}', (COALESCE(stats->>'totalConversations', '0')::int + 1)::text::jsonb)`,
      })
      .where('id = :id', { id: clientId })
      .execute();
  }

  async addTag(clientId: string, tag: string): Promise<void> {
    await this.clientRepo
      .createQueryBuilder()
      .update(Client)
      .set({
        tags: () => `array_append(tags, '${tag}')`,
      })
      .where('id = :id AND NOT (tags @> ARRAY[:tag])', { id: clientId, tag })
      .execute();
  }

  async removeTag(clientId: string, tag: string): Promise<void> {
    await this.clientRepo
      .createQueryBuilder()
      .update(Client)
      .set({
        tags: () => `array_remove(tags, '${tag}')`,
      })
      .where('id = :id', { id: clientId })
      .execute();
  }

  async getClientContext(tenantId: string, phone: string): Promise<string> {
    const client = await this.findOrCreate(tenantId, phone);
    const parts: string[] = [];

    if (client.name && client.name !== phone) {
      parts.push(`Nome do cliente: ${client.name}`);
    }

    if (client.stats?.lastInteractionAt) {
      const lastDate = new Date(client.stats.lastInteractionAt);
      const diffDays = Math.floor(
        (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays > 0) {
        parts.push(`Última interação: há ${diffDays} dias`);
      }
    }

    if (client.stats?.totalBookings > 0) {
      parts.push(`Total de agendamentos: ${client.stats.totalBookings}`);
    }

    if (client.tags?.length > 0) {
      parts.push(`Tags: ${client.tags.join(', ')}`);
    }

    if (client.notes) {
      parts.push(`Observações: ${client.notes}`);
    }

    return parts.join('\n');
  }
}
