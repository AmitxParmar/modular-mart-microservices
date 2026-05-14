import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '@repo/database';
import { UsersModule } from './users/users.module';
import { ConfigModule } from './config/config.module';
import { AuthProxyModule } from './auth-proxy.module';
import {
  HealthModule,
  HttpExceptionFilter,
  CorrelationMiddleware,
  createLoggerConfig,
} from '@repo/common';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRootAsync({
      useFactory: () => createLoggerConfig('user-service'),
    }),
    DatabaseModule.forRoot(),
    AuthProxyModule,
    UsersModule,
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
    // Apply correlation ID middleware to all routes
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
