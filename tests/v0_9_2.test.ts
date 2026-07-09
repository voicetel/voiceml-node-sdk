/**
 * Wire-shape tests for the v0.9.2 surface: per-product host routing, Messaging
 * Service, and Pricing v1/v2.
 *
 * Messaging Service must ride `messaging.voicetel.com` (that host is what
 * disambiguates it from Conversation Service on the shared `/v1/Services`
 * path). Pricing rides the default host. Host derivation is unit-tested
 * directly. Uses a stub `fetch` to intercept calls.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { Client, resolveProductBaseUrls } from '../src/index.js';

const ACCOUNT_SID = 'AC' + 'f'.repeat(32);
const API_KEY = 'secret-key-1234';
const BASE = 'https://voiceml.voicetel.com';
const MSG = 'https://messaging.voicetel.com';
const CONV = 'https://conversations.voicetel.com';

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

function hostOf(url: string): string {
  return new URL(url).host;
}

afterEach(() => vi.restoreAllMocks());

// ===========================================================================
// Host resolution
// ===========================================================================

describe('Per-product host derivation', () => {
  it('derives messaging + conversations from the default host', () => {
    const urls = resolveProductBaseUrls(BASE);
    expect(urls.default).toBe(BASE);
    expect(urls.messaging).toBe(MSG);
    expect(urls.conversations).toBe(CONV);
  });

  it('swaps the voiceml label on a regional host', () => {
    const urls = resolveProductBaseUrls('https://east-1.us.voiceml.voicetel.com');
    expect(urls.default).toBe('https://east-1.us.voiceml.voicetel.com');
    expect(urls.messaging).toBe('https://east-1.us.messaging.voicetel.com');
    expect(urls.conversations).toBe('https://east-1.us.conversations.voicetel.com');
  });

  it('falls back to a single host for a self-hosted base URL', () => {
    // A custom host has no `voiceml` label to swap — every product stays on it.
    const urls = resolveProductBaseUrls('https://pbx.acme.com');
    expect(urls.default).toBe('https://pbx.acme.com');
    expect(urls.messaging).toBe('https://pbx.acme.com');
    expect(urls.conversations).toBe('https://pbx.acme.com');
  });

  it('lets explicit overrides win', () => {
    const urls = resolveProductBaseUrls(
      'https://pbx.acme.com',
      'https://msg.acme.com',
      'https://conv.acme.com/',
    );
    expect(urls.default).toBe('https://pbx.acme.com');
    expect(urls.messaging).toBe('https://msg.acme.com');
    expect(urls.conversations).toBe('https://conv.acme.com');
  });
});

describe('v0.9.2 resources wired on the client', () => {
  it('exposes messagingV1 + pricing', () => {
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY });
    expect(c.messagingV1.services).toBeDefined();
    expect(c.pricing.v1.voice.countries).toBeDefined();
    expect(c.pricing.v1.voice.numbers).toBeDefined();
    expect(c.pricing.v1.messaging.countries).toBeDefined();
    expect(c.pricing.v1.phoneNumbers.countries).toBeDefined();
    expect(c.pricing.v2.voice.countries).toBeDefined();
    expect(c.pricing.v2.voice.numbers).toBeDefined();
    expect(c.pricing.v2.trunking.countries).toBeDefined();
    expect(c.pricing.v2.trunking.numbers).toBeDefined();
  });
});

// ===========================================================================
// Messaging Service — CRUD on the messaging host
// ===========================================================================

function messagingServicePayload(sid: string = 'MG' + '0'.repeat(32)) {
  return {
    sid,
    account_sid: ACCOUNT_SID,
    friendly_name: 'alerts',
    inbound_request_url: 'https://example.com/in',
    sticky_sender: true,
    date_created: '2026-07-08T00:00:00Z',
    date_updated: '2026-07-08T00:00:00Z',
    url: `${MSG}/v1/Services/${sid}`,
  };
}

describe('Messaging Service CRUD on the messaging host', () => {
  it('routes create/list/fetch/update/delete to messaging.voicetel.com', async () => {
    const sid = 'MG' + '1'.repeat(32);
    const { fetch, calls } = fakeFetch([
      jsonResponse(messagingServicePayload(sid), 201),
      jsonResponse({ services: [messagingServicePayload(sid)], meta: null }),
      jsonResponse(messagingServicePayload(sid)),
      jsonResponse(messagingServicePayload(sid)),
      noContentResponse(),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const created = await c.messagingV1.services.create({
      FriendlyName: 'alerts',
      InboundRequestUrl: 'https://example.com/in',
      StickySender: true,
    });
    const listed = await c.messagingV1.services.list({ PageSize: 25 });
    const fetched = await c.messagingV1.services.fetch(sid);
    const updated = await c.messagingV1.services.update(sid, {
      FriendlyName: 'renamed',
    });
    await c.messagingV1.services.delete(sid);

    expect(created.sid).toBe(sid);
    expect(created.sid?.startsWith('MG')).toBe(true);
    expect(listed.services).toHaveLength(1);
    expect(fetched.sid).toBe(sid);
    expect(updated.sid).toBe(sid);

    // Every request must have hit the messaging host, not the default one.
    expect(calls.every((call) => hostOf(call.url) === 'messaging.voicetel.com')).toBe(true);

    expect(calls[0].url).toBe(`${MSG}/v1/Services`);
    expect(calls[0].init.method).toBe('POST');
    const createBody = calls[0].init.body as URLSearchParams;
    expect(createBody.get('FriendlyName')).toBe('alerts');
    expect(createBody.get('InboundRequestUrl')).toBe('https://example.com/in');
    expect(createBody.get('StickySender')).toBe('true');

    expect(calls[1].url).toBe(`${MSG}/v1/Services?PageSize=25`);
    expect(calls[2].url).toBe(`${MSG}/v1/Services/${sid}`);

    expect(calls[3].url).toBe(`${MSG}/v1/Services/${sid}`);
    expect(calls[3].init.method).toBe('POST');
    const updateBody = calls[3].init.body as URLSearchParams;
    expect([...updateBody.entries()]).toEqual([['FriendlyName', 'renamed']]);

    expect(calls[4].url).toBe(`${MSG}/v1/Services/${sid}`);
    expect(calls[4].init.method).toBe('DELETE');
  });

  it('honors an explicit messagingBaseUrl override', async () => {
    const { fetch, calls } = fakeFetch([jsonResponse({ services: [], meta: null })]);
    const c = new Client({
      accountSid: ACCOUNT_SID,
      apiKey: API_KEY,
      baseUrl: 'https://pbx.acme.com',
      messagingBaseUrl: 'https://msg.acme.com',
      fetch,
    });
    await c.messagingV1.services.list();
    expect(hostOf(calls[0].url)).toBe('msg.acme.com');
  });
});

// ===========================================================================
// Pricing v1/v2 — read-only on the default host
// ===========================================================================

describe('Pricing v1 voice countries + number', () => {
  it('lists countries, fetches a country, fetches a number (default host)', async () => {
    const countries = {
      countries: [
        { country: 'United States', iso_country: 'US', url: `${BASE}/v1/Voice/Countries/US` },
      ],
      meta: { page: 0, page_size: 50 },
    };
    const country = {
      country: 'United States',
      iso_country: 'US',
      outbound_prefix_prices: [
        {
          prefixes: ['1'],
          base_price: '0.013',
          current_price: '0.013',
          friendly_name: 'United States & Canada',
        },
      ],
      inbound_call_prices: [
        { base_price: '0.0085', current_price: '0.0085', number_type: 'local' },
      ],
      price_unit: 'USD',
      url: `${BASE}/v1/Voice/Countries/US`,
    };
    const number = {
      number: '+18005551234',
      country: 'United States',
      iso_country: 'US',
      outbound_call_price: { base_price: '0.013', current_price: '0.013' },
      inbound_call_price: {
        base_price: '0.0085',
        current_price: '0.0085',
        number_type: 'toll free',
      },
      price_unit: 'USD',
      url: `${BASE}/v1/Voice/Numbers/+18005551234`,
    };
    const { fetch, calls } = fakeFetch([
      jsonResponse(countries),
      jsonResponse(country),
      jsonResponse(number),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const listed = await c.pricing.v1.voice.countries.list();
    const fetched = await c.pricing.v1.voice.countries.fetch('US');
    const num = await c.pricing.v1.voice.numbers.fetch('+18005551234');

    expect(listed.countries[0].iso_country).toBe('US');
    expect(fetched.outbound_prefix_prices[0].prefixes).toEqual(['1']);
    expect(num.inbound_call_price?.number_type).toBe('toll free');

    expect(calls.every((call) => hostOf(call.url) === 'voiceml.voicetel.com')).toBe(true);
    expect(calls[0].url).toBe(`${BASE}/v1/Voice/Countries`);
    expect(calls[1].url).toBe(`${BASE}/v1/Voice/Countries/US`);
    // E.164 `+` must be percent-encoded in the path segment.
    expect(calls[2].url).toBe(`${BASE}/v1/Voice/Numbers/%2B18005551234`);
  });
});

describe('Pricing v2 voice number with origination', () => {
  it('URL-encodes the number path and origination query', async () => {
    const payload = {
      destination_number: '+18005551234',
      origination_number: '+15551112222',
      country: 'United States',
      iso_country: 'US',
      outbound_call_prices: [
        { origination_prefixes: ['1'], base_price: '0.013', current_price: '0.013' },
      ],
      inbound_call_price: {
        base_price: '0.0085',
        current_price: '0.0085',
        number_type: 'local',
      },
      price_unit: 'USD',
      url: `${BASE}/v2/Voice/Numbers/+18005551234`,
    };
    const { fetch, calls } = fakeFetch([jsonResponse(payload)]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const got = await c.pricing.v2.voice.numbers.fetch('+18005551234', {
      originationNumber: '+15551112222',
    });
    expect(got.origination_number).toBe('+15551112222');
    expect(calls[0].url).toBe(
      `${BASE}/v2/Voice/Numbers/%2B18005551234?OriginationNumber=%2B15551112222`,
    );
    expect(hostOf(calls[0].url)).toBe('voiceml.voicetel.com');
  });
});

describe('Pricing v2 trunking country', () => {
  it('fetches a trunking country on the default host', async () => {
    const payload = {
      country: 'United States',
      iso_country: 'US',
      terminating_prefix_prices: [
        {
          origination_prefixes: ['1'],
          destination_prefixes: ['1'],
          base_price: '0.013',
          current_price: '0.013',
          friendly_name: 'US',
        },
      ],
      originating_call_prices: [
        { base_price: '0.0085', current_price: '0.0085', number_type: 'local' },
      ],
      price_unit: 'USD',
      url: `${BASE}/v2/Trunking/Countries/US`,
    };
    const { fetch, calls } = fakeFetch([jsonResponse(payload)]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const got = await c.pricing.v2.trunking.countries.fetch('US');
    expect(got.terminating_prefix_prices[0].friendly_name).toBe('US');
    expect(calls[0].url).toBe(`${BASE}/v2/Trunking/Countries/US`);
    expect(hostOf(calls[0].url)).toBe('voiceml.voicetel.com');
  });

  it('lists pricing messaging countries on the default host', async () => {
    const { fetch, calls } = fakeFetch([jsonResponse({ countries: [], meta: null })]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const listed = await c.pricing.v1.messaging.countries.list();
    expect(listed.countries).toEqual([]);
    expect(hostOf(calls[0].url)).toBe('voiceml.voicetel.com');
  });
});
