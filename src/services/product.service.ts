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
   SelectProductModel,
} from "../models/products.model.js";
import { ProductRepository } from "../repositories/products/product.repository.js";

export class ProductService {
   constructor(private productRepo: ProductRepository) {}

   //  to insert/add product
   async createProduct(
      userId: string,
      dto: CreateProductDTO
   ): Promise<ApiResponse<SelectProductModel>> {
      const { name, price, stock, description, imageUrl } = dto;

      const badRequestErrors: Record<string, string> = {};

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

      // 4. If all validation passes, proceed with creation
      const productData: InsertProductModel = {
         name,
         price,
         stock,
         description,
         imageUrl,
         createdBy: userId,
      };

      const product = await this.productRepo.add(productData);

      return {
         success: true,
         data: product,
         message: "Product created successfully",
      };
   }

   async getAllProducts(
      params: PaginationParams
   ): Promise<ApiResponse<PaginatedResult<SelectProductModel>>> {
      // 👆 This is the key: ApiResponse now wraps the PaginatedResult<T>

      const { page, limit } = params;
      const badRequestErrors: Record<string, string> = {};

      // 1. Validation (Same as before)
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

      const paginatedResult: PaginatedResult<SelectProductModel> = {
         data: allProducts,
         meta: meta,
      };

      return {
         success: true,
         data: paginatedResult,
         message: "Products retrieved successfully",
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
   async getProductsWithLowStock(): Promise<ApiResponse<SelectProductModel[]>> {
      const productList = await this.productRepo.getProductWithLowStocks();

      if (!Array.isArray(productList) || productList.length === 0) {
         throw new NotFound("No low stock products found");
      }

      await this.sendLowStockNotification(productList);

      return {
         success: true,
         data: productList,
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
