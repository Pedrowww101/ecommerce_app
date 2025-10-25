// Client input
export interface PaginationParams {
   page: number;
   limit: number;
}

export interface SearchFilterQuery {
   ratings?: number;
   priceRange?: [number, number];
   categories?: string | string[];
}

export interface PaginationMeta {
   totalItems: number;
   totalPages: number;
   page: number;
   limit: number;
   hasNextPage: boolean;
   hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
   data: T[];
   meta: PaginationMeta;
}

export type SingleResult<T> = T;

export interface PaginatedRepositoryResult<T> {
   items: T[]; // Use a more general name like 'items' or 'data' instead of 'allCategories'
   total: number;
}

export interface PaginationValidationResult {
   isValid: boolean;
   errors: Record<string, string>;
   values: {
      page: number;
      limit: number;
   };
}
