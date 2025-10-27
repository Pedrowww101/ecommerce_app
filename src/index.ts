import { loadEnv } from "./lib/load-env.js";
loadEnv();

import { auth } from "./lib/auth.js";
import { Env } from "./lib/auth.type.js";
import { authCorsMiddleware } from "./middleware/cors-middleware.js";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { getGlobalErrorHandler } from "./middleware/global-error-handler.middleware.js";
import { authMiddleware } from "./middleware/auth.middleware.js";

// Import route modules
import { publicProductRoutes } from "./routes/index.js";
import protectedRoutes from "./routes/protected/index.js";

const app = new Hono<Env>()
   .basePath("/api")

   .use(logger())
   .onError(getGlobalErrorHandler)

   // Auth routes (public)
   .use("*", authCorsMiddleware())

   .on(["POST", "GET"], "/auth/*", async (c) => {
      return await auth.handler(c.req.raw);
   })

   // Apply auth middleware to all routes (sets user context)
   .use("*", authMiddleware)

   // Public routes
   .route("/products", publicProductRoutes)

   // Protected routes
   .route("/protected", protectedRoutes);

const port = parseInt(process.env.PORT || "3000");

console.log(`🚀 Server is running on port ${port}`);
serve({
   fetch: app.fetch,
   port,
});
