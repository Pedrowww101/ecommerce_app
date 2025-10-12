import { BadRequest } from "../common/errors/BadRequestError.js";
import { ConflictError } from "../common/errors/ConflictError.js";
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
         page: page,
         limit: limit,
         totalItems: total,
         totalPages: totalPages,
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
}
