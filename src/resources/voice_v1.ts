import type {
  CreateVoiceV1ByocTrunkRequest,
  CreateVoiceV1ConnectionPolicyRequest,
  CreateVoiceV1ConnectionPolicyTargetRequest,
  CreateVoiceV1IpRecordRequest,
  CreateVoiceV1SourceIpMappingRequest,
  ListVoiceV1PageParams,
  UpdateVoiceV1ByocTrunkRequest,
  UpdateVoiceV1ConnectionPolicyRequest,
  UpdateVoiceV1ConnectionPolicyTargetRequest,
  UpdateVoiceV1DialingPermissionsSettingsRequest,
  UpdateVoiceV1IpRecordRequest,
  UpdateVoiceV1SourceIpMappingRequest,
  VoiceV1ByocTrunk,
  VoiceV1ByocTrunkList,
  VoiceV1ConnectionPolicy,
  VoiceV1ConnectionPolicyList,
  VoiceV1ConnectionPolicyTarget,
  VoiceV1ConnectionPolicyTargetList,
  VoiceV1DialingPermissionsSettings,
  VoiceV1IpRecord,
  VoiceV1IpRecordList,
  VoiceV1SourceIpMapping,
  VoiceV1SourceIpMappingList,
} from '../models/index.js';
import type { Transport } from '../transport.js';

/**
 * `client.voiceV1.*` — Twilio Voice v1 surface.
 *
 * The `/v1/` namespace sits outside the `/2010-04-01/Accounts/.../` prefix.
 * The account is resolved from HTTP Basic auth.
 */
export class VoiceV1Resource {
  readonly byocTrunks: VoiceV1ByocTrunksResource;
  /**
   * Callable: `connectionPolicies(sid)` returns a per-policy scope carrying
   * `.targets.*` and fetch/update/delete helpers. Also exposes flat CRUD
   * methods directly: `.list()`, `.create(body)`, `.fetch(sid)`, etc.
   */
  readonly connectionPolicies: VoiceV1ConnectionPoliciesCallable;
  readonly settings: VoiceV1SettingsResource;
  readonly sourceIpMappings: VoiceV1SourceIpMappingsResource;
  readonly ipRecords: VoiceV1IpRecordsResource;

  constructor(transport: Transport) {
    this.byocTrunks = new VoiceV1ByocTrunksResource(transport);
    this.connectionPolicies = makeConnectionPoliciesCallable(transport);
    this.settings = new VoiceV1SettingsResource(transport);
    this.sourceIpMappings = new VoiceV1SourceIpMappingsResource(transport);
    this.ipRecords = new VoiceV1IpRecordsResource(transport);
  }
}

// ---------------------------------------------------------------------------
// IpRecords — /v1/IpRecords
// ---------------------------------------------------------------------------

export class VoiceV1IpRecordsResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  list(params: ListVoiceV1PageParams = {}): Promise<VoiceV1IpRecordList> {
    return this.t.request<VoiceV1IpRecordList>({
      method: 'GET',
      path: '/v1/IpRecords',
      params,
    });
  }

  create(body: CreateVoiceV1IpRecordRequest): Promise<VoiceV1IpRecord> {
    return this.t.request<VoiceV1IpRecord>({
      method: 'POST',
      path: '/v1/IpRecords',
      form: body,
    });
  }

  fetch(sid: string): Promise<VoiceV1IpRecord> {
    return this.t.request<VoiceV1IpRecord>({
      method: 'GET',
      path: `/v1/IpRecords/${sid}`,
    });
  }

  update(sid: string, body: UpdateVoiceV1IpRecordRequest): Promise<VoiceV1IpRecord> {
    return this.t.request<VoiceV1IpRecord>({
      method: 'POST',
      path: `/v1/IpRecords/${sid}`,
      form: body,
    });
  }

  async delete(sid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: `/v1/IpRecords/${sid}`,
    });
  }
}

// ---------------------------------------------------------------------------
// SourceIpMappings — /v1/SourceIpMappings
// ---------------------------------------------------------------------------

