import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from './core/redis/redis.module';

// Configs
import {
  appConfig, dbConfig, redisConfig, jwtConfig,
  aiConfig, evolutionConfig, storageConfig,
} from './core/config/app.config';

// Entities
import { Tenant } from './database/entities/tenant.entity';
import { User } from './database/entities/user.entity';
import { Client } from './database/entities/client.entity';
import { Conversation } from './database/entities/conversation.entity';
import { Message } from './database/entities/message.entity';
import { Flow } from './database/entities/flow.entity';
import { Booking, Resource } from './database/entities/booking.entity';
import { Automation } from './database/entities/automation.entity';
import { AiConfig } from './database/entities/ai-config.entity';

// Modules
import { TenancyModule } from './core/tenancy/tenancy.module';
import { AuthModule } from './core/auth/auth.module';
import { MemoryModule } from './memory/memory.module';
import { MessagingModule } from './messaging/messaging.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { ApiModule } from './api.module';

const ALL_ENTITIES = [
  Tenant, User, Client, Conversation, Message,
  Flow, Booking, Resource, Automation, AiConfig,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, dbConfig, redisConfig, jwtConfig, aiConfig, evolutionConfig, storageConfig],
    }),

    // Banco: SQLite (dev sem instalação) ou PostgreSQL (produção)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const useSqlite = config.get<boolean>('app.useSqlite');
        if (useSqlite) {
          return {
            type: 'better-sqlite3' as any,
            database: 'omnidesk-dev.sqlite',
            entities: ALL_ENTITIES,
            synchronize: true,
            logging: false,
          };
        }
        return {
          type: 'postgres',
          host: config.get('db.host'),
          port: config.get<number>('db.port'),
          username: config.get('db.user'),
          password: config.get('db.pass'),
          database: config.get('db.name'),
          entities: ALL_ENTITIES,
          synchronize: config.get('app.nodeEnv') === 'development',
          logging: false,
        };
      },
      inject: [ConfigService],
    }),

    // Filas: usa createClient com ioredis-mock (dev) ou Redis real (prod)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const useMock = config.get<boolean>('app.useRedisMock');
        if (useMock) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const RedisMock = require('ioredis-mock');
          const mockInstance = new RedisMock();
          return { createClient: () => mockInstance };
        }
        return {
          redis: {
            host: config.get('redis.host'),
            port: config.get<number>('redis.port'),
            password: config.get('redis.password') || undefined,
          },
        };
      },
      inject: [ConfigService],
    }),

    ScheduleModule.forRoot(),
    RedisModule,
    TenancyModule,
    AuthModule,
    MemoryModule,
    MessagingModule,
    SchedulingModule,
    ApiModule,
  ],
  providers: [],
  exports: [],
})
export class AppModule {}
