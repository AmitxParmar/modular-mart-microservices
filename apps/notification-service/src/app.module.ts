import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './config/config.module';

/**
 * The Root Module of the Notification Service.
 * This module coordinates all the sub-modules of the application.
 */
@Module({
  imports: [
    // Import the configuration module first to ensure environment variables 
    // are loaded and validated before other modules initialize.
    AppConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
