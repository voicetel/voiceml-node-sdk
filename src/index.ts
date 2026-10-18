/**
 * Official TypeScript/Node SDK for the VoiceML REST API.
 *
 * VoiceML is VoiceTel's voice, messaging and answering-machine-detection service with a
 * Twilio-compatible REST API (`https://voiceml.voicetel.com`). Requests authenticate with
 * your AccountSid and VoiceML API key over HTTP Basic, in the same positions Twilio SDKs use.
 */

export { Client, type ClientOptions } from './client.js';
export type {
  BinaryRequestOptions,
  BinaryResponse,
  HttpVerb,
  RequestOptions,
  TransportOptions,
} from './transport.js';
export {
  DEFAULT_BASE_URL,
  DEFAULT_MAX_RETRIES,
  DEFAULT_TIMEOUT_MS,
  MAX_RETRY_AFTER_SECONDS,
  Transport,
  parseRetryAfter,
} from './transport.js';
export { resolveProductBaseUrls, type ProductBaseUrls } from './hosts.js';
export {
  encodePathSegment,
  type JsonObject,
  type JsonValue,
} from './encoding.js';
export { nextPageLink, type PageItem } from './pagination.js';
export {
  computeSignature,
  RequestValidator,
  validateRequest,
  type WebhookParams,
} from './webhooks.js';
export {
  ApiError,
  APIConnectionError,
  APITimeoutError,
  AuthenticationError,
  BadRequestError,
  ConfigurationError,
  ConflictError,
  GoneError,
  MethodNotAllowedError,
  NotFoundError,
  NotImplementedAPIError,
  PaginationError,
  PermissionDeniedError,
  RateLimitError,
  ServerError,
  VoiceMLError,
  type ApiErrorOptions,
} from './errors.js';
export * from './models/index.js';
export * from './resources/index.js';
export { VERSION } from './version.js';
