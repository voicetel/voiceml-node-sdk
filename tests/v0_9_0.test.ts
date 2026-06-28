/**
 * Wire-shape tests for the v0.9.0 surface:
 *
 *   - Routes V2 /v2/PhoneNumbers/{PhoneNumber}
 *   - Voice V1 /v1/ByocTrunks, /v1/ConnectionPolicies[/{Sid}/Targets],
 *     /v1/Settings, /v1/SourceIpMappings, /v1/IpRecords
 *   - Conversations V1 — the full 15-resource surface under /v1/.
 *
 * Uses a stub `fetch` to intercept calls. Validates URL shape, method,
 * absence of the account-prefix, and form-body content where relevant.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { Client } from '../src/index.js';

const ACCOUNT_SID = 'AC' + 'f'.repeat(32);
const API_KEY = 'secret-key-1234';
const BASE = 'https://voiceml.voicetel.com';

// SID fixtures
const QQ_SID = 'QQ' + '0'.repeat(32);
const PHONE = '+18005551234';
const IL_SID = 'IL' + '1'.repeat(32);
const IB_SID = 'IB' + '2'.repeat(32);
const BY_SID = 'BY' + '3'.repeat(32);
const NY_SID = 'NY' + '4'.repeat(32);
const NE_SID = 'NE' + '5'.repeat(32);
const SD_SID = 'SD' + '6'.repeat(32);
const CH_SID = 'CH' + '7'.repeat(32);
const IM_SID = 'IM' + '8'.repeat(32);
const MB_SID = 'MB' + '9'.repeat(32);
const WH_SID = 'WH' + 'a'.repeat(32);
const RL_SID = 'RL' + 'b'.repeat(32);
const US_SID = 'US' + 'c'.repeat(32);
const CR_SID = 'CR' + 'd'.repeat(32);
const IG_SID = 'IG' + 'e'.repeat(32);
const IS_SID = 'IS' + '0'.repeat(32);
const DY_SID = 'DY' + '1'.repeat(32);

interface CapturedCall {
  url: string;
  init: RequestInit;
}

function fakeFetch(responses: Array<Response>): {
  fetch: typeof fetch;
  calls: CapturedCall[];
} {
  const calls: CapturedCall[] = [];
  let i = 0;
  const fn = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    calls.push({ url, init });
    const next = responses[i++];
    if (!next) throw new Error(`fakeFetch: out of responses (${i - 1} consumed)`);
    return next;
  });
  return { fetch: fn as unknown as typeof fetch, calls };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function noContentResponse(): Response {
  return new Response(null, { status: 204 });
}

function metaEnvelope(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    first_page_url: null,
    next_page_url: null,
    previous_page_url: null,
    url: null,
    page: 0,
    page_size: 50,
    key: null,
    ...extra,
  };
}

afterEach(() => vi.restoreAllMocks());

// ===========================================================================
// Routes V2 — PhoneNumbers
// ===========================================================================

describe('Routes V2 Phone Numbers', () => {
  function payload() {
    return {
      sid: QQ_SID,
      phone_number: PHONE,
      account_sid: ACCOUNT_SID,
      friendly_name: 'sales line',
      voice_region: 'us1',
      url: `${BASE}/v2/PhoneNumbers/${encodeURIComponent(PHONE)}`,
      date_created: '2026-06-17T20:00:00Z',
      date_updated: '2026-06-17T20:00:00Z',
    };
  }

  it('is wired on the client', () => {
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY });
    expect(c.routesV2.phoneNumbers).toBeDefined();
  });

  it('fetch routes to /v2/PhoneNumbers/{number} with no account prefix', async () => {
    const { fetch, calls } = fakeFetch([jsonResponse(payload())]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const r = await c.routesV2.phoneNumbers.fetch(PHONE);
    expect(r.sid).toBe(QQ_SID);
    expect(r.voice_region).toBe('us1');
    expect(calls[0].url).toContain(`/v2/PhoneNumbers/`);
    expect(calls[0].url).not.toContain(ACCOUNT_SID);
    expect(calls[0].init.method).toBe('GET');
  });

  it('update sends VoiceRegion as form body', async () => {
    const { fetch, calls } = fakeFetch([jsonResponse(payload())]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.routesV2.phoneNumbers.update(PHONE, { VoiceRegion: 'ie1' });
    const body = calls[0].init.body as URLSearchParams;
    expect(body.get('VoiceRegion')).toBe('ie1');
    expect(calls[0].init.method).toBe('POST');
  });
});

// ===========================================================================
// Voice V1 — IpRecords
// ===========================================================================

describe('Voice V1 IpRecords', () => {
  const REC = {
    account_sid: ACCOUNT_SID,
    sid: IL_SID,
    friendly_name: 'edge-1',
    ip_address: '203.0.113.10',
    cidr_prefix_length: 32,
    date_created: '2026-06-27T10:00:00Z',
    date_updated: '2026-06-27T10:00:00Z',
    url: `${BASE}/v1/IpRecords/${IL_SID}`,
  };

  it('is wired and lists with /v1/IpRecords (no account prefix)', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ ip_records: [REC], meta: metaEnvelope() }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    expect(c.voiceV1.ipRecords).toBeDefined();
    const page = await c.voiceV1.ipRecords.list();
    expect(page.ip_records[0].sid).toBe(IL_SID);
    expect(page.meta.page).toBe(0);
    expect(calls[0].url).toBe(`${BASE}/v1/IpRecords`);
    expect(calls[0].url).not.toContain(ACCOUNT_SID);
  });

  it('create sends form body, fetch/update/delete hit /{sid}', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse(REC, 201),
      jsonResponse(REC),
      jsonResponse(REC),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.voiceV1.ipRecords.create({ IpAddress: '203.0.113.10', FriendlyName: 'a' });
    const body = calls[0].init.body as URLSearchParams;
    expect(body.get('IpAddress')).toBe('203.0.113.10');
    expect(body.get('FriendlyName')).toBe('a');

    await c.voiceV1.ipRecords.fetch(IL_SID);
    expect(calls[1].url).toBe(`${BASE}/v1/IpRecords/${IL_SID}`);
    expect(calls[1].init.method).toBe('GET');

    await c.voiceV1.ipRecords.update(IL_SID, { FriendlyName: 'b' });
    expect(calls[2].init.method).toBe('POST');

    await c.voiceV1.ipRecords.delete(IL_SID);
    expect(calls[3].init.method).toBe('DELETE');
  });
});

// ===========================================================================
// Voice V1 — SourceIpMappings
// ===========================================================================

describe('Voice V1 SourceIpMappings', () => {
  const MAP = {
    sid: IB_SID,
    ip_record_sid: IL_SID,
    sip_domain_sid: SD_SID,
    date_created: '2026-06-27T10:00:00Z',
    date_updated: '2026-06-27T10:00:00Z',
    url: `${BASE}/v1/SourceIpMappings/${IB_SID}`,
  };

  it('CRUD reaches /v1/SourceIpMappings*', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ source_ip_mappings: [MAP], meta: metaEnvelope() }),
      jsonResponse(MAP, 201),
      jsonResponse(MAP),
      jsonResponse(MAP),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.voiceV1.sourceIpMappings.list();
    expect(calls[0].url).toBe(`${BASE}/v1/SourceIpMappings`);
    await c.voiceV1.sourceIpMappings.create({
      IpRecordSid: IL_SID,
      SipDomainSid: SD_SID,
    });
    const body = calls[1].init.body as URLSearchParams;
    expect(body.get('IpRecordSid')).toBe(IL_SID);
    expect(body.get('SipDomainSid')).toBe(SD_SID);
    await c.voiceV1.sourceIpMappings.fetch(IB_SID);
    expect(calls[2].url).toBe(`${BASE}/v1/SourceIpMappings/${IB_SID}`);
    await c.voiceV1.sourceIpMappings.update(IB_SID, { SipDomainSid: SD_SID });
    await c.voiceV1.sourceIpMappings.delete(IB_SID);
    expect(calls[4].init.method).toBe('DELETE');
  });
});

// ===========================================================================
// Voice V1 — ByocTrunks
// ===========================================================================

describe('Voice V1 ByocTrunks', () => {
  const BYOC = {
    account_sid: ACCOUNT_SID,
    sid: BY_SID,
    friendly_name: 'carrier-x',
    voice_url: null,
    voice_method: null,
    voice_fallback_url: null,
    voice_fallback_method: null,
    status_callback_url: null,
    status_callback_method: null,
    cnam_lookup_enabled: false,
    connection_policy_sid: null,
    from_domain_sid: null,
    date_created: '2026-06-27T10:00:00Z',
    date_updated: '2026-06-27T10:00:00Z',
    url: `${BASE}/v1/ByocTrunks/${BY_SID}`,
  };

  it('exposes 5 CRUD operations on /v1/ByocTrunks*', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ byoc_trunks: [BYOC], meta: metaEnvelope() }),
      jsonResponse(BYOC, 201),
      jsonResponse(BYOC),
      jsonResponse(BYOC),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.voiceV1.byocTrunks.list({ PageSize: 25 });
    expect(calls[0].url).toBe(`${BASE}/v1/ByocTrunks?PageSize=25`);
    await c.voiceV1.byocTrunks.create({ FriendlyName: 'carrier-x' });
    const body = calls[1].init.body as URLSearchParams;
    expect(body.get('FriendlyName')).toBe('carrier-x');
    await c.voiceV1.byocTrunks.fetch(BY_SID);
    expect(calls[2].url).toBe(`${BASE}/v1/ByocTrunks/${BY_SID}`);
    await c.voiceV1.byocTrunks.update(BY_SID, { CnamLookupEnabled: true });
    const body2 = calls[3].init.body as URLSearchParams;
    expect(body2.get('CnamLookupEnabled')).toBe('true');
    await c.voiceV1.byocTrunks.delete(BY_SID);
    expect(calls[4].init.method).toBe('DELETE');
  });
});

// ===========================================================================
// Voice V1 — ConnectionPolicies + nested Targets (callable form)
// ===========================================================================

describe('Voice V1 ConnectionPolicies + Targets', () => {
  const POL = {
    account_sid: ACCOUNT_SID,
    sid: NY_SID,
    friendly_name: 'p',
    date_created: '2026-06-27T10:00:00Z',
    date_updated: '2026-06-27T10:00:00Z',
    url: `${BASE}/v1/ConnectionPolicies/${NY_SID}`,
    links: { targets: `${BASE}/v1/ConnectionPolicies/${NY_SID}/Targets` },
  };
  const TGT = {
    account_sid: ACCOUNT_SID,
    connection_policy_sid: NY_SID,
    sid: NE_SID,
    friendly_name: null,
    target: 'sip:edge@example.com',
    priority: 10,
    weight: 10,
    enabled: true,
    date_created: '2026-06-27T10:00:00Z',
    date_updated: '2026-06-27T10:00:00Z',
    url: `${BASE}/v1/ConnectionPolicies/${NY_SID}/Targets/${NE_SID}`,
  };

  it('flat list/create + callable scope fetch/update/delete', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ connection_policies: [POL], meta: metaEnvelope() }),
      jsonResponse(POL, 201),
      jsonResponse(POL),
      jsonResponse(POL),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.voiceV1.connectionPolicies.list();
    expect(calls[0].url).toBe(`${BASE}/v1/ConnectionPolicies`);
    await c.voiceV1.connectionPolicies.create({ FriendlyName: 'p' });
    expect(calls[1].init.method).toBe('POST');

    // Callable scope:
    const scoped = c.voiceV1.connectionPolicies(NY_SID);
    await scoped.fetch();
    expect(calls[2].url).toBe(`${BASE}/v1/ConnectionPolicies/${NY_SID}`);
    await scoped.update({ FriendlyName: 'renamed' });
    expect(calls[3].init.method).toBe('POST');
    await scoped.delete();
    expect(calls[4].init.method).toBe('DELETE');
  });

  it('nested .targets.* CRUD reaches /v1/ConnectionPolicies/{Sid}/Targets', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ targets: [TGT], meta: metaEnvelope() }),
      jsonResponse(TGT, 201),
      jsonResponse(TGT),
      jsonResponse(TGT),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const targets = c.voiceV1.connectionPolicies(NY_SID).targets;
    await targets.list();
    expect(calls[0].url).toBe(`${BASE}/v1/ConnectionPolicies/${NY_SID}/Targets`);
    await targets.create({ Target: 'sip:edge@example.com', Priority: 1, Weight: 5 });
    const body = calls[1].init.body as URLSearchParams;
    expect(body.get('Target')).toBe('sip:edge@example.com');
    expect(body.get('Priority')).toBe('1');
    expect(body.get('Weight')).toBe('5');
    await targets.fetch(NE_SID);
    expect(calls[2].url).toBe(
      `${BASE}/v1/ConnectionPolicies/${NY_SID}/Targets/${NE_SID}`,
    );
    await targets.update(NE_SID, { Enabled: false });
    expect(calls[3].init.method).toBe('POST');
    await targets.delete(NE_SID);
    expect(calls[4].init.method).toBe('DELETE');
  });
});

// ===========================================================================
// Voice V1 — DialingPermissions Settings
// ===========================================================================

describe('Voice V1 DialingPermissions Settings', () => {
  it('fetch + update routed to /v1/Settings', async () => {
    const payload = { dialing_permissions_inheritance: true, url: `${BASE}/v1/Settings` };
    const { fetch, calls } = fakeFetch([jsonResponse(payload), jsonResponse(payload, 202)]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.voiceV1.settings.fetch();
    expect(calls[0].url).toBe(`${BASE}/v1/Settings`);
    expect(calls[0].init.method).toBe('GET');
    await c.voiceV1.settings.update({ DialingPermissionsInheritance: true });
    const body = calls[1].init.body as URLSearchParams;
    expect(body.get('DialingPermissionsInheritance')).toBe('true');
  });
});

// ===========================================================================
// Conversations V1 — Conversations + nested Messages/Participants/Webhooks
// ===========================================================================

describe('Conversations V1 — Conversations', () => {
  const CONV = {
    account_sid: ACCOUNT_SID,
    chat_service_sid: null,
    messaging_service_sid: null,
    sid: CH_SID,
    friendly_name: 'support',
    unique_name: null,
    attributes: '{}',
    state: 'active',
    date_created: '2026-06-27T10:00:00Z',
    date_updated: '2026-06-27T10:00:00Z',
    timers: null,
    url: `${BASE}/v1/Conversations/${CH_SID}`,
    links: null,
    bindings: null,
  };

  it('CRUD on /v1/Conversations*', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ conversations: [CONV], meta: metaEnvelope() }),
      jsonResponse(CONV, 201),
      jsonResponse(CONV),
      jsonResponse(CONV),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.conversationsV1.conversations.list();
    expect(calls[0].url).toBe(`${BASE}/v1/Conversations`);
    await c.conversationsV1.conversations.create({ FriendlyName: 'support' });
    expect(calls[1].init.method).toBe('POST');
    await c.conversationsV1.conversations.fetch(CH_SID);
    expect(calls[2].url).toBe(`${BASE}/v1/Conversations/${CH_SID}`);
    await c.conversationsV1.conversations.update(CH_SID, { State: 'closed' });
    const body = calls[3].init.body as URLSearchParams;
    expect(body.get('State')).toBe('closed');
    await c.conversationsV1.conversations.delete(CH_SID);
    expect(calls[4].init.method).toBe('DELETE');
  });

  it('messages(sid) returns scoped CRUD under /Messages', async () => {
    const MSG = {
      account_sid: ACCOUNT_SID,
      conversation_sid: CH_SID,
      sid: IM_SID,
      index: 0,
      author: '+15551234567',
      body: 'hi',
      media: null,
      attributes: '{}',
      participant_sid: null,
      date_created: '2026-06-27T10:00:00Z',
      date_updated: '2026-06-27T10:00:00Z',
      url: `${BASE}/v1/Conversations/${CH_SID}/Messages/${IM_SID}`,
      delivery: null,
      links: null,
      content_sid: null,
    };
    const { fetch, calls } = fakeFetch([
      jsonResponse({ messages: [MSG], meta: metaEnvelope() }),
      jsonResponse(MSG, 201),
      jsonResponse(MSG),
      jsonResponse(MSG),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const msgs = c.conversationsV1.conversations.messages(CH_SID);
    await msgs.list();
    expect(calls[0].url).toBe(`${BASE}/v1/Conversations/${CH_SID}/Messages`);
    await msgs.create({ Author: 'a', Body: 'hi' });
    const body = calls[1].init.body as URLSearchParams;
    expect(body.get('Author')).toBe('a');
    expect(body.get('Body')).toBe('hi');
    await msgs.fetch(IM_SID);
    expect(calls[2].url).toBe(
      `${BASE}/v1/Conversations/${CH_SID}/Messages/${IM_SID}`,
    );
    await msgs.update(IM_SID, { Body: 'edited' });
    expect(calls[3].init.method).toBe('POST');
    await msgs.delete(IM_SID);
    expect(calls[4].init.method).toBe('DELETE');
  });

  it('messages(sid).receipts(sid) routes to /Receipts*', async () => {
    const RCPT = {
      account_sid: ACCOUNT_SID,
      conversation_sid: CH_SID,
      sid: DY_SID,
      message_sid: IM_SID,
      channel_message_sid: null,
      participant_sid: null,
      status: 'delivered',
      error_code: 0,
      date_created: '2026-06-27T10:00:00Z',
      date_updated: '2026-06-27T10:00:00Z',
      url: `${BASE}/v1/Conversations/${CH_SID}/Messages/${IM_SID}/Receipts/${DY_SID}`,
    };
    const { fetch, calls } = fakeFetch([
      jsonResponse({ delivery_receipts: [RCPT], meta: metaEnvelope() }),
      jsonResponse(RCPT),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const r = c.conversationsV1.conversations.messages(CH_SID).receipts(IM_SID);
    await r.list();
    expect(calls[0].url).toBe(
      `${BASE}/v1/Conversations/${CH_SID}/Messages/${IM_SID}/Receipts`,
    );
    await r.fetch(DY_SID);
    expect(calls[1].url).toBe(
      `${BASE}/v1/Conversations/${CH_SID}/Messages/${IM_SID}/Receipts/${DY_SID}`,
    );
  });

  it('participants(sid) CRUD under /Participants', async () => {
    const PART = {
      account_sid: ACCOUNT_SID,
      conversation_sid: CH_SID,
      sid: MB_SID,
      identity: 'alice',
      attributes: '{}',
      messaging_binding: null,
      role_sid: null,
      date_created: '2026-06-27T10:00:00Z',
      date_updated: '2026-06-27T10:00:00Z',
      url: `${BASE}/v1/Conversations/${CH_SID}/Participants/${MB_SID}`,
      last_read_message_index: null,
      last_read_timestamp: null,
    };
    const { fetch, calls } = fakeFetch([
      jsonResponse({ participants: [PART], meta: metaEnvelope() }),
      jsonResponse(PART, 201),
      jsonResponse(PART),
      jsonResponse(PART),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const p = c.conversationsV1.conversations.participants(CH_SID);
    await p.list();
    expect(calls[0].url).toBe(`${BASE}/v1/Conversations/${CH_SID}/Participants`);
    await p.create({ Identity: 'alice' });
    expect(calls[1].init.method).toBe('POST');
    await p.fetch(MB_SID);
    await p.update(MB_SID, { LastReadMessageIndex: 5 });
    await p.delete(MB_SID);
    expect(calls[4].init.method).toBe('DELETE');
  });

  it('webhooks(sid) CRUD under /Webhooks', async () => {
    const WH = {
      sid: WH_SID,
      account_sid: ACCOUNT_SID,
      conversation_sid: CH_SID,
      target: 'webhook',
      url: `${BASE}/v1/Conversations/${CH_SID}/Webhooks/${WH_SID}`,
      configuration: null,
      date_created: '2026-06-27T10:00:00Z',
      date_updated: '2026-06-27T10:00:00Z',
    };
    const { fetch, calls } = fakeFetch([
      jsonResponse({ webhooks: [WH], meta: metaEnvelope() }),
      jsonResponse(WH, 201),
      jsonResponse(WH),
      jsonResponse(WH),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const w = c.conversationsV1.conversations.webhooks(CH_SID);
    await w.list();
    expect(calls[0].url).toBe(`${BASE}/v1/Conversations/${CH_SID}/Webhooks`);
    await w.create({ Target: 'webhook', 'Configuration.Url': 'https://x' });
    const body = calls[1].init.body as URLSearchParams;
    expect(body.get('Target')).toBe('webhook');
    expect(body.get('Configuration.Url')).toBe('https://x');
    await w.fetch(WH_SID);
    await w.update(WH_SID, { 'Configuration.Method': 'POST' });
    await w.delete(WH_SID);
    expect(calls[4].init.method).toBe('DELETE');
  });
});

// ===========================================================================
// Conversations V1 — Roles
// ===========================================================================

describe('Conversations V1 — Roles', () => {
  const ROLE = {
    sid: RL_SID,
    account_sid: ACCOUNT_SID,
    chat_service_sid: null,
    friendly_name: 'admin',
    type: 'conversation',
    permissions: ['sendMessage', 'leaveConversation'],
    date_created: '2026-06-27T10:00:00Z',
    date_updated: '2026-06-27T10:00:00Z',
    url: `${BASE}/v1/Roles/${RL_SID}`,
  };
  it('5 CRUD ops under /v1/Roles', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ roles: [ROLE], meta: metaEnvelope() }),
      jsonResponse(ROLE, 201),
      jsonResponse(ROLE),
      jsonResponse(ROLE),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.conversationsV1.roles.list();
    expect(calls[0].url).toBe(`${BASE}/v1/Roles`);
    await c.conversationsV1.roles.create({
      FriendlyName: 'admin',
      Type: 'conversation',
      Permission: ['sendMessage'],
    });
    const body = calls[1].init.body as URLSearchParams;
    expect(body.get('FriendlyName')).toBe('admin');
    expect(body.get('Type')).toBe('conversation');
    expect(body.getAll('Permission')).toEqual(['sendMessage']);
    await c.conversationsV1.roles.fetch(RL_SID);
    expect(calls[2].url).toBe(`${BASE}/v1/Roles/${RL_SID}`);
    await c.conversationsV1.roles.update(RL_SID, { Permission: ['leaveConversation'] });
    await c.conversationsV1.roles.delete(RL_SID);
    expect(calls[4].init.method).toBe('DELETE');
  });
});

// ===========================================================================
// Conversations V1 — Users (callable) + UserConversations
// ===========================================================================

describe('Conversations V1 — Users + UserConversations', () => {
  const USER = {
    sid: US_SID,
    account_sid: ACCOUNT_SID,
    chat_service_sid: null,
    role_sid: null,
    identity: 'alice',
    friendly_name: null,
    attributes: '{}',
    is_online: null,
    is_notifiable: null,
    date_created: '2026-06-27T10:00:00Z',
    date_updated: '2026-06-27T10:00:00Z',
    url: `${BASE}/v1/Users/${US_SID}`,
    links: null,
  };

  it('flat CRUD on /v1/Users + nested .conversations under /Users/{Sid}/Conversations', async () => {
    const UC = {
      account_sid: ACCOUNT_SID,
      chat_service_sid: null,
      conversation_sid: CH_SID,
      unread_messages_count: 0,
      last_read_message_index: null,
      participant_sid: null,
      user_sid: US_SID,
      friendly_name: 'support',
      conversation_state: 'active',
      timers: null,
      attributes: '{}',
      date_created: '2026-06-27T10:00:00Z',
      date_updated: '2026-06-27T10:00:00Z',
      created_by: null,
      notification_level: 'default',
      unique_name: null,
      url: `${BASE}/v1/Users/${US_SID}/Conversations/${CH_SID}`,
      links: null,
    };
    const { fetch, calls } = fakeFetch([
      jsonResponse({ users: [USER], meta: metaEnvelope() }),
      jsonResponse(USER, 201),
      jsonResponse(USER),
      jsonResponse(USER),
      noContentResponse(),
      jsonResponse({ conversations: [UC], meta: metaEnvelope() }),
      jsonResponse(UC),
      jsonResponse(UC),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    // Flat CRUD
    await c.conversationsV1.users.list();
    expect(calls[0].url).toBe(`${BASE}/v1/Users`);
    await c.conversationsV1.users.create({ Identity: 'alice' });
    expect(calls[1].init.method).toBe('POST');
    await c.conversationsV1.users.fetch(US_SID);
    expect(calls[2].url).toBe(`${BASE}/v1/Users/${US_SID}`);
    await c.conversationsV1.users.update(US_SID, { FriendlyName: 'A' });
    await c.conversationsV1.users.delete(US_SID);
    expect(calls[4].init.method).toBe('DELETE');
    // Callable scope -> conversations sub-resource
    const ucr = c.conversationsV1.users(US_SID).conversations;
    await ucr.list();
    expect(calls[5].url).toBe(`${BASE}/v1/Users/${US_SID}/Conversations`);
    await ucr.fetch(CH_SID);
    expect(calls[6].url).toBe(
      `${BASE}/v1/Users/${US_SID}/Conversations/${CH_SID}`,
    );
    await ucr.update(CH_SID, { NotificationLevel: 'muted' });
    const body = calls[7].init.body as URLSearchParams;
    expect(body.get('NotificationLevel')).toBe('muted');
    await ucr.delete(CH_SID);
    expect(calls[8].init.method).toBe('DELETE');
  });
});

// ===========================================================================
// Conversations V1 — Credentials
// ===========================================================================

describe('Conversations V1 — Credentials', () => {
  const CRED = {
    sid: CR_SID,
    account_sid: ACCOUNT_SID,
    friendly_name: 'apns',
    type: 'apn',
    sandbox: null,
    date_created: '2026-06-27T10:00:00Z',
    date_updated: '2026-06-27T10:00:00Z',
    url: `${BASE}/v1/Credentials/${CR_SID}`,
  };
  it('5 CRUD ops under /v1/Credentials', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ credentials: [CRED], meta: metaEnvelope() }),
      jsonResponse(CRED, 201),
      jsonResponse(CRED),
      jsonResponse(CRED),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.conversationsV1.credentials.list();
    expect(calls[0].url).toBe(`${BASE}/v1/Credentials`);
    await c.conversationsV1.credentials.create({ Type: 'apn', FriendlyName: 'apns' });
    const body = calls[1].init.body as URLSearchParams;
    expect(body.get('Type')).toBe('apn');
    await c.conversationsV1.credentials.fetch(CR_SID);
    await c.conversationsV1.credentials.update(CR_SID, { FriendlyName: 'renamed' });
    await c.conversationsV1.credentials.delete(CR_SID);
    expect(calls[4].init.method).toBe('DELETE');
  });
});

// ===========================================================================
// Conversations V1 — Configuration + Webhooks + Addresses
// ===========================================================================

describe('Conversations V1 — Configuration', () => {
  const CFG = {
    account_sid: ACCOUNT_SID,
    default_chat_service_sid: null,
    default_messaging_service_sid: null,
    default_inactive_timer: null,
    default_closed_timer: null,
    url: `${BASE}/v1/Configuration`,
    links: null,
  };
  const WBH = {
    account_sid: ACCOUNT_SID,
    method: 'POST',
    filters: null,
    pre_webhook_url: null,
    post_webhook_url: null,
    target: 'webhook',
    url: `${BASE}/v1/Configuration/Webhooks`,
  };
  const ADDR = {
    sid: IG_SID,
    account_sid: ACCOUNT_SID,
    type: 'sms',
    address: '+15551234567',
    friendly_name: 'in',
    auto_creation: null,
    date_created: '2026-06-27T10:00:00Z',
    date_updated: '2026-06-27T10:00:00Z',
    url: `${BASE}/v1/Configuration/Addresses/${IG_SID}`,
    address_country: null,
  };

  it('fetch/update /v1/Configuration, /Webhooks, addresses CRUD', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse(CFG),
      jsonResponse(CFG),
      jsonResponse(WBH),
      jsonResponse(WBH),
      jsonResponse({ addresses: [ADDR], meta: metaEnvelope() }),
      jsonResponse(ADDR, 201),
      jsonResponse(ADDR),
      jsonResponse(ADDR),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.conversationsV1.configuration.fetch();
    expect(calls[0].url).toBe(`${BASE}/v1/Configuration`);
    await c.conversationsV1.configuration.update({
      DefaultInactiveTimer: 'PT1H',
    });
    const body = calls[1].init.body as URLSearchParams;
    expect(body.get('DefaultInactiveTimer')).toBe('PT1H');

    await c.conversationsV1.configuration.webhooks.fetch();
    expect(calls[2].url).toBe(`${BASE}/v1/Configuration/Webhooks`);
    await c.conversationsV1.configuration.webhooks.update({
      Method: 'POST',
      Target: 'webhook',
    });
    expect(calls[3].init.method).toBe('POST');

    await c.conversationsV1.configuration.addresses.list();
    expect(calls[4].url).toBe(`${BASE}/v1/Configuration/Addresses`);
    await c.conversationsV1.configuration.addresses.create({
      Type: 'sms',
      Address: '+15551234567',
    });
    const body2 = calls[5].init.body as URLSearchParams;
    expect(body2.get('Type')).toBe('sms');
    expect(body2.get('Address')).toBe('+15551234567');
    await c.conversationsV1.configuration.addresses.fetch(IG_SID);
    expect(calls[6].url).toBe(`${BASE}/v1/Configuration/Addresses/${IG_SID}`);
    await c.conversationsV1.configuration.addresses.update(IG_SID, {
      FriendlyName: 'renamed',
    });
    await c.conversationsV1.configuration.addresses.delete(IG_SID);
    expect(calls[8].init.method).toBe('DELETE');
  });
});

// ===========================================================================
// Conversations V1 — ParticipantConversations + ConversationWithParticipants + Services
// ===========================================================================

describe('Conversations V1 — ParticipantConversations + ConversationWithParticipants + Services', () => {
  it('participantConversations.list() with filters', async () => {
    const PC = {
      account_sid: ACCOUNT_SID,
      chat_service_sid: null,
      participant_sid: MB_SID,
      participant_user_sid: US_SID,
      participant_identity: 'alice',
      participant_messaging_binding: null,
      conversation_sid: CH_SID,
      conversation_unique_name: null,
      conversation_friendly_name: 'thread',
      conversation_attributes: '{}',
      conversation_date_created: '2026-06-27T10:00:00Z',
      conversation_date_updated: '2026-06-27T10:00:00Z',
      conversation_created_by: null,
      conversation_state: 'active',
      conversation_timers: null,
      links: null,
    };
    const { fetch, calls } = fakeFetch([
      jsonResponse({ conversations: [PC], meta: metaEnvelope() }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.conversationsV1.participantConversations.list({ Identity: 'alice' });
    expect(calls[0].url).toBe(`${BASE}/v1/ParticipantConversations?Identity=alice`);
  });

  it('conversationWithParticipants.create posts to /v1/ConversationWithParticipants', async () => {
    const CWP = {
      account_sid: ACCOUNT_SID,
      chat_service_sid: null,
      messaging_service_sid: null,
      sid: CH_SID,
      friendly_name: 'group',
      unique_name: null,
      attributes: '{}',
      state: 'active',
      date_created: '2026-06-27T10:00:00Z',
      date_updated: '2026-06-27T10:00:00Z',
      timers: null,
      links: null,
      bindings: null,
      url: `${BASE}/v1/Conversations/${CH_SID}`,
    };
    const { fetch, calls } = fakeFetch([jsonResponse(CWP, 201)]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.conversationsV1.conversationWithParticipants.create({
      FriendlyName: 'group',
      Participant: [
        JSON.stringify({ identity: 'alice' }),
        JSON.stringify({ identity: 'bob' }),
      ],
    });
    expect(calls[0].url).toBe(`${BASE}/v1/ConversationWithParticipants`);
    expect(calls[0].init.method).toBe('POST');
    const body = calls[0].init.body as URLSearchParams;
    expect(body.get('FriendlyName')).toBe('group');
    expect(body.getAll('Participant').length).toBe(2);
  });

  it('services list/create/fetch/delete (4 ops, no update)', async () => {
    const SVC = {
      sid: IS_SID,
      account_sid: ACCOUNT_SID,
      friendly_name: 'svc',
      date_created: '2026-06-27T10:00:00Z',
      date_updated: '2026-06-27T10:00:00Z',
      url: `${BASE}/v1/Services/${IS_SID}`,
      links: null,
    };
    const { fetch, calls } = fakeFetch([
      jsonResponse({ services: [SVC], meta: metaEnvelope() }),
      jsonResponse(SVC, 201),
      jsonResponse(SVC),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.conversationsV1.services.list();
    expect(calls[0].url).toBe(`${BASE}/v1/Services`);
    await c.conversationsV1.services.create({ FriendlyName: 'svc' });
    expect(calls[1].init.method).toBe('POST');
    await c.conversationsV1.services.fetch(IS_SID);
    expect(calls[2].url).toBe(`${BASE}/v1/Services/${IS_SID}`);
    await c.conversationsV1.services.delete(IS_SID);
    expect(calls[3].init.method).toBe('DELETE');
  });
});

// ===========================================================================
// Cross-cutting: 22 resources are all wired on the client
// ===========================================================================

describe('v0.9.0 client wiring', () => {
  it('exposes all 22 new resources on client.{routesV2,voiceV1,conversationsV1}', () => {
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY });
    // Routes V2 — 2 resources
    expect(c.routesV2.sipDomains).toBeDefined();
    expect(c.routesV2.phoneNumbers).toBeDefined();
    // Voice V1 — 6 resources
    expect(c.voiceV1.ipRecords).toBeDefined();
    expect(c.voiceV1.sourceIpMappings).toBeDefined();
    expect(c.voiceV1.byocTrunks).toBeDefined();
    expect(c.voiceV1.connectionPolicies).toBeDefined();
    expect(typeof c.voiceV1.connectionPolicies).toBe('function');
    expect(c.voiceV1.settings).toBeDefined();
    // Conversations V1 — 15 resources surfaced as top-level handles or
    // returned by factory methods.
    expect(c.conversationsV1.conversations).toBeDefined();
    expect(c.conversationsV1.roles).toBeDefined();
    expect(c.conversationsV1.users).toBeDefined();
    expect(typeof c.conversationsV1.users).toBe('function');
    expect(c.conversationsV1.credentials).toBeDefined();
    expect(c.conversationsV1.configuration).toBeDefined();
    expect(c.conversationsV1.configuration.webhooks).toBeDefined();
    expect(c.conversationsV1.configuration.addresses).toBeDefined();
    expect(c.conversationsV1.participantConversations).toBeDefined();
    expect(c.conversationsV1.conversationWithParticipants).toBeDefined();
    expect(c.conversationsV1.services).toBeDefined();
    // Factory-returned sub-resources (messages/participants/webhooks/receipts/userConversations).
    expect(c.conversationsV1.conversations.messages(CH_SID)).toBeDefined();
    expect(c.conversationsV1.conversations.participants(CH_SID)).toBeDefined();
    expect(c.conversationsV1.conversations.webhooks(CH_SID)).toBeDefined();
    expect(
      c.conversationsV1.conversations.messages(CH_SID).receipts(IM_SID),
    ).toBeDefined();
    expect(c.conversationsV1.users(US_SID).conversations).toBeDefined();
  });
});
