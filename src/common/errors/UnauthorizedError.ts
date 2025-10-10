import { AppError, AppErrorStatusCode } from "./app-error.js";

export class Unauthorized extends AppError {
   constructor(message: string, details?: unknown) {
      super(message, 401 as AppErrorStatusCode, details);
   }
}
