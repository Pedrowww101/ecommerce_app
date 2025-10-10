import { AppError } from "./app-error.js";

export class ValidationError extends AppError {
   constructor(public details: string[]) {
      super("Validation Failed", 422);
   }
}
