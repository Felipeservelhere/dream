import {
  Controller, Post, Body, Param, HttpCode, HttpStatus, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { EvolutionApiService } from './evolution-api.service';
import { TenancyService } from '../../core/tenancy/tenancy.service';

@ApiTags('Webhooks')
@Controller('webhook')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);

  constructor(
    private readonly evolutionApi: EvolutionApiService,
    private readonly tenancyService: TenancyService,
    @InjectQueue('messages') private readonly messageQueue: Queue,
  ) {}

  @Post(':instanceName')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recebe eventos da Evolution API' })
  async handleWebhook(
    @Param('instanceName') instanceName: string,
    @Body() payload: Record<string, any>,
  ) {
    const inbound = this.evolutionApi.parseWebhookPayload(payload);
    if (!inbound) return { ok: true };

    // Encontrar tenant pela instância
    const tenants = await this.tenancyService.findAll();
    const tenant = tenants.find(
      (t) => t.whatsappInstance?.instanceName === instanceName,
    );

    if (!tenant) {
      this.logger.warn(`No tenant found for instance: ${instanceName}`);
      return { ok: true };
    }

    // Enfileirar para processamento assíncrono
    await this.messageQueue.add(
      'process',
      { tenantId: tenant.id, inbound },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    );

    this.logger.debug(`[${tenant.id}] Message queued from ${inbound.phone}`);
    return { ok: true };
  }
}
