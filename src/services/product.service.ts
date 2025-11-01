import axios from "axios";
import { BadRequest } from "../common/errors/BadRequestError.js";
import { ConflictError } from "../common/errors/ConflictError.js";
import { NotFound } from "../common/errors/NotFoundError.js";
import { ApiResponse } from "../common/responses/ApiResponse.js";
import {
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
import { logger } from "../lib/logger.js";
import { Forbidden } from "../common/errors/ForbiddenError.js";
import { InternalServerError } from "../common/errors/InternalServerError.js";

export class ProductService {
   constructor(private productRepo: ProductsRepository) {}

   async getAll(
      params: PaginationParams,
      filters?: SearchFilterQuery
   ): Promise<ApiResponse<PaginatedResult<ProductResponseDTO>>> {
      const { isValid, values, errors } = validatePaginationParams(params);
      if (!isValid)
         throw new BadRequest("Invalid pagination parameters", { errors });

      const cacheKey = `products:page:${values.page}:limit:${
         values.limit
      }:filters:${JSON.stringify(filters || {})}`;

      logger.debug({
         msg: "[ProductService] Fetching products...",
         pagination: values,
         filters: filters || {},
         cacheKey,
      });

      const fetcher = async () => this.productRepo.getAll(values, filters);

      const { allProducts, total } = await cache.remember(
         cacheKey,
         GLOBAL_TTL_CACHE,
         async () => {
            logger.warn({
               msg: "CACHE MISS – Fetching fresh data...",
               cacheKey,
            });
            return fetcher();
         }
      );

      logger.info({
         msg: "[ProductService] Retrieved products",
         fetched: allProducts.length,
         total,
         page: values.page,
         limit: values.limit,
      });

      const totalPages = values.limit > 0 ? Math.ceil(total / values.limit) : 1;

      const meta: PaginationMeta = {
         page: values.page,
         limit: values.limit,
         totalItems: total,
         totalPages,
         hasNextPage: values.page < totalPages,
         hasPrevPage: values.page > 1,
      };

      logger.debug({
         msg: "[ProductService] Computed pagination meta",
         meta,
      });

      return {
         success: true,
         message: "Products retrieved successfully",
         data: { data: allProducts, meta },
      };
   }

   async updateProduct(
      userId: string,
      productId: string,
      dto: UpdateProductDTO
   ): Promise<ApiResponse<ProductResponseDTO>> {
      const { name, slug, price, stock, description, imageUrl } = dto;
      const badRequestErrors: Record<string, string> = {};

      // Basic validation
      if (!productId?.trim()) throw new BadRequest("Product ID is required.");
      if (name !== undefined && !name.trim())
         badRequestErrors.name = "Name cannot be empty.";
      if (price !== undefined && Number(price) <= 0)
         badRequestErrors.price = "Price must be greater than zero.";
      if (Object.keys(badRequestErrors).length > 0)
         throw new BadRequest(
            "Validation failed for one or more fields.",
            badRequestErrors
         );

      // Retrieve existing product
      const existingProduct = await this.productRepo.getById(productId);
      if (!existingProduct) throw new NotFound("Product not found");

      // Ownership check (optional)
      if (existingProduct.createdBy !== userId)
         throw new Forbidden("You are not authorized to update this product.");

      // Slug handling
      const nameToSlugify = name ?? existingProduct.name;
      const finalSlug = slugify(slug?.trim() || nameToSlugify);

      // Slug conflict check
      const existingProductBySlug = await this.productRepo.getBySlug(finalSlug);
      if (existingProductBySlug && existingProductBySlug.id !== productId)
         throw new ConflictError(
            `Product slug '${finalSlug}' already exists.`,
            {
               slug: `The product slug '${finalSlug}' is already in use.`,
            }
         );

      // Prepare update payload
      const updatePayload: Partial<UpdateProductModel> = {
         slug: finalSlug,
         updatedBy: userId,
      };
      if (name !== undefined) updatePayload.name = name;
      if (price !== undefined) updatePayload.price = Number(price);
      if (stock !== undefined) updatePayload.stock = Number(stock);
      if (description !== undefined) updatePayload.description = description;
      if (imageUrl !== undefined) updatePayload.imageUrl = imageUrl;

      // Log before performing update
      logger.info({
         msg: "[ProductService] Updating product...",
         productId,
         updatePayload,
      });

      // Perform DB update
      const updatedProduct = await this.productRepo.update(
         productId,
         updatePayload as UpdateProductModel
      );
      if (!updatedProduct)
         throw new InternalServerError("Failed to update product record.");

      // Cache invalidation
      await Promise.all([
         cache.delByPrefix("products"),
         cache.delByPrefix(`products:${productId}`),
      ]);

      logger.info({
         msg: "[ProductService] Cache invalidated after product update.",
         cachePrefix: "products",
         productId,
      });

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
      private categoryRepo: CategoriesRepository,
      private productCategoryRepo: ProductCategoryRepository
   ) {}

   async createProduct(
      userId: string,
      dto: CreateProductDTO
   ): Promise<ApiResponse<ProductResponseDTO>> {
      const { name, slug, price, stock, description, imageUrl, categoryIds } =
         dto;

      const badRequestErrors: Record<string, string> = {};

      // 🧩 Basic validation
      if (!userId || typeof userId !== "string" || !userId.trim()) {
         throw new BadRequest("User ID is required.");
      }

      if (!name || name.trim().length === 0) {
         badRequestErrors.name = "Name is required.";
      }

      if (price !== undefined && price <= 0) {
         badRequestErrors.price = "Price must be greater than zero.";
      }

      if (Object.keys(badRequestErrors).length > 0) {
         logger.warn({
            msg: "[ProductService] Validation failed for product creation.",
            userId,
            errors: badRequestErrors,
         });
         throw new BadRequest(
            "Validation failed for one or more fields.",
            badRequestErrors
         );
      }

      const finalSlug =
         slug && slug.trim() !== "" ? slugify(slug) : slugify(name);

      logger.debug({
         msg: "[ProductService] Checking product and category conflicts...",
         name,
         slug: finalSlug,
         categoryIds,
      });

      // 🟢 Parallel lookups
      const [existingProduct, existingProductSlug, categories] =
         await Promise.all([
            this.productRepo.getByName(name),
            this.productRepo.getBySlug(finalSlug),
            this.categoryRepo.getByIds(categoryIds),
         ]);

      if (existingProduct) {
         logger.warn({
            msg: "[ProductService] Duplicate product name detected.",
            name,
            userId,
         });
         throw new ConflictError(`Product name '${name}' already exists.`, {
            name: `The product name '${name}' is already in use.`,
         });
      }

      if (existingProductSlug) {
         logger.warn({
            msg: "[ProductService] Duplicate product slug detected.",
            slug: finalSlug,
            userId,
         });
         throw new ConflictError(
            `Product slug: ${finalSlug} is already used. Please try another.`
         );
      }

      if (categories.length !== categoryIds.length) {
         logger.warn({
            msg: "[ProductService] Invalid category IDs detected.",
            provided: categoryIds,
            validCount: categories.length,
         });
         throw new BadRequest("Some category IDs are invalid.");
      }

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

      // 🟡 Log before creation
      logger.info({
         msg: "[ProductService] Creating product...",
         name,
         slug: finalSlug,
         userId,
      });

      const product = await this.productCategoryRepo.add(productData);

      if (!product) {
         logger.error({
            msg: "[ProductService] Failed to create product.",
            productData,
         });
         throw new BadRequest("Failed to create product.");
      }

      await cache.delByPrefix("products");

      logger.info({
         msg: "[ProductService] Cache invalidated after product creation.",
         cachePrefix: "products",
      });

      const productCategories = await this.categoryRepo.getProductByIds(
         product.id
      );
      const responseData: ProductResponseDTO = {
         ...product,
         price: Number(product.price),
         categories: productCategories.map((c) => c.name),
      };

      // ✅ Success log
      logger.info({
         msg: "[ProductService] Product created successfully.",
         productId: product.id,
         name: product.name,
         slug: product.slug,
         createdBy: userId,
      });

      return {
         success: true,
         data: responseData,
         message: "Product created successfully",
      };
   }
}
