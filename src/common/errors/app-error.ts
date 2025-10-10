export type AppErrorStatusCode = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 503;

export abstract class AppError extends Error {
  public readonly statusCode: AppErrorStatusCode;
  public readonly details?: unknown;
  public readonly meta?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: AppErrorStatusCode,
    details?: unknown,
    meta?: Record<string, unknown>
  ) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.details = details;
    this.meta = meta;

    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, new.target.prototype);
  }
}