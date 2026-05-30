export * from './logger.config';
export * from './logger.constants';
export * from './logger.types';
export * from './logger.utils';
export * from './trace.utils';
export * from './correlation-id.store';
export { AppLoggingModule } from './logging.module';

// Re-export nestjs-pino primitives — services import from @repo/common, not nestjs-pino directly
export { Logger, PinoLogger, InjectPinoLogger } from 'nestjs-pino';
