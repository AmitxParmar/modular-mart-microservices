/**
 * Represents the authenticated Clerk user payload
 * attached to every request that passes ClerkAuthGuard.
 *
 * Available via `@CurrentUser()` in controller methods.
 */
export interface ClerkUser {
  /** The Clerk user ID (e.g. "user_2abc...") */
  userId: string;
  /** The Clerk session ID */
  sessionId: string;
}
