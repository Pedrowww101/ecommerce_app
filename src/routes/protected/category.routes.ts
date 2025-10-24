import { Hono, Env } from "hono";
import { roleAndPermissionMiddleware } from "../../middleware/role-permission.middleware.js";
import { addCategoryController } from "../../controller/categories/add-category.controller.js";
import { getAllCategoriesController } from "../../controller/categories/get-all-categories.controller.js";

const protectedCategoryRoutes = new Hono<Env>()
   .post(
      "/add",
      roleAndPermissionMiddleware("category", "create"),
      ...addCategoryController
   )
   .get(
      "",
      roleAndPermissionMiddleware("category", "view"),
      ...getAllCategoriesController
   );

export default protectedCategoryRoutes;
