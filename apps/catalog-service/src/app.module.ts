import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { DatabaseModule } from '@repo/database';
import { ConfigModule } from './config/config.module';
import { AuthClientModule } from '@repo/auth';
import {
  HealthModule,
  MetricsModule,
  SentryModule,
  HttpExceptionFilter,
  CorrelationMiddleware,
  createLoggerConfig,
} from '@repo/common';
import { LoggerModule } from 'nestjs-pino';
import { CatalogModule } from './catalog/catalog.module';
import { MessagingModule } from './messaging.module';

@Module({
  imports: [
    ConfigModule,
    AuthClientModule,
    LoggerModule.forRootAsync({
      useFactory: () => createLoggerConfig('catalog-service'),
    }),
    DatabaseModule.forRoot(),
    MessagingModule,
    CatalogModule,
    HealthModule,
    MetricsModule,
    SentryModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
