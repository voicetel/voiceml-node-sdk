import type {
  RoutesV2SipDomain,
  UpdateRoutesV2SipDomainRequest,
} from '../models/index.js';
import type { Transport } from '../transport.js';

/**
 * `client.routesV2.*` — Twilio's routes/v2 Inbound Processing Region API.
 *
 * The `/v2/` namespace sits outside the `/2010-04-01/Accounts/.../` prefix.
 * The account is resolved from HTTP Basic auth; paths are keyed by SIP
 * domain name (not the SipDomain SID).
 */
export class RoutesV2Resource {
  readonly sipDomains: RoutesV2SipDomainsResource;

  constructor(transport: Transport) {
    this.sipDomains = new RoutesV2SipDomainsResource(transport);
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
