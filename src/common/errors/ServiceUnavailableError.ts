import { AppError, AppErrorStatusCode } from "./app-error.js";

export class ServiceUnavailableError extends AppError {
   constructor(message: "string", details?: Record<string, unknown> | string) {
      super(message, 503 as AppErrorStatusCode, details);
   }
}
