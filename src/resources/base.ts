import type { Transport } from '../transport.js';

/** Mixin shared by every resource group — holds the transport + builds AccountSid-scoped paths. */
export class BaseResource {
  protected readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  /**
   * Build a URL under `/2010-04-01/Accounts/{AccountSid}/…` and append the canonical
   * Twilio `.json` suffix to the final path segment. Skips falsy segments.
   *
   * The suffix is omitted when the final segment already carries a recognized media
   * extension (`.wav`/`.json`/`.yaml`/`.yml`) — callers that need a different shape
   * (e.g. `recordings.getAudio()` for `.wav` audio) build the URL themselves.
   *
   * Caller passes sids and slug names verbatim — Twilio sids never need URL escaping.
   */
  protected path(...parts: string[]): string {
    const tail = parts.filter(Boolean).join('/');
    const base = `/2010-04-01/Accounts/${this.t.accountSid}/${tail}`;
    return hasMediaSuffix(base) ? base : `${base}.json`;
  }
}

const MEDIA_SUFFIXES = ['.json', '.wav', '.yaml', '.yml'];

function hasMediaSuffix(url: string): boolean {
  return MEDIA_SUFFIXES.some((ext) => url.endsWith(ext));
}
