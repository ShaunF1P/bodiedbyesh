import { type ZodSchema, ZodError, type ZodIssue } from "zod";

export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

export interface ValidationFailure {
  success: false;
  response: Response;
  error: ZodError;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Validates JSON request body against a Zod schema with uniform 400 Bad Request responses.
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: Response.json(
        {
          success: false,
          error: "Invalid JSON",
          message: "Request body contains malformed JSON.",
        },
        { status: 400 }
      ),
      error: new ZodError([]),
    };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      success: false,
      response: Response.json(
        {
          success: false,
          error: "Validation Error",
          issues: result.error.issues.map((e: ZodIssue) => ({
            field: e.path.join("."),
            message: e.message,
            code: e.code,
          })),
        },
        { status: 400 }
      ),
      error: result.error,
    };
  }

  return { success: true, data: result.data };
}

/**
 * Validates URL query search parameters against a Zod schema.
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): ValidationResult<T> {
  const paramsObject = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(paramsObject);

  if (!result.success) {
    return {
      success: false,
      response: Response.json(
        {
          success: false,
          error: "Invalid Query Parameters",
          issues: result.error.issues.map((e: ZodIssue) => ({
            field: e.path.join("."),
            message: e.message,
            code: e.code,
          })),
        },
        { status: 400 }
      ),
      error: result.error,
    };
  }

  return { success: true, data: result.data };
}
