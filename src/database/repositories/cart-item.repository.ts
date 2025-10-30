import { and, count, eq, sql } from "drizzle-orm";
import {
   PaginatedRepositoryResult,
   PaginationParams,
} from "../../common/utils/pagination.js";
import { cartItems } from "../app-schema.js";
import { DrizzleClient, db } from "../client.js";
import {
   CartItemsResponseDTO,
   InsertCartItemsModel,
} from "../models/cart-items.model.js";

export class CartItemsRepository {
   private dbClient: DrizzleClient;
   constructor(database?: DrizzleClient) {
      this.dbClient = database || db;
   }

   async upsert(data: InsertCartItemsModel) {
      const [cartItem] = await this.dbClient
         .insert(cartItems)
         .values({
            ...data,
            price: data.price.toFixed(2),
         })
         .onConflictDoUpdate({
            target: [cartItems.cartId, cartItems.productId],
            set: {
               quantity: sql`${cartItems.quantity} + ${data.quantity}`,
            },
         })
         .returning();

      return cartItem;
   }

   async updateQuantity(
      cartId: string,
      productId: string,
      newQuantity: number
   ) {
      const [updatedItem] = await this.dbClient
         .update(cartItems)
         .set({ quantity: newQuantity, updatedAt: new Date() })
         .where(
            and(
               eq(cartItems.cartId, cartId),
               eq(cartItems.productId, productId)
            )
         )
         .returning();

      return updatedItem; // Returns SelectCartItemsModel (price is string)
   }

   async getAll({
      page,
      limit,
   }: PaginationParams): Promise<
      PaginatedRepositoryResult<CartItemsResponseDTO>
   > {
      const offset = (page - 1) * limit;

      const [cartItemRows, totalResult] = await Promise.all([
         this.dbClient.query.cartItems.findMany({
            limit,
            offset,
            with: {
               cart: {
                  columns: { id: true, userId: true },
               },
               product: {
                  columns: {
                     id: true,
                     name: true,
                     price: true,
                     imageUrl: true,
                  },
               },
            },
         }),
         this.dbClient.select({ count: count() }).from(cartItems),
      ]);

      const total = totalResult[0]?.count ?? 0;

      const normalized: CartItemsResponseDTO[] = cartItemRows.map((ci) => ({
         id: ci.id,
         quantity: ci.quantity,
         price: Number(ci.product.price),
         product: {
            id: ci.product.id,
            name: ci.product.name,
            imageUrl: ci.product.imageUrl,
         },
         cart: {
            id: ci.cart.id,
            userId: ci.cart.userId,
         },
      }));

      return {
         items: normalized,
         total,
      };
   }

   async removeItem(cartId: string, productId: string) {
      const [deletedItem] = await this.dbClient
         .delete(cartItems)
         .where(
            and(
               eq(cartItems.cartId, cartId),
               eq(cartItems.productId, productId)
            )
         )
         .returning(); // Use returning() to confirm the item was deleted

      return deletedItem; // Returns SelectCartItemsModel or undefined
   }
}
