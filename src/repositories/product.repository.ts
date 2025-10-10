import { products } from "@/database/app-schema.js";
import { db, DrizzleClient } from "@/database/client.js";
import { InsertProductModel } from "@/models/products.model.js";
import { PaginationParams } from "@/common/utils/pagination.js";
import { eq, sql } from "drizzle-orm";

export class ProductRepository {
   private dbClient: DrizzleClient;
   constructor(database?: DrizzleClient) {
      this.dbClient = database || db;
   }

   async add(data: InsertProductModel) {
      const [addProduct] = await this.dbClient
         .insert(products)
         .values({
            ...data,
            price: data.price.toFixed(2),
         })
         .returning();

      return addProduct;
   }

   async getProductById(id: string) {
      const product = await this.dbClient.query.products.findFirst({
         where: eq(products.id, id),
      });
      return product;
   }

   async getProductByName(name: string) {
      const product = await this.dbClient.query.products.findFirst({
         where: eq(products.name, name),
      });

      return product;
   }

   async getAllProducts(params: PaginationParams) {
      const { page, limit } = params;
      const offset = (page - 1) * limit;
      const allProducts = await this.dbClient.query.products.findMany({
         limit: limit,
         offset,
      });

      const totalResult = await this.dbClient
         .select({ count: sql<number>`count(*)` })
         .from(products);

      const total = totalResult[0].count;

      return {
         allProducts,
         page,
         limit,
         total,
      };
   }
}
