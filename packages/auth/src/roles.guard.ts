import {
  SetMetadata,
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom, timeout, TimeoutError } from "rxjs";
import { EVENT_PATTERNS } from "@repo/contracts";
import type { Request } from "express";
import type { ClerkUser } from "./types";
import { PinoLogger } from "nestjs-pino";

export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly logger: PinoLogger,
    private readonly reflector: Reflector,
    @Inject("AUTH_SERVICE") private readonly authClient: ClientProxy, // Must be provided by consuming app
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { auth } = context
      .switchToHttp()
      .getRequest<Request & { auth?: ClerkUser }>();

    // If user is not authenticated natively, deny
    if (!auth?.userId) {
      return false;
    }

    this.logger.info(`RolesGuard: Checking roles for userId=${auth.userId} internalId=${auth.internalId || 'N/A'}. Required: ${JSON.stringify(requiredRoles)}`);

    // Ping the user-service to fetch relational roles via RabbitMQ.
    // A 30s timeout prevents hanging indefinitely when user-service is cold-starting
    // (Render free-tier spins down after 15 min — cold start takes 30-60s).
    try {
      this.logger.info(`RolesGuard: Sending GET_USER_ROLE request to AUTH_SERVICE for userId=${auth.userId}`);
      const roles: string[] = await firstValueFrom(
        this.authClient.send(EVENT_PATTERNS.GET_USER_ROLE, {
          userId: auth.userId,
        }).pipe(timeout(30_000)),
      );

      this.logger.info(`RolesGuard: Received roles from AUTH_SERVICE: ${JSON.stringify(roles)} for userId=${auth.userId}`);

      auth.role = roles.length > 0 ? roles[0] : undefined; // Attach it for potential downstream controllers

      // Check if user has at least one of the required roles
      const hasRole = requiredRoles.some((role) => roles.includes(role));
      this.logger.info(`RolesGuard: Result for userId=${auth.userId}: hasRole=${hasRole}`);
      return hasRole;
    } catch (err) {
      if (err instanceof TimeoutError) {
        this.logger.warn(
          `RolesGuard: Role check timed out after 30s for userId=${auth.userId}. ` +
          `user-service may be cold-starting. Denying access (fail-closed).`
        );
      } else {
        this.logger.error(`Failed to verify role via AUTH_SERVICE: ${err instanceof Error ? err.message : err}. Stack: ${err instanceof Error ? err.stack : 'N/A'}`);
      }
      return false;
    }
  }
}
