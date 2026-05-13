import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from '../../database/entities/tenant.entity';

@Injectable()
export class TenancyService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  async findBySubdomain(subdomain: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { subdomain } });
    if (!tenant) throw new NotFoundException(`Tenant '${subdomain}' not found`);
    return tenant;
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException(`Tenant '${id}' not found`);
    return tenant;
  }

  async isActive(tenantId: string): Promise<boolean> {
    const tenant = await this.findById(tenantId);
    return tenant.status === TenantStatus.ACTIVE || tenant.status === TenantStatus.TRIAL;
  }

  async incrementUsage(
    tenantId: string,
    field: 'messagesThisMonth' | 'aiCallsThisMonth',
  ): Promise<void> {
    await this.tenantRepo
      .createQueryBuilder()
      .update(Tenant)
      .set({
        currentUsage: () =>
          `jsonb_set(current_usage, '{${field}}', (COALESCE(current_usage->>'${field}', '0')::int + 1)::text::jsonb)`,
      })
      .where('id = :id', { id: tenantId })
      .execute();
  }

  async hasRemainingQuota(
    tenantId: string,
    field: 'messages' | 'aiCalls',
  ): Promise<boolean> {
    const tenant = await this.findById(tenantId);
    const limitKey = field === 'messages' ? 'messagesPerMonth' : 'aiCallsPerMonth';
    const usageKey = field === 'messages' ? 'messagesThisMonth' : 'aiCallsThisMonth';
    const limit = tenant.planLimits?.[limitKey] ?? Infinity;
    const usage = tenant.currentUsage?.[usageKey] ?? 0;
    return usage < limit;
  }

  async create(data: Partial<Tenant>): Promise<Tenant> {
    const tenant = this.tenantRepo.create(data);
    return this.tenantRepo.save(tenant);
  }

  async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
    await this.tenantRepo.update(id, data);
    return this.findById(id);
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepo.find({ order: { createdAt: 'DESC' } });
  }
}
