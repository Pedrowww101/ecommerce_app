import { factory } from "../../lib/factory.js";
import { ProductsRepository } from "../../database/repositories/product.repository.js";
import { ProductService } from "../../services/product.service.js";

export const getAllLowStocksProductController = factory.createHandlers(
   async (c) => {
      const productRepo = new ProductsRepository();
      const productService = new ProductService(productRepo);

      const result = await productService.getProductsWithLowStock();

      return c.json(result, 200);
   }
);
