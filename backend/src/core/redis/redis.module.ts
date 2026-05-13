import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (config: ConfigService) => {
        const useMock = config.get<boolean>('app.useRedisMock');
        if (useMock) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const RedisMock = require('ioredis-mock');
          return new RedisMock();
        }
        return new Redis({
          host: config.get('redis.host') || 'localhost',
          port: config.get<number>('redis.port') || 6379,
          password: config.get('redis.password') || undefined,
          lazyConnect: true,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
