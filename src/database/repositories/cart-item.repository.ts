import { count, sql } from "drizzle-orm";
import { PaginationParams } from "../../common/utils/pagination.js";
import { cartItems } from "../app-schema.js";
import { DrizzleClient, db } from "../client.js";
import { InsertCartItemsModel } from "../models/cart-items.model.js";

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

   async getAll(params: PaginationParams) {
      const { page, limit } = params;
      const offset = (page - 1) * limit;

      const [items, totalResult] = await Promise.all([
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

      return {
         items,
         meta: { page, limit, total },
      };
   }
}
