import { Hono, Env } from "hono";
import { addProductController } from "../../controller/products/add-product.controller.js";
import { roleAndPermissionMiddleware } from "../../middleware/role-permission.middleware.js";

const protectedCategoryRoutes = new Hono<Env>().post(
   "/add",
   roleAndPermissionMiddleware("category", "create"),
   ...addProductController
);

export default protectedCategoryRoutes;
