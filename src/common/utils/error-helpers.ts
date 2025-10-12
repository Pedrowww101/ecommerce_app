import { AppError } from "../errors/app-error.js";

/**
 * Helper function to create standardized error responses
 * This ensures consistency across all error handling
 */
export const createErrorResponse = (error: AppError) => {
   return error.toResponse();
};

/**
 * Helper function to throw errors in a consistent way
 * Useful in services and controllers
 */
export const throwError = (error: AppError): never => {
   throw error;
};

/**
 * Helper function to create error responses for non-AppError exceptions
 * Used as a fallback for unexpected errors
 */
export const createGenericErrorResponse = (
   message = "Something went wrong"
) => {
   return {
      success: false,
      code: "InternalServerError",
      errorCode: `INTERNAL_${Math.random()
         .toString(36)
         .substring(2, 8)
         .toUpperCase()}`,
      message,
      timestamp: new Date().toISOString(),
   };
};
