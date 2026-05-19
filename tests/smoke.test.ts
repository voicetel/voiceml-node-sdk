/**
 * Smoke tests — verify the SDK constructs, sends well-formed requests, and maps response
 * status codes to the right exception subclasses. Uses a stub `fetch` to intercept calls;
 * never hits the network.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  ApiError,
  AuthenticationError,
  Client,
  ConfigurationError,
  NotFoundError,
  NotImplementedAPIError,
  RateLimitError,
  VERSION,
  type CreateCallRequest,
  type StartStreamRequest,
} from '../src/index.js';

const ACCOUNT_SID = 'AC' + 'f'.repeat(32);
const API_KEY = 'secret-key-1234';
const BASE = 'https://voiceml.voicetel.com';

interface CapturedCall {
  url: string;
  init: RequestInit;
}

function fakeFetch(responses: Array<Response | (() => Response)>): {
  fetch: typeof fetch;
  calls: CapturedCall[];
} {
  const calls: CapturedCall[] = [];
  let i = 0;
  const fn = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    calls.push({ url, init });
    const next = responses[i++];
    if (!next) throw new Error(`fakeFetch: out of responses (${i - 1} consumed)`);
    return typeof next === 'function' ? next() : next;
  });
  return { fetch: fn as unknown as typeof fetch, calls };
}

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function callPayload(sid: string = 'CA' + '0'.repeat(32)) {
  return {
    sid,
    account_sid: ACCOUNT_SID,
    api_version: '2010-04-01',
    status: 'queued',
    direction: 'outbound-api',
    date_created: 'Mon, 19 May 2026 12:00:00 +0000',
    date_updated: 'Mon, 19 May 2026 12:00:00 +0000',
    uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/Calls/${sid}.json`,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('module surface', () => {
  it('exports the right version', () => {
    expect(VERSION).toBe('0.4.0');
  });

  it('requires accountSid + apiKey', () => {
    expect(() => new Client({ accountSid: '', apiKey: API_KEY })).toThrow(ConfigurationError);
    expect(() => new Client({ accountSid: ACCOUNT_SID, apiKey: '' })).toThrow(ConfigurationError);
  });

  it('wires up all resource groups', () => {
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY });
    expect(c.calls).toBeDefined();
    expect(c.conferences).toBeDefined();
    expect(c.queues).toBeDefined();
    expect(c.applications).toBeDefined();
    expect(c.recordings).toBeDefined();
    expect(c.diagnostics).toBeDefined();
    expect(c.accountSid).toBe(ACCOUNT_SID);
    expect(c.baseUrl).toBe(BASE);
  });
});

describe('calls.create', () => {
  it('sends form-urlencoded body + Basic auth', async () => {
    const { fetch, calls } = fakeFetch([jsonResponse(callPayload(), 201)]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const body: CreateCallRequest = {
      To: '+18005551234',
      From: '+18005550000',
      Url: 'https://example.com/twiml',
    };
    const call = await c.calls.create(body);
    expect(call.sid.startsWith('CA')).toBe(true);

    expect(calls).toHaveLength(1);
    const [{ url, init }] = calls;
    expect(url).toBe(`${BASE}/2010-04-01/Accounts/${ACCOUNT_SID}/Calls`);
    expect(init.method).toBe('POST');

    const headers = init.headers as Record<string, string>;
    const expectedAuth = 'Basic ' + Buffer.from(`${ACCOUNT_SID}:${API_KEY}`).toString('base64');
    expect(headers.Authorization).toBe(expectedAuth);

    const params = init.body as URLSearchParams;
    expect(params).toBeInstanceOf(URLSearchParams);
    expect(params.get('To')).toBe('+18005551234');
    expect(params.get('From')).toBe('+18005550000');
    expect(params.get('Url')).toBe('https://example.com/twiml');
  });
});

describe('calls.list', () => {
  it('round-trips Twilio-shape filter params including StartTime>= and StartTime<=', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({
        calls: [callPayload()],
        page: 0,
        page_size: 50,
        total: 1,
        next_page_uri: null,
        uri: '/Calls',
      }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const result = await c.calls.list({
      Status: 'completed',
      startTimeGte: '2026-01-01',
      startTimeLte: '2026-12-31',
      PageSize: 10,
    });
    expect(result.calls).toHaveLength(1);

    const url = new URL(calls[0]!.url);
    expect(url.searchParams.get('Status')).toBe('completed');
    expect(url.searchParams.get('StartTime>=')).toBe('2026-01-01');
    expect(url.searchParams.get('StartTime<=')).toBe('2026-12-31');
    expect(url.searchParams.get('PageSize')).toBe('10');
  });
});

describe('calls.update', () => {
  it('sends Status=completed to terminate', async () => {
    const sid = 'CA' + '1'.repeat(32);
    const { fetch, calls } = fakeFetch([
      jsonResponse({ ...callPayload(sid), status: 'completed' }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const result = await c.calls.update(sid, { Status: 'completed' });
    expect(result.status).toBe('completed');

    const params = calls[0]!.init.body as URLSearchParams;
    expect(params.get('Status')).toBe('completed');
  });
});

describe('booleans', () => {
  it('encodes Muted=true / Hold=false as strings', async () => {
    const cfSid = 'CF' + '5'.repeat(32);
    const callSid = 'CA' + '4'.repeat(32);
    const { fetch, calls } = fakeFetch([
      jsonResponse({
        call_sid: callSid,
        conference_sid: cfSid,
        account_sid: ACCOUNT_SID,
        muted: true,
        hold: false,
        start_conference_on_enter: true,
        end_conference_on_exit: false,
        status: 'connected',
        api_version: '2010-04-01',
        uri: '/x',
      }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.conferences.updateParticipant(cfSid, callSid, { Muted: true, Hold: false });

    const params = calls[0]!.init.body as URLSearchParams;
    expect(params.get('Muted')).toBe('true');
    expect(params.get('Hold')).toBe('false');
  });
});

describe('streams.start', () => {
  it('sends Url + Track + Name', async () => {
    const callSid = 'CA' + '6'.repeat(32);
    const { fetch, calls } = fakeFetch([
      jsonResponse(
        {
          sid: 'MZ' + '7'.repeat(32),
          account_sid: ACCOUNT_SID,
          call_sid: callSid,
          status: 'in-progress',
          api_version: '2010-04-01',
          uri: '/x',
        },
        201,
      ),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const body: StartStreamRequest = {
      Url: 'wss://example.com/ws',
      Track: 'both_tracks',
      Name: 'ws-1',
    };
    await c.calls.startStream(callSid, body);

    const params = calls[0]!.init.body as URLSearchParams;
    expect(params.get('Url')).toBe('wss://example.com/ws');
    expect(params.get('Track')).toBe('both_tracks');
    expect(params.get('Name')).toBe('ws-1');
  });
});

describe('error mapping', () => {
  it('maps 401 → AuthenticationError', async () => {
    const sid = 'CA' + '8'.repeat(32);
    const { fetch } = fakeFetch([
      jsonResponse({ code: 20003, message: 'Authentication Error', status: 401 }, 401),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await expect(c.calls.get(sid)).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('maps 404 → NotFoundError', async () => {
    const sid = 'CA' + '9'.repeat(32);
    const { fetch } = fakeFetch([
      jsonResponse({ code: 20404, message: 'Not Found', status: 404 }, 404),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await expect(c.calls.get(sid)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('maps 429 → RateLimitError (no retry when maxRetries=0)', async () => {
    const sid = 'CA' + 'a'.repeat(32);
    const { fetch } = fakeFetch([
      jsonResponse({ code: 20429, message: 'Too Many', status: 429 }, 429),
    ]);
    const c = new Client({
      accountSid: ACCOUNT_SID,
      apiKey: API_KEY,
      fetch,
      maxRetries: 0,
    });

    await expect(c.calls.get(sid)).rejects.toBeInstanceOf(RateLimitError);
  });

  it('maps 501 → NotImplementedAPIError (UserDefinedMessages)', async () => {
    const sid = 'CA' + 'b'.repeat(32);
    const { fetch } = fakeFetch([
      jsonResponse({ code: 20501, message: 'Not Implemented', status: 501 }, 501),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await expect(c.calls.sendUserDefinedMessage(sid, { hello: 'world' })).rejects.toBeInstanceOf(
      NotImplementedAPIError,
    );
  });

  it('ApiError is the catch-all base', async () => {
    const sid = 'QU' + 'c'.repeat(32);
    const { fetch } = fakeFetch([
      jsonResponse(
        { code: 20409, message: 'Queue still has waiting members', status: 409 },
        409,
      ),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    let err: unknown;
    try {
      await c.queues.delete(sid);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).statusCode).toBe(409);
    expect((err as ApiError).code).toBe(20409);
  });
});

describe('retry policy', () => {
  it('retries 503 and succeeds on the second try', async () => {
    const sid = 'CA' + 'd'.repeat(32);
    const { fetch, calls } = fakeFetch([
      new Response('upstream busy', { status: 503 }),
      jsonResponse(callPayload(sid)),
    ]);
    const c = new Client({
      accountSid: ACCOUNT_SID,
      apiKey: API_KEY,
      fetch,
      maxRetries: 1,
    });

    const result = await c.calls.get(sid);
    expect(result.sid).toBe(sid);
    expect(calls).toHaveLength(2);
  });
});

describe('queue create', () => {
  it('sends FriendlyName + MaxSize', async () => {
    const quSid = 'QU' + '3'.repeat(32);
    const { fetch, calls } = fakeFetch([
      jsonResponse(
        {
          sid: quSid,
          account_sid: ACCOUNT_SID,
          friendly_name: 'support',
          current_size: 0,
          max_size: 200,
          average_wait_time: 0,
          date_created: 'x',
          date_updated: 'x',
          uri: '/x',
        },
        201,
      ),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.queues.create({ FriendlyName: 'support', MaxSize: 200 });

    const params = calls[0]!.init.body as URLSearchParams;
    expect(params.get('FriendlyName')).toBe('support');
    expect(params.get('MaxSize')).toBe('200');
  });
});

describe('conferences.end', () => {
  it('defaults to Status=completed when no body is provided', async () => {
    const cfSid = 'CF' + '2'.repeat(32);
    const { fetch, calls } = fakeFetch([
      jsonResponse({
        sid: cfSid,
        account_sid: ACCOUNT_SID,
        friendly_name: 'x',
        status: 'completed',
        api_version: '2010-04-01',
        uri: '/x',
      }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const result = await c.conferences.end(cfSid);
    expect(result.status).toBe('completed');

    const params = calls[0]!.init.body as URLSearchParams;
    expect(params.get('Status')).toBe('completed');
  });
});

describe('recordings.getAudio', () => {
  it('returns the bytes from the .wav endpoint', async () => {
    const reSid = 'RE' + 'e'.repeat(32);
    const wavBytes = new Uint8Array([0x52, 0x49, 0x46, 0x46]); // "RIFF" magic
    const { fetch } = fakeFetch([
      new Response(wavBytes, { status: 200, headers: { 'content-type': 'audio/wav' } }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const audio = await c.recordings.getAudio(reSid);
    expect(audio.sid).toBe(reSid);
    expect(audio.contentType).toBe('audio/wav');
    expect(Array.from(audio.body)).toEqual([0x52, 0x49, 0x46, 0x46]);
  });
});
