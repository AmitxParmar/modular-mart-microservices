import { Params } from 'nestjs-pino';

/**
 * Creates a consistent nestjs-pino LoggerModule config for all services.
 * Call this inside AppModule's LoggerModule.forRoot().
 *
 * @param serviceName - Name of the service (used as a default log field)
 */
export function createLoggerConfig(serviceName: string): Params {
  return {
    pinoHttp: {
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
      level: process.env.LOG_LEVEL ?? 'info',
      // Make every log line include the service name for easy filtering in prod
      customProps: () => ({ service: serviceName }),
      // Redact sensitive data before it reaches logs
      redact: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.cardNumber',
      ],
    },
  };
}
