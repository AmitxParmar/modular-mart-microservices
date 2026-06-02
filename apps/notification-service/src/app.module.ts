import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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
    // 1. Core configuration and environment validation
    AppConfigModule,
    
    // 2. Database integration with asynchronous loading
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
    
    // 3. Enable scheduled tasks (Crons)
    ScheduleModule.forRoot(),
    
    // 4. Domain-specific features
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
