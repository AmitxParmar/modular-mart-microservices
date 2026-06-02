import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';
import { NotificationsModule } from './notifications/notifications.module';

/**
 * The Root Module of the Notification Service.
 * This module coordinates all the sub-modules of the application.
 */
@Module({
  imports: [
    // Import the configuration module first to ensure environment variables 
    // are loaded and validated before other modules initialize.
    AppConfigModule,
    
    // Asynchronous TypeORM configuration using ConfigService
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        // Automatically load entities registered via forFeature()
        autoLoadEntities: true,
        // Disable synchronize to enforce migration-based schema updates
        synchronize: false,
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    
    // Feature modules
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
