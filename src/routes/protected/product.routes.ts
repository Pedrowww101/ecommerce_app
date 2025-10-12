import { Hono } from "hono";
import { Env } from "../../lib/auth.type";
import { addProductController } from "../../controller/products/add-product.controller.js";
import { roleAndPermissionMiddleware } from "../../middleware/role-permission.middleware.js";

const protectedProductRoutes = new Hono<Env>().post(
   "/add",
   roleAndPermissionMiddleware("product", "create"),
   ...addProductController
);

export default protectedProductRoutes;
