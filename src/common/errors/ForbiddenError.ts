import { AppError, AppErrorStatusCode } from "./app-error.js";

export class Forbidden extends AppError {
   constructor(message: string, details?: Record<string, unknown> | string) {
      super(message, 403 as AppErrorStatusCode, details);
   }
}
