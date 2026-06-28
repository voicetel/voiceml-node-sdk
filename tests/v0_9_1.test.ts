/**
 * Wire-shape tests for the v0.9.1 **Assistants v1** surface
 * (`/v1/Assistants`, `/v1/Tools`, `/v1/Knowledge`, `/v1/Sessions`,
 * `/v1/Policies`).
 *
 * Validates URL shape, method, JSON request body (not form-urlencoded),
 * the `PUT` method on updates, and that nested factories chain correctly.
 *
 * Uses a stub `fetch` to intercept calls; the conformance Twilio corpus does
 * NOT cover this surface, so wire-shape is the only verification gate.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { Client } from '../src/index.js';

const ACCOUNT_SID = 'AC' + 'f'.repeat(32);
const API_KEY = 'secret-key-1234';
const BASE = 'https://voiceml.voicetel.com';

// Prefixed-string identifiers (Assistants v1 does not use 34-char hex sids).
const ASST_ID = 'aia_asst_test123';
const TOOL_ID = 'aia_tool_test123';
const KNOW_ID = 'aia_know_test123';
const MSG_ID = 'aia_msg_test123';
const FDBK_ID = 'aia_fdbk_test123';
const PLCY_ID = 'aia_plcy_test123';
const SESSION_ID = 'sess_test123';

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

function parseJsonBody(init: RequestInit): Record<string, unknown> {
  expect(init.body).toBeDefined();
  expect(typeof init.body).toBe('string');
  return JSON.parse(init.body as string) as Record<string, unknown>;
}

afterEach(() => vi.restoreAllMocks());

// ===========================================================================
// Wire on the client
// ===========================================================================

describe('assistantsV1 is wired on the client', () => {
  it('exposes the five sub-resources', () => {
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY });
    expect(c.assistantsV1).toBeDefined();
    expect(typeof c.assistantsV1.assistants).toBe('function');
    expect(c.assistantsV1.tools).toBeDefined();
    expect(typeof c.assistantsV1.knowledge).toBe('function');
    expect(typeof c.assistantsV1.sessions).toBe('function');
    expect(c.assistantsV1.policies).toBeDefined();
  });
});

// ===========================================================================
// /v1/Assistants — CRUD (5 ops)
// ===========================================================================

describe('Assistants v1 — /v1/Assistants CRUD', () => {
  const ASST = {
    account_sid: ACCOUNT_SID,
    customer_ai: {},
    id: ASST_ID,
    model: 'gpt-4o',
    name: 'support',
    owner: 'team@example.com',
    personality_prompt: 'Be helpful.',
    url: `${BASE}/v1/Assistants/${ASST_ID}`,
    date_created: '2026-06-27T10:00:00Z',
    date_updated: '2026-06-27T10:00:00Z',
  };

  it('list reaches /v1/Assistants (no account prefix), JSON body absent', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ assistants: [ASST], meta: metaEnvelope() }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const page = await c.assistantsV1.assistants.list({ PageSize: 25 });
    expect(calls[0].url).toBe(`${BASE}/v1/Assistants?PageSize=25`);
    expect(calls[0].init.method).toBe('GET');
    expect(calls[0].init.body).toBeUndefined();
    expect(page.assistants[0].id).toBe(ASST_ID);
  });

  it('create POSTs JSON body to /v1/Assistants', async () => {
    const { fetch, calls } = fakeFetch([jsonResponse(ASST, 201)]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.assistantsV1.assistants.create({
      name: 'support',
      owner: 'team@example.com',
      personality_prompt: 'Be helpful.',
      model: 'gpt-4o',
      customer_ai: { perception_engine_enabled: true },
    });
    expect(calls[0].url).toBe(`${BASE}/v1/Assistants`);
    expect(calls[0].init.method).toBe('POST');
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    const body = parseJsonBody(calls[0].init);
    expect(body.name).toBe('support');
    expect(body.model).toBe('gpt-4o');
    expect(body.customer_ai).toEqual({ perception_engine_enabled: true });
  });

  it('fetch hits /v1/Assistants/{id}', async () => {
    const expanded = { ...ASST, tools: [], knowledge: [] };
    const { fetch, calls } = fakeFetch([jsonResponse(expanded)]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const r = await c.assistantsV1.assistants.fetch(ASST_ID);
    expect(calls[0].url).toBe(`${BASE}/v1/Assistants/${ASST_ID}`);
    expect(calls[0].init.method).toBe('GET');
    expect(r.tools).toEqual([]);
    expect(r.knowledge).toEqual([]);
  });

  it('update uses PUT with JSON body', async () => {
    const { fetch, calls } = fakeFetch([jsonResponse(ASST)]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.assistantsV1.assistants.update(ASST_ID, { name: 'renamed' });
    expect(calls[0].url).toBe(`${BASE}/v1/Assistants/${ASST_ID}`);
    expect(calls[0].init.method).toBe('PUT');
    const body = parseJsonBody(calls[0].init);
    expect(body.name).toBe('renamed');
  });

  it('delete uses DELETE and returns void', async () => {
    const { fetch, calls } = fakeFetch([noContentResponse()]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.assistantsV1.assistants.delete(ASST_ID);
    expect(calls[0].url).toBe(`${BASE}/v1/Assistants/${ASST_ID}`);
    expect(calls[0].init.method).toBe('DELETE');
  });
});

// ===========================================================================
// /v1/Tools — top-level CRUD + assistant-scoped list/attach/detach (8 ops)
// ===========================================================================

describe('Assistants v1 — /v1/Tools (top-level CRUD + nested attach/detach)', () => {
  const TOOL = {
    account_sid: ACCOUNT_SID,
    description: 'lookup',
    enabled: true,
    id: TOOL_ID,
    meta: {},
    name: 'crm-lookup',
    requires_auth: false,
    type: 'webhook',
    url: `${BASE}/v1/Tools/${TOOL_ID}`,
    date_created: '2026-06-27T10:00:00Z',
    date_updated: '2026-06-27T10:00:00Z',
  };

  it('top-level CRUD (list/create/fetch/update/delete) reaches /v1/Tools*', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ tools: [TOOL], meta: metaEnvelope() }),
      jsonResponse(TOOL, 201),
      jsonResponse({ ...TOOL, policies: [] }),
      jsonResponse(TOOL),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.assistantsV1.tools.list({ AssistantId: ASST_ID, PageSize: 10 });
    expect(calls[0].url).toBe(
      `${BASE}/v1/Tools?AssistantId=${ASST_ID}&PageSize=10`,
    );

    await c.assistantsV1.tools.create({
      name: 'crm-lookup',
      type: 'webhook',
      enabled: true,
    });
    expect(calls[1].init.method).toBe('POST');
    const body = parseJsonBody(calls[1].init);
    expect(body.name).toBe('crm-lookup');
    expect(body.type).toBe('webhook');
    expect(body.enabled).toBe(true);

    const fetched = await c.assistantsV1.tools.fetch(TOOL_ID);
    expect(calls[2].url).toBe(`${BASE}/v1/Tools/${TOOL_ID}`);
    expect(fetched.policies).toEqual([]);

    await c.assistantsV1.tools.update(TOOL_ID, { enabled: false });
    expect(calls[3].init.method).toBe('PUT');
    const upd = parseJsonBody(calls[3].init);
    expect(upd.enabled).toBe(false);

    await c.assistantsV1.tools.delete(TOOL_ID);
    expect(calls[4].init.method).toBe('DELETE');
  });

  it('nested factory: assistants(id).tools.list/attach/detach', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ tools: [TOOL], meta: metaEnvelope() }),
      noContentResponse(),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const tools = c.assistantsV1.assistants(ASST_ID).tools;

    await tools.list();
    expect(calls[0].url).toBe(`${BASE}/v1/Assistants/${ASST_ID}/Tools`);
    expect(calls[0].init.method).toBe('GET');

    await tools.attach(TOOL_ID);
    expect(calls[1].url).toBe(
      `${BASE}/v1/Assistants/${ASST_ID}/Tools/${TOOL_ID}`,
    );
    expect(calls[1].init.method).toBe('POST');

    await tools.detach(TOOL_ID);
    expect(calls[2].url).toBe(
      `${BASE}/v1/Assistants/${ASST_ID}/Tools/${TOOL_ID}`,
    );
    expect(calls[2].init.method).toBe('DELETE');
  });
});

// ===========================================================================
// /v1/Knowledge — top-level CRUD + Status/Chunks + assistant attach/detach (10)
// ===========================================================================

describe('Assistants v1 — /v1/Knowledge (CRUD + Status + Chunks + nested)', () => {
  const KNOW = {
    description: 'FAQs',
    id: KNOW_ID,
    account_sid: ACCOUNT_SID,
    name: 'product-faq',
    type: 'url',
    url: `${BASE}/v1/Knowledge/${KNOW_ID}`,
    date_created: '2026-06-27T10:00:00Z',
    date_updated: '2026-06-27T10:00:00Z',
  };

  it('top-level CRUD on /v1/Knowledge*', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ knowledge: [KNOW], meta: metaEnvelope() }),
      jsonResponse(KNOW, 201),
      jsonResponse(KNOW),
      jsonResponse(KNOW),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.assistantsV1.knowledge.list({ AssistantId: ASST_ID });
    expect(calls[0].url).toBe(`${BASE}/v1/Knowledge?AssistantId=${ASST_ID}`);

    await c.assistantsV1.knowledge.create({ name: 'product-faq', type: 'url' });
    expect(calls[1].init.method).toBe('POST');
    const create = parseJsonBody(calls[1].init);
    expect(create.name).toBe('product-faq');
    expect(create.type).toBe('url');

    await c.assistantsV1.knowledge.fetch(KNOW_ID);
    expect(calls[2].url).toBe(`${BASE}/v1/Knowledge/${KNOW_ID}`);

    await c.assistantsV1.knowledge.update(KNOW_ID, { description: 'updated' });
    expect(calls[3].init.method).toBe('PUT');
    const update = parseJsonBody(calls[3].init);
    expect(update.description).toBe('updated');

    await c.assistantsV1.knowledge.delete(KNOW_ID);
    expect(calls[4].init.method).toBe('DELETE');
  });

  it('knowledge(id).status.fetch hits /v1/Knowledge/{id}/Status', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({
        account_sid: ACCOUNT_SID,
        status: 'COMPLETED',
        last_status: 'PROCESSING',
        date_updated: '2026-06-27T10:00:00Z',
      }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const r = await c.assistantsV1.knowledge(KNOW_ID).status.fetch();
    expect(calls[0].url).toBe(`${BASE}/v1/Knowledge/${KNOW_ID}/Status`);
    expect(calls[0].init.method).toBe('GET');
    expect(r.status).toBe('COMPLETED');
  });

  it('knowledge(id).chunks.list hits /v1/Knowledge/{id}/Chunks', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ chunks: [], meta: metaEnvelope() }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.assistantsV1.knowledge(KNOW_ID).chunks.list({ PageSize: 5 });
    expect(calls[0].url).toBe(
      `${BASE}/v1/Knowledge/${KNOW_ID}/Chunks?PageSize=5`,
    );
    expect(calls[0].init.method).toBe('GET');
  });

  it('nested factory: assistants(id).knowledge.list/attach/detach', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ knowledge: [KNOW], meta: metaEnvelope() }),
      noContentResponse(),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const k = c.assistantsV1.assistants(ASST_ID).knowledge;

    await k.list();
    expect(calls[0].url).toBe(`${BASE}/v1/Assistants/${ASST_ID}/Knowledge`);

    await k.attach(KNOW_ID);
    expect(calls[1].url).toBe(
      `${BASE}/v1/Assistants/${ASST_ID}/Knowledge/${KNOW_ID}`,
    );
    expect(calls[1].init.method).toBe('POST');

    await k.detach(KNOW_ID);
    expect(calls[2].url).toBe(
      `${BASE}/v1/Assistants/${ASST_ID}/Knowledge/${KNOW_ID}`,
    );
    expect(calls[2].init.method).toBe('DELETE');
  });
});

// ===========================================================================
// /v1/Sessions + /v1/Sessions/{id}/Messages — read-only (3 ops)
// ===========================================================================

describe('Assistants v1 — /v1/Sessions (list, fetch, messages.list)', () => {
  const SESS = {
    id: SESSION_ID,
    account_sid: ACCOUNT_SID,
    assistant_id: ASST_ID,
    verified: false,
    identity: 'user-1',
    date_created: '2026-06-27T10:00:00Z',
    date_updated: '2026-06-27T10:00:00Z',
  };

  it('list/fetch hit /v1/Sessions*', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ sessions: [SESS], meta: metaEnvelope() }),
      jsonResponse(SESS),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.assistantsV1.sessions.list();
    expect(calls[0].url).toBe(`${BASE}/v1/Sessions`);
    expect(calls[0].init.method).toBe('GET');

    await c.assistantsV1.sessions.fetch(SESSION_ID);
    expect(calls[1].url).toBe(`${BASE}/v1/Sessions/${SESSION_ID}`);
    expect(calls[1].init.method).toBe('GET');
  });

  it('sessions(id).messages.list hits /v1/Sessions/{id}/Messages', async () => {
    const MSG = {
      id: MSG_ID,
      account_sid: ACCOUNT_SID,
      assistant_id: ASST_ID,
      session_id: SESSION_ID,
      identity: 'user-1',
      role: 'user',
      content: { text: 'hello' },
      date_created: '2026-06-27T10:00:00Z',
      date_updated: '2026-06-27T10:00:00Z',
    };
    const { fetch, calls } = fakeFetch([
      jsonResponse({ messages: [MSG], meta: metaEnvelope() }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.assistantsV1.sessions(SESSION_ID).messages.list({ PageSize: 50 });
    expect(calls[0].url).toBe(
      `${BASE}/v1/Sessions/${SESSION_ID}/Messages?PageSize=50`,
    );
    expect(calls[0].init.method).toBe('GET');
  });
});

// ===========================================================================
// /v1/Assistants/{id}/Messages — send (1 op)
// ===========================================================================

describe('Assistants v1 — send a message to an Assistant', () => {
  it('assistants(id).messages.create POSTs JSON to /Messages and returns SendMessageResponse', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({
        status: 'completed',
        flagged: false,
        aborted: false,
        session_id: SESSION_ID,
        account_sid: ACCOUNT_SID,
        body: 'Hello back!',
      }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const r = await c.assistantsV1.assistants(ASST_ID).messages.create({
      identity: 'user-1',
      body: 'Hello?',
      session_id: SESSION_ID,
    });
    expect(calls[0].url).toBe(`${BASE}/v1/Assistants/${ASST_ID}/Messages`);
    expect(calls[0].init.method).toBe('POST');
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    const body = parseJsonBody(calls[0].init);
    expect(body.identity).toBe('user-1');
    expect(body.body).toBe('Hello?');
    expect(body.session_id).toBe(SESSION_ID);
    expect(r.status).toBe('completed');
    expect(r.session_id).toBe(SESSION_ID);
    expect(r.body).toBe('Hello back!');
  });
});

// ===========================================================================
// /v1/Assistants/{id}/Feedbacks — list/create (2 ops)
// ===========================================================================

describe('Assistants v1 — /v1/Assistants/{id}/Feedbacks', () => {
  const FDBK = {
    assistant_id: ASST_ID,
    id: FDBK_ID,
    account_sid: ACCOUNT_SID,
    message_id: MSG_ID,
    score: 0.9,
    session_id: SESSION_ID,
    text: 'great',
    date_created: '2026-06-27T10:00:00Z',
    date_updated: '2026-06-27T10:00:00Z',
  };

  it('list and create reach the assistant-scoped Feedbacks path', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ feedbacks: [FDBK], meta: metaEnvelope() }),
      jsonResponse(FDBK, 201),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const fb = c.assistantsV1.assistants(ASST_ID).feedbacks;

    await fb.list({ PageSize: 25 });
    expect(calls[0].url).toBe(
      `${BASE}/v1/Assistants/${ASST_ID}/Feedbacks?PageSize=25`,
    );
    expect(calls[0].init.method).toBe('GET');

    await fb.create({ session_id: SESSION_ID, score: 0.9, text: 'great' });
    expect(calls[1].url).toBe(`${BASE}/v1/Assistants/${ASST_ID}/Feedbacks`);
    expect(calls[1].init.method).toBe('POST');
    const headers = calls[1].init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    const body = parseJsonBody(calls[1].init);
    expect(body.session_id).toBe(SESSION_ID);
    expect(body.score).toBe(0.9);
    expect(body.text).toBe('great');
  });
});

// ===========================================================================
// /v1/Policies — list (1 op)
// ===========================================================================

describe('Assistants v1 — /v1/Policies', () => {
  it('list hits /v1/Policies and honors ToolId/KnowledgeId filters', async () => {
    const POL = {
      id: PLCY_ID,
      type: 'rest_api',
      policy_details: {},
      date_created: '2026-06-27T10:00:00Z',
      date_updated: '2026-06-27T10:00:00Z',
    };
    const { fetch, calls } = fakeFetch([
      jsonResponse({ policies: [POL], meta: metaEnvelope() }),
      jsonResponse({ policies: [POL], meta: metaEnvelope() }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.assistantsV1.policies.list();
    expect(calls[0].url).toBe(`${BASE}/v1/Policies`);
    expect(calls[0].init.method).toBe('GET');

    await c.assistantsV1.policies.list({ ToolId: TOOL_ID, KnowledgeId: KNOW_ID });
    expect(calls[1].url).toBe(
      `${BASE}/v1/Policies?ToolId=${TOOL_ID}&KnowledgeId=${KNOW_ID}`,
    );
  });
});
