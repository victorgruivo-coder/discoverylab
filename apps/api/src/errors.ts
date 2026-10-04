/** The one error shape every API endpoint returns (docs/decisions.md). */
export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: unknown,
  ) {
    super(message);

    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function notFound(message: string): AppError {
  return new AppError(message, 'NOT_FOUND', 404);
}

export function badRequest(message: string, details?: unknown): AppError {
  return new AppError(message, 'BAD_REQUEST', 400, details);
}

/**
 * Boundary failures (Zod) get their own code, so clients can tell "your payload
 * is malformed" apart from "your payload parsed fine but the rule rejects it",
 * which stays on BAD_REQUEST.
 */
export function validationError(details: unknown): AppError {
  return new AppError('Invalid request', 'VALIDATION_ERROR', 400, details);
}

export function internal(message = 'Internal server error'): AppError {
  return new AppError(message, 'INTERNAL_ERROR', 500);
}
