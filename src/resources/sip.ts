import type {
  CreateSipCredentialListMappingRequest,
  CreateSipCredentialListRequest,
  CreateSipCredentialRequest,
  CreateSipDomainRequest,
  CreateSipIpAccessControlListMappingRequest,
  CreateSipIpAccessControlListRequest,
  CreateSipIpAddressRequest,
  ListSipPageParams,
  SipCredential,
  SipCredentialList,
  SipCredentialListList,
  SipCredentialListMappingList,
  SipCredentialListPage,
  SipDomain,
  SipDomainList,
  SipDomainMapping,
  SipIpAccessControlList,
  SipIpAccessControlListList,
  SipIpAccessControlListMappingList,
  SipIpAddress,
  SipIpAddressList,
  UpdateSipCredentialListRequest,
  UpdateSipCredentialRequest,
  UpdateSipDomainRequest,
  UpdateSipIpAccessControlListRequest,
  UpdateSipIpAddressRequest,
} from '../models/index.js';
import type { Transport } from '../transport.js';
import { BaseResource } from './base.js';

/**
 * `client.sip.*` — the Twilio-compatible SIP Trunking surface.
 *
 * Three top-level sub-resources hang off `client.sip`:
 *
 * - `client.sip.domains` — SIP ingress endpoints (`SD…`) with voice URL handlers.
 *   Domain ↔ ACL / CredentialList bindings live under `client.sip.domains.*Mappings`
 *   (historical aliases) or `client.sip.domains.auth.{calls,registrations}.*Mappings`
 *   (modern namespace). All four bind paths round-trip the same shape.
 * - `client.sip.credentialLists` — named bags of SIP-digest credentials (`CL…`).
 *   Per-list credentials live under `credentialLists.credentials(clSid)`.
 * - `client.sip.ipAccessControlLists` — named bags of CIDR-bound IPs (`AL…`).
 *   Per-list IP entries live under `ipAccessControlLists.ipAddresses(aclSid)`.
 */
export class SipResource {
  readonly domains: SipDomainsResource;
  readonly credentialLists: SipCredentialListsResource;
  readonly ipAccessControlLists: SipIpAccessControlListsResource;

  constructor(transport: Transport) {
    this.domains = new SipDomainsResource(transport);
    this.credentialLists = new SipCredentialListsResource(transport);
    this.ipAccessControlLists = new SipIpAccessControlListsResource(transport);
  }
}

// ---------------------------------------------------------------------------
// Per-domain mapping helpers — instantiated by the factory methods below.
// ---------------------------------------------------------------------------

/** Mappings under `/SIP/Domains/{Sid}/[Auth/{Calls,Registrations}/]CredentialListMappings`. */
export class SipDomainCredentialListMappingsResource extends BaseResource {
  private readonly domainSid: string;
  private readonly authSegment?: 'Calls' | 'Registrations';

  constructor(t: Transport, domainSid: string, authSegment?: 'Calls' | 'Registrations') {
    super(t);
    this.domainSid = domainSid;
    this.authSegment = authSegment;
  }

  private root(tail?: string): string {
    return this.authSegment
      ? this.path('SIP', 'Domains', this.domainSid, 'Auth', this.authSegment,
          'CredentialListMappings', ...(tail ? [tail] : []))
      : this.path('SIP', 'Domains', this.domainSid,
          'CredentialListMappings', ...(tail ? [tail] : []));
  }

  list(params: ListSipPageParams = {}): Promise<SipCredentialListMappingList> {
    return this.t.request<SipCredentialListMappingList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  create(body: CreateSipCredentialListMappingRequest): Promise<SipDomainMapping> {
    return this.t.request<SipDomainMapping>({
      method: 'POST',
      path: this.root(),
      form: body,
    });
  }

  fetch(mappingSid: string): Promise<SipDomainMapping> {
    return this.t.request<SipDomainMapping>({
      method: 'GET',
      path: this.root(mappingSid),
    });
  }

  async delete(mappingSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.root(mappingSid),
    });
  }
}

/** Mappings under `/SIP/Domains/{Sid}/[Auth/Calls/]IpAccessControlListMappings`. */
export class SipDomainIpAccessControlListMappingsResource extends BaseResource {
  private readonly domainSid: string;
  private readonly authSegment?: 'Calls';

  constructor(t: Transport, domainSid: string, authSegment?: 'Calls') {
    super(t);
    this.domainSid = domainSid;
    this.authSegment = authSegment;
  }

  private root(tail?: string): string {
    return this.authSegment
      ? this.path('SIP', 'Domains', this.domainSid, 'Auth', this.authSegment,
          'IpAccessControlListMappings', ...(tail ? [tail] : []))
      : this.path('SIP', 'Domains', this.domainSid,
          'IpAccessControlListMappings', ...(tail ? [tail] : []));
  }

