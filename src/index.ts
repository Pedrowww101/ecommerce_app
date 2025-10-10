import { auth } from './lib/auth.js';
import { Env } from './lib/auth.type';
// import { authMiddleware } from './middleware/auth.middleware';
import { authCorsMiddleware } from './middleware/cors-middleware';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server'
import { addProductController } from './controller/product.controller.js';
import { getGlobalErrorHandler } from './middleware/global-error-handler.middleware.js';

const app = new Hono<Env>()
.basePath("/api")

.use(logger())

.onError(getGlobalErrorHandler)

.use("/auth/*", async (c, next) => {
  console.log("CORS middleware start");  
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(o => o.trim());
  await authCorsMiddleware(allowedOrigins)(c, next);
})

.on(["POST", "GET"], "/auth/*", async (c) => {
	return await auth.handler(c.req.raw);
})


.use("/products/add", ...addProductController)

// .use("*", authMiddleware)

const port = parseInt(process.env.PORT || '3000');

console.log(`🚀 Server is running on port ${port}`);
serve({
  fetch: app.fetch,
  port,
})
