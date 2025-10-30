import {
   createInsertSchema,
   createSelectSchema,
   createUpdateSchema,
} from "drizzle-arktype";
import { cartItems } from "../app-schema.js";
import { type } from "arktype";

export const selectCartItemsSchema = createSelectSchema(cartItems);
export const insertCartItemsSchema = createInsertSchema(cartItems, {
   quantity: type("number > 0"),
   price: type("number > 0"),
});
export const updateCartItemsSchema = createUpdateSchema(cartItems, {
   quantity: type("number > 0"),
   price: type("number > 0"),
});

export type SelectCartItemsModel = typeof selectCartItemsSchema.t;
export type InsertCartItemsModel = typeof insertCartItemsSchema.t;
export type UpdateCartItemsModel = typeof updateCartItemsSchema.t;

export const selectCartItemsDTO = selectCartItemsSchema.omit(
   "createdAt",
   "updatedAt"
);

export const insertCartItemsDTO = insertCartItemsSchema.pick(
   "productId",
   "quantity"
);

export const updateCartItemsDTO = updateCartItemsSchema
   .partial()
   .pick("quantity", "price");

export type SelectCartItemsDTO = typeof selectCartItemsDTO.infer;
export type InsertCartItemsDTO = typeof insertCartItemsDTO.infer;
export type UpdateCartItemsDTO = typeof updateCartItemsDTO.infer;
export type CartItemsResponseDTO = {
   id: string;
   quantity: number;
   price: number;
   product: {
      id: string;
      name: string;
      imageUrl: string | null;
   };
   cart: {
      id: string;
      userId: string;
   };
};
