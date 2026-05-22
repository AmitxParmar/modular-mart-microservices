import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import {
  createLoggerConfig,
  CorrelationMiddleware,
  HttpExceptionFilter,
  HealthModule,
} from '@repo/common';

import { ConfigModule } from './config/config.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { ProxyModule } from './proxy/proxy.module';

/**
 * Root application module.
 *
 * Import order reflects the dependency graph:
 *  1. ConfigModule  - must be first; others depend on ConfigService
 *  2. LoggerModule  - structured HTTP request logging via nestjs-pino
 *  3. RateLimitModule - global rate-limit guard
 *  4. HealthModule  - /health endpoint (not proxied)
 *  5. ProxyModule   - reverse proxy to all downstream microservices (last,
 *                     so middleware is applied after all other middleware)
 */
@Module({
  imports: [
    ConfigModule,

    // Structured JSON logging for every HTTP request.
    // Centrally managed in @repo/common/logger
    LoggerModule.forRootAsync({
      useFactory: () => createLoggerConfig('api-gateway'),
    }),

    RateLimitModule,
    HealthModule,
    ProxyModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Apply correlation ID middleware to all routes at the entry point.
    // This ensures every request gets an X-Request-ID early in its lifecycle.
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}

