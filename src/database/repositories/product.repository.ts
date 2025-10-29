import { categories, productCategories, products } from "../app-schema.js";
import { db, DrizzleClient } from "../client.js";
import { UpdateProductModel } from "../models/products.model.js";
import {
   PaginationParams,
   SearchFilterQuery,
} from "../../common/utils/pagination.js";
import {
   and,
   asc,
   between,
   count,
   desc,
   eq,
   exists,
   gte,
   inArray,
   lte,
   SQL,
   sql,
} from "drizzle-orm";

export class ProductsRepository {
   private dbClient: DrizzleClient;
   constructor(database?: DrizzleClient) {
      this.dbClient = database || db;
   }

   async update(id: string, data: UpdateProductModel) {
      const [product] = await this.dbClient
         .update(products)
         .set({
            ...data,
            price: data.price.toFixed(2),
         })
         .where(eq(products.id, id))
         .returning();
      return product;
   }

   async getById(id: string) {
      const product = await this.dbClient.query.products.findFirst({
         where: eq(products.id, id),
      });
      return product;
   }

   async getByName(name: string) {
      const product = await this.dbClient.query.products.findFirst({
         where: eq(products.name, name),
      });

      return product;
   }

   async getBySlug(slug: string) {
      const product = await this.dbClient.query.products.findFirst({
         where: eq(products.slug, slug),
      });
      return product;
   }

   async getAll(params: PaginationParams, filters?: SearchFilterQuery) {
      const { page, limit } = params;
      const offset = (page - 1) * limit;
      const whereConditions: (SQL | undefined)[] = [];

      // --- Dynamic Filters ---
      if (filters?.ratings !== undefined) {
         whereConditions.push(gte(products.rating, filters.ratings));
      }

      if (filters?.priceRange) {
         whereConditions.push(
            between(
               products.price,
               filters.priceRange[0].toString(),
               filters.priceRange[1].toString()
            )
         );
      }

      if (filters?.categories !== undefined) {
         const categoryNames = Array.isArray(filters.categories)
            ? filters.categories
            : [filters.categories];

         const categoryResults = await this.dbClient
            .select({ id: categories.id })
            .from(categories)
            .where(inArray(categories.name, categoryNames));

         const categoryIds = categoryResults.map((r) => r.id);

         if (categoryIds.length > 0) {
            const categoryExists = exists(
               this.dbClient
                  .select({ id: productCategories.productId })
                  .from(productCategories)
                  .where(
                     and(
                        eq(productCategories.productId, products.id),
                        inArray(productCategories.categoryId, categoryIds)
                     )
                  )
            );
            whereConditions.push(categoryExists);
         } else {
            whereConditions.push(sql`false`);
         }
      }

      const whereClause =
         whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // --- Parallel Queries for Performance ---
      const [allProducts, totalResult] = await Promise.all([
         this.dbClient.query.products.findMany({
            limit,
            offset,
            where: whereClause,
            with: {
               productCategories: {
                  columns: { categoryId: true },
               },
            },
         }),
         this.dbClient
            .select({ count: count() })
            .from(products)
            .where(whereClause),
      ]);

      const total = totalResult[0]?.count ?? 0;

      return {
         products: allProducts,
         meta: { page, limit, total },
      };
   }

   // method for getting the latest products
   async getLatestProduct() {
      const latestProduct = await this.dbClient.query.products.findMany({
         limit: 10,
         orderBy: [desc(products.createdAt)],
      });

      return latestProduct;
   }

   // method for getting the product with a less than or equal 50
   async getProductWithLowStocks() {
      const productWithLowStock = await this.dbClient.query.products.findMany({
         where: and(lte(products.stock, 50)),
         orderBy: [asc(products.stock), asc(products.name)],
      });

      return productWithLowStock;
   }
}
