import { DynamicModule, Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { createLoggerConfig } from './logger.config';

/**
 * AppLoggingModule — the single entry point for structured Pino logging.
 *
 * Usage in each service's AppModule:
 *   imports: [AppLoggingModule.forRoot('my-service')]
 *
 * This wrapper means services NEVER need to import `nestjs-pino` directly.
 */
@Module({})
export class AppLoggingModule {
  static forRoot(serviceName: string): DynamicModule {
    return {
      module: AppLoggingModule,
      imports: [
        LoggerModule.forRootAsync({
          useFactory: () => createLoggerConfig(serviceName),
        }),
      ],
      exports: [LoggerModule],
    };
  }
}
