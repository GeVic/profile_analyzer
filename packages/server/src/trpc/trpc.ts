import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "./context";

// Initialize tRPC with context
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === "BAD_REQUEST" && error.cause ? error.cause : null,
      },
    };
  },
});

// Base router and procedures
export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware for logging requests
export const loggerMiddleware = t.middleware(({ path, type, next }) => {
  const start = Date.now();
  return next({
    ctx: {},
  }).then((result) => {
    const durationMs = Date.now() - start;
    console.log(`[${type}] ${path} - ${durationMs}ms`);
    return result;
  });
});

// Rate limiting middleware
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimitMiddleware = t.middleware(({ ctx, next }) => {
  const ip = ctx.req.ip || ctx.req.connection.remoteAddress || "unknown";
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = parseInt(process.env.RATE_LIMIT_PER_MINUTE || "20");

  const clientData = requestCounts.get(ip);

  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize counter
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
  } else {
    // Increment counter
    clientData.count += 1;

    if (clientData.count > maxRequests) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded: ${maxRequests} requests per minute`,
      });
    }
  }

  return next();
});

// Protected procedure with rate limiting and logging
export const protectedProcedure = publicProcedure
  .use(loggerMiddleware)
  .use(rateLimitMiddleware);

// Error handling utilities
export const createTRPCError = (
  code: string,
  message: string,
  cause?: unknown,
) => {
  const errorCode = code as any; // Type assertion for flexibility
  return new TRPCError({
    code: errorCode,
    message,
    cause,
  });
};

// Clean up old rate limit entries periodically
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, data] of requestCounts.entries()) {
      if (now > data.resetTime) {
        requestCounts.delete(ip);
      }
    }
  },
  5 * 60 * 1000,
); // Clean up every 5 minutes
