import { AppError, AppErrorStatusCode } from "./app-error.js";

export class NotFound extends AppError {
   constructor(message: string, details?: Record<string, unknown> | string) {
      super(message, 404 as AppErrorStatusCode, details);
   }
}
