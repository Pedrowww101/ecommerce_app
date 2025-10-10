import { AppError } from "../errors/index.js";

export interface ErrorResponse {
   success: false;
   error: AppError;
   message?: string | string[];
}

export interface SuccessResponse<T> {
   success: true;
   message?: string;
   data?: T;
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
