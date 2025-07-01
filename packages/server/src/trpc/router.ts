import { router } from './trpc';
import { profileRouter } from './routers/profile.router';

/**
 * Main application router that combines all sub-routers
 * This is the root router that gets exposed to the Express server
 */
export const appRouter = router({
  // Profile analysis routes
  profile: profileRouter,
});

// Export the router type for use in client-side code
export type AppRouter = typeof appRouter;
