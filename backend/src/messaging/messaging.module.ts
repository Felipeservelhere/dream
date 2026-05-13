import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Conversation } from '../database/entities/conversation.entity';
import { Message } from '../database/entities/message.entity';
import { Flow } from '../database/entities/flow.entity';
import { AiConfig } from '../database/entities/ai-config.entity';
import { EvolutionApiService } from './whatsapp/evolution-api.service';
import { WhatsappWebhookController } from './whatsapp/whatsapp-webhook.controller';
import { MessageProcessorService } from './processor/message-processor.service';
import { MessageQueueProcessor } from './processor/message.processor';
import { MessageDispatcherService } from './dispatcher/message-dispatcher.service';
import { FlowEngineService } from '../flows/engine/flow-engine.service';
import { AiService } from '../ai/ai.service';
import { OpenAiProvider } from '../ai/provider/openai.provider';
import { ContextBuilderService } from '../ai/context/context-builder.service';
import { AI_PROVIDER } from '../ai/provider/ai-provider.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message, Flow, AiConfig]),
    BullModule.registerQueue({ name: 'messages' }),
  ],
  controllers: [WhatsappWebhookController],
  providers: [
    EvolutionApiService,
    MessageProcessorService,
    MessageQueueProcessor,
    MessageDispatcherService,
    FlowEngineService,
    AiService,
    ContextBuilderService,
    { provide: AI_PROVIDER, useClass: OpenAiProvider },
  ],
  exports: [MessageDispatcherService, EvolutionApiService],
})
export class MessagingModule {}
