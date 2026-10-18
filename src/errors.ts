/**
 * Error hierarchy. Catch `VoiceMLError` to handle any SDK error; catch the specific subclass
 * (`AuthenticationError`, `NotFoundError`, …) when you want to branch on HTTP status family.
 *
 * The Twilio-compatible error body (`{ code, message, more_info, status }`) is parsed into `code` /
 * `message` / `moreInfo` when present, with the raw payload exposed on `body`.
 *
 * Network failures and timeouts surface as {@link APIConnectionError} / {@link APITimeoutError}
 * (both `ApiError` subclasses with `statusCode: 0`); the underlying runtime error is kept on the
 * standard `Error.cause`.
 */

export class VoiceMLError extends Error {
  override readonly name: string = 'VoiceMLError';
}

/** Invalid client configuration or request arguments, raised before any network I/O. */
export class ConfigurationError extends VoiceMLError {
  override readonly name = 'ConfigurationError';
}

/**
 * Raised when a list envelope links to a next page the SDK refuses to follow — e.g. a
 * `meta.next_page_url` on a host other than the configured product host. Credentials are
 * never sent to a host the client was not configured for.
 */
export class PaginationError extends VoiceMLError {
  override readonly name = 'PaginationError';
}

export interface ApiErrorOptions {
  statusCode: number;
  code?: number | null;
  body?: unknown;
  moreInfo?: string | null;
  /** Parsed `Retry-After` header in seconds, when the response carried one. */
  retryAfter?: number | null;
  /** Underlying error this one wraps, surfaced via the standard `Error.cause`. */
  cause?: unknown;
}

export class ApiError extends VoiceMLError {
  override readonly name: string = 'ApiError';
  /** HTTP status code; `0` when no response was received (see {@link APIConnectionError}). */
  readonly statusCode: number;
  /** Numeric error code from the Twilio-compatible error envelope (`null` when absent). */
  readonly code: number | null;
  /** Raw response body: parsed JSON when the server sent JSON, the text otherwise. */
  readonly body: unknown;
  /** Twilio-compatible `more_info` URL from the error envelope (`null` when absent). */
  readonly moreInfo: string | null;
  /**
   * Seconds the server asked the client to wait (`Retry-After`, delta-seconds or HTTP-date),
   * or `null` when the response carried no parseable `Retry-After` header.
   */
  readonly retryAfter: number | null;

  constructor(message: string, options: ApiErrorOptions) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.statusCode = options.statusCode;
    this.code = options.code ?? null;
    this.body = options.body ?? null;
    this.moreInfo = options.moreInfo ?? null;
    this.retryAfter = options.retryAfter ?? null;
  }
}

/** The request could not be completed: DNS, connect, TLS, reset, or a body-read failure. */
export class APIConnectionError extends ApiError {
  override readonly name: string = 'APIConnectionError';
}

/** `timeoutMs` elapsed before the response (headers and body) was fully received. */
export class APITimeoutError extends APIConnectionError {
  override readonly name = 'APITimeoutError';
}

export class BadRequestError extends ApiError {
  override readonly name = 'BadRequestError';
}
export class AuthenticationError extends ApiError {
  override readonly name = 'AuthenticationError';
}
export class PermissionDeniedError extends ApiError {
  override readonly name = 'PermissionDeniedError';
}
export class NotFoundError extends ApiError {
  override readonly name = 'NotFoundError';
}
/** HTTP 405 — the server does not support this method on the path (code 20004). */
export class MethodNotAllowedError extends ApiError {
  override readonly name = 'MethodNotAllowedError';
}
export class ConflictError extends ApiError {
  override readonly name = 'ConflictError';
}
export class GoneError extends ApiError {
  override readonly name = 'GoneError';
}
export class RateLimitError extends ApiError {
  override readonly name = 'RateLimitError';
}
export class NotImplementedAPIError extends ApiError {
  override readonly name = 'NotImplementedAPIError';
}
export class ServerError extends ApiError {
  override readonly name = 'ServerError';
}

export function fromResponse(
  statusCode: number,
  message: string,
  options: Omit<ApiErrorOptions, 'statusCode'> = {},
): ApiError {
  const opts: ApiErrorOptions = { ...options, statusCode };
  switch (statusCode) {
    case 400:
      return new BadRequestError(message, opts);
    case 401:
      return new AuthenticationError(message, opts);
    case 403:
      return new PermissionDeniedError(message, opts);
    case 404:
      return new NotFoundError(message, opts);
    case 405:
      return new MethodNotAllowedError(message, opts);
    case 409:
      return new ConflictError(message, opts);
    case 410:
      return new GoneError(message, opts);
    case 429:
      return new RateLimitError(message, opts);
    case 501:
      return new NotImplementedAPIError(message, opts);
    default:
      if (statusCode >= 500) return new ServerError(message, opts);
      return new ApiError(message, opts);
  }
}
