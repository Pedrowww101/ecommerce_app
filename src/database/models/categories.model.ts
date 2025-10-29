import {
   createInsertSchema,
   createSelectSchema,
   createUpdateSchema,
} from "drizzle-arktype";
import { categories } from "../app-schema.js";
import { type } from "arktype";

export const selectCategoriesModel = createSelectSchema(categories);

export const insertCategoriesModel = createInsertSchema(categories, {
   name: type("string > 0"),
   description: type("string | undefined | null"),
   slug: type("string | undefined"),
});

export const updateCategoriesModel = createUpdateSchema(categories, {
   name: type("string > 0 | undefined"),
   description: type("string | undefined | null | undefined"),
   slug: type("string | undefined"),
});

export type SelectCategoriesModel = typeof selectCategoriesModel.t;
export type InsertCategoriesModel = typeof insertCategoriesModel.t;
export type UpdateCategoriesModel = typeof updateCategoriesModel.t;

export const createCategoryDTO = insertCategoriesModel.omit(
   "id",
   "createdAt",
   "updatedAt"
);

export const updateCategoryDTO = updateCategoriesModel
   .partial()
   .omit("id", "createdAt", "createdBy", "updatedAt");

export const selectCategoryDTO = selectCategoriesModel.omit(
   "createdAt",
   "updatedAt"
);

export type SelectCategoriesDTO = typeof selectCategoryDTO.infer;
export type CreateCategoriesDTO = typeof createCategoryDTO.infer;
export type UpdateCategoriesDTO = typeof updateCategoryDTO.infer;
export type CategoriesResponseDTO = typeof selectCategoryDTO.infer;
