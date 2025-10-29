import { eq } from "drizzle-orm";
import { DrizzleClient, db } from "../client.js";
import { carts } from "../app-schema.js";

export class CartRepository {
   private dbClient: DrizzleClient;
   constructor(database?: DrizzleClient) {
      this.dbClient = database || db;
   }

   async create(userId: string) {
      const [newCart] = await this.dbClient
         .insert(carts)
         .values({ userId })
         .returning();
      return newCart;
   }

   async getByUserId(userId: string) {
      const cart = this.dbClient.query.carts.findFirst({
         where: eq(carts.userId, userId),
      });
      return cart;
   }
}
