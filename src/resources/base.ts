import { encodePathSegment } from '../encoding.js';
import { ConfigurationError } from '../errors.js';
import type { Transport } from '../transport.js';

/** Suffix of a `/2010-04-01` route, taken from the route definition (not the segment text). */
export type RouteSuffix = '.json' | '.wav' | '';

/** Build `/2010-04-01/Accounts/{AccountSid}/<segments><suffix>`, percent-encoding every segment. */
export function accountPath(transport: Transport, segments: string[], suffix: RouteSuffix): string {
  if (!transport.hasCredentials) {
    throw new ConfigurationError(
      'this client has no credentials — pass accountSid and apiKey to call account endpoints',
    );
  }
  const tail = segments.map(encodePathSegment).join('/');
  return `/2010-04-01/Accounts/${encodePathSegment(transport.accountSid)}/${tail}${suffix}`;
}

/** Mixin shared by every resource group — holds the transport + builds AccountSid-scoped paths. */
export class BaseResource {
  protected readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  /**
   * `/2010-04-01/Accounts/{AccountSid}/<segments>.json`. Every JSON route under the 2010 API ends in
   * `.json`, so the suffix is always appended — a sid such as `Twilio.CURRENT` keeps it.
   * Every segment is percent-encoded (RFC 3986 unreserved characters pass through).
   */
  protected path(...segments: string[]): string {
    return accountPath(this.t, segments, '.json');
  }

  /** Account-scoped route with an explicit suffix (`.wav` audio, suffix-less exports). */
  protected pathWithSuffix(suffix: RouteSuffix, ...segments: string[]): string {
    return accountPath(this.t, segments, suffix);
  }
}
