import { factory } from "@/lib/factory.js";
import { validator } from "@/lib/validator.js";
import { createProductDTO } from "@/models/products.model.js";
import { ProductRepository } from "@/repositories/product.repository.js";
import { ProductService } from "@/services/product.service.js";

export const addProductController = factory.createHandlers(
   validator("json", createProductDTO),
   async (c) => {
      const body = c.req.valid("json");

      const productRepo = new ProductRepository();
      const productService = new ProductService(productRepo);

      const result = await productService.createProduct(body);

      return c.json(result, 201);
   }
);
