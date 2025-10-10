// Client input
export interface PaginationParams {
   page: number;
   limit: number;
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
