import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { MessageProcessorService } from './message-processor.service';
import { TenancyService } from '../../core/tenancy/tenancy.service';
import { InboundMessage } from '../whatsapp/evolution-api.service';

@Processor('messages')
export class MessageQueueProcessor {
  private readonly logger = new Logger(MessageQueueProcessor.name);

  constructor(
    private readonly processor: MessageProcessorService,
    private readonly tenancyService: TenancyService,
  ) {}

  @Process('process')
  async handleProcess(job: Job<{ tenantId: string; inbound: InboundMessage }>) {
    const { tenantId, inbound } = job.data;

    try {
      const tenant = await this.tenancyService.findById(tenantId);
      const isActive = await this.tenancyService.isActive(tenantId);

      if (!isActive) {
        this.logger.warn(`Tenant ${tenantId} is not active, skipping message`);
        return;
      }

      await this.processor.process(tenant, inbound);
    } catch (err) {
      this.logger.error(`Failed to process message for tenant ${tenantId}`, err);
      throw err; // Re-throw para BullMQ tentar novamente
    }
  }
}
