import { BadRequest } from "../common/errors/BadRequestError.js";
import { ConflictError } from "../common/errors/ConflictError.js";
import { ApiResponse } from "../common/responses/ApiResponse.js";
import {
   PaginatedRepositoryResult,
   PaginatedResult,
   PaginationMeta,
   PaginationParams,
} from "../common/utils/pagination.js";
import { GLOBAL_TTL_CACHE } from "../config/constants.js";
import {
   CategoriesResponseDTO,
   CreateCategoriesDTO,
} from "../database/models/categories.model.js";
import { CategoriesRepository } from "../database/repositories/category.repository.js";
import { cache } from "../utils/cache.js";
import { slugify } from "../utils/slugify.js";
import { validatePaginationParams } from "../utils/validators.js";

export class CategoriesService {
   constructor(private categoryRepo: CategoriesRepository) {}

   async createCategory(
      userId: string,
      dto: CreateCategoriesDTO
   ): Promise<ApiResponse<CategoriesResponseDTO>> {
      const { name, slug } = dto;
      if (!dto.name) throw new BadRequest("Category Name is required.");

      const existingCategoryName = await this.categoryRepo.getByName(name);

      if (existingCategoryName)
         throw new ConflictError(
            `Category name: ${name} is already used. Please try another.`
         );

      const newCategory = await this.categoryRepo.add({
         ...dto,
         slug: slug ? slug : slugify(name),
         createdBy: userId,
      });

      await cache.delByPrefix("categories");

      return {
         success: true,
         data: newCategory,
         message: "Category created successfully.",
      };
   }

   // category.service.ts
   async getAll(
      params: PaginationParams
   ): Promise<ApiResponse<PaginatedResult<CategoriesResponseDTO>>> {
      const { page, limit } = params;

      // --- Validate pagination ---
      const { isValid, values, errors } = validatePaginationParams({
         page,
         limit,
      });
      if (!isValid) {
         throw new BadRequest("Invalid pagination parameters", { errors });
      }

      // --- Cache Key ---
      const cacheKey = `categories:page:${values.page}:limit:${values.limit}`;

      // --- Fetcher (used by cache.remember) ---
      const fetcher = async (): Promise<
         PaginatedRepositoryResult<CategoriesResponseDTO>
      > => {
         const { allCategories, total } = await this.categoryRepo.getAll(
            values
         );
         return { items: allCategories, total };
      };

      // --- Retrieve from cache or fetch fresh ---
      const { items: allCategories, total } = await cache.remember<
         PaginatedRepositoryResult<CategoriesResponseDTO>
      >(cacheKey, GLOBAL_TTL_CACHE, fetcher);

      // --- Pagination Meta ---
      const totalPages = values.limit > 0 ? Math.ceil(total / values.limit) : 1;

      const meta: PaginationMeta = {
         page: values.page,
         limit: values.limit,
         totalItems: total,
         totalPages,
         hasNextPage: values.page < totalPages,
         hasPrevPage: values.page > 1,
      };

      // --- Final Paginated Result ---
      return {
         success: true,
         message: "All categories fetched successfully.",
         data: {
            data: allCategories,
            meta,
         },
      };
   }
}
