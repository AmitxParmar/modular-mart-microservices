import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '@repo/database';
import { ConfigModule } from './config/config.module';
import { AuthClientModule } from '@repo/auth';
import {
  AppLoggingModule,
  HealthModule,
  MetricsModule,
  SentryModule,
  HttpExceptionFilter,
  CorrelationMiddleware,
  ServiceTrustMiddleware,
} from '@repo/common';
// TypeOrmModule removed — no standalone forFeature registrations needed at root
import { OrdersModule } from './orders/orders.module';
import { MessagingModule } from './messaging.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule,
    AuthClientModule,
    MessagingModule,
    ScheduleModule.forRoot(),
    AppLoggingModule.forRoot('order-service'),
    DatabaseModule.forRoot(),
    OrdersModule,
    HealthModule,
    MetricsModule,
    SentryModule,
  ],

  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationMiddleware, ServiceTrustMiddleware).forRoutes('*');
  }
}
