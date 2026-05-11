import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

/**
 * Application roles used for route protection.
 * Keeping them as a union type gives us:
 * - autocomplete
 * - type safety
 * - prevention of invalid role strings
 */
type Role = 'ADMIN' | 'SELLER' | 'CUSTOMER';

/**
 * Shape of the custom metadata stored inside Clerk JWT/session claims.
 *
 * Depending on your Clerk JWT template configuration,
 * roles may appear under:
 * - metadata
 * - publicMetadata
 * - public_metadata
 */
type RoleMetadata = {
  roles?: string[];
};

/**
 * Extended session claims structure.
 *
 * Clerk's default sessionClaims type does not know
 * about our custom role metadata, so we extend it here.
 */
type SessionClaimsWithRoles = {
  metadata?: RoleMetadata;
  publicMetadata?: RoleMetadata;
  public_metadata?: RoleMetadata;
};

/**
 * Matches all routes that require authentication.
 *
 * Examples:
 * - /dashboard
 * - /dashboard/admin
 * - /customer/orders
 */
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/customer(.*)',
]);

/**
 * Matches routes specifically intended for CUSTOMER users.
 *
 * Used for role-based authorization checks.
 */
const isCustomerRoute = createRouteMatcher([
  '/customer(.*)',
  '/dashboard/customer(.*)',
]);

/**
 * Main Clerk middleware.
 *
 * Runs before requests hit your pages/API routes.
 *
 * Responsibilities:
 * 1. Check if route is protected
 * 2. Verify user is signed in
 * 3. Extract user roles from Clerk session claims
 * 4. Restrict access based on roles
 */
export default clerkMiddleware(async (auth, req: NextRequest) => {
  /**
   * Skip middleware logic completely
   * if the current route is public.
   */
  if (!isProtectedRoute(req)) return;

  /**
   * Retrieve authentication/session data
   * for the current request.
   */
  const session = await auth();

  /**
   * Step 1:
   * User must be authenticated.
   *
   * If not signed in,
   * redirect them to Clerk sign-in page.
   */
  if (!session.userId) {
    return session.redirectToSignIn();
  }

  /**
   * Step 2:
   * Extract session claims.
   *
   * We cast because Clerk doesn't automatically
   * know about our custom metadata structure.
   */
  const claims = session.sessionClaims as
    | SessionClaimsWithRoles
    | undefined;

  /**
   * Helpful debug log while configuring Clerk JWT templates.
   *
   * Remove in production if unnecessary.
   */
  console.log(
    'Middleware Debug: Session Claims:',
    JSON.stringify(claims, null, 2)
  );

  /**
   * Step 3:
   * Extract metadata safely.
   *
   * Different Clerk configurations may expose metadata
   * using different property names.
   */
  const metadata: RoleMetadata =
    claims?.metadata ??
    claims?.publicMetadata ??
    claims?.public_metadata ??
    {};

  /**
   * Normalize roles:
   * - fallback to empty array
   * - convert all roles to uppercase
   *
   * This prevents issues like:
   * - "admin"
   * - "Admin"
   * - "ADMIN"
   */
  const userRoles: Role[] = (metadata.roles ?? []).map(
    (role) => role.toUpperCase() as Role
  );

  console.log(
    'Middleware Debug: Extracted User Roles (Normalized):',
    userRoles
  );

  /**
   * Current request pathname.
   *
   * Example:
   * /dashboard/admin/orders
   */
  const path = new URL(req.url).pathname;

  /**
   * ADMIN route protection.
   *
   * Only users with ADMIN role
   * can access /dashboard/admin/*
   */
  if (
    path.startsWith('/dashboard/admin') &&
    !userRoles.includes('ADMIN')
  ) {
    console.warn(
      `Middleware: Access denied for ${session.userId} to admin dashboard. Roles found:`,
      userRoles
    );

    return Response.redirect(
      new URL('/dashboard/forbidden', req.url)
    );
  }

  /**
   * SELLER route protection.
   *
   * Only SELLER users can access:
   * /dashboard/seller/*
   */
  if (
    path.startsWith('/dashboard/seller') &&
    !userRoles.includes('SELLER')
  ) {
    console.warn(
      `Middleware: Access denied for ${session.userId} to seller dashboard. Roles found:`,
      userRoles
    );

    return Response.redirect(
      new URL('/dashboard/forbidden', req.url)
    );
  }

  /**
   * CUSTOMER route protection.
   *
   * Only CUSTOMER users can access:
   * - /customer/*
   * - /dashboard/customer/*
   */
  if (
    isCustomerRoute(req) &&
    !userRoles.includes('CUSTOMER')
  ) {
    /**
     * Fallback behavior:
     *
     * If no roles exist at all,
     * allow access temporarily.
     *
     * This is useful during:
     * - Clerk JWT template setup
     * - migration
     * - debugging
     */
    if (userRoles.length === 0) {
      console.warn(
        `Middleware: No roles found in session claims for ${session.userId}. Allowing /customer as fallback.`
      );

      return;
    }

    /**
     * User has roles,
     * but not the required CUSTOMER role.
     */
  

    return Response.redirect(
      new URL('/dashboard/forbidden', req.url)
    );
  }
});

/**
 * Next.js middleware matcher configuration.
 *
 * Controls which requests trigger this middleware.
 */
export const config = {
  matcher: [
    /**
     * Run middleware for all routes except:
     * - _next static files
     * - images
     * - css/js assets
     * - other static resources
     */
    String.raw`/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)`,

    /**
     * Always run middleware for API routes.
     */
    '/(api|trpc)(.*)',

    /**
     * Required for Clerk frontend APIs.
     */
    '/__clerk/(.*)',
  ],
} as const;