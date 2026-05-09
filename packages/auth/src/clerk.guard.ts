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
      // Clerk JWT stores custom metadata under publicMetadata (camelCase)
      // Note: top-level `internalId` check kept as a fallback for dev tokens
      const meta = (payload as any).publicMetadata ?? (payload as any).public_metadata;
      const internalId: string | undefined =
        (payload as any).internalId ?? meta?.internalId;

      if (!internalId) {
        this.logger.warn(
          `ClerkAuthGuard: internalId missing from JWT for user ${userId}. ` +
          'User may not have been synced via webhook yet.',
        );
      }

      // 2. Attach to request so @CurrentUser() can read it
      // Note: Clerk templates might return the literal string "null" if mapping fails
      const verifiedInternalId = 
        internalId && internalId !== "null" && internalId !== "undefined" 
          ? internalId 
          : "";

      (request as Request & { auth: ClerkUser }).auth = {
        userId,
        internalId: verifiedInternalId,
        sessionId: payload.sid,
        email: (payload as any).email || (payload as any).email_address,
      };

      this.logger.debug(`ClerkAuthGuard: User ${userId} authenticated with internalId: ${verifiedInternalId || 'MISSING'}`);

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
