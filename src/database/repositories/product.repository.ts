import { productCategories, products } from "../app-schema.js";
import { db, DrizzleClient } from "../client.js";
import {
   InsertProductModel,
   UpdateProductModel,
} from "../models/products.model.js";
import { PaginationParams } from "../../common/utils/pagination.js";
import { and, asc, desc, eq, lte, sql } from "drizzle-orm";

export class ProductsRepository {
   private dbClient: DrizzleClient;
   constructor(database?: DrizzleClient) {
      this.dbClient = database || db;
   }

   async add(data: InsertProductModel) {
      const [newProduct] = await db
         .insert(products)
         .values({
            ...data,
            price: data.price.toFixed(2),
         })
         .returning();

      if (data.categoryIds?.length) {
         await db.insert(productCategories).values(
            data.categoryIds.map((catId) => ({
               productId: newProduct.id,
               categoryId: catId,
            }))
         );
      }

      return newProduct;
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

   async getProductBySlug(slug: string) {
      const product = await this.dbClient.query.products.findFirst({
         where: eq(products.slug, slug),
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

   // For discord bot, n8n testing etc..

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
