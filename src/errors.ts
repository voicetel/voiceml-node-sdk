/**
 * Error hierarchy. Catch `VoiceMLError` to handle any SDK error; catch the specific subclass
 * (`AuthenticationError`, `NotFoundError`, …) when you want to branch on HTTP status family.
 *
 * The Twilio-compatible error body (`{ code, message, more_info, status }`) is parsed into `code` /
 * `message` / `moreInfo` when present, with the raw payload exposed on `body`.
 */

export class VoiceMLError extends Error {
  override readonly name: string = 'VoiceMLError';
}

export class ConfigurationError extends VoiceMLError {
  override readonly name = 'ConfigurationError';
}

export interface ApiErrorOptions {
  statusCode: number;
  code?: number | string | null;
  body?: unknown;
  moreInfo?: string | null;
  /** Underlying error this one wraps, surfaced via the standard `Error.cause`. */
  cause?: unknown;
}

export class ApiError extends VoiceMLError {
  override readonly name: string = 'ApiError';
  readonly statusCode: number;
  readonly code: number | string | null;
  readonly body: unknown;
  /** Twilio-compat `more_info` URL from the error envelope (`null` when absent). */
  readonly moreInfo: string | null;

  constructor(message: string, options: ApiErrorOptions) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.statusCode = options.statusCode;
    this.code = options.code ?? null;
    this.body = options.body ?? null;
    this.moreInfo = options.moreInfo ?? null;
  }
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
  code: number | string | null,
  body: unknown,
  message: string,
  moreInfo: string | null = null,
): ApiError {
  const opts: ApiErrorOptions = { statusCode, code, body, moreInfo };
  switch (statusCode) {
    case 400:
      return new BadRequestError(message, opts);
    case 401:
      return new AuthenticationError(message, opts);
    case 403:
      return new PermissionDeniedError(message, opts);
    case 404:
      return new NotFoundError(message, opts);
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
