import axios from "axios";
import { BadRequest } from "../common/errors/BadRequestError.js";
import { ConflictError } from "../common/errors/ConflictError.js";
import { NotFound } from "../common/errors/NotFoundError.js";
import { ApiResponse } from "../common/responses/ApiResponse.js";
import {
   PaginatedRepositoryResult,
   PaginatedResult,
   PaginationMeta,
   PaginationParams,
   SearchFilterQuery,
} from "../common/utils/pagination.js";
import {
   CreateProductDTO,
   InsertProductModel,
   ProductResponseDTO,
   SelectProductModel,
   UpdateProductDTO,
   UpdateProductModel,
} from "../database/models/products.model.js";
import { ProductsRepository } from "../database/repositories/product.repository.js";
import { slugify } from "../utils/slugify.js";
import { CategoriesRepository } from "../database/repositories/category.repository.js";
import { cache } from "../utils/cache.js";
import { GLOBAL_TTL_CACHE } from "../config/constants.js";
import { validatePaginationParams } from "../utils/validators.js";
import { ProductCategoryRepository } from "../database/repositories/product-category.repository.js";

export class ProductService {
   constructor(private productRepo: ProductsRepository) {}

   async getAll(
      params: PaginationParams,
      filters?: SearchFilterQuery
   ): Promise<ApiResponse<PaginatedResult<ProductResponseDTO>>> {
      const { page, limit } = params;

      const { isValid, values, errors } = validatePaginationParams({
         page,
         limit,
      });

      if (!isValid) {
         throw new BadRequest("Invalid pagination parameters", { errors });
      }

      const filterString = filters ? JSON.stringify(filters) : "none";
      const cacheKey = `products:page:${values.page}:limit:${values.limit}:filters:${filterString}`;

      const fetcher = async (): Promise<
         PaginatedRepositoryResult<ProductResponseDTO>
      > => {
         const { products } = await this.productRepo.getAll(values, filters);

         const items: ProductResponseDTO[] = products.map((p) => ({
            ...p,
            price: Number(p.price),
         }));

         return { items, total };
      };

      const { items: mappedProducts, total } = await cache.remember(
         cacheKey,
         GLOBAL_TTL_CACHE,
         fetcher
      );

      const totalPages = Math.ceil(total / limit);

      const meta: PaginationMeta = {
         page: values.page,
         limit: values.limit,
         totalItems: total,
         totalPages,
         hasNextPage: page < totalPages,
         hasPrevPage: page > 1,
      };

      const paginatedResult: PaginatedResult<ProductResponseDTO> = {
         data: mappedProducts,
         meta,
      };

      return {
         success: true,
         data: paginatedResult,
         message: "Products retrieved successfully",
      };
   }

   async updateProduct(
      userId: string,
      productId: string,
      dto: UpdateProductDTO
   ): Promise<ApiResponse<ProductResponseDTO>> {
      const { name, slug, price, stock, description, imageUrl } = dto;
      const badRequestErrors: Record<string, string> = {};

      if (!productId || typeof productId !== "string" || !productId.trim()) {
         throw new BadRequest("Product ID is required.");
      }
      if (name !== undefined && name.trim().length === 0) {
         badRequestErrors.name = "Name cannot be empty.";
      }
      if (price !== undefined && Number(price) <= 0) {
         badRequestErrors.price = "Price must be greater than zero.";
      }

      if (Object.keys(badRequestErrors).length > 0) {
         throw new BadRequest(
            "Validation failed for one or more fields.",
            badRequestErrors
         );
      }

      const existingProduct = await this.productRepo.getById(productId);
      if (!existingProduct) {
         throw new NotFound("Product not found");
      }

      const nameToSlugify = name !== undefined ? name : existingProduct.name;

      const finalSlug =
         slug && slug.trim() !== "" ? slugify(slug) : slugify(nameToSlugify);

      const existingProductBySlug = await this.productRepo.getBySlug(finalSlug);

      if (existingProductBySlug && existingProductBySlug.id !== productId) {
         throw new ConflictError(
            `Product slug '${finalSlug}' already exists.`,
            { slug: `The product slug '${finalSlug}' is already in use.` }
         );
      }
      const updatePayload: Partial<UpdateProductModel> = {
         slug: finalSlug,
         updatedBy: userId,
      };

      if (name !== undefined) updatePayload.name = name;
      if (price !== undefined) {
         const parsedPrice = Number(price);
         updatePayload.price = Math.round(parsedPrice * 100) / 100;
      }
      if (stock !== undefined) updatePayload.stock = Number(stock);
      if (description !== undefined) updatePayload.description = description;
      if (imageUrl !== undefined) updatePayload.imageUrl = imageUrl;

      const updatedProduct = await this.productRepo.update(
         productId,
         updatePayload as UpdateProductModel
      );

      if (!updatedProduct) {
         throw new BadRequest("Failed to retrieve updated product data.");
      }

      const response: ProductResponseDTO = {
         ...updatedProduct,
         price: Number(updatedProduct.price),
      };

      return {
         success: true,
         data: response,
         message: "Product updated successfully",
      };
   }

