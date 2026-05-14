import {
  Controller, Post, Body, Param, HttpCode, HttpStatus, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EvolutionApiService } from './evolution-api.service';
import { TenancyService } from '../../core/tenancy/tenancy.service';
import { MessageProcessorService } from '../processor/message-processor.service';

@ApiTags('Webhooks')
@Controller('webhook')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);

  constructor(
    private readonly evolutionApi: EvolutionApiService,
    private readonly tenancyService: TenancyService,
    private readonly messageProcessor: MessageProcessorService,
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

    const tenants = await this.tenancyService.findAll();

    // Try matching by stored instance name first, fall back to env var
    let tenant = tenants.find(
      (t) => t.whatsappInstance?.instanceName === instanceName,
    );
    if (!tenant && instanceName === process.env.EVOLUTION_INSTANCE_NAME) {
      tenant = tenants[0];
    }

    if (!tenant) {
      this.logger.warn(`No tenant found for instance: ${instanceName}`);
      return { ok: true };
    }

    // Process synchronously — Bull queues don't run in serverless
    try {
      await this.messageProcessor.process(tenant, inbound);
      this.logger.debug(`[${tenant.id}] Message processed from ${inbound.phone}`);
    } catch (err) {
      this.logger.error(`[${tenant.id}] Failed to process message from ${inbound.phone}`, err);
    }

    return { ok: true };
  }
}
