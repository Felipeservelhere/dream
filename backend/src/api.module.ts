import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './database/entities/tenant.entity';
import { User } from './database/entities/user.entity';
import { Conversation } from './database/entities/conversation.entity';
import { Message } from './database/entities/message.entity';
import { Booking } from './database/entities/booking.entity';
import { Flow } from './database/entities/flow.entity';
import { AiConfig } from './database/entities/ai-config.entity';
import { TenantsController } from './tenants/tenants.controller';
import { ConversationsController } from './conversations/conversations.controller';
import { AnalyticsController } from './analytics/analytics.controller';
import { FlowsController } from './flows/flows.controller';
import { HandoffService } from './handoff/handoff.service';
import { SeedService } from './database/seed.service';
import { Resource } from './database/entities/booking.entity';
import { MessagingModule } from './messaging/messaging.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tenant, User, Conversation, Message,
      Booking, Resource, Flow, AiConfig,
    ]),
    MessagingModule,
  ],
  controllers: [
    TenantsController,
    ConversationsController,
    AnalyticsController,
    FlowsController,
  ],
  providers: [HandoffService, SeedService],
})
export class ApiModule {}
