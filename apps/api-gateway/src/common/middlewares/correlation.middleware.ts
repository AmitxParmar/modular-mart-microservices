import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Correlation ID Middleware.
 *
 * In a distributed system, a single user action fans out across many services.
 * This middleware ensures every request carries a unique `X-Request-ID` header
 * that is:
 *   1. Accepted from the client (if trusted) or generated fresh here
 *   2. Forwarded in the proxy request to all upstream microservices
 *      (via http-proxy-middleware's `changeOrigin` behaviour)
 *   3. Echoed back in the response so clients can report it for debugging
 *
 * Pino's `pinoHttp` automatically picks up `req.id` as the request ID in logs.
 */
@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Accept an existing correlation ID from upstream (e.g. from your frontend
    // or an outer edge gateway), or generate a new one.
    const correlationId =
      (req.headers['x-request-id'] as string) ?? randomUUID();

    // Normalise: always set it on the request headers so downstream proxies
    // and pino's req.id both see the same value.
    req.headers['x-request-id'] = correlationId;

    // Echo back in the response so clients can use it for support tickets.
    res.setHeader('x-request-id', correlationId);

    next();
  }
}
