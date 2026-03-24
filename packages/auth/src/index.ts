/**
 * Barrel export for @repo/auth
 * All services import from this single entry point.
 */
export { ClerkAuthGuard } from './clerk.guard';
export { CurrentUser } from './current-user.decorator';
export { Roles, RolesGuard } from './roles.guard';
export type { ClerkUser } from './types';
