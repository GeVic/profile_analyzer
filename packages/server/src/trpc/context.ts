import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';

/**
 * Creates context for tRPC requests
 * This function is called for every tRPC request
 */
export const createContext = ({
  req,
  res,
}: CreateExpressContextOptions) => {
  // You can add authentication, database connections, etc. here
  return {
    req,
    res,
    // Add any other context data you need
    user: null, // Placeholder for future authentication
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
