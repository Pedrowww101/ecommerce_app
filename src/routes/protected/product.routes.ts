import { Hono } from "hono";
import { Env } from "../../lib/auth.type.js";
import { addProductController } from "../../controller/products/add-product.controller.js";
import { roleAndPermissionMiddleware } from "../../middleware/role-permission.middleware.js";
import { getAllLowStocksProductController } from "../../controller/products/get-all-low-stocks-product.controller.js";

const protectedProductRoutes = new Hono<Env>()
   .post(
      "/add",
      roleAndPermissionMiddleware("product", "create"),
      ...addProductController
   )
   .get(
      "/low-stock",
      roleAndPermissionMiddleware("product", "read"),
      ...getAllLowStocksProductController
   );

export default protectedProductRoutes;
