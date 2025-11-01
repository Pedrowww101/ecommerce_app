import { type } from "arktype";
import { factory } from "../../lib/factory.js";
import { validator } from "../../lib/validator.js";
import { ProductsRepository } from "../../database/repositories/product.repository.js";
import { ProductService } from "../../services/product.service.js";
import { SearchFilterQuery } from "../../common/utils/pagination.js";
import { logger } from "../../lib/logger.js";

const querySchema = type({
   page: "string",
   limit: "string",
   "minPrice?": "string",
   "maxPrice?": "string",
   "ratings?": "string",
   "categories?": "string ",
});

export const getAllProductsController = factory.createHandlers(
   validator("query", querySchema),
   async (c) => {
      logger.debug({
         msg: "[ProductsController] Incoming request",
         query: c.req.query(),
      });

      const params = c.req.valid("query");

      const queryNumber = {
         page: Number(params.page),
         limit: Number(params.limit),
      };
      const filters: SearchFilterQuery = {};

      if (params.minPrice || params.maxPrice) {
         const min = params.minPrice ? Number(params.minPrice) : 0;
         const max = params.maxPrice
            ? Number(params.maxPrice)
            : Number.MAX_SAFE_INTEGER;
         filters.priceRange = [min, max] as [number, number];
      }

      if (params.ratings) {
         filters.ratings = Number(params.ratings);
      }

      if (params.categories) {
         filters.categories = params.categories.split(",").map((c) => c.trim());
      }

      const productRepo = new ProductsRepository();
      const productService = new ProductService(productRepo);

      const result = await productService.getAll(queryNumber, filters);

      return c.json(result, 200);
   }
);
