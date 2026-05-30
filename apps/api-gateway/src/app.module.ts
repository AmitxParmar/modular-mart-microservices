import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import {
  CorrelationMiddleware,
  HttpExceptionFilter,
  HealthModule,
  MetricsModule,
  SentryModule,
  AppLoggingModule,
} from '@repo/common';

import { ConfigModule } from './config/config.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { ProxyModule } from './proxy/proxy.module';

/**
 * Root application module.
 *
 * Import order reflects the dependency graph:
 *  1. ConfigModule    - must be first; others depend on ConfigService
 *  2. AppLoggingModule - structured HTTP request logging via nestjs-pino (from @repo/common)
 *  3. RateLimitModule - global rate-limit guard
 *  4. HealthModule    - /health endpoint (not proxied)
 *  5. ProxyModule     - reverse proxy to all downstream microservices (last,
 *                       so middleware is applied after all other middleware)
 */
@Module({
  imports: [
    ConfigModule,
    AppLoggingModule.forRoot('api-gateway'),
    RateLimitModule,
    HealthModule,
    MetricsModule,
    SentryModule,
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

