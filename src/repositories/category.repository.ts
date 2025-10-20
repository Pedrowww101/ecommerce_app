import { eq, sql } from "drizzle-orm";
import { PaginationParams } from "../common/utils/pagination.js";
import { categories } from "../database/app-schema.js";
import { db, DrizzleClient } from "../database/client.js";
import {
   InsertCategoriesModel,
   UpdateCategoriesModel,
} from "../database/models/categories.model.js";

export class CategoriesRepository {
   private dbClient: DrizzleClient;
   constructor(database?: DrizzleClient) {
      this.dbClient = database || db;
   }

   async add(data: InsertCategoriesModel) {
      const [newCategory] = await this.dbClient
         .insert(categories)
         .values(data)
         .returning();

      return newCategory;
   }

   async getAllCategories(params: PaginationParams) {
      const { page, limit } = params;
      const offset = (page - 1) * limit;
      const allProducts = await this.dbClient.query.products.findMany({
         limit: limit,
         offset,
      });

      const totalResult = await this.dbClient
         .select({ count: sql<number>`count(*)` })
         .from(categories);

      const total = totalResult[0].count;

      return {
         allProducts,
         page,
         limit,
         total,
      };
   }

   async getById(id: string) {
      const product = await this.dbClient.query.categories.findFirst({
         where: eq(categories.id, id),
      });

      return product;
   }

   async getByName(name: string) {
      const product = await this.dbClient.query.categories.findFirst({
         where: eq(categories.name, name),
      });

      return product;
   }

   async update(id: string, data: UpdateCategoriesModel) {
      const [category] = await this.dbClient
         .update(categories)
         .set(data)
         .where(eq(categories.id, id))
         .returning();

      return category;
   }
}
