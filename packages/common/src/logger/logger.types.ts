import { Params } from 'nestjs-pino';

/**
 * Custom logger configuration options.
 */
export interface LoggerConfigOptions {
  /**
   * Name of the service.
   */
  serviceName: string;
  /**
   * Environment (e.g., development, production).
   */
  env?: string;
  /**
   * Log level.
   */
  level?: string;
}

/**
 * Standard log event names.
 */
export enum LogEvents {
  REQUEST_STARTED = 'request_started',
  REQUEST_COMPLETED = 'request_completed',
  REQUEST_FAILED = 'request_failed',
  SERVICE_STARTED = 'service_started',
  SERVICE_STOPPED = 'service_stopped',
}
