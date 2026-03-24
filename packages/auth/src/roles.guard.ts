import { SetMetadata, Injectable, CanActivate, ExecutionContext, Inject, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import type { Request } from 'express';
import type { ClerkUser } from './types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private reflector: Reflector,
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy, // Must be provided by consuming app
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { auth } = context.switchToHttp().getRequest<Request & { auth?: ClerkUser }>();
    
    // If user is not authenticated natively, deny
    if (!auth || !auth.userId) {
      return false;
    }

    // Ping the user-service to fetch relational roles via TCP!
    try {
      const roles: string[] = await firstValueFrom(
        this.authClient.send('get_user_role', { userId: auth.userId })
      );

      auth.role = roles.length > 0 ? roles[0] : undefined; // Attach it for potential downstream controllers

      // Check if user has at least one of the required roles
      return requiredRoles.some((role) => roles.includes(role));
    } catch (err) {
      this.logger.error(`Failed to verify role via AUTH_SERVICE TCP: ${err}`);
      return false;
    }
  }
}
