import { factory } from "../../lib/factory.js";
import { validator } from "../../lib/validator.js";
import { createProductDTO } from "../../database/models/products.model.js";
import { ProductsRepository } from "../../repositories/product.repository.js";
import { ProductService } from "../../services/product.service.js";

export const addProductController = factory.createHandlers(
   validator("json", createProductDTO),
   async (c) => {
      const body = c.req.valid("json");
      const user = c.get("user");

      const productRepo = new ProductsRepository();
      const productService = new ProductService(productRepo);

      const result = await productService.createProduct(user!.id, body);

      return c.json(result, 201);
   }
);
