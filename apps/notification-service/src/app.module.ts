import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { NotificationsModule } from './notifications/notifications.module';
import {
  AppLoggingModule,
  HealthModule,
  MetricsModule,
  SentryModule,
  CorrelationMiddleware,
} from '@repo/common';

/**
 * The Root Module of the Notification Service.
 * This module coordinates all the sub-modules of the application.
 */
@Module({
  imports: [
    // 1. Core configuration and environment validation
    AppConfigModule,
    
    // 2. Structured logging (Pino)
    AppLoggingModule.forRoot('notification-service'),
    
    // 3. Database integration with asynchronous loading
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    
    // 4. Enable scheduled tasks (Crons)
    ScheduleModule.forRoot(),
    
    // 5. Observability modules
    HealthModule,
    MetricsModule,
    SentryModule,
    
    // 6. Domain-specific features
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  /**
   * Configure global middleware.
   */
  configure(consumer: MiddlewareConsumer) {
    // Apply correlation ID middleware to all routes
    // This ensures every request has a unique ID that propagates across services.
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
