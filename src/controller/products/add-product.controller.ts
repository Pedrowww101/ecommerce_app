import { factory } from "../../lib/factory.js";
import { validator } from "../../lib/validator.js";
import { createProductDTO } from "../../database/models/products.model.js";
import { ProductsRepository } from "../../database/repositories/product.repository.js";
import { ProductCategoryService } from "../../services/product.service.js";
import { CategoriesRepository } from "../../database/repositories/category.repository.js";
import { ProductCategoryRepository } from "../../database/repositories/product-category.repository.js";
import { logger } from "../../lib/logger.js";

export const addProductController = factory.createHandlers(
   validator("json", createProductDTO),
   async (c) => {
      const body = c.req.valid("json");
      const user = c.get("user");

      logger.debug({
         msg: "[ProductsController] Incoming request",
         json: body,
         user: {
            id: user?.id,
            name: user?.name,
            role: user?.role,
         },
      });
      const productRepo = new ProductsRepository();
      const categoryRepo = new CategoriesRepository();
      const productCategoryRepo = new ProductCategoryRepository();
      const productService = new ProductCategoryService(
         productRepo,
         categoryRepo,
         productCategoryRepo
      );

      const result = await productService.createProduct(user!.id, body);

      return c.json(result, 201);
   }
);
