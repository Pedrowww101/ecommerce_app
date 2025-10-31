import { categories, productCategories, products } from "../app-schema.js";
import { db, DrizzleClient } from "../client.js";
import {
   ProductResponseDTO,
   UpdateProductModel,
} from "../models/products.model.js";
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
import { logger } from "../../lib/logger.js";

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

   async getAll(
      params: PaginationParams,
      filters?: SearchFilterQuery
   ): Promise<{
      allProducts: ProductResponseDTO[];
      total: number;
   }> {
      const { page, limit } = params;
      const offset = (page - 1) * limit;
      const whereConditions: (SQL | undefined)[] = [];

      logger.debug({
         msg: "[ProductRepository] Building query...",
         pagination: { page, limit, offset },
         filters: filters || {},
      });

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

         logger.debug({ msg: "Resolving category filters", categoryNames });

         const categoryResults = await this.dbClient
            .select({ id: categories.id })
            .from(categories)
            .where(inArray(categories.name, categoryNames));

         const categoryIds = categoryResults.map((r) => r.id);

         logger.debug({ msg: "Category IDs found", categoryIds });

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
            logger.warn({
               msg: "No matching categories found; returning empty set",
               categoryNames,
            });
            whereConditions.push(sql`false`);
         }
      }

      const whereClause =
         whereConditions.length > 0 ? and(...whereConditions) : undefined;

      logger.debug({
         msg: "Final whereClause built",
         hasWhereClause: !!whereClause,
      });

      // --- Parallel Queries for Performance ---
      const [rawProducts, totalResult] = await Promise.all([
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

      logger.info({
         msg: "[ProductRepository] Query fetched results",
         fetched: rawProducts.length,
         total,
         page,
      });

      const allProducts: ProductResponseDTO[] = rawProducts.map((p) => ({
         ...p,
         price: Number(p.price),
      }));

      return {
         allProducts,
         total,
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
