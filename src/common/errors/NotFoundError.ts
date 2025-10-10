import { AppError, AppErrorStatusCode } from "./app-error";

export class NotFound extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 404 as AppErrorStatusCode, details);
  }
}

