import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { ClerkUser } from './types';

/**
 * @CurrentUser() parameter decorator.
 *
 * Extracts the authenticated Clerk user payload from the request.
 * Must only be used on routes protected by ClerkAuthGuard.
 *
 * @example
 * @Get('me')
 * @UseGuards(ClerkAuthGuard)
 * getMe(@CurrentUser() user: ClerkUser) {
 *   return this.usersService.findById(user.userId);
 * }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ClerkUser => {
    const request = ctx.switchToHttp().getRequest<Request & { auth: ClerkUser }>();
    return request.auth;
  },
);
