import { AppError, AppErrorStatusCode } from "./app-error.js";

export class BadRequest extends AppError {
   constructor(message: string, errors?: Record<string, string>) {
      super(message, 400 as AppErrorStatusCode, errors);
      this.name = "BadRequest";
   }
}
