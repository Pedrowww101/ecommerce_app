import { AppError, AppErrorStatusCode } from "./app-error";

export class BadRequest extends AppError {
  constructor(
    message: string,
    errors?: Record<string, string>
  ) {
    super(message, 400 as AppErrorStatusCode, errors);
  }
}