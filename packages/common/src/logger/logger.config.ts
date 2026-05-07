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
      serializers: {
        req(req) {
          return {
            id: req.id,
            method: req.method,
            url: req.url,
          };
        },

        res(res) {
          return {
            statusCode: res.statusCode,
          };
        },
      },
      transport:
          process.env.NODE_ENV === 'development'
          ? {
            target: 'pino-pretty',
            options: { colorize: true },
          }
    : undefined,
      level: process.env.LOG_LEVEL ?? 'info',
      // Make every log line include the service name for easy filtering in prod
      customProps: (req,res) => ({ service: serviceName,requestId: req.id, }),

      genReqId: (req) =>
        req.headers['x-request-id']?.toString() ??
        crypto.randomUUID(),

      customSuccessMessage: (req, res) =>
  `${req.method} ${req.url} completed ${res.statusCode}`,  

      customErrorMessage: (req, res, err) =>
  `${req.method} ${req.url} failed with ${res.statusCode}: ${err.message}`,

      // Redact sensitive data before it reaches logs
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.cardNumber',
          'req.body.cvc',
          'req.body.token',
          'req.body.accessToken',
          'req.body.refreshToken',
        ],
        censor: '[REDACTED]',
      }
    },
  };
}
