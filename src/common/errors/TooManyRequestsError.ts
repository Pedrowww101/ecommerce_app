import { AppError } from "./app-error.js";

export class TooManyRequestsError extends AppError {
   constructor(message = "Too Many Requests") {
      super(message, 429);
   }
}
