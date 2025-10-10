import { type } from "arktype";
import { factory } from "../../lib/factory.js";
import { validator } from "../../lib/validator.js";
import { ProductRepository } from "../../repositories/products/product.repository.js";
import { ProductService } from "../../services/product.service.js";

const querySchema = type({
   page: "number",
   limit: "number",
});
export const getAllProductsController = factory.createHandlers(
   validator("query", querySchema),
   async (c) => {
      const params = c.req.valid("query");

      const productRepo = new ProductRepository();
      const productService = new ProductService(productRepo);

      const result = await productService.getAllProducts(params);

      return c.json(result, 200);
   }
);