   // n8n low stock less than 50 triggers warning
   async getProductsWithLowStock(): Promise<ApiResponse<ProductResponseDTO[]>> {
      const cacheKey = "products:low-stock";

      const fetcher = async (): Promise<ProductResponseDTO[]> => {
         const result = await this.productRepo.getProductWithLowStocks();

         if (!Array.isArray(result) || result.length === 0) {
            throw new NotFound("No low stock products found.");
         }

         return result.map((p) => ({
            ...p,
            price: Number(p.price),
         }));
      };

      // Use cache layer
      const lowStockProducts = await cache.remember<ProductResponseDTO[]>(
         cacheKey,
         GLOBAL_TTL_CACHE,
         fetcher
      );

      // Send notifications asynchronously (don’t block response)
      this.sendLowStockNotification(
         lowStockProducts as unknown as SelectProductModel[]
      ).catch((err) => {
         console.error("⚠️ Failed to send low stock notification:", err);
      });

      return {
         success: true,
         data: lowStockProducts,
         message: "Low stock products retrieved successfully.",
      };
   }

   private async sendLowStockNotification(productList: SelectProductModel[]) {
      if (!productList.length) return;

      // 👇 add emoji based on severity
      const formattedProducts = productList.map((p) => ({
         ...p,
         alertEmoji: p.stock < 10 ? "🔴" : "🟡",
      }));

      if (!process.env.N8N_WEBHOOK) {
         console.error("❌ N8N webhook URL not set!");
         return;
      }
      const res = await axios.post(process.env.N8N_WEBHOOK, {
         message: "Low stock products detected",
         data: formattedProducts,
      });

      console.log(
         `✅ Low stock notification sent to n8n: ${res.status} ${res.statusText}`
      );
   }
}

export class ProductCategoryService {
   constructor(
      private productRepo: ProductsRepository,
      private productCategoryRepo: ProductCategoryRepository,
      private categoryRepo: CategoriesRepository
   ) {}
   async createProduct(
      userId: string,
      dto: CreateProductDTO
   ): Promise<ApiResponse<ProductResponseDTO>> {
      const { name, slug, price, stock, description, imageUrl, categoryIds } =
         dto;

      const badRequestErrors: Record<string, string> = {};

      if (!userId || typeof userId !== "string" || !userId.trim()) {
         throw new BadRequest("Product ID is required.");
      }

      if (!name || name.trim().length === 0) {
         badRequestErrors.name = "Name is required.";
      }

      if (price !== undefined && price <= 0) {
         badRequestErrors.price = "Price must be greater than zero.";
      }

      if (Object.keys(badRequestErrors).length > 0) {
         throw new BadRequest(
            "Validation failed for one or more fields.",
            badRequestErrors // Pass the structured errors
         );
      }

      const existingProduct = await this.productRepo.getByName(name);

      if (existingProduct) {
         throw new ConflictError(`Product name '${name}' already exists.`, {
            name: `The product name '${name}' is already in use.`,
         });
      }

      const finalSlug =
         slug && slug.trim() !== "" ? slugify(slug) : slugify(name);

      const categories = await this.categoryRepo.getByIds(categoryIds);
      if (categories.length !== categoryIds.length) {
         throw new BadRequest("Some category IDs are invalid.");
      }
      // 4. If all validation passes, proceed with creation
      const productData: InsertProductModel = {
         name,
         slug: finalSlug,
         price,
         stock,
         description,
         imageUrl,
         categoryIds,
         createdBy: userId,
      };

      const product = await this.productCategoryRepo.add(productData);

      await cache.delByPrefix("products");

      const productCategories = await this.categoryRepo.getProductByIds(
         product.id
      );
      const responseData: ProductResponseDTO = {
         ...product,
         price: Number(product.price),
         categories: productCategories.map((c) => c.name),
      };

      return {
         success: true,
         data: responseData,
         message: "Product created successfully",
      };
   }
}
