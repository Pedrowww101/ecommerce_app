import { AppError, AppErrorStatusCode } from "./app-error.js";

export class ValidationError extends AppError {
   constructor(message: string, details?: Record<string, string> | string) {
      super(message, 400 as AppErrorStatusCode, details);
   }
}
