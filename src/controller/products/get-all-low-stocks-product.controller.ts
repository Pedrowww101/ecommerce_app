import { factory } from "../../lib/factory.js";
import { ProductRepository } from "../../repositories/products/product.repository.js";
import { ProductService } from "../../services/product.service.js";

export const getAllLowStocksProductController = factory.createHandlers(
   async (c) => {
      const productRepo = new ProductRepository();
      const productService = new ProductService(productRepo);

      const result = await productService.getProductWithLowStock();

      return c.json(result, 200);
   }
);
