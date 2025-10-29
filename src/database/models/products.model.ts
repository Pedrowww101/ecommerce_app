import { products } from "../app-schema.js";
import { type } from "arktype";
import {
   createInsertSchema,
   createSelectSchema,
   createUpdateSchema,
} from "drizzle-arktype";

// for database model
export const selectProductSchema = createSelectSchema(products);
export const insertProductSchema = createInsertSchema(products, {
   name: type("string > 0"),
   slug: type("string | undefined"),
   description: type("string | null"),
   price: type("number > 0"),
   stock: type("number >= 0"),
   imageUrl: type("string.url | null"),
});

export const insertProductWithCategorySchema = insertProductSchema.and({
   categoryIds: type("string[] | undefined"),
});

export const updateProductSchema = createUpdateSchema(products, {
   name: type("string > 0 | undefined"),
   slug: type("string > 0 | undefined"),
   description: type("string | null | undefined"),
   price: type("number > 0 | undefined"),
   stock: type("number >= 0 | undefined"),
   imageUrl: type("string.url | null | undefined"),
});

export type SelectProductModel = typeof selectProductSchema.t;
export type InsertProductModel = typeof insertProductWithCategorySchema.t;
export type UpdateProductModel = typeof updateProductSchema.t;

// for service layer
export const selectProductDTO = selectProductSchema.omit(
   "createdAt",
   "updatedAt"
);
export const createProductDTO = insertProductWithCategorySchema.omit(
   "id",
   "rating",
   "createdBy",
   "updatedBy",
   "createdAt",
   "updatedAt"
);
export const updateProductDTO = updateProductSchema
   .partial()
   .omit("id", "rating", "createdAt", "updatedAt", "createdBy");

export type CreateProductDTO = typeof createProductDTO.infer;
export type UpdateProductDTO = typeof updateProductDTO.infer;

// for response
export type ProductResponseDTO = Omit<
   SelectProductModel,
   "price" | "createdAt" | "updatedAt"
> & {
   price: number;
   categories?: string[];
};
