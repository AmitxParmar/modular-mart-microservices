import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

/**
 * Application roles used for route protection.
 */
type Role = 'ADMIN' | 'SELLER' | 'CUSTOMER';

/**
 * Shape of the custom metadata stored inside Clerk JWT/session claims.
 */
type RoleMetadata = {
  roles?: string[];
};

/**
 * Extended session claims structure to include custom role metadata.
 */
type SessionClaimsWithRoles = {
  metadata?: RoleMetadata;
  publicMetadata?: RoleMetadata;
  public_metadata?: RoleMetadata;
};

/**
 * Configuration for route-based authorization.
 * Maps path patterns to the roles allowed to access them.
 */
const ROUTE_PROTECTION = [
  { 
    matcher: createRouteMatcher(['/dashboard/admin(.*)']), 
    roles: ['ADMIN'] as Role[],
    name: 'Admin Dashboard'
  },
  { 
    matcher: createRouteMatcher(['/dashboard/seller(.*)']), 
    roles: ['SELLER'] as Role[],
    name: 'Seller Dashboard'
  },
  { 
    matcher: createRouteMatcher(['/customer(.*)', '/dashboard/customer(.*)', '/checkout(.*)']), 
    roles: ['CUSTOMER'] as Role[],
    name: 'Customer Area',
    // Special handling for checkout to avoid redirect loops with modal auth
    skipRedirectOnUnauthenticated: (path: string) => path.startsWith('/checkout')
  },
];

/**
 * Matches all routes that require at least basic authentication.
 */
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/customer(.*)',
  '/checkout(.*)',
]);

/**
 * Main Clerk middleware for authentication and role-based access control.
 * Orchestrates the verification process based on the ROUTE_PROTECTION config.
 */
export default clerkMiddleware(async (auth, req: NextRequest) => {
  // 1. Skip middleware for public routes
  if (!isProtectedRoute(req)) return;

  const session = await auth();
  const path = new URL(req.url).pathname;

  // 2. Handle unauthenticated users
  if (!session.userId) {
    // Check if any rule allows skipping redirect (e.g., checkout uses a modal)
    const currentRule = ROUTE_PROTECTION.find(rule => rule.matcher(req));
    if (currentRule?.skipRedirectOnUnauthenticated?.(path)) {
      return;
    }
    return session.redirectToSignIn();
  }

  // 3. Extract and normalize user roles from Clerk session claims
  const claims = session.sessionClaims as SessionClaimsWithRoles | undefined;
  const metadata: RoleMetadata = claims?.metadata ?? claims?.publicMetadata ?? claims?.public_metadata ?? {};
  const userRoles: Role[] = (metadata.roles ?? []).map(role => role.toUpperCase() as Role);

  // 4. Verify role-based access based on configuration
  for (const rule of ROUTE_PROTECTION) {
    if (rule.matcher(req)) {
      const isAuthorized = rule.roles.some(role => userRoles.includes(role));
      
      // Fallback: Allow access if no roles are set yet (for onboarding/dev)
      if (!isAuthorized && userRoles.length === 0) {
        console.warn(`Middleware: No roles found for user ${session.userId}. Allowing temporary fallback.`);
        continue;
      }

      if (!isAuthorized) {
        console.warn(`Middleware: Access denied for ${session.userId} to ${rule.name}. Required: ${rule.roles}, Found: ${userRoles}`);
        return Response.redirect(new URL('/dashboard/forbidden', req.url));
      }
    }
  }
});

/**
 * Next.js middleware matcher configuration.
 * Controls which requests trigger this middleware.
 */
export const config = {
  matcher: [
    // Skip static files and assets
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Required for Clerk frontend APIs
    '/__clerk/(.*)',
  ],
};
