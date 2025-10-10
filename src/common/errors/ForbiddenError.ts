import { AppError, AppErrorStatusCode } from "./app-error";

export class Forbidden extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 403 as AppErrorStatusCode, details);
  }
}
