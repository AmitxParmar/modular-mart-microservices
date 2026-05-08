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
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from './catalog/catalog.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { Payment } from './payments/entities/payment.entity';
import { AuthProxyModule } from './auth-proxy.module';

@Module({
  imports: [
    ConfigModule,
    AuthProxyModule,
    LoggerModule.forRootAsync({
      useFactory: () => createLoggerConfig('catalog-order-service'),
    }),
    DatabaseModule.forRoot(),
    CatalogModule,
    OrdersModule,
    PaymentsModule,
    TypeOrmModule.forFeature([Payment]),
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
