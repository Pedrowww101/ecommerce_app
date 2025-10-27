import { InternalServerError } from "../../common/errors/InternalServerError.js";
import { productCategories, products } from "../app-schema.js";
import { db, DrizzleClient } from "../client.js";
import { InsertProductModel } from "../models/products.model.js";

export class ProductCategoryRepository {
   private dbClient: DrizzleClient;
   constructor(database?: DrizzleClient) {
      this.dbClient = database || db;
   }

   async add(data: InsertProductModel) {
      return await this.dbClient.transaction(async (trx) => {
         const [newProduct] = await trx
            .insert(products)
            .values({
               // Ensure categoryIds is NOT included here, as it doesn't belong in the 'products' table
               name: data.name,
               slug: data.slug,
               price: data.price.toFixed(2), // Conversion from number/string to decimal string
               stock: data.stock,
               description: data.description,
               imageUrl: data.imageUrl,
               createdBy: data.createdBy,
               updatedBy: data.updatedBy,
            })
            .returning();

         // Check if the product was successfully created and returned
         if (!newProduct) {
            // Throwing an error here causes the transaction to roll back
            throw new InternalServerError(
               "Failed to create new product record."
            );
         }

         if (data.categoryIds?.length) {
            const linksToInsert = data.categoryIds.map((catId) => ({
               productId: newProduct.id,
               categoryId: catId,
            }));

            // Use 'trx' for the junction table insert as well
            await trx.insert(productCategories).values(linksToInsert);
         }

         return newProduct;
      });
   }
}
