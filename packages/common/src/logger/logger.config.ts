import { Params } from 'nestjs-pino';
import { SENSITIVE_FIELDS, REDACTION_LABEL, HEALTH_CHECK_PATH } from './logger.constants';
import { serializers } from './logger.utils';
import { genReqId, traceUtils } from './trace.utils';
import { getCorrelationId } from './correlation-id.store';

/**
 * Creates a consistent nestjs-pino LoggerModule config for all services.
 * Call this inside AppModule's LoggerModule.forRoot().
 *
 * @param serviceName - Name of the service (used as a default log field)
 */
export function createLoggerConfig(serviceName: string): Params {
  const isDevelopment = process.env.NODE_ENV === 'development';
  // Use pino-pretty only in development and if not explicitly disabled.
  // This is crucial for Docker environments where pino-pretty (a devDependency) is missing.
  const usePrettyLogs = isDevelopment && process.env.LOG_PRETTY !== 'false';

  return {
    pinoHttp: {
      // 1. Request ID Generation
      genReqId,

      // 2. Standardized Serializers
      serializers,

      // 3. Environment-Aware Transport
      transport: usePrettyLogs
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
              translateTime: 'SYS:standard',
            },
          }
        : undefined,

      // 4. Log Level
      level: process.env.LOG_LEVEL ?? (isDevelopment ? 'debug' : 'info'),

      customLogLevel: (req: any, res: any, err?: Error) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },

      // 5. Common Metadata
      customProps: (req: any) => ({
        service: serviceName,
        env: process.env.NODE_ENV,
        version: process.env.npm_package_version,
        requestId: req.id,
        correlationId: getCorrelationId() !== 'unknown' ? getCorrelationId() : req.id,
        ...traceUtils.getTraceContext(),
      }),

      // 6. Custom Messages
      customSuccessMessage: (req: any, res: any) =>
        `${req.method} ${req.url} completed ${res.statusCode}`,

      customErrorMessage: (req: any, res: any, err: Error) =>
        `${req.method} ${req.url} failed with ${res.statusCode}: ${err.message}`,

      // 7. Redaction Rules
      redact: {
        paths: SENSITIVE_FIELDS,
        censor: REDACTION_LABEL,
      },

      // 8. Health Check Ignore Rules
      autoLogging: {
        ignore: (req: any) => req.url === HEALTH_CHECK_PATH,
      },

      // 9. Standardized Log Format
      formatters: {
        level: (label) => ({ level: label }),
      },
    },
  };
}
