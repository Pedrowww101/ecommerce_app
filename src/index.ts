import { auth } from "./lib/auth.js";
import { Env } from "./lib/auth.type.js";
// import { authMiddleware } from './middleware/auth.middleware.js';
import { authCorsMiddleware } from "./middleware/cors-middleware.js";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { addProductController } from "./controller/products/add-product.controller.js";
import { getGlobalErrorHandler } from "./middleware/global-error-handler.middleware.js";
import { getAllProductsController } from "./controller/products/get-all-products.controller.js";

const app = new Hono<Env>()
   .basePath("/api")

   .use(logger())

   .onError(getGlobalErrorHandler)

   .use("/auth/*", async (c, next) => {
      console.log("CORS middleware start");
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
         .split(",")
         .map((o) => o.trim());
      await authCorsMiddleware(allowedOrigins)(c, next);
   })

   .on(["POST", "GET"], "/auth/*", async (c) => {
      return await auth.handler(c.req.raw);
   })

   .use("/products/add", ...addProductController)
   .use("/products", ...getAllProductsController);

// .use("*", authMiddleware)

const port = parseInt(process.env.PORT || "3000");

console.log(`🚀 Server is running on port ${port}`);
serve({
   fetch: app.fetch,
   port,
});
