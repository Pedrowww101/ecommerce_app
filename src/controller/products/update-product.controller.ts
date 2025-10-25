import { type } from "arktype";
import { factory } from "../../lib/factory.js";
import { validator } from "../../lib/validator.js";
import { updateProductDTO } from "../../database/models/products.model.js";
import { ProductsRepository } from "../../database/repositories/product.repository.js";
import { ProductService } from "../../services/product.service.js";

const paramSchema = type({
   id: "string",
});

export const updateProductController = factory.createHandlers(
   validator("param", paramSchema),
   validator("json", updateProductDTO),
   async (c) => {
      const { id } = c.req.valid("param");
      const user = c.get("user");

      const body = c.req.valid("json");
      const productRepo = new ProductsRepository();
      const productService = new ProductService(productRepo);

      const result = await productService.updateProduct(user!.id, id, body);
      return c.json(result, 200);
   }
);
