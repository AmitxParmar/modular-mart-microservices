import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * InternalOnlyGuard
 *
 * Restricts sensitive endpoints (/metrics, /swagger, /docs, /admin) to callers
 * that present the X-Gateway-Secret header. On Render free-tier every service
 * has a public HTTPS URL — this guard prevents external scraping of Prometheus
 * metrics or Swagger docs.
 *
 * Apply at the controller level:
 *   @UseGuards(InternalOnlyGuard)
 *
 * Or per-route:
 *   @Get('metrics')
 *   @UseGuards(InternalOnlyGuard)
 *   getMetrics() { ... }
 *
 * Note: If GATEWAY_INTERNAL_SECRET is not set, the guard logs a warning
 * and allows the request (avoids lock-out during initial setup).
 */
@Injectable()
export class InternalOnlyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const secret = this.config.get<string>('GATEWAY_INTERNAL_SECRET');

    if (!secret || secret.trim() === '') {
      // Not configured — skip enforcement, but warn
      return true;
    }

    const header = req.headers['x-gateway-secret'];
    if (header !== secret) {
      throw new UnauthorizedException('Access to internal endpoints is restricted.');
    }

    return true;
  }
}
