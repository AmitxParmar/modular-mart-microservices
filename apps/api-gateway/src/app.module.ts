import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from './config/config.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { ProxyModule } from './proxy/proxy.module';

/**
 * Root application module.
 *
 * Import order reflects the dependency graph:
 *  1. ConfigModule  - must be first; others depend on ConfigService
 *  2. LoggerModule  - structured HTTP request logging via nestjs-pino
 *  3. CommonModule  - global exception filter
 *  4. RateLimitModule - global rate-limit guard
 *  5. HealthModule  - /health endpoint (not proxied)
 *  6. ProxyModule   - reverse proxy to all downstream microservices (last,
 *                     so middleware is applied after all other middleware)
 */
@Module({
  imports: [
    ConfigModule,

    // Structured JSON logging for every HTTP request.
    // In development we pretty-print; in production we emit raw JSON.
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        level: process.env.LOG_LEVEL ?? 'info',
        // Redact sensitive headers from logs
        redact: ['req.headers.authorization', 'req.headers.cookie'],
      },
    }),

    CommonModule,
    RateLimitModule,
    HealthModule,
    ProxyModule,
  ],
})
export class AppModule {}
