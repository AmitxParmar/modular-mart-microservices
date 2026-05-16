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
import { PaymentsModule } from './payments/payments.module';
import { MessagingModule } from './messaging.module';

@Module({
  imports: [
    ConfigModule,
    MessagingModule,
    LoggerModule.forRootAsync({
      useFactory: () => createLoggerConfig('payment-service'),
    }),
    DatabaseModule.forRoot(),
    PaymentsModule,
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
