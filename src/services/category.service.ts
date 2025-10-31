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
import { logger } from "../lib/logger.js";
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

      // ✅ Step 1: Basic validation (no DB calls yet)
      if (!name || name.trim().length === 0) {
         throw new BadRequest("Category name is required.");
      }

      if (!userId || typeof userId !== "string" || !userId.trim()) {
         throw new BadRequest("User ID is required.");
      }

      // ✅ Step 2: Compute slug before parallel DB queries
      const finalSlug = slug?.trim() ? slugify(slug) : slugify(name);

      // ✅ Step 3: Parallel DB lookups
      const [existingByName, existingBySlug] = await Promise.all([
         this.categoryRepo.getByName(name),
         this.categoryRepo.getBySlug(finalSlug),
      ]);

      // ✅ Step 4: Business validation
      if (existingByName) {
         throw new ConflictError(`Category name '${name}' already exists.`, {
            name: "Category name is already in use.",
         });
      }

      if (existingBySlug) {
         throw new ConflictError(
            `Category slug '${finalSlug}' is already used. Please try another.`
         );
      }

      const [newCategory] = await Promise.all([
         this.categoryRepo.add({
            ...dto,
            slug: finalSlug,
            createdBy: userId,
         }),
         cache.delByPrefix("categories"),
      ]);

      logger.info({
         msg: "Category created successfully",
         category: { id: newCategory.id, name, slug: finalSlug },
      });

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
