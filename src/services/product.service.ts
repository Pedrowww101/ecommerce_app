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
      dto: CreateProductDTO
   ): Promise<ApiResponse<SelectProductModel>> {
      const { name, price, stock, description, imageUrl } = dto;

      // 1. Initialize the collection for 400 Bad Request errors
      const badRequestErrors: Record<string, string> = {};

      // --- 400 Check 1: Name is required (collect error, DON'T throw yet) ---
      if (!name || name.trim().length === 0) {
         badRequestErrors.name = "Name is required.";
      }

      // --- 400 Check 2: Price must be positive (example of a second check) ---
      // Assuming price validation also happens here if not covered by Arktype
      if (price !== undefined && price <= 0) {
         badRequestErrors.price = "Price must be greater than zero.";
      }

      // 2. THROW POINT A: Throw a single BadRequest if ANY 400 errors exist
      if (Object.keys(badRequestErrors).length > 0) {
         throw new BadRequest(
            "Validation failed for one or more fields.",
            badRequestErrors // Pass the structured errors
         );
      }

      // ----------------------------------------------------
      // 3. 409 Conflict Check (Only runs if 400 errors passed)
      // ----------------------------------------------------
      const existingProduct = await this.productRepo.getProductByName(name);

      if (existingProduct) {
         // THROW POINT B: Throw a 409 Conflict error
         // We still use the structured error object to highlight the 'name' field
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
