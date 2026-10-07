import type { ApiErrorResponse, ApiErrorCode } from '@/src/contracts/http';

export const STATUS_CODES: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  RUN_NOT_FOUND: 404,
  AGENT_RESULT_NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

/**
 * Creates a JSON error response.
 * NEVER includes stack traces, secrets, or internal details.
 */
export function errorResponse(code: ApiErrorCode, message: string): Response {
  const body: ApiErrorResponse = { error: code, message };
  return new Response(JSON.stringify(body), {
    status: STATUS_CODES[code],
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Creates a JSON success response.
 */
export function successResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Wraps a handler in a try/catch that produces INTERNAL_ERROR on uncaught exceptions.
 * NEVER exposes the error message or stack trace to the client.
 */
export function safeErrorMessage(err: unknown): string {
  // Return a generic message — never expose internal error details
  if (err instanceof Error) {
    return `Internal error: ${err.message}`;
  }
  return 'Internal error';
}
