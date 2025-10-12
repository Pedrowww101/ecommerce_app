export type AppErrorStatusCode =
   | 400
   | 401
   | 403
   | 404
   | 409
   | 422
   | 429
   | 500
   | 503;

export abstract class AppError extends Error {
   public readonly statusCode: AppErrorStatusCode;
   public readonly details?: unknown;
   public readonly meta?: Record<string, unknown>;
   public readonly timestamp: string;
   public readonly errorCode: string;

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
      this.timestamp = new Date().toISOString();
      this.errorCode = this.generateErrorCode();

      // Ensure instanceof works correctly
      Object.setPrototypeOf(this, new.target.prototype);
   }

   private generateErrorCode(): string {
      // Generate a unique error code for tracking
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `${this.name.toUpperCase()}_${random}`;
   }

   // Helper method to create standardized error response
   toResponse() {
      return {
         success: false,
         code: this.name,
         errorCode: this.errorCode,
         message: this.message,
         timestamp: this.timestamp,
         details: this.details ?? undefined,
         meta: this.meta ?? undefined,
      };
   }
}
