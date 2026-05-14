import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define which routes are public (unprotected)
const isPublicRoute = createRouteMatcher([
  '/', 
  '/welcome', 
  '/sign-in(.*)', 
  '/sign-up(.*)',
  '/v1/events',
  '/stripe-webhook', // Add this to allow Stripe to hit the endpoint
  '/api/auth/getDatabaseSyncStatus' 
])

export default clerkMiddleware(async (auth, request) => {
  // If the route is NOT public, protect it
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
