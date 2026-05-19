import type { Transport } from '../transport.js';

/** Mixin shared by every resource group — holds the transport + builds AccountSid-scoped paths. */
export class BaseResource {
  protected readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  /**
   * Build a URL under `/2010-04-01/Accounts/{AccountSid}/…`. Skips falsy segments.
   * Caller passes sids and slug names verbatim — Twilio sids never need URL escaping.
   */
  protected path(...parts: string[]): string {
    const tail = parts.filter(Boolean).join('/');
    return `/2010-04-01/Accounts/${this.t.accountSid}/${tail}`;
  }
}
