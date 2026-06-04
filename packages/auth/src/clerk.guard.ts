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
import { PinoLogger } from "nestjs-pino";

/**
 * ClerkAuthGuard
 * 
 * Intercepts incoming HTTP requests to verify the Clerk-issued JWT.
 * It ensures the user is authenticated and attaches the verified user info
 * to the request object for use in controllers.
 */
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Main entry point for the guard. Orchestrates token extraction, verification,
   * and user data attachment.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. Extract the bearer token from the Authorization header
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException("Missing or malformed Authorization header.");
    }

    // 2. Validate environment configuration
    const secretKey = this.validateConfiguration();

    try {
      // 3. Verify the JWT cryptographically
      const payload = await this.verifySession(token, secretKey);

      // 4. Process the payload and attach verified user info to the request
      (request as Request & { auth: ClerkUser }).auth = this.processPayload(payload);

      return true;
    } catch (err) {
      this.handleVerificationError(err, token, secretKey);
      throw new UnauthorizedException("Invalid or expired Clerk session token.");
    }
  }

  /**
   * Validates that the necessary Clerk configuration is present.
   * @returns The Clerk secret key.
   */
  private validateConfiguration(): string {
    const secretKey = this.configService.get<string>("CLERK_SECRET_KEY");

    if (!secretKey) {
      this.logger.error("ClerkAuthGuard: CLERK_SECRET_KEY is MISSING.");
      throw new UnauthorizedException("Internal authentication configuration error.");
    }

    if (!secretKey.startsWith("sk_")) {
      this.logger.error("ClerkAuthGuard: CLERK_SECRET_KEY is malformed (should start with sk_).");
    }

    return secretKey;
  }

  /**
   * Verifies the token against Clerk's backend logic.
   * Includes a 10s clock skew tolerance for distributed systems.
   */
  private async verifySession(token: string, secretKey: string) {
    return await verifyToken(token, {
      secretKey,
      clockSkewInMs: 10000,
    });
  }

  /**
   * Transforms the raw JWT payload into a clean ClerkUser object.
   * Handles metadata extraction and internal ID resolution.
   */
  private processPayload(payload: any): ClerkUser {
    const userId = payload.sub;
    
    // Attempt to extract internalId from various metadata locations
    const meta = payload.publicMetadata ?? payload.public_metadata;
    const internalId: string | undefined = payload.internalId ?? meta?.internalId;

    if (!internalId) {
      this.logger.warn(`ClerkAuthGuard: internalId missing for user ${userId}. Sync might be pending.`);
    }

    // Sanitize the internalId (handle potential stringified nulls from templates)
    const verifiedInternalId = 
      internalId && internalId !== "null" && internalId !== "undefined" 
        ? internalId 
        : "";

    return {
      userId,
      internalId: verifiedInternalId,
      sessionId: payload.sid,
      email: payload.email || payload.email_address,
    };
  }

  /**
   * Logs verification failures with context for debugging.
   */
  private handleVerificationError(err: any, token: string, secretKey: string) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    this.logger.error(`Clerk auth verification failed: ${errorMessage}`);
    
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`Failed token (prefix): ${token.substring(0, 10)}...`);
      this.logger.debug(`Secret Key (prefix): ${secretKey.substring(0, 7)}...`);
    }
  }

  /**
   * Helper to extract the token from the Authorization header.
   */
  private extractBearerToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.slice(7).trim();
    return token.length > 0 ? token : null;
  }
}
