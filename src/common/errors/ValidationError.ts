import { AppError } from "./app-error";

export class ValidationError extends AppError {
  constructor(public details: string[]) {
    super("Validation Failed", 422);
  }
}
