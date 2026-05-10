import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define which routes are public
const isPublicRoute = createRouteMatcher([
  '/', 
  '/welcome', 
  '/sign-in(.*)', 
  '/sign-up(.*)',
  '/v1/events',
  '/api/payment/stripeWebhook',
  '/api/auth/getDatabaseSyncStatus' 
])

export default clerkMiddleware(async (auth, request) => {
  // auth is a Promise, so we must await it to access .protect()
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