import { Hono } from "hono";
import { Env } from "../../lib/auth.type";
import { getAllProductsController } from "../../controller/products/get-all-products.controller.js";

const publicProductRoutes = new Hono<Env>()
   // Public product endpoints - no authentication required
   .get("/", ...getAllProductsController);

export default publicProductRoutes;
