import { Module } from '@nestjs/common';
import {
  ThrottlerModule as NestThrottlerModule,
  ThrottlerGuard,
} from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Rate limiting module using @nestjs/throttler.
 * Configuration is read from the namespaced 'rateLimit' config (env.config.ts).
 * The ThrottlerGuard is registered globally via APP_GUARD so every
 * controller in the gateway is protected automatically.
 */
@Module({
  imports: [
    NestThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('rateLimit.ttl', 60_000),
            limit: config.get<number>('rateLimit.limit', 100),
          },
        ],
      }),
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class RateLimitModule {}
