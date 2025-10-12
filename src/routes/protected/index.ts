import { Hono } from "hono";
import { Env } from "../../lib/auth.type.js";
import { requiredAuthMiddleware } from "../../middleware/required.middleware.js";
import protectedProductRoutes from "./product.routes.js";

const protectedRoutes = new Hono<Env>()
   .use(requiredAuthMiddleware) // apply once globally
   .route("/products", protectedProductRoutes); // mount sub-routes

export default protectedRoutes;
