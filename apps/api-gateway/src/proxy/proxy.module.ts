import {
  Logger,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createProxyMiddleware,
  Options,
  fixRequestBody,
} from 'http-proxy-middleware';
import type { Request, Response } from 'express';

interface ServiceRouteConfig {
  /** URL prefix that this gateway listens on */
  pathPrefix: string;
  /** Namespaced config key pointing to the service base URL */
  configKey: string;
}

/**
 * Route definitions for all downstream microservices.
 * To add a new service: add one entry here and its URL to env.schema.ts.
 */
const SERVICE_ROUTES: ServiceRouteConfig[] = [
  { pathPrefix: '/api/users', configKey: 'services.userService' },
  { pathPrefix: '/api/catalog', configKey: 'services.catalogService' },
  { pathPrefix: '/api/products', configKey: 'services.catalogService' },
  { pathPrefix: '/api/orders', configKey: 'services.orderService' },
  { pathPrefix: '/api/payments', configKey: 'services.paymentService' },
  { pathPrefix: '/api/cart', configKey: 'services.catalogService' },
];

@Module({})
export class ProxyModule implements NestModule {
  private readonly logger = new Logger(ProxyModule.name);

  constructor(
    private readonly configService: ConfigService,
  ) {}

  configure(consumer: MiddlewareConsumer): void {
    SERVICE_ROUTES.forEach(({ pathPrefix, configKey }) => {
      const targetUrl = this.configService.get<string>(configKey);

      if (!targetUrl) {
        this.logger.warn(
          `No target URL configured for "${configKey}" (prefix: ${pathPrefix}). Skipping route.`,
        );
        return;
      }

      const proxyOptions: Options = {
        target: targetUrl,
        changeOrigin: true,
        proxyTimeout: 10000, // 10s timeout for the proxy to connect
        timeout: 10000, // 10s timeout for the upstream to respond
        on: {
          error: (err: Error, req: Request, res: Response) => {
            const correlationId = req.headers['x-request-id'];
            const requestPayload = (req as any).body;
            this.logger.error(
              `Proxy error → ${targetUrl} | Method: ${req.method} | URL: ${req.url} | Correlation ID: ${correlationId} | Error: ${err.message}`,
              err.stack,
            );
            if (requestPayload && Object.keys(requestPayload).length > 0) {
              this.logger.error(`Request payload for failed proxy call: ${JSON.stringify(requestPayload)}`);
            }
            if (!res.headersSent) {
              res.status(502).json({
                statusCode: 502,
                error: 'Bad Gateway',
                message: `Upstream service at "${configKey}" is unavailable.`,
                timestamp: new Date().toISOString(),
                path: req.url,
                correlationId,
              });
            }
          },
          proxyReq: (proxyReq, req) => {
            // Ensure correlation ID is forwarded to every upstream service.
            const correlationId = req.headers['x-request-id'];
            if (correlationId) {
              proxyReq.setHeader('x-request-id', correlationId);
            }

            // Fix for hanging body: If the body was already parsed by a middleware
            // (like NestJS ValidationPipe), re-stream it to the proxy request.
            fixRequestBody(proxyReq, req);

            this.logger.debug(
              `Proxying request | Method: ${req.method} | URL: ${req.url} | Target: ${targetUrl} | Correlation ID: ${correlationId}`,
            );
          },
        },
      };

      consumer.apply(createProxyMiddleware(proxyOptions)).forRoutes({
        path: `${pathPrefix}{*rest}`,
        method: RequestMethod.ALL,
      });

      this.logger.log(
        `Route registered: "${pathPrefix}/*" → ${targetUrl}`,
      );
    });
  }
}
