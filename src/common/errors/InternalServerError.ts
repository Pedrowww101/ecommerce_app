import { AppError, AppErrorStatusCode } from "./app-error.js";

export class InternalServerError extends AppError {
   constructor(message: string, details?: unknown) {
      super(message, 500 as AppErrorStatusCode, details);
   }
}
