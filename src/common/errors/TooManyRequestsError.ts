import { AppError, AppErrorStatusCode } from "./app-error.js";

export class TooManyRequestsError extends AppError {
   constructor(message: string, details?: Record<string, unknown> | string) {
      super(message, 429 as AppErrorStatusCode, details);
   }
}
