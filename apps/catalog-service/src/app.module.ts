import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { DatabaseModule } from '@repo/database';
import { ConfigModule } from './config/config.module';
import {
  HealthModule,
  HttpExceptionFilter,
  CorrelationMiddleware,
  createLoggerConfig,
} from '@repo/common';
import { LoggerModule } from 'nestjs-pino';
import { CatalogModule } from './catalog/catalog.module';
import { AuthProxyModule } from './auth-proxy.module';
import { MessagingModule } from './messaging.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRootAsync({
      useFactory: () => createLoggerConfig('catalog-service'),
    }),
    DatabaseModule.forRoot(),
    AuthProxyModule,
    MessagingModule,
    CatalogModule,
    HealthModule,
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
