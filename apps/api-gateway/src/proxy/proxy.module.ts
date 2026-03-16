import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
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
  { pathPrefix: '/api/products', configKey: 'services.productService' },
  { pathPrefix: '/api/orders', configKey: 'services.orderService' },
  { pathPrefix: '/api/payments', configKey: 'services.paymentService' },
  { pathPrefix: '/api/cart', configKey: 'services.cartService' },
];

@Module({})
export class ProxyModule implements NestModule {
  constructor(
    private readonly configService: ConfigService,
    @InjectPinoLogger(ProxyModule.name)
    private readonly logger: PinoLogger,
  ) {}

  configure(consumer: MiddlewareConsumer): void {
    SERVICE_ROUTES.forEach(({ pathPrefix, configKey }) => {
      const targetUrl = this.configService.get<string>(configKey);

      if (!targetUrl) {
        this.logger.warn(
          { configKey, pathPrefix },
          `No target URL configured for "${configKey}". Skipping route.`,
        );
        return;
      }

      const proxyOptions: Options = {
        target: targetUrl,
        changeOrigin: true,
        on: {
          error: (err: Error, req: Request, res: Response) => {
            const correlationId = req.headers['x-request-id'];
            this.logger.error(
              {
                method: req.method,
                url: req.url,
                target: targetUrl,
                correlationId,
                err,
              },
              `Proxy error → ${targetUrl}`,
            );
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
            this.logger.debug(
              {
                method: req.method,
                url: req.url,
                target: targetUrl,
                correlationId,
              },
              `Proxying request`,
            );
          },
        },
      };

      consumer.apply(createProxyMiddleware(proxyOptions)).forRoutes({
        path: `${pathPrefix}{*rest}`,
        method: RequestMethod.ALL,
      });

      this.logger.info(
        { pathPrefix, target: targetUrl },
        `Route registered: "${pathPrefix}/*" → ${targetUrl}`,
      );
    });
  }
}