export class VoiceV1SourceIpMappingsResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  list(params: ListVoiceV1PageParams = {}): Promise<VoiceV1SourceIpMappingList> {
    return this.t.request<VoiceV1SourceIpMappingList>({
      method: 'GET',
      path: '/v1/SourceIpMappings',
      params,
    });
  }

  create(body: CreateVoiceV1SourceIpMappingRequest): Promise<VoiceV1SourceIpMapping> {
    return this.t.request<VoiceV1SourceIpMapping>({
      method: 'POST',
      path: '/v1/SourceIpMappings',
      form: body,
    });
  }

  fetch(sid: string): Promise<VoiceV1SourceIpMapping> {
    return this.t.request<VoiceV1SourceIpMapping>({
      method: 'GET',
      path: `/v1/SourceIpMappings/${sid}`,
    });
  }

  update(
    sid: string,
    body: UpdateVoiceV1SourceIpMappingRequest,
  ): Promise<VoiceV1SourceIpMapping> {
    return this.t.request<VoiceV1SourceIpMapping>({
      method: 'POST',
      path: `/v1/SourceIpMappings/${sid}`,
      form: body,
    });
  }

  async delete(sid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: `/v1/SourceIpMappings/${sid}`,
    });
  }
}

// ---------------------------------------------------------------------------
// ByocTrunks — /v1/ByocTrunks
// ---------------------------------------------------------------------------

export class VoiceV1ByocTrunksResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  list(params: ListVoiceV1PageParams = {}): Promise<VoiceV1ByocTrunkList> {
    return this.t.request<VoiceV1ByocTrunkList>({
      method: 'GET',
      path: '/v1/ByocTrunks',
      params,
    });
  }

  create(body: CreateVoiceV1ByocTrunkRequest): Promise<VoiceV1ByocTrunk> {
    return this.t.request<VoiceV1ByocTrunk>({
      method: 'POST',
      path: '/v1/ByocTrunks',
      form: body,
    });
  }

  fetch(sid: string): Promise<VoiceV1ByocTrunk> {
    return this.t.request<VoiceV1ByocTrunk>({
      method: 'GET',
      path: `/v1/ByocTrunks/${sid}`,
    });
  }

  update(sid: string, body: UpdateVoiceV1ByocTrunkRequest): Promise<VoiceV1ByocTrunk> {
    return this.t.request<VoiceV1ByocTrunk>({
      method: 'POST',
      path: `/v1/ByocTrunks/${sid}`,
      form: body,
    });
  }

  async delete(sid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: `/v1/ByocTrunks/${sid}`,
    });
  }
}

// ---------------------------------------------------------------------------
// ConnectionPolicies + nested Targets — /v1/ConnectionPolicies[/{Sid}/Targets]
// ---------------------------------------------------------------------------

export class VoiceV1ConnectionPolicyTargetsResource {
  private readonly t: Transport;
  private readonly policySid: string;

  constructor(transport: Transport, policySid: string) {
    this.t = transport;
    this.policySid = policySid;
  }

  private root(tail?: string): string {
    const base = `/v1/ConnectionPolicies/${this.policySid}/Targets`;
    return tail ? `${base}/${tail}` : base;
  }

  list(params: ListVoiceV1PageParams = {}): Promise<VoiceV1ConnectionPolicyTargetList> {
    return this.t.request<VoiceV1ConnectionPolicyTargetList>({
      method: 'GET',
      path: this.root(),
      params,
    });
  }

  create(
    body: CreateVoiceV1ConnectionPolicyTargetRequest,
  ): Promise<VoiceV1ConnectionPolicyTarget> {
    return this.t.request<VoiceV1ConnectionPolicyTarget>({
      method: 'POST',
      path: this.root(),
      form: body,
    });
  }

  fetch(targetSid: string): Promise<VoiceV1ConnectionPolicyTarget> {
    return this.t.request<VoiceV1ConnectionPolicyTarget>({
      method: 'GET',
      path: this.root(targetSid),
    });
  }

  update(
    targetSid: string,
    body: UpdateVoiceV1ConnectionPolicyTargetRequest,
  ): Promise<VoiceV1ConnectionPolicyTarget> {
    return this.t.request<VoiceV1ConnectionPolicyTarget>({
      method: 'POST',
      path: this.root(targetSid),
      form: body,
    });
  }

  async delete(targetSid: string): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: this.root(targetSid),
    });
  }
}

/**
 * Per-policy facade returned by `connectionPolicies(sid)`. Exposes the nested
 * `.targets.*` sub-resource plus single-record CRUD helpers scoped to that
 * policy sid.
 */
export class VoiceV1ConnectionPolicyScoped {
  readonly targets: VoiceV1ConnectionPolicyTargetsResource;
  private readonly t: Transport;
  private readonly sid: string;

