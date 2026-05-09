import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// No routes are protected by default via middleware to allow for dialog-based auth on the client side
// You can add routes here that should strictly redirect to sign-in page server-side
const isProtectedRoute = createRouteMatcher([]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
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