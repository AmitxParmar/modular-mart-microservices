import type { Request } from 'express';

/**
 * Shared AuthContext for all services.
 * Represents the authenticated user information derived from the Gateway.
 */
export interface AuthContext {
  /** The unique identifier from the Identity Provider (e.g., Clerk ID) */
  userId: string;
  /** The internal database UUID for the user */
  internalId: string;
  /** The user's primary email address */
  email?: string;
}

/**
 * Extension of the Express Request object to include authenticated user context.
 */
export interface AuthenticatedRequest extends Request {
  /** The authentication payload attached by middleware/guards */
  auth: AuthContext;
}

/**
 * Represents the standard headers injected by Kong Gateway after successful authentication.
 * Services should use these to reconstruct the user context.
 */
export interface GatewayHeaders {
  /** Maps to X-User-ID header */
  "x-user-id": string;
  /** Maps to X-User-Internal-ID header */
  "x-user-internal-id": string;
  /** Maps to X-User-Email header */
  "x-user-email"?: string;
  /** Maps to X-Request-ID header (Correlation ID) */
  "x-request-id": string;
}

/**
 * Minimal UserContext for business logic usage, decoupled from the underlying auth provider.
 */
export interface UserContext {
  /** External user identifier */
  userId: string;
  /** Internal system identifier */
  internalId: string;
  /** Optional user email */
  email?: string;
}
