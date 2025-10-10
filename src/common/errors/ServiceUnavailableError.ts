import { AppError } from "./app-error";

export class ServiceUnavailableError extends AppError {
  constructor(message = "Service Unavailable") {
    super(message, 503);
  }
}
