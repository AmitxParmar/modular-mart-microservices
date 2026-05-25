import { Module } from '@nestjs/common';
import { SentryModule as NestSentryModule } from '@sentry/nestjs';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    NestSentryModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        dsn: configService.get<string>('SENTRY_DSN') || configService.get<string>('services.sentryDsn'),
        tracesSampleRate: 1.0,
        profilesSampleRate: 1.0,
        environment: configService.get<string>('NODE_ENV', 'development'),
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [NestSentryModule],
})
export class SentryModule {}
