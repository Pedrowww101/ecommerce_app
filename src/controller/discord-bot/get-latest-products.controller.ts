import { factory } from "../../lib/factory.js";
import { ProductsRepository } from "../../repositories/product.repository.js";
import { ProductService } from "../../services/product.service.js";

export const getLatestProductsController = factory.createHandlers(async (c) => {
   const productRepo = new ProductsRepository();
   const productService = new ProductService(productRepo);

   const result = await productService.getLatestProducts();

   return c.json(result, 200);
});
