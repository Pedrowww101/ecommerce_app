import axios from "axios";
import { BadRequest } from "../common/errors/BadRequestError.js";
import { ConflictError } from "../common/errors/ConflictError.js";
import { NotFound } from "../common/errors/NotFoundError.js";
import { ApiResponse } from "../common/responses/ApiResponse.js";
import {
   PaginatedResult,
   PaginationMeta,
   PaginationParams,
} from "../common/utils/pagination.js";
import {
   CreateProductDTO,
   InsertProductModel,
   ProductResponseDTO,
   SelectProductModel,
   UpdateProductDTO,
   UpdateProductModel,
} from "../database/models/products.model.js";
import { ProductsRepository } from "../repositories/product.repository.js";
import { slugify } from "../utils/slugify.js";

export class ProductService {
   constructor(private productRepo: ProductsRepository) {}

   //  to insert/add product
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

      const existingProduct = await this.productRepo.getProductByName(name);

      if (existingProduct) {
         throw new ConflictError(`Product name '${name}' already exists.`, {
            name: `The product name '${name}' is already in use.`,
         });
      }

      const finalSlug =
         slug && slug.trim() !== "" ? slugify(slug) : slugify(name);

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

      const product = await this.productRepo.add(productData);

      const responseData: ProductResponseDTO = {
         ...product,
         price: Number(product.price),
      };

      return {
         success: true,
         data: responseData,
         message: "Product created successfully",
      };
   }

   async getAllProducts(
      params: PaginationParams
   ): Promise<ApiResponse<PaginatedResult<ProductResponseDTO>>> {
      const { page, limit } = params;
      const badRequestErrors: Record<string, string> = {};

      if (!Number.isInteger(page) || page < 1) {
         badRequestErrors.page = "Page number must be a positive integer.";
      }
      if (!Number.isInteger(limit) || limit < 1) {
         badRequestErrors.limit = "Limit must be a positive integer.";
      }

      if (Object.keys(badRequestErrors).length > 0) {
         throw new BadRequest(
            "Pagination parameters are invalid.",
            badRequestErrors
         );
      }

      const { allProducts, total } = await this.productRepo.getAllProducts(
         params
      );

      const totalPages = Math.ceil(total / limit);

      const meta: PaginationMeta = {
         page,
         limit,
         totalItems: total,
         totalPages,
         hasNextPage: page < totalPages,
         hasPrevPage: page > 1,
      };

      const mappedProducts: ProductResponseDTO[] = allProducts.map((p) => ({
         ...p,
         price: Number(p.price),
      }));

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

      const existingProduct = await this.productRepo.getProductById(productId);
      if (!existingProduct) {
         throw new NotFound("Product not found");
      }

      const nameToSlugify = name !== undefined ? name : existingProduct.name;

      const finalSlug =
         slug && slug.trim() !== "" ? slugify(slug) : slugify(nameToSlugify);

      const existingProductBySlug = await this.productRepo.getProductBySlug(
         finalSlug
      );

      if (existingProductBySlug && existingProductBySlug.id !== productId) {
         throw new ConflictError(
            `Product slug '${finalSlug}' already exists.`,
            { slug: `The product slug '${finalSlug}' is already in use.` }
         );
      }
      const updatePayload: Partial<UpdateProductModel> = { slug: finalSlug };

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

   // DISCORD BOT SERVICES ONLY
   async getLatestProducts(): Promise<ApiResponse<SelectProductModel[]>> {
      const productList = await this.productRepo.getLatestProduct();

      if (!Array.isArray(productList) || productList.length === 0) {
         throw new NotFound("No products found");
      }

      return {
         success: true,
         data: productList,
         message: "Products retrieved successfully",
      };
   }

   // n8n low stock less than 50 triggers warning
   async getProductsWithLowStock(): Promise<ApiResponse<ProductResponseDTO[]>> {
      const productListWithLowStocks =
         await this.productRepo.getProductWithLowStocks();

      if (
         !Array.isArray(productListWithLowStocks) ||
         productListWithLowStocks.length === 0
      ) {
         throw new NotFound("No low stock products found");
      }

      this.sendLowStockNotification(productListWithLowStocks).catch((err) => {
         console.error("⚠️ Failed to send low stock notification:", err);
      });

      const mappedProductList: ProductResponseDTO[] =
         productListWithLowStocks.map((p) => ({
            ...p,
            price: Number(p.price),
         }));

      return {
         success: true,
         data: mappedProductList,
         message: "Products retrieved successfully",
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
