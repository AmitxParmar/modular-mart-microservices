import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Protect all dashboard routes
const isDashboardRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isDashboardRoute(req)) {
    const session = await auth();
    
    // 1. Must be signed in
    if (!session.userId) {
      return session.redirectToSignIn();
    }

    // 2. Extract roles from Clerk metadata
    // Check multiple potential keys as they depend on the Clerk JWT Template configuration
    const claims = session.sessionClaims as any;
    const metadata = claims?.metadata || claims?.publicMetadata || claims?.public_metadata || {};
    const userRoles = (metadata?.roles || []) as string[];

    const url = new URL(req.url);
    const path = url.pathname;

    // 3. Match path to required role
    // We use a permissive check if the claims are missing to avoid complete lockout during setup,
    // but ideally the JWT template should be configured in Clerk Dashboard.
    if (path.startsWith('/dashboard/admin') && !userRoles.includes('ADMIN')) {
      console.warn(`Middleware: Access denied for ${session.userId} to admin dashboard. Roles found:`, userRoles);
      return Response.redirect(new URL('/dashboard/forbidden', req.url));
    }
    if (path.startsWith('/dashboard/seller') && !userRoles.includes('SELLER')) {
      console.warn(`Middleware: Access denied for ${session.userId} to seller dashboard. Roles found:`, userRoles);
      return Response.redirect(new URL('/dashboard/forbidden', req.url));
    }
    if (path.startsWith('/dashboard/customer') && !userRoles.includes('CUSTOMER')) {
      // If no roles at all are found, we might be missing the JWT template mapping.
      // We allow customer dashboard as a fallback if the user is at least signed in.
      if (userRoles.length === 0) {
        console.warn(`Middleware: No roles found in session claims for ${session.userId}. Is JWT template configured?`);
        return; // Proceed to customer dashboard as fallback
      }
      return Response.redirect(new URL('/dashboard/forbidden', req.url));
    }
  }
});


export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    String.raw`/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)`,
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Always run for Clerk-specific frontend API routes
    '/__clerk/(.*)',
  ],
};