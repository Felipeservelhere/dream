import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../database/entities/client.entity';
import { ConversationMemoryService } from './conversation/conversation-memory.service';
import { ProfileMemoryService } from './profile/profile-memory.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Client])],
  providers: [ConversationMemoryService, ProfileMemoryService],
  exports: [ConversationMemoryService, ProfileMemoryService],
})
export class MemoryModule {}
