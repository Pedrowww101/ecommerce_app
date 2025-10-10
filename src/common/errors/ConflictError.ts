import { AppError, AppErrorStatusCode } from "./app-error.js";

export class ConflictError extends AppError {
   constructor(message = "Conflict", errors?: Record<string, string>) {
      super(message, 409 as AppErrorStatusCode, errors);
      this.name = "ConflictError"; // Helps with logging/debugging
   }
}
