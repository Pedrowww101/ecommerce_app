import { type } from "arktype";
import { factory } from "../../lib/factory.js";
import { validator } from "../../lib/validator.js";
import { CategoriesRepository } from "../../database/repositories/category.repository.js";
import { CategoriesService } from "../../services/category.service.js";

const querySchema = type({
   page: "string",
   limit: "string",
});

export const getAllCategoriesController = factory.createHandlers(
   validator("query", querySchema),
   async (c) => {
      const params = c.req.valid("query");

      const queryNumber = {
         page: Number(params.page),
         limit: Number(params.limit),
      };

      const categoryRepo = new CategoriesRepository();
      const categoryService = new CategoriesService(categoryRepo);

      const result = await categoryService.getAll(queryNumber);

      return c.json(result, 200);
   }
);
