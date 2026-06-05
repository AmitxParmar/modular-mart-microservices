import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '@repo/database';
import { UsersModule } from './users/users.module';
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

@Module({
  imports: [
    ConfigModule,
    AppLoggingModule.forRoot('user-service'),
    DatabaseModule.forRoot(),
    AuthClientModule,
    UsersModule,
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
    // Apply correlation ID and Service Trust middleware to all routes.
    // ServiceTrustMiddleware ensures requests come from the API Gateway.
    consumer.apply(CorrelationMiddleware, ServiceTrustMiddleware).forRoutes('*');
  }
}
