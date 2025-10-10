import { products } from "@/database/app-schema";
import { type } from "arktype";
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-arktype";

// for database model
export const selectProductSchema = createSelectSchema(products)
export const insertProductSchema = createInsertSchema(products, {
    name: type("string > 0"),
    description: type("string | null"),
    price: type("number > 0"),
    stock: type("number >= 0"),
    imageUrl:  type("string.url | null")
  });
 
export const updateProductSchema = createUpdateSchema(products, {
    name: type("string.trim.preformatted"),
    description: type("string | null"),
    price: type("number > 0"),
    stock: type("number >= 0"),
    imageUrl:  type("string.url | null")
})

export type SelectProductModel = typeof selectProductSchema.t
export type InsertProductModel = typeof insertProductSchema.t
export type UpdateProductModel = typeof updateProductSchema.t

// for service layer
export const selectProductDTO = selectProductSchema.omit("createdAt", "updatedAt")
export const createProductDTO = insertProductSchema.omit("id", "createdAt", "updatedAt")
export const updateProductDTO = updateProductSchema.partial()

export type CreateProductDTO = typeof createProductDTO.infer
export type UpdateProductDTO = typeof updateProductDTO.infer


// for response
export type ProductResponseDTO = Omit<SelectProductModel, "price" | "createdAt" | "updatedAt"> & {
    price: number;
};