/**
 * Represents the authenticated Clerk user payload
 * attached to every request that passes ClerkAuthGuard.
 *
 * Available via `@CurrentUser()` in controller methods.
 */
export interface ClerkUser {
  /** The Clerk user ID (e.g. "user_2abc...") */
  userId: string;
  /** The local database UUID for the user */
  internalId: string;
  /** The Clerk session ID */
  sessionId: string;
  /** Custom Role retrieved from Clerk publicMetadata */
  role?: string;
  /** User email retrieved from Clerk JWT */
  email?: string;
}
