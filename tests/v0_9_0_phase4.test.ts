/**
 * Wire-shape tests for the v0.9.0 **Phase 4** service-scoped surface under
 * `/v1/Services/{ChatServiceSid}/…`.
 *
 * Validates:
 *   - `client.conversationsV1.services` remains a usable account-level
 *     collection (`.list/.create/.fetch/.delete`).
 *   - `client.conversationsV1.services(chatServiceSid)` returns a scope
 *     carrying the 14 Phase 4 sub-resource families.
 *   - URL shape, method, and form-body content for representative ops in
 *     every family (48 ops total).
 *
 * Uses a stub `fetch` to intercept calls.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { Client } from '../src/index.js';

const ACCOUNT_SID = 'AC' + 'f'.repeat(32);
const API_KEY = 'secret-key-1234';
// Conversations V1 rides its own product host (see hosts.ts); the whole
// phase-4 service-scoped surface is Conversation Service, so every URL here is
// on the conversations host.
const BASE = 'https://conversations.voicetel.com';

// SID fixtures
const IS_SID = 'IS' + '0'.repeat(32);
const CH_SID = 'CH' + '7'.repeat(32);
const IM_SID = 'IM' + '8'.repeat(32);
const MB_SID = 'MB' + '9'.repeat(32);
const WH_SID = 'WH' + 'a'.repeat(32);
const RL_SID = 'RL' + 'b'.repeat(32);
const US_SID = 'US' + 'c'.repeat(32);
const DY_SID = 'DY' + '1'.repeat(32);
const BS_SID = 'BS' + '2'.repeat(32);

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
// Backwards-compat: account-level `/v1/Services` is still usable
// ===========================================================================

describe('Phase 4 — account-level /v1/Services still works', () => {
  const SVC = {
    sid: IS_SID,
    account_sid: ACCOUNT_SID,
    friendly_name: 'svc',
    date_created: '2026-06-27T10:00:00Z',
    date_updated: '2026-06-27T10:00:00Z',
    url: `${BASE}/v1/Services/${IS_SID}`,
    links: null,
  };

  it('services callable still exposes list/create/fetch/delete', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ services: [SVC], meta: metaEnvelope() }),
      jsonResponse(SVC, 201),
      jsonResponse(SVC),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    expect(typeof c.conversationsV1.services).toBe('function');
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
// ServiceConversation — /v1/Services/{Sid}/Conversations* (5 ops)
// ===========================================================================

describe('Phase 4 — ServiceConversation', () => {
  const CONV = {
    account_sid: ACCOUNT_SID,
    chat_service_sid: IS_SID,
    messaging_service_sid: null,
    sid: CH_SID,
    friendly_name: 'support',
    unique_name: null,
    attributes: '{}',
    state: 'active',
    date_created: '2026-06-27T10:00:00Z',
    date_updated: '2026-06-27T10:00:00Z',
    timers: null,
    url: `${BASE}/v1/Services/${IS_SID}/Conversations/${CH_SID}`,
    links: null,
    bindings: null,
  };

  it('CRUD reaches /v1/Services/{Sid}/Conversations*', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ conversations: [CONV], meta: metaEnvelope() }),
      jsonResponse(CONV, 201),
      jsonResponse(CONV),
      jsonResponse(CONV),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const svc = c.conversationsV1.services(IS_SID);
    await svc.conversations.list({ PageSize: 25 });
    expect(calls[0].url).toBe(
      `${BASE}/v1/Services/${IS_SID}/Conversations?PageSize=25`,
    );
    await svc.conversations.create({ FriendlyName: 'support' });
    expect(calls[1].init.method).toBe('POST');
    const body = calls[1].init.body as URLSearchParams;
    expect(body.get('FriendlyName')).toBe('support');
    await svc.conversations.fetch(CH_SID);
    expect(calls[2].url).toBe(
      `${BASE}/v1/Services/${IS_SID}/Conversations/${CH_SID}`,
    );
    await svc.conversations.update(CH_SID, { State: 'closed' });
    const body2 = calls[3].init.body as URLSearchParams;
    expect(body2.get('State')).toBe('closed');
    await svc.conversations.delete(CH_SID);
    expect(calls[4].init.method).toBe('DELETE');
  });
});

// ===========================================================================
// ServiceConversationMessage + ServiceConversationMessageReceipt
// ===========================================================================

describe('Phase 4 — ServiceConversationMessage + Receipts', () => {
  const MSG = {
    account_sid: ACCOUNT_SID,
    chat_service_sid: IS_SID,
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
    url: `${BASE}/v1/Services/${IS_SID}/Conversations/${CH_SID}/Messages/${IM_SID}`,
    delivery: null,
    links: null,
    content_sid: null,
  };

  it('messages CRUD under service-scoped path', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ messages: [MSG], meta: metaEnvelope() }),
      jsonResponse(MSG, 201),
      jsonResponse(MSG),
      jsonResponse(MSG),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const msgs = c.conversationsV1.services(IS_SID).conversations.messages(CH_SID);
    await msgs.list();
    expect(calls[0].url).toBe(
      `${BASE}/v1/Services/${IS_SID}/Conversations/${CH_SID}/Messages`,
    );
    await msgs.create({ Author: 'a', Body: 'hi' });
    const body = calls[1].init.body as URLSearchParams;
    expect(body.get('Author')).toBe('a');
    expect(body.get('Body')).toBe('hi');
    await msgs.fetch(IM_SID);
    expect(calls[2].url).toBe(
      `${BASE}/v1/Services/${IS_SID}/Conversations/${CH_SID}/Messages/${IM_SID}`,
    );
    await msgs.update(IM_SID, { Body: 'edited' });
    expect(calls[3].init.method).toBe('POST');
    await msgs.delete(IM_SID);
    expect(calls[4].init.method).toBe('DELETE');
  });

  it('receipts list + fetch routed to /Receipts*', async () => {
    const RCPT = {
      account_sid: ACCOUNT_SID,
      chat_service_sid: IS_SID,
      conversation_sid: CH_SID,
      sid: DY_SID,
      message_sid: IM_SID,
      channel_message_sid: null,
      participant_sid: null,
      status: 'delivered',
      error_code: 0,
      date_created: '2026-06-27T10:00:00Z',
      date_updated: '2026-06-27T10:00:00Z',
      url:
        `${BASE}/v1/Services/${IS_SID}/Conversations/${CH_SID}/Messages/${IM_SID}` +
        `/Receipts/${DY_SID}`,
    };
    const { fetch, calls } = fakeFetch([
      jsonResponse({ delivery_receipts: [RCPT], meta: metaEnvelope() }),
      jsonResponse(RCPT),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const r = c.conversationsV1
      .services(IS_SID)
      .conversations.messages(CH_SID)
      .receipts(IM_SID);
    await r.list();
    expect(calls[0].url).toBe(
      `${BASE}/v1/Services/${IS_SID}/Conversations/${CH_SID}/Messages/${IM_SID}/Receipts`,
    );
    await r.fetch(DY_SID);
    expect(calls[1].url).toBe(
      `${BASE}/v1/Services/${IS_SID}/Conversations/${CH_SID}/Messages/${IM_SID}/Receipts/${DY_SID}`,
    );
  });
});

// ===========================================================================
// ServiceConversationParticipant + ServiceConversationScopedWebhook
// ===========================================================================

describe('Phase 4 — Participants + scoped Webhooks under service Conversation', () => {
  it('participants CRUD', async () => {
    const PART = {
      account_sid: ACCOUNT_SID,
      chat_service_sid: IS_SID,
      conversation_sid: CH_SID,
      sid: MB_SID,
      identity: 'alice',
      attributes: '{}',
      messaging_binding: null,
      role_sid: null,
      date_created: '2026-06-27T10:00:00Z',
      date_updated: '2026-06-27T10:00:00Z',
      url: `${BASE}/v1/Services/${IS_SID}/Conversations/${CH_SID}/Participants/${MB_SID}`,
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
    const p = c.conversationsV1.services(IS_SID).conversations.participants(CH_SID);
    await p.list();
    expect(calls[0].url).toBe(
      `${BASE}/v1/Services/${IS_SID}/Conversations/${CH_SID}/Participants`,
    );
    await p.create({ Identity: 'alice' });
    const body = calls[1].init.body as URLSearchParams;
    expect(body.get('Identity')).toBe('alice');
    await p.fetch(MB_SID);
    expect(calls[2].url).toBe(
      `${BASE}/v1/Services/${IS_SID}/Conversations/${CH_SID}/Participants/${MB_SID}`,
    );
    await p.update(MB_SID, { Attributes: '{"k":1}' });
    expect(calls[3].init.method).toBe('POST');
    await p.delete(MB_SID);
    expect(calls[4].init.method).toBe('DELETE');
  });

  it('webhooks CRUD', async () => {
    const WH = {
      sid: WH_SID,
      account_sid: ACCOUNT_SID,
      chat_service_sid: IS_SID,
      conversation_sid: CH_SID,
      target: 'webhook',
      url: `${BASE}/v1/Services/${IS_SID}/Conversations/${CH_SID}/Webhooks/${WH_SID}`,
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
    const w = c.conversationsV1.services(IS_SID).conversations.webhooks(CH_SID);
    await w.list();
    expect(calls[0].url).toBe(
      `${BASE}/v1/Services/${IS_SID}/Conversations/${CH_SID}/Webhooks`,
    );
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
// ServiceConversationWithParticipants — create-only
// ===========================================================================

describe('Phase 4 — ServiceConversationWithParticipants', () => {
  it('posts to /v1/Services/{Sid}/ConversationWithParticipants', async () => {
    const CWP = {
      account_sid: ACCOUNT_SID,
      chat_service_sid: IS_SID,
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
      url: `${BASE}/v1/Services/${IS_SID}/Conversations/${CH_SID}`,
    };
    const { fetch, calls } = fakeFetch([jsonResponse(CWP, 201)]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.conversationsV1.services(IS_SID).conversationWithParticipants.create({
      FriendlyName: 'group',
      Participant: [
        JSON.stringify({ identity: 'alice' }),
        JSON.stringify({ identity: 'bob' }),
      ],
    });
    expect(calls[0].url).toBe(
      `${BASE}/v1/Services/${IS_SID}/ConversationWithParticipants`,
    );
    expect(calls[0].init.method).toBe('POST');
    const body = calls[0].init.body as URLSearchParams;
    expect(body.get('FriendlyName')).toBe('group');
    expect(body.getAll('Participant').length).toBe(2);
  });
});

// ===========================================================================
// ServiceParticipantConversation — list-only
// ===========================================================================

describe('Phase 4 — ServiceParticipantConversation', () => {
  it('list with Identity filter routed to /v1/Services/{Sid}/ParticipantConversations', async () => {
    const PC = {
      account_sid: ACCOUNT_SID,
      chat_service_sid: IS_SID,
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
    await c.conversationsV1.services(IS_SID).participantConversations.list({
      Identity: 'alice',
    });
    expect(calls[0].url).toBe(
      `${BASE}/v1/Services/${IS_SID}/ParticipantConversations?Identity=alice`,
    );
  });
});

// ===========================================================================
// ServiceRole — CRUD (5)
// ===========================================================================

describe('Phase 4 — ServiceRole', () => {
  it('5 CRUD ops under /v1/Services/{Sid}/Roles', async () => {
    const ROLE = {
      sid: RL_SID,
      account_sid: ACCOUNT_SID,
      chat_service_sid: IS_SID,
      friendly_name: 'admin',
      type: 'service',
      permissions: ['editAnyMessage'],
      date_created: '2026-06-27T10:00:00Z',
      date_updated: '2026-06-27T10:00:00Z',
      url: `${BASE}/v1/Services/${IS_SID}/Roles/${RL_SID}`,
    };
    const { fetch, calls } = fakeFetch([
      jsonResponse({ roles: [ROLE], meta: metaEnvelope() }),
      jsonResponse(ROLE, 201),
      jsonResponse(ROLE),
      jsonResponse(ROLE),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const roles = c.conversationsV1.services(IS_SID).roles;
    await roles.list();
    expect(calls[0].url).toBe(`${BASE}/v1/Services/${IS_SID}/Roles`);
    await roles.create({
      FriendlyName: 'admin',
      Type: 'service',
      Permission: ['editAnyMessage'],
    });
    const body = calls[1].init.body as URLSearchParams;
    expect(body.get('FriendlyName')).toBe('admin');
    expect(body.get('Type')).toBe('service');
    expect(body.getAll('Permission')).toEqual(['editAnyMessage']);
    await roles.fetch(RL_SID);
    expect(calls[2].url).toBe(`${BASE}/v1/Services/${IS_SID}/Roles/${RL_SID}`);
    await roles.update(RL_SID, { Permission: ['leaveConversation'] });
    await roles.delete(RL_SID);
    expect(calls[4].init.method).toBe('DELETE');
  });
});

// ===========================================================================
// ServiceUser — CRUD (callable) + ServiceUserConversation
// ===========================================================================

describe('Phase 4 — ServiceUser + ServiceUserConversation', () => {
  it('flat CRUD on /v1/Services/{Sid}/Users + nested users(sid).conversations.list', async () => {
    const USER = {
      sid: US_SID,
      account_sid: ACCOUNT_SID,
      chat_service_sid: IS_SID,
      role_sid: null,
      identity: 'alice',
      friendly_name: null,
      attributes: '{}',
      is_online: null,
      is_notifiable: null,
      date_created: '2026-06-27T10:00:00Z',
      date_updated: '2026-06-27T10:00:00Z',
      url: `${BASE}/v1/Services/${IS_SID}/Users/${US_SID}`,
      links: null,
    };
    const UC = {
      account_sid: ACCOUNT_SID,
      chat_service_sid: IS_SID,
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
      url: `${BASE}/v1/Services/${IS_SID}/Users/${US_SID}/Conversations/${CH_SID}`,
      links: null,
    };
    const { fetch, calls } = fakeFetch([
      jsonResponse({ users: [USER], meta: metaEnvelope() }),
      jsonResponse(USER, 201),
      jsonResponse(USER),
      jsonResponse(USER),
      noContentResponse(),
      jsonResponse({ conversations: [UC], meta: metaEnvelope() }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const users = c.conversationsV1.services(IS_SID).users;
    expect(typeof users).toBe('function');
    await users.list();
    expect(calls[0].url).toBe(`${BASE}/v1/Services/${IS_SID}/Users`);
    await users.create({ Identity: 'alice' });
    expect(calls[1].init.method).toBe('POST');
    await users.fetch(US_SID);
    expect(calls[2].url).toBe(`${BASE}/v1/Services/${IS_SID}/Users/${US_SID}`);
    await users.update(US_SID, { FriendlyName: 'A' });
    await users.delete(US_SID);
    expect(calls[4].init.method).toBe('DELETE');
    // Callable scope: users(sid).conversations.list (1 op for ServiceUserConversation)
    await users(US_SID).conversations.list();
    expect(calls[5].url).toBe(
      `${BASE}/v1/Services/${IS_SID}/Users/${US_SID}/Conversations`,
    );
  });
});

// ===========================================================================
// ServiceBinding — list / fetch / delete (3)
// ===========================================================================

describe('Phase 4 — ServiceBinding', () => {
  it('list/fetch/delete under /v1/Services/{Sid}/Bindings', async () => {
    const BIND = {
      sid: BS_SID,
      account_sid: ACCOUNT_SID,
      chat_service_sid: IS_SID,
      credential_sid: null,
      date_created: '2026-06-27T10:00:00Z',
      date_updated: '2026-06-27T10:00:00Z',
      endpoint: null,
      identity: 'alice',
      binding_type: 'apn',
      message_types: null,
      url: `${BASE}/v1/Services/${IS_SID}/Bindings/${BS_SID}`,
    };
    const { fetch, calls } = fakeFetch([
      jsonResponse({ bindings: [BIND], meta: metaEnvelope() }),
      jsonResponse(BIND),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const b = c.conversationsV1.services(IS_SID).bindings;
    await b.list({ BindingType: 'apn', Identity: 'alice' });
    expect(calls[0].url).toBe(
      `${BASE}/v1/Services/${IS_SID}/Bindings?BindingType=apn&Identity=alice`,
    );
    await b.fetch(BS_SID);
    expect(calls[1].url).toBe(`${BASE}/v1/Services/${IS_SID}/Bindings/${BS_SID}`);
    await b.delete(BS_SID);
    expect(calls[2].init.method).toBe('DELETE');
  });
});

// ===========================================================================
// ServiceConfiguration (2) + ServiceNotification (2) + ServiceWebhookConfiguration (2)
// ===========================================================================

describe('Phase 4 — Configuration singletons', () => {
  it('fetch/update Configuration, Notifications, Webhooks', async () => {
    const CFG = {
      chat_service_sid: IS_SID,
      default_conversation_creator_role_sid: null,
      default_conversation_role_sid: null,
      default_chat_service_role_sid: null,
      url: `${BASE}/v1/Services/${IS_SID}/Configuration`,
      links: null,
      reachability_enabled: false,
    };
    const NOTIF = {
      account_sid: ACCOUNT_SID,
      chat_service_sid: IS_SID,
      new_message: null,
      added_to_conversation: null,
      removed_from_conversation: null,
      log_enabled: false,
      url: `${BASE}/v1/Services/${IS_SID}/Configuration/Notifications`,
    };
    const WEBCFG = {
      account_sid: ACCOUNT_SID,
      chat_service_sid: IS_SID,
      pre_webhook_url: null,
      post_webhook_url: null,
      filters: null,
      method: 'POST',
      url: `${BASE}/v1/Services/${IS_SID}/Configuration/Webhooks`,
    };
    const { fetch, calls } = fakeFetch([
      jsonResponse(CFG),
      jsonResponse(CFG),
      jsonResponse(NOTIF),
      jsonResponse(NOTIF),
      jsonResponse(WEBCFG),
      jsonResponse(WEBCFG),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const cfg = c.conversationsV1.services(IS_SID).configuration;
    await cfg.fetch();
    expect(calls[0].url).toBe(`${BASE}/v1/Services/${IS_SID}/Configuration`);
    await cfg.update({ ReachabilityEnabled: true });
    const body = calls[1].init.body as URLSearchParams;
    expect(body.get('ReachabilityEnabled')).toBe('true');

    await cfg.notifications.fetch();
    expect(calls[2].url).toBe(
      `${BASE}/v1/Services/${IS_SID}/Configuration/Notifications`,
    );
    await cfg.notifications.update({
      LogEnabled: true,
      'NewMessage.Enabled': true,
      'NewMessage.Template': 'hello',
    });
    const body2 = calls[3].init.body as URLSearchParams;
    expect(body2.get('LogEnabled')).toBe('true');
    expect(body2.get('NewMessage.Enabled')).toBe('true');
    expect(body2.get('NewMessage.Template')).toBe('hello');

    await cfg.webhooks.fetch();
    expect(calls[4].url).toBe(`${BASE}/v1/Services/${IS_SID}/Configuration/Webhooks`);
    await cfg.webhooks.update({ Method: 'POST', Filters: ['onMessageAdded'] });
    const body3 = calls[5].init.body as URLSearchParams;
    expect(body3.get('Method')).toBe('POST');
    expect(body3.getAll('Filters')).toEqual(['onMessageAdded']);
  });
});

// ===========================================================================
// Cross-cutting wiring: 14 sub-resource families surfaced on the scope
// ===========================================================================

describe('Phase 4 wiring', () => {
  it('client.conversationsV1.services is callable and surfaces all 14 families', () => {
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY });
    expect(typeof c.conversationsV1.services).toBe('function');
    const svc = c.conversationsV1.services(IS_SID);
    expect(svc.conversations).toBeDefined();
    expect(svc.conversations.messages(CH_SID)).toBeDefined();
    expect(svc.conversations.messages(CH_SID).receipts(IM_SID)).toBeDefined();
    expect(svc.conversations.participants(CH_SID)).toBeDefined();
    expect(svc.conversations.webhooks(CH_SID)).toBeDefined();
    expect(svc.conversationWithParticipants).toBeDefined();
    expect(svc.participantConversations).toBeDefined();
    expect(svc.roles).toBeDefined();
    expect(svc.users).toBeDefined();
    expect(typeof svc.users).toBe('function');
    expect(svc.users(US_SID).conversations).toBeDefined();
    expect(svc.bindings).toBeDefined();
    expect(svc.configuration).toBeDefined();
    expect(svc.configuration.notifications).toBeDefined();
    expect(svc.configuration.webhooks).toBeDefined();
  });
});
