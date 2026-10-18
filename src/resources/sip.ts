import type {
  CreateSipCredentialListMappingRequest,
  CreateSipCredentialListRequest,
  CreateSipCredentialRequest,
  CreateSipDomainRequest,
  CreateSipIpAccessControlListMappingRequest,
  CreateSipIpAccessControlListRequest,
  CreateSipIpAddressRequest,
  ListSipFilteredPageParams,
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
  SipRegistration,
  SipRegistrationList,
  UpdateSipCredentialListRequest,
  UpdateSipCredentialRequest,
  UpdateSipDomainRequest,
  UpdateSipIpAccessControlListRequest,
  UpdateSipIpAddressRequest,
} from '../models/index.js';
import type { Transport } from '../transport.js';
import { paginate } from '../pagination.js';
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
 * - `client.sip.registrations` — live SIP registrations across the account's domains.
 */
export class SipResource {
  readonly domains: SipDomainsResource;
  readonly credentialLists: SipCredentialListsResource;
  readonly ipAccessControlLists: SipIpAccessControlListsResource;
  readonly registrations: SipRegistrationsResource;

  constructor(transport: Transport) {
    this.domains = new SipDomainsResource(transport);
    this.credentialLists = new SipCredentialListsResource(transport);
    this.ipAccessControlLists = new SipIpAccessControlListsResource(transport);
    this.registrations = new SipRegistrationsResource(transport);
  }
}

/** `/SIP/Registrations.json` — endpoints currently registered against the account's domains. */
export class SipRegistrationsResource extends BaseResource {
  async list(params: ListSipPageParams = {}): Promise<SipRegistrationList> {
    return this.t.request<SipRegistrationList>({
      method: 'GET',
      path: this.path('SIP', 'Registrations'),
      params,
    });
  }

  /** Lazily walk every page of `/SIP/Registrations`, following `next_page_uri`. */
  async *iterate(params: ListSipPageParams = {}): AsyncGenerator<SipRegistration, void, void> {
    yield* paginate(this.t, await this.list(params));
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

  async list(params: ListSipPageParams = {}): Promise<SipCredentialListMappingList> {
    return this.t.request<SipCredentialListMappingList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  async create(body: CreateSipCredentialListMappingRequest): Promise<SipDomainMapping> {
    return this.t.request<SipDomainMapping>({
      method: 'POST',
      path: this.root(),
      form: body,
    });
  }

  async fetch(mappingSid: string): Promise<SipDomainMapping> {
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

  async list(params: ListSipPageParams = {}): Promise<SipIpAccessControlListMappingList> {
    return this.t.request<SipIpAccessControlListMappingList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  async create(body: CreateSipIpAccessControlListMappingRequest): Promise<SipDomainMapping> {
    return this.t.request<SipDomainMapping>({
      method: 'POST',
      path: this.root(),
      form: body,
    });
  }

  async fetch(mappingSid: string): Promise<SipDomainMapping> {
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

  async list(params: ListSipFilteredPageParams = {}): Promise<SipDomainList> {
    return this.t.request<SipDomainList>({
      method: 'GET',
      path: this.path('SIP', 'Domains'),
      params,
    });
  }

  async create(body: CreateSipDomainRequest): Promise<SipDomain> {
    return this.t.request<SipDomain>({
      method: 'POST',
      path: this.path('SIP', 'Domains'),
      form: body,
    });
  }

  async fetch(domainSid: string): Promise<SipDomain> {
    return this.t.request<SipDomain>({
      method: 'GET',
      path: this.path('SIP', 'Domains', domainSid),
    });
  }

  async update(domainSid: string, body: UpdateSipDomainRequest): Promise<SipDomain> {
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

  /** Lazily walk every page of `/SIP/Domains`, following `next_page_uri`. */
  async *iterate(params: ListSipFilteredPageParams = {}): AsyncGenerator<SipDomain, void, void> {
    yield* paginate(this.t, await this.list(params));
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

  async list(params: ListSipPageParams = {}): Promise<SipCredentialListPage> {
    return this.t.request<SipCredentialListPage>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  async create(body: CreateSipCredentialRequest): Promise<SipCredential> {
    return this.t.request<SipCredential>({
      method: 'POST',
      path: this.root(),
      form: body,
    });
  }

  async fetch(credentialSid: string): Promise<SipCredential> {
    return this.t.request<SipCredential>({
      method: 'GET',
      path: this.root(credentialSid),
    });
  }

  async update(credentialSid: string, body: UpdateSipCredentialRequest): Promise<SipCredential> {
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
  async list(params: ListSipFilteredPageParams = {}): Promise<SipCredentialListList> {
    return this.t.request<SipCredentialListList>({
      method: 'GET',
      path: this.path('SIP', 'CredentialLists'),
      params,
    });
  }

  async create(body: CreateSipCredentialListRequest): Promise<SipCredentialList> {
    return this.t.request<SipCredentialList>({
      method: 'POST',
      path: this.path('SIP', 'CredentialLists'),
      form: body,
    });
  }

  async fetch(credentialListSid: string): Promise<SipCredentialList> {
    return this.t.request<SipCredentialList>({
      method: 'GET',
      path: this.path('SIP', 'CredentialLists', credentialListSid),
    });
  }

  async update(
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

  async list(params: ListSipFilteredPageParams = {}): Promise<SipIpAddressList> {
    return this.t.request<SipIpAddressList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  async create(body: CreateSipIpAddressRequest): Promise<SipIpAddress> {
    return this.t.request<SipIpAddress>({
      method: 'POST',
      path: this.root(),
      form: body,
    });
  }

  async fetch(ipAddressSid: string): Promise<SipIpAddress> {
    return this.t.request<SipIpAddress>({
      method: 'GET',
      path: this.root(ipAddressSid),
    });
  }

  async update(ipAddressSid: string, body: UpdateSipIpAddressRequest): Promise<SipIpAddress> {
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
  async list(params: ListSipFilteredPageParams = {}): Promise<SipIpAccessControlListList> {
    return this.t.request<SipIpAccessControlListList>({
      method: 'GET',
      path: this.path('SIP', 'IpAccessControlLists'),
      params,
    });
  }

  async create(body: CreateSipIpAccessControlListRequest): Promise<SipIpAccessControlList> {
    return this.t.request<SipIpAccessControlList>({
      method: 'POST',
      path: this.path('SIP', 'IpAccessControlLists'),
      form: body,
    });
  }

  async fetch(aclSid: string): Promise<SipIpAccessControlList> {
    return this.t.request<SipIpAccessControlList>({
      method: 'GET',
      path: this.path('SIP', 'IpAccessControlLists', aclSid),
    });
  }

  async update(
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
