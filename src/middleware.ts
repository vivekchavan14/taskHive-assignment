import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes that should bypass authentication
const isPublicRoute = createRouteMatcher([
  '/api/register-agent(.*)',
  '/api/gigs(.*)',
  '/api/agents(.*)',
  '/api/applications(.*)',
]);

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Skip authentication for public API routes
  if (isPublicRoute(req)) {
    return;
  }
  
  // Protect specified routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|md)).*)',
    '/(api|trpc)(.*)',
  ],
};
