/**
 * Official TypeScript/Node SDK for the VoiceML REST API.
 *
 * VoiceML is VoiceTel's outbound voice + AMD service with a Twilio-compatible REST surface
 * (`https://voiceml.voicetel.com`). The wire format, auth model, error codes, and
 * pagination envelope match Twilio's documented Programmable Voice surface — existing
 * Twilio Node SDK patterns map across with the same constructor shape.
 */

export { Client, type ClientOptions } from './client.js';
export type { TransportOptions, RequestOptions } from './transport.js';
export { Transport } from './transport.js';
export { resolveProductBaseUrls, type ProductBaseUrls } from './hosts.js';
export {
  ApiError,
  AuthenticationError,
  BadRequestError,
  ConfigurationError,
  ConflictError,
  GoneError,
  NotFoundError,
  NotImplementedAPIError,
  PermissionDeniedError,
  RateLimitError,
  ServerError,
  VoiceMLError,
} from './errors.js';
export * from './models/index.js';
export { VERSION } from './version.js';
