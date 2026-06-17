/** Wire-shape tests for the Routes V2 (Inbound Processing Region) API. */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { Client } from '../src/index.js';

const ACCOUNT_SID = 'AC' + 'f'.repeat(32);
const API_KEY = 'secret-key-1234';
const BASE = 'https://voiceml.voicetel.com';
const DOMAIN_NAME = 'ingress.example.com';
const QQ_SID = 'QQ' + '0'.repeat(32);

interface CapturedCall {
  url: string;
  init: RequestInit;
}

function fakeFetch(responses: Array<Response>): { fetch: typeof fetch; calls: CapturedCall[] } {
  const calls: CapturedCall[] = [];
  let i = 0;
  const fn = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    calls.push({ url, init });
    const next = responses[i++];
    if (!next) throw new Error(`fakeFetch: out of responses`);
    return next;
  });
  return { fetch: fn as unknown as typeof fetch, calls };
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function payload() {
  return {
    sid: QQ_SID,
    sip_domain: DOMAIN_NAME,
    account_sid: ACCOUNT_SID,
    friendly_name: 'ingress',
    voice_region: 'us1',
    url: `${BASE}/v2/SipDomains/${DOMAIN_NAME}`,
    date_created: '2026-06-17T20:00:00Z',
    date_updated: '2026-06-17T20:00:00Z',
  };
}

afterEach(() => vi.restoreAllMocks());

describe('Routes V2 SIP Domains', () => {
  it('routesV2 is wired on the client', () => {
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY });
    expect(c.routesV2).toBeDefined();
    expect(c.routesV2.sipDomains).toBeDefined();
  });

  it('fetch routes to /v2/SipDomains/{name} with no account prefix', async () => {
    const { fetch, calls } = fakeFetch([jsonResponse(payload())]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    const rv = await c.routesV2.sipDomains.fetch(DOMAIN_NAME);
    expect(rv.sid).toBe(QQ_SID);
    expect(rv.voice_region).toBe('us1');
    expect(calls[0].url).toBe(`${BASE}/v2/SipDomains/${DOMAIN_NAME}`);
    expect(calls[0].url).not.toContain(ACCOUNT_SID);
  });

  it('update sends VoiceRegion + FriendlyName as form body', async () => {
    const { fetch, calls } = fakeFetch([jsonResponse(payload())]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.routesV2.sipDomains.update(DOMAIN_NAME, {
      VoiceRegion: 'ie1',
      FriendlyName: 'renamed',
    });
    const body = calls[0].init.body as URLSearchParams;
    expect(body.get('VoiceRegion')).toBe('ie1');
    expect(body.get('FriendlyName')).toBe('renamed');
    expect(calls[0].init.method).toBe('POST');
  });

  it('update accepts partial body (VoiceRegion only)', async () => {
    const { fetch, calls } = fakeFetch([jsonResponse(payload())]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.routesV2.sipDomains.update(DOMAIN_NAME, { VoiceRegion: 'us1' });
    const body = calls[0].init.body as URLSearchParams;
    expect(body.get('VoiceRegion')).toBe('us1');
    expect(Array.from(body.keys())).toEqual(['VoiceRegion']);
  });
});
