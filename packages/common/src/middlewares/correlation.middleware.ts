import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { correlationStorage } from '../logger/correlation-id.store';

/**
 * Correlation ID middleware.
 * Apply in every service to propagate X-Request-ID across the entire system.
 * Pino's pinoHttp picks up req.id automatically.
 */
@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // If pino-http has already generated an ID, use it.
    // Otherwise, check header or generate a new one.
    const correlationId =
      (req as any).id ??
      (req.headers['x-request-id'] as string) ??
      randomUUID();

    req.headers['x-request-id'] = correlationId;
    res.setHeader('x-request-id', correlationId);

    if ((req as any).log) {
      (req as any).log.info(`Incoming request: ${req.method} ${req.url}`);
    } else {
      console.log(`[CorrelationMiddleware] Incoming request: ${req.method} ${req.url}`);
    }

    // Provide the correlationId to the async local storage for both HTTP and Logger usage
    correlationStorage.run(new Map([['correlationId', correlationId]]), () => {
      next();
    });
  }
}
