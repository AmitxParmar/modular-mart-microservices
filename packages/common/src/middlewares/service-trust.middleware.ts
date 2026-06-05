import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

/**
 * ServiceTrustMiddleware
 *
 * Ensures that requests to microservices originate from the trusted API Gateway.
 * It checks for a pre-shared secret in the 'X-Gateway-Secret' header.
 */
@Injectable()
export class ServiceTrustMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const gatewaySecret = this.configService.get<string>('GATEWAY_INTERNAL_SECRET');
    const incomingSecret = req.headers['x-gateway-secret'];

    // In production, we enforce the secret check to establish a trust boundary.
    // In development, it's optional unless GATEWAY_INTERNAL_SECRET is set.
    if (process.env.NODE_ENV === 'production' || (gatewaySecret && gatewaySecret !== "")) {
      if (!incomingSecret || incomingSecret !== gatewaySecret) {
        throw new UnauthorizedException('Service Trust Violation: Request must originate from the trusted API Gateway.');
      }
    }

    next();
  }
}
