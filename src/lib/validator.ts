import { type } from "arktype";
import type { Type, ArkErrors, ArkError } from "arktype";
import type {
  Context,
  MiddlewareHandler,
  Env,
  ValidationTargets,
  TypedResponse,
} from "hono";
import { validator as honoValidator } from "hono/validator";
import { BadRequest } from "@/common/errors/BadRequestError";

export type Hook<T, E extends Env, P extends string, O = {}> = (
  result:
    | { success: false; data: unknown; errors: ArkError[] }
    | { success: true; data: T },
  c: Context<E, P>
) =>
  | Response
  | Promise<Response>
  | void
  | Promise<Response | void>
  | TypedResponse<O>;

type HasUndefined<T> = undefined extends T ? true : false;

const RESTRICTED_DATA_FIELDS = {
  header: ["cookie"],
};

export const validator = <
  T extends Type,
  Target extends keyof ValidationTargets,
  E extends Env,
  P extends string,
  I = T["inferIn"],
  O = T["infer"],
  V extends {
    in: HasUndefined<I> extends true
      ? { [K in Target]?: I }
      : { [K in Target]: I };
    out: { [K in Target]: O };
  } = {
    in: HasUndefined<I> extends true
      ? { [K in Target]?: I }
      : { [K in Target]: I };
    out: { [K in Target]: O };
  }
>(
  target: Target,
  schema: T,
  hook?: Hook<T["infer"], E, P>
): MiddlewareHandler<E, P, V> =>
  // @ts-expect-error Hono's validator type might not perfectly align with Arktype's infer
  honoValidator(target, (value, c) => {
    const result = schema(value);

    const hasErrors = result instanceof type.errors;

    const plainErrors: ArkError[] = hasErrors
      ? Array.from(result as ArkErrors)
      : [];

    // --- Hook Logic (remains unchanged from your last working version) ---
    if (hook) {
      const hookResult = hook(
        hasErrors
          ? { success: false, data: value, errors: plainErrors }
          : { success: true, data: result },
        c
      );
      if (hookResult) {
        if (hookResult instanceof Response || hookResult instanceof Promise) {
          return hookResult;
        }
        if ("response" in hookResult) {
          return hookResult.response;
        }
      }
    }

    // --- Error Handling (MODIFIED to throw BadRequest) ---
    if (hasErrors) {
      const formattedErrors = plainErrors.map((error) => {
        let sanitizedErrorData: unknown = error.data;
        if (
          target in RESTRICTED_DATA_FIELDS &&
          typeof error.data === "object" &&
          error.data !== null &&
          !Array.isArray(error.data)
        ) {
          const restrictedFields =
            RESTRICTED_DATA_FIELDS[
              target as keyof typeof RESTRICTED_DATA_FIELDS
            ] || [];
          const dataCopy = {
            ...(error.data as Record<string, unknown>),
          };
          for (const field of restrictedFields) {
            delete dataCopy[field];
          }
          sanitizedErrorData = dataCopy;
        }

        return {
          field: error.path.join("."),
          message: error.message,
          type: error.code,
          actual: error.actual,
          expected: error.expected,
          // value: sanitizedErrorData, // Uncomment if needed
        };
      });

      // --- CRITICAL CHANGE: THROW THE CUSTOM ERROR ---
      // Instead of returning c.json directly, throw a BadRequest error.
      // We stringify the detailed errors and pass them as the message
      // or as a custom property if your AppError supports it.
      // For simplicity, we'll stringify them into the message.
      // A better approach
      //  for complex error data is to add a 'details' property to AppError.
      const errorRecord = Object.fromEntries(
        formattedErrors.map((e) => [e.field, e.message])
      );
      // If you want a generic message and keep errors in a 'details' property:
      throw new BadRequest(
        "Validation failed for one or more fields.", // Clean string message
        errorRecord // Pass the structured errors here as 'details'
      );

      // OR if your BadRequest constructor had a 'details' parameter:
      // throw new BadRequest(validationErrorMessage, formattedErrors);

      // OR, if you just want to pass the first error message as the main message:
      // throw new BadRequest(formattedErrors[0]?.message || "Validation failed.");
    }

    // --- Success Case (remains unchanged) ---
    return result;
  });
