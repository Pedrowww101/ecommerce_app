import { BadRequest } from "../common/errors/BadRequestError.js";
import { ConflictError } from "../common/errors/ConflictError.js";
import { ApiResponse } from "../common/responses/ApiResponse.js";
import {
   PaginatedResult,
   PaginationMeta,
   PaginationParams,
} from "../common/utils/pagination.js";
import {
   CategoriesResponseDTO,
   CreateCategoriesDTO,
} from "../database/models/categories.model.js";
import { CategoriesRepository } from "../repositories/category.repository.js";
import { slugify } from "../utils/slugify.js";

export class CategoriesService {
   constructor(private categoryRepo: CategoriesRepository) {}

   async createCategory(
      userId: string,
      dto: CreateCategoriesDTO
   ): Promise<ApiResponse<CategoriesResponseDTO>> {
      const { name, slug } = dto;
      if (dto.name) throw new BadRequest("Category Name is required.");

      const existingCategoryName = await this.categoryRepo.getByName(name);

      if (existingCategoryName)
         throw new ConflictError(
            `Category name: ${name} is already used. Please try another.`
         );

      const newCategory = await this.categoryRepo.add({
         ...dto,
         slug: slug ? slug : slugify(slug),
         createdBy: userId,
      });

      return {
         success: true,
         data: newCategory,
         message: "Category created successfully.",
      };
   }

   async getAll(
      params: PaginationParams
   ): Promise<ApiResponse<PaginatedResult<CategoriesResponseDTO>>> {
      const { page, limit } = params;

      const badRequestErrors: Record<string, string> = {};

      if (!Number.isInteger(page) || page < 1) {
         ("Page number must be a positive integer.");
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

      const { allProducts, total } = await this.categoryRepo.getAllCategories(
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

      const paginatedResult: PaginatedResult<CategoriesResponseDTO> = {
         data: allProducts,
         meta,
      };

      return {
         success: true,
         data: paginatedResult,
         message: "All Categories fetched successfully.",
      };
   }
}
