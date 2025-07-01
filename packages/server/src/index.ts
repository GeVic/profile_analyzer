import dotenv from "dotenv";

// Load environment variables FIRST, before any other imports
dotenv.config();

// Force reload environment variables
dotenv.config({ override: true });

import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./trpc/router";
import { createContext } from "./trpc/context";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || [
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" })); // Limit for PDF files (matches validation)


// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`,
    );
  });
  next();
});

// tRPC middleware
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

// Health check endpoint (non-tRPC)
app.get("/", (req, res) => {
  res.json({
    message: "Profile Analyzer Server with tRPC",
    version: "1.0.0",
    status: "healthy",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "GET /",
      trpc: "POST /trpc",
      procedures: {
        "profile.health": "GET /trpc/profile.health - Health check",
        "profile.testAI": "GET /trpc/profile.testAI - Test AI connection",
        "profile.analyzeProfile":
          "POST /trpc/profile.analyzeProfile - Analyze CV against job description",
      },
    },
    documentation: {
      tRPC: {
        url: `http://localhost:${PORT}/trpc`,
        example: {
          analyzeProfile: {
            input: {
              jobDescription: {
                name: "job-description.pdf",
                type: "application/pdf",
                size: 123456,
                data: "base64-encoded-pdf-data...",
              },
              cv: {
                name: "cv.pdf",
                type: "application/pdf",
                size: 234567,
                data: "base64-encoded-pdf-data...",
              },
            },
          },
        },
      },
    },
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    server: "express",
    trpc: "enabled",
    environment: process.env.NODE_ENV || "development",
    rateLimits: {
      perMinute: process.env.RATE_LIMIT_PER_MINUTE || "20",
      perHour: process.env.RATE_LIMIT_PER_HOUR || "300",
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: [
      "GET /",
      "GET /health",
      "POST /trpc/profile.analyzeProfile",
      "GET /trpc/profile.health",
      "GET /trpc/profile.testAI",
    ],
  });
});

// Global error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Global error handler:", err);

    const isDevelopment = process.env.NODE_ENV === "development";

    res.status(err.status || 500).json({
      error: "Internal Server Error",
      message: isDevelopment ? err.message : "Something went wrong",
      ...(isDevelopment && { stack: err.stack }),
      timestamp: new Date().toISOString(),
    });
  },
);

// Start server
const server = app.listen(PORT, () => {
  console.log("🚀 Profile Analyzer Server Started");
  console.log("═══════════════════════════════════");
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 tRPC endpoint: http://localhost:${PORT}/trpc`);
  console.log("");
  console.log("📋 Available endpoints:");
  console.log(
    `   GET  http://localhost:${PORT}/                          - Server info`,
  );
  console.log(
    `   GET  http://localhost:${PORT}/health                    - Health check`,
  );
  console.log(
    `   POST http://localhost:${PORT}/trpc/profile.analyzeProfile - Analyze CV`,
  );
  console.log(
    `   GET  http://localhost:${PORT}/trpc/profile.health       - tRPC health`,
  );
  console.log(
    `   GET  http://localhost:${PORT}/trpc/profile.testAI       - Test AI connection`,
  );
  console.log("");
  console.log("🔧 Configuration:");
  console.log(
    `   Rate limit: ${process.env.RATE_LIMIT_PER_MINUTE || "20"} req/min, ${process.env.RATE_LIMIT_PER_HOUR || "300"} req/hour`,
  );
  console.log(
    `   Max file size: ${parseInt(process.env.MAX_FILE_SIZE || "10485760") / 1024 / 1024}MB`,
  );
  console.log(
    `   AI API: ${process.env.GEMINI_API_URL || "https://intertest.woolf.engineering/invoke"}`,
  );
  console.log("═══════════════════════════════════");
});

// Graceful shutdown handlers
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}, shutting down server gracefully...`);

  server.close((err) => {
    if (err) {
      console.error("❌ Error during server shutdown:", err);
      process.exit(1);
    }

    console.log("✅ Server closed successfully");
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.log("⚠️  Forcing shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});

export { app, server };
