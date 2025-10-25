import { Hono } from "hono";
import { Env } from "../../lib/auth.type.js";
import { getAllProductsController } from "../../controller/products/get-all-products.controller.js";
// import { getLatestProductsController } from "../../controller/discord-bot/get-latest-products.controller.js";

const publicProductRoutes = new Hono<Env>()
   // Public product endpoints - no authentication required
   .get("/", ...getAllProductsController);

// .get("/latest", ...getLatestProductsController);

export default publicProductRoutes;
