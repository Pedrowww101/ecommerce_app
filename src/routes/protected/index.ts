import { Hono } from "hono";
import { Env } from "../../lib/auth.type.js";
import { requiredAuthMiddleware } from "../../middleware/required.middleware.js";
import protectedProductRoutes from "./product.routes.js";
import protectedCategoryRoutes from "./category.routes.js";
import protectedCartRoutes from "./cart.routes.js";

const protectedRoutes = new Hono<Env>()
   .use(requiredAuthMiddleware)
   .route("/products", protectedProductRoutes)
   .route("/categories", protectedCategoryRoutes)
   .route("/cart", protectedCartRoutes);

export default protectedRoutes;
