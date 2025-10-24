import { eq, inArray, sql } from "drizzle-orm";
import { PaginationParams } from "../../common/utils/pagination.js";
import { categories } from "../app-schema.js";
import { db, DrizzleClient } from "../client.js";
import {
   InsertCategoriesModel,
   UpdateCategoriesModel,
} from "../models/categories.model.js";

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
      const allCategories = await this.dbClient.query.categories.findMany({
         limit: limit,
         offset,
      });

      const totalResult = await this.dbClient
         .select({ count: sql<number>`count(*)` })
         .from(categories);

      const total = totalResult[0].count;

      return {
         allCategories,
         page,
         limit,
         total,
      };
   }

   async getById(id: string) {
      const category = await this.dbClient.query.categories.findFirst({
         where: eq(categories.id, id),
      });

      return category;
   }

   async getByIds(id: string[]) {
      const category = await this.dbClient.query.categories.findMany({
         where: inArray(categories.id, id),
      });

      return category.map((c) => ({
         id: c.id,
         name: c.name,
      }));
   }

   async getByName(name: string) {
      const category = await this.dbClient.query.categories.findFirst({
         where: eq(categories.name, name),
      });

      return category;
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
