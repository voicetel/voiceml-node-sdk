import type {
  RoutesV2PhoneNumber,
  RoutesV2SipDomain,
  UpdateRoutesV2PhoneNumberRequest,
  UpdateRoutesV2SipDomainRequest,
} from '../models/index.js';
import type { Transport } from '../transport.js';

/**
 * `client.routesV2.*` — Twilio's routes/v2 Inbound Processing Region API.
 *
 * The `/v2/` namespace sits outside the `/2010-04-01/Accounts/.../` prefix.
 * The account is resolved from HTTP Basic auth; SIP-domain paths are keyed
 * by domain name (not the SipDomain SID), phone-number paths are keyed by
 * the E.164 number (or its `PN…` sid).
 */
export class RoutesV2Resource {
  readonly sipDomains: RoutesV2SipDomainsResource;
  readonly phoneNumbers: RoutesV2PhoneNumbersResource;

  constructor(transport: Transport) {
    this.sipDomains = new RoutesV2SipDomainsResource(transport);
    this.phoneNumbers = new RoutesV2PhoneNumbersResource(transport);
  }
}

/** Operations on `/v2/SipDomains/{SipDomain}`. */
export class RoutesV2SipDomainsResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  /** Fetch a domain's Inbound Processing Region binding. */
  fetch(domainName: string): Promise<RoutesV2SipDomain> {
    return this.t.request<RoutesV2SipDomain>({
      method: 'GET',
      path: `/v2/SipDomains/${domainName}`,
    });
  }

  /** Update a domain's voice region and/or friendly name. */
  update(
    domainName: string,
    body: UpdateRoutesV2SipDomainRequest,
  ): Promise<RoutesV2SipDomain> {
    return this.t.request<RoutesV2SipDomain>({
      method: 'POST',
      path: `/v2/SipDomains/${domainName}`,
      form: body,
    });
  }
}

/** Operations on `/v2/PhoneNumbers/{PhoneNumber}`. */
export class RoutesV2PhoneNumbersResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  /** Fetch a phone number's Inbound Processing Region binding. */
  fetch(phoneNumber: string): Promise<RoutesV2PhoneNumber> {
    return this.t.request<RoutesV2PhoneNumber>({
      method: 'GET',
      path: `/v2/PhoneNumbers/${encodeURIComponent(phoneNumber)}`,
    });
  }

  /** Update a phone number's voice region and/or friendly name. */
  update(
    phoneNumber: string,
    body: UpdateRoutesV2PhoneNumberRequest,
  ): Promise<RoutesV2PhoneNumber> {
    return this.t.request<RoutesV2PhoneNumber>({
      method: 'POST',
      path: `/v2/PhoneNumbers/${encodeURIComponent(phoneNumber)}`,
      form: body,
    });
  }
}