  list(params: ListSipPageParams = {}): Promise<SipIpAccessControlListMappingList> {
    return this.t.request<SipIpAccessControlListMappingList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  create(body: CreateSipIpAccessControlListMappingRequest): Promise<SipDomainMapping> {
    return this.t.request<SipDomainMapping>({
      method: 'POST',
      path: this.root(),
      form: body,
    });
  }

  fetch(mappingSid: string): Promise<SipDomainMapping> {
    return this.t.request<SipDomainMapping>({
      method: 'GET',
      path: this.root(mappingSid),
    });
  }

  async delete(mappingSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.root(mappingSid),
    });
  }
}

// ---------------------------------------------------------------------------
// Domain auth namespace holders
// ---------------------------------------------------------------------------

export class SipDomainAuthCallsResource {
  constructor(private readonly transport: Transport) {}

  credentialListMappings(domainSid: string): SipDomainCredentialListMappingsResource {
    return new SipDomainCredentialListMappingsResource(this.transport, domainSid, 'Calls');
  }

  ipAccessControlListMappings(domainSid: string): SipDomainIpAccessControlListMappingsResource {
    return new SipDomainIpAccessControlListMappingsResource(this.transport, domainSid, 'Calls');
  }
}

export class SipDomainAuthRegistrationsResource {
  constructor(private readonly transport: Transport) {}

  credentialListMappings(domainSid: string): SipDomainCredentialListMappingsResource {
    return new SipDomainCredentialListMappingsResource(
      this.transport,
      domainSid,
      'Registrations',
    );
  }
}

export class SipDomainAuthResource {
  readonly calls: SipDomainAuthCallsResource;
  readonly registrations: SipDomainAuthRegistrationsResource;

  constructor(transport: Transport) {
    this.calls = new SipDomainAuthCallsResource(transport);
    this.registrations = new SipDomainAuthRegistrationsResource(transport);
  }
}

// ---------------------------------------------------------------------------
// SipDomains top-level resource
// ---------------------------------------------------------------------------

export class SipDomainsResource extends BaseResource {
  readonly auth: SipDomainAuthResource;

  constructor(transport: Transport) {
    super(transport);
    this.auth = new SipDomainAuthResource(transport);
  }

  list(params: ListSipPageParams = {}): Promise<SipDomainList> {
    return this.t.request<SipDomainList>({
      method: 'GET',
      path: this.path('SIP', 'Domains'),
      params,
    });
  }

  create(body: CreateSipDomainRequest): Promise<SipDomain> {
    return this.t.request<SipDomain>({
      method: 'POST',
      path: this.path('SIP', 'Domains'),
      form: body,
    });
  }

  fetch(domainSid: string): Promise<SipDomain> {
    return this.t.request<SipDomain>({
      method: 'GET',
      path: this.path('SIP', 'Domains', domainSid),
    });
  }

  update(domainSid: string, body: UpdateSipDomainRequest): Promise<SipDomain> {
    return this.t.request<SipDomain>({
      method: 'POST',
      path: this.path('SIP', 'Domains', domainSid),
      form: body,
    });
  }

  async delete(domainSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.path('SIP', 'Domains', domainSid),
    });
  }

  /** Walk every page of `/SIP/Domains` and yield individual records. */
  async *iterate(params: ListSipPageParams = {}): AsyncGenerator<SipDomain, void, void> {
    let page = params.Page ?? 0;
    while (true) {
      const chunk = await this.list({ ...params, Page: page });
      for (const item of chunk.domains) yield item;
      if (!chunk.next_page_uri || chunk.domains.length === 0) return;
      page += 1;
    }
  }

  credentialListMappings(domainSid: string): SipDomainCredentialListMappingsResource {
    return new SipDomainCredentialListMappingsResource(this.t, domainSid);
  }

  ipAccessControlListMappings(domainSid: string): SipDomainIpAccessControlListMappingsResource {
    return new SipDomainIpAccessControlListMappingsResource(this.t, domainSid);
  }
}

// ---------------------------------------------------------------------------
// SipCredentialLists + nested credentials
// ---------------------------------------------------------------------------

export class SipCredentialsResource extends BaseResource {
  private readonly clSid: string;

  constructor(t: Transport, credentialListSid: string) {
    super(t);
    this.clSid = credentialListSid;
  }

  private root(tail?: string): string {
    return this.path('SIP', 'CredentialLists', this.clSid,
      'Credentials', ...(tail ? [tail] : []));
  }

