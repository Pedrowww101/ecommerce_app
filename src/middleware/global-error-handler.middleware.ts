import type { ErrorHandler } from "hono";
import { AppError } from "../common/errors/app-error.js";

export const getGlobalErrorHandler: ErrorHandler = (err, c) => {
   if (err instanceof AppError) {
      return c.json(err.toResponse(), err.statusCode);
   }

   // ✅ Unexpected errors (e.g. bugs, runtime issues)
   console.error("Unexpected error:", err); // or send to Sentry, Datadog, etc.

   // Create a generic internal server error
   const internalError = {
      success: false,
      code: "InternalServerError",
      errorCode: `INTERNAL_${Math.random()
         .toString(36)
         .substring(2, 8)
         .toUpperCase()}`,
      message: "Something went wrong.",
      timestamp: new Date().toISOString(),
   };

   return c.json(internalError, 500);
};
