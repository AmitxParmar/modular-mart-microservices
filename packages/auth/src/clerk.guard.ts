import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { verifyToken } from "@clerk/backend";
import { ConfigService } from "@nestjs/config";
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
  constructor(
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException(
        "Missing or malformed Authorization header.",
      );
    }

    const secretKey = this.configService.get<string>("CLERK_SECRET_KEY");

    if (!secretKey) {
      this.logger.error("ClerkAuthGuard: CLERK_SECRET_KEY is MISSING in environment variables.");
      throw new UnauthorizedException("Internal authentication configuration error.");
    }

    if (secretKey.startsWith("sk_")) {
      this.logger.debug(`ClerkAuthGuard: CLERK_SECRET_KEY is present and starts with 'sk_'. Length: ${secretKey.length}`);
    } else {
      this.logger.error(`ClerkAuthGuard: CLERK_SECRET_KEY does not start with 'sk_'. It might be a publishable key or malformed. Length: ${secretKey.length}`);
    }

    try {
      // 1. Verify the JWT cryptographically locally without a network request
      // We add clockSkewInMs to handle potential drift between server and Clerk's auth servers
      const payload = await verifyToken(token, {
        secretKey,
        clockSkewInMs: 10000, // 10 seconds of tolerance
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
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`Clerk auth verification failed: ${errorMessage}`);
      
      // If we're in development, providing a bit more detail in the log can help
      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug(`Failed token (first 10 chars): ${token.substring(0, 10)}...`);
        this.logger.debug(`Secret Key starts with: ${secretKey.substring(0, 7)}...`);
      }

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