  list(params: ListSipPageParams = {}): Promise<SipCredentialListPage> {
    return this.t.request<SipCredentialListPage>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  create(body: CreateSipCredentialRequest): Promise<SipCredential> {
    return this.t.request<SipCredential>({
      method: 'POST',
      path: this.root(),
      form: body,
    });
  }

  fetch(credentialSid: string): Promise<SipCredential> {
    return this.t.request<SipCredential>({
      method: 'GET',
      path: this.root(credentialSid),
    });
  }

  update(credentialSid: string, body: UpdateSipCredentialRequest): Promise<SipCredential> {
    return this.t.request<SipCredential>({
      method: 'POST',
      path: this.root(credentialSid),
      form: body,
    });
  }

  async delete(credentialSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.root(credentialSid),
    });
  }
}

export class SipCredentialListsResource extends BaseResource {
  list(params: ListSipPageParams = {}): Promise<SipCredentialListList> {
    return this.t.request<SipCredentialListList>({
      method: 'GET',
      path: this.path('SIP', 'CredentialLists'),
      params,
    });
  }

  create(body: CreateSipCredentialListRequest): Promise<SipCredentialList> {
    return this.t.request<SipCredentialList>({
      method: 'POST',
      path: this.path('SIP', 'CredentialLists'),
      form: body,
    });
  }

  fetch(credentialListSid: string): Promise<SipCredentialList> {
    return this.t.request<SipCredentialList>({
      method: 'GET',
      path: this.path('SIP', 'CredentialLists', credentialListSid),
    });
  }

  update(
    credentialListSid: string,
    body: UpdateSipCredentialListRequest,
  ): Promise<SipCredentialList> {
    return this.t.request<SipCredentialList>({
      method: 'POST',
      path: this.path('SIP', 'CredentialLists', credentialListSid),
      form: body,
    });
  }

  async delete(credentialListSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.path('SIP', 'CredentialLists', credentialListSid),
    });
  }

  credentials(credentialListSid: string): SipCredentialsResource {
    return new SipCredentialsResource(this.t, credentialListSid);
  }
}

// ---------------------------------------------------------------------------
// SipIpAccessControlLists + nested ip_addresses
// ---------------------------------------------------------------------------

export class SipIpAddressesResource extends BaseResource {
  private readonly aclSid: string;

  constructor(t: Transport, ipAccessControlListSid: string) {
    super(t);
    this.aclSid = ipAccessControlListSid;
  }

  private root(tail?: string): string {
    return this.path('SIP', 'IpAccessControlLists', this.aclSid,
      'IpAddresses', ...(tail ? [tail] : []));
  }

  list(params: ListSipPageParams = {}): Promise<SipIpAddressList> {
    return this.t.request<SipIpAddressList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  create(body: CreateSipIpAddressRequest): Promise<SipIpAddress> {
    return this.t.request<SipIpAddress>({
      method: 'POST',
      path: this.root(),
      form: body,
    });
  }

  fetch(ipAddressSid: string): Promise<SipIpAddress> {
    return this.t.request<SipIpAddress>({
      method: 'GET',
      path: this.root(ipAddressSid),
    });
  }

  update(ipAddressSid: string, body: UpdateSipIpAddressRequest): Promise<SipIpAddress> {
    return this.t.request<SipIpAddress>({
      method: 'POST',
      path: this.root(ipAddressSid),
      form: body,
    });
  }

  async delete(ipAddressSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.root(ipAddressSid),
    });
  }
}

export class SipIpAccessControlListsResource extends BaseResource {
  list(params: ListSipPageParams = {}): Promise<SipIpAccessControlListList> {
    return this.t.request<SipIpAccessControlListList>({
      method: 'GET',
      path: this.path('SIP', 'IpAccessControlLists'),
      params,
    });
  }

  create(body: CreateSipIpAccessControlListRequest): Promise<SipIpAccessControlList> {
    return this.t.request<SipIpAccessControlList>({
      method: 'POST',
      path: this.path('SIP', 'IpAccessControlLists'),
      form: body,
    });
  }

  fetch(aclSid: string): Promise<SipIpAccessControlList> {
    return this.t.request<SipIpAccessControlList>({
      method: 'GET',
      path: this.path('SIP', 'IpAccessControlLists', aclSid),
    });
  }

  update(
    aclSid: string,
    body: UpdateSipIpAccessControlListRequest,
  ): Promise<SipIpAccessControlList> {
    return this.t.request<SipIpAccessControlList>({
      method: 'POST',
      path: this.path('SIP', 'IpAccessControlLists', aclSid),
      form: body,
    });
  }

  async delete(aclSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.path('SIP', 'IpAccessControlLists', aclSid),
    });
  }

  ipAddresses(aclSid: string): SipIpAddressesResource {
    return new SipIpAddressesResource(this.t, aclSid);
  }
}
