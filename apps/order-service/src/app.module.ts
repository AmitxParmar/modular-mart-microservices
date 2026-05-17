import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '@repo/database';
import { ConfigModule } from './config/config.module';
import {
  HealthModule,
  HttpExceptionFilter,
  CorrelationMiddleware,
  createLoggerConfig,
} from '@repo/common';
import { LoggerModule } from 'nestjs-pino';
// TypeOrmModule removed — no standalone forFeature registrations needed at root
import { OrdersModule } from './orders/orders.module';
import { AdminModule } from './admin/admin.module';
import { AuthProxyModule } from './auth-proxy.module';
import { MessagingModule } from './messaging.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule,
    AuthProxyModule,
    MessagingModule,
    ScheduleModule.forRoot(),
    LoggerModule.forRootAsync({
      useFactory: () => createLoggerConfig('order-service'),
    }),
    DatabaseModule.forRoot(),
    OrdersModule,
    AdminModule,
    HealthModule,
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
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
