import { count, eq, inArray } from "drizzle-orm";
import { PaginationParams } from "../../common/utils/pagination.js";
import { categories, products } from "../app-schema.js";
import { db, DrizzleClient } from "../client.js";
import {
   CategoriesResponseDTO,
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

   async getAll(params: PaginationParams): Promise<{
      allCategories: CategoriesResponseDTO[];
      total: number;
   }> {
      const { page, limit } = params;
      const offset = (page - 1) * limit;

      const [allCategories, totalResult] = await Promise.all([
         this.dbClient.query.categories.findMany({
            limit,
            offset,
         }),
         this.dbClient.select({ count: count() }).from(categories),
      ]);

      const total = totalResult[0]?.count ?? 0;

      return { allCategories, total };
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

   async getProductByIds(id: string | string[]) {
      if (!id) return [];

      // Normalize to array
      const ids = Array.isArray(id) ? id : [id];

      const productsList = await db
         .select()
         .from(products)
         .where(inArray(products.id, ids));

      return productsList;
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
