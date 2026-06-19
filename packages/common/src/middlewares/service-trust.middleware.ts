import { Injectable, NestMiddleware, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

/**
 * ServiceTrustMiddleware
 *
 * Ensures that requests to microservices originate from the trusted API Gateway.
 * It checks for a pre-shared secret in the 'X-Gateway-Secret' header.
 *
 * NOTE: On Render free-tier, all service-to-service traffic goes over public
 * HTTPS via *.onrender.com. Kong's request-transformer adds the header before
 * forwarding. Render's reverse proxy passes custom headers through unchanged.
 */
@Injectable()
export class ServiceTrustMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ServiceTrustMiddleware.name);

  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // Allow health check routes to bypass the secret check.
    // /metrics is protected at the controller level via InternalOnlyGuard.
    const path = req.originalUrl || req.url;
    if (
      path.startsWith('/health/') ||
      path.startsWith('/api/health/')
    ) {
      return next();
    }

    const gatewaySecret = this.configService.get<string>('GATEWAY_INTERNAL_SECRET');

    // If GATEWAY_INTERNAL_SECRET is not configured at all, skip enforcement.
    // This prevents accidental lock-out during initial deployment.
    if (!gatewaySecret || gatewaySecret.trim() === '') {
      this.logger.warn(
        `GATEWAY_INTERNAL_SECRET is not set — skipping trust check for ${req.method} ${path}. ` +
        `Set this env var in production to enforce service trust boundaries.`
      );
      return next();
    }

    // Express lowercases all header names, so 'x-gateway-secret' is always correct.
    const incomingSecret = req.headers['x-gateway-secret'];

    if (!incomingSecret) {
      this.logger.error(
        `Service Trust Violation: Missing X-Gateway-Secret header. ` +
        `path=${path} method=${req.method} ip=${req.ip} ` +
        `headers=${JSON.stringify(Object.keys(req.headers))}`
      );
      throw new UnauthorizedException(
        'Service Trust Violation: Request must originate from the trusted API Gateway.'
      );
    }

    if (incomingSecret !== gatewaySecret) {
      this.logger.error(
        `Service Trust Violation: Invalid X-Gateway-Secret header. ` +
        `path=${path} method=${req.method} ip=${req.ip}`
      );
      throw new UnauthorizedException(
        'Service Trust Violation: Request must originate from the trusted API Gateway.'
      );
    }

    next();
  }
}
