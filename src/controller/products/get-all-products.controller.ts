import { type } from "arktype";
import { factory } from "../../lib/factory.js";
import { validator } from "../../lib/validator.js";
import { ProductsRepository } from "../../database/repositories/product.repository.js";
import { ProductService } from "../../services/product.service.js";

const querySchema = type({
   page: "string",
   limit: "string",
});

export const getAllProductsController = factory.createHandlers(
   validator("query", querySchema),
   async (c) => {
      const params = c.req.valid("query");

      const queryNumber = {
         page: Number(params.page),
         limit: Number(params.limit),
      };

      const productRepo = new ProductsRepository();
      const productService = new ProductService(productRepo);

      const result = await productService.getAll(queryNumber);

      return c.json(result, 200);
   }
);
