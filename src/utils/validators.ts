import {
   PaginationParams,
   PaginationValidationResult,
} from "../common/utils/pagination.js";

export function validatePaginationParams({
   page = 1,
   limit = 10,
}: PaginationParams): PaginationValidationResult {
   const errors: Record<string, string> = {};

   if (!Number.isInteger(page) || page < 1) {
      errors.page = "Page number must be a positive integer.";
   }

   if (!Number.isInteger(limit) || limit < 1) {
      errors.limit = "Limit must be a positive integer.";
   }

   return {
      isValid: Object.keys(errors).length === 0,
      errors,
      values: {
         page: Math.max(1, Math.floor(page)), // sanitize
         limit: Math.max(1, Math.floor(limit)), // sanitize
      },
   };
}