  constructor(transport: Transport, sid: string) {
    this.t = transport;
    this.sid = sid;
    this.targets = new VoiceV1ConnectionPolicyTargetsResource(transport, sid);
  }

  fetch(): Promise<VoiceV1ConnectionPolicy> {
    return this.t.request<VoiceV1ConnectionPolicy>({
      method: 'GET',
      path: `/v1/ConnectionPolicies/${this.sid}`,
    });
  }

  update(
    body: UpdateVoiceV1ConnectionPolicyRequest,
  ): Promise<VoiceV1ConnectionPolicy> {
    return this.t.request<VoiceV1ConnectionPolicy>({
      method: 'POST',
      path: `/v1/ConnectionPolicies/${this.sid}`,
      form: body,
    });
  }

  async delete(): Promise<void> {
    await this.t.request<void>({
      method: 'DELETE',
      path: `/v1/ConnectionPolicies/${this.sid}`,
    });
  }
}

/**
 * The shape of `client.voiceV1.connectionPolicies`:
 *
 * - **Callable**: `connectionPolicies(sid)` returns a {@link VoiceV1ConnectionPolicyScoped}
 *   carrying `.targets.*` + per-policy `.fetch()/.update()/.delete()`.
 * - **Methods**: `.list(params?)` and `.create(body)` for the unscoped collection.
 */
export type VoiceV1ConnectionPoliciesCallable = ((
  sid: string,
) => VoiceV1ConnectionPolicyScoped) & {
  list(params?: ListVoiceV1PageParams): Promise<VoiceV1ConnectionPolicyList>;
  create(
    body: CreateVoiceV1ConnectionPolicyRequest,
  ): Promise<VoiceV1ConnectionPolicy>;
  /** Equivalent to `connectionPolicies(sid).fetch()`. */
  fetch(sid: string): Promise<VoiceV1ConnectionPolicy>;
  /** Equivalent to `connectionPolicies(sid).update(body)`. */
  update(
    sid: string,
    body: UpdateVoiceV1ConnectionPolicyRequest,
  ): Promise<VoiceV1ConnectionPolicy>;
  /** Equivalent to `connectionPolicies(sid).delete()`. */
  delete(sid: string): Promise<void>;
};

function makeConnectionPoliciesCallable(
  transport: Transport,
): VoiceV1ConnectionPoliciesCallable {
  const fn = ((sid: string) =>
    new VoiceV1ConnectionPolicyScoped(transport, sid)) as VoiceV1ConnectionPoliciesCallable;

  fn.list = (params: ListVoiceV1PageParams = {}) =>
    transport.request<VoiceV1ConnectionPolicyList>({
      method: 'GET',
      path: '/v1/ConnectionPolicies',
      params,
    });

  fn.create = (body: CreateVoiceV1ConnectionPolicyRequest) =>
    transport.request<VoiceV1ConnectionPolicy>({
      method: 'POST',
      path: '/v1/ConnectionPolicies',
      form: body,
    });

  fn.fetch = (sid: string) =>
    transport.request<VoiceV1ConnectionPolicy>({
      method: 'GET',
      path: `/v1/ConnectionPolicies/${sid}`,
    });

  fn.update = (sid: string, body: UpdateVoiceV1ConnectionPolicyRequest) =>
    transport.request<VoiceV1ConnectionPolicy>({
      method: 'POST',
      path: `/v1/ConnectionPolicies/${sid}`,
      form: body,
    });

  fn.delete = async (sid: string) => {
    await transport.request<void>({
      method: 'DELETE',
      path: `/v1/ConnectionPolicies/${sid}`,
    });
  };

  return fn;
}

// ---------------------------------------------------------------------------
// DialingPermissions Settings — /v1/Settings
// ---------------------------------------------------------------------------

export class VoiceV1SettingsResource {
  private readonly t: Transport;

  constructor(transport: Transport) {
    this.t = transport;
  }

  fetch(): Promise<VoiceV1DialingPermissionsSettings> {
    return this.t.request<VoiceV1DialingPermissionsSettings>({
      method: 'GET',
      path: '/v1/Settings',
    });
  }

  update(
    body: UpdateVoiceV1DialingPermissionsSettingsRequest,
  ): Promise<VoiceV1DialingPermissionsSettings> {
    return this.t.request<VoiceV1DialingPermissionsSettings>({
      method: 'POST',
      path: '/v1/Settings',
      form: body,
    });
  }
}
