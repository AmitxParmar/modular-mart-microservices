import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { createClerkClient, verifyToken } from "@clerk/backend";
import type { Request } from "express";
import type { ClerkUser } from "./types";
import { PinoLogger } from "@repo/common";

/**
 * ClerkAuthGuard
 *
 * Verifies the Clerk-issued JWT from the `Authorization: Bearer <token>` header.
 * Attaches the verified payload to `request.auth` for downstream use via @CurrentUser().
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  constructor(private readonly logger: PinoLogger) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException(
        "Missing or malformed Authorization header.",
      );
    }

    try {
      // 1. Verify the JWT cryptographically locally without a network request
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      const userId = payload.sub;

      // 2. Attach to request so @CurrentUser() can read it
      (request as Request & { auth: ClerkUser }).auth = {
        userId,
        sessionId: payload.sid,
        // Role is now resolved statelessly by RolesGuard via MessagePattern
      };

      return true;
    } catch (err) {
      if (err instanceof Error) {
        this.logger.error(`Clerk auth verification failed: ${err.message}`);
        throw new UnauthorizedException(
          "Invalid or expired Clerk session token.",
        );
      }
      this.logger.error(`Clerk auth verification failed: ${err}`);
      throw new UnauthorizedException(
        "Invalid or expired Clerk session token.",
      );
    }
  }

  private extractBearerToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.slice(7).trim();
    return token.length > 0 ? token : null;
  }
}
