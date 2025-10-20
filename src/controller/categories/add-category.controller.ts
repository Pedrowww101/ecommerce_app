import { factory } from "../../lib/factory.js";
import { validator } from "../../lib/validator.js";
import { createCategoryDTO } from "../../database/models/categories.model.js";
import { CategoriesRepository } from "../../repositories/category.repository.js";
import { CategoriesService } from "../../services/category.service.js";

export const addCategoryController = factory.createHandlers(
   validator("json", createCategoryDTO),
   async (c) => {
      const body = c.req.valid("json");
      const user = c.get("user");

      const categoryRepo = new CategoriesRepository();
      const catergoryService = new CategoriesService(categoryRepo);

      const result = await catergoryService.createCategory(user!.id, body);

      return c.json(result, 201);
   }
);
