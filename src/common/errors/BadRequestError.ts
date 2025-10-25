import { AppError, AppErrorStatusCode } from "./app-error.js";

export class BadRequest extends AppError {
   constructor(message: string, details?: Record<string, unknown> | string) {
      super(message, 400 as AppErrorStatusCode, details);
      this.name = "BadRequest";
   }
}
