import type { ErrorHandler } from 'hono'
import { AppError } from '@/common/errors' // adjust path

export const getGlobalErrorHandler: ErrorHandler = (err, c) => {
    
  // ✅ Known application errors
  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        code: err.constructor.name, // e.g. "BadRequest"
        message: err.message,
        errors: err.details ?? undefined,
      },
      err.statusCode
    )
  }

  // ✅ Unexpected errors (e.g. bugs, runtime issues)
  console.error(err) // or send to Sentry, Datadog, etc.

  return c.json(
    {
      success: false,
      code: 'InternalServerError',
      message: 'Something went wrong.',
    },
    500
  )
}
