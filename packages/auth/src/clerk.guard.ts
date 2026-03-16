import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import type { Request } from 'express';
import type { ClerkUser } from './types';

/**
 * ClerkAuthGuard
 *
 * Verifies the Clerk-issued JWT from the `Authorization: Bearer <token>` header.
 * Attaches the verified payload to `request.auth` for downstream use via @CurrentUser().
 *
 * Usage — apply to a controller or individual route:
 * @UseGuards(ClerkAuthGuard)
 *
 * The guard reads CLERK_SECRET_KEY from process.env at construction time.
 * Ensure it is set before the NestJS app bootstraps.
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing or malformed Authorization header.');
    }

    try {
      const payload = await this.clerk.clients.verifyClient(token);

      // Attach to request so @CurrentUser() can read it
      (request as Request & { auth: ClerkUser }).auth = {
        userId: payload.id,
        sessionId: payload.lastActiveSessionId ?? '',
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired Clerk session token.');
    }
  }

  private extractBearerToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7).trim();
    return token.length > 0 ? token : null;
  }
}
