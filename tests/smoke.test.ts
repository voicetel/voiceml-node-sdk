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
  type Call,
  type Conference,
  type Recording,
  type Queue,
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
    expect(VERSION).toBe('0.8.0');
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
    expect(c.incomingPhoneNumbers).toBeDefined();
    expect(c.messages).toBeDefined();
    expect(c.notifications).toBeDefined();
    expect(c.sip).toBeDefined();
    expect(c.sip.domains).toBeDefined();
    expect(c.sip.credentialLists).toBeDefined();
    expect(c.sip.ipAccessControlLists).toBeDefined();
    expect(c.sip.domains.auth.calls).toBeDefined();
    expect(c.sip.domains.auth.registrations).toBeDefined();
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
    expect(url).toBe(`${BASE}/2010-04-01/Accounts/${ACCOUNT_SID}/Calls.json`);
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
  it('round-trips Twilio-compatible filter params including StartTime>= and StartTime<=', async () => {
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
  it('returns the bytes from the .wav endpoint (and does NOT append .json)', async () => {
    const reSid = 'RE' + 'e'.repeat(32);
    const wavBytes = new Uint8Array([0x52, 0x49, 0x46, 0x46]); // "RIFF" magic
    const { fetch, calls } = fakeFetch([
      new Response(wavBytes, { status: 200, headers: { 'content-type': 'audio/wav' } }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const audio = await c.recordings.getAudio(reSid);
    expect(audio.sid).toBe(reSid);
    expect(audio.contentType).toBe('audio/wav');
    expect(Array.from(audio.body)).toEqual([0x52, 0x49, 0x46, 0x46]);
    // .wav must NOT have .json appended — and must not be double-suffixed
    expect(calls[0]!.url).toBe(
      `${BASE}/2010-04-01/Accounts/${ACCOUNT_SID}/Recordings/${reSid}.wav`,
    );
    expect(calls[0]!.url.endsWith('.wav')).toBe(true);
    expect(calls[0]!.url.endsWith('.json')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// v0.5.0: `.json` URL suffix coverage across the account-scoped resources.
// ---------------------------------------------------------------------------

describe('.json URL suffix', () => {
  const emptyOk = (body: object) => jsonResponse(body);

  it('appends .json to Calls list and Calls/{sid} get', async () => {
    const sid = 'CA' + '0'.repeat(32);
    const { fetch, calls } = fakeFetch([
      emptyOk({ calls: [], page: 0, page_size: 50, total: 0 }),
      emptyOk(callPayload(sid)),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.calls.list();
    await c.calls.get(sid);

    expect(new URL(calls[0]!.url).pathname).toBe(
      `/2010-04-01/Accounts/${ACCOUNT_SID}/Calls.json`,
    );
    expect(new URL(calls[1]!.url).pathname).toBe(
      `/2010-04-01/Accounts/${ACCOUNT_SID}/Calls/${sid}.json`,
    );
  });

  it('appends .json to Conferences, Queues, Applications, Recordings paths', async () => {
    const cfSid = 'CF' + '1'.repeat(32);
    const quSid = 'QU' + '2'.repeat(32);
    const apSid = 'AP' + '3'.repeat(32);
    const reSid = 'RE' + '4'.repeat(32);
    const { fetch, calls } = fakeFetch([
      emptyOk({ conferences: [], page: 0, page_size: 50 }),
      emptyOk({ sid: cfSid, account_sid: ACCOUNT_SID, friendly_name: 'x', status: 'in-progress', api_version: '2010-04-01', uri: '/x' }),
      emptyOk({ queues: [], page: 0, page_size: 50 }),
      emptyOk({ sid: quSid, account_sid: ACCOUNT_SID, friendly_name: 'x', current_size: 0, max_size: 200, average_wait_time: 0, date_created: 'x', date_updated: 'x', uri: '/x' }),
      emptyOk({ applications: [], page: 0, page_size: 50 }),
      emptyOk({ sid: apSid, account_sid: ACCOUNT_SID, friendly_name: 'x', api_version: '2010-04-01', voice_url: 'https://x', voice_caller_id_lookup: false, date_created: 'x', date_updated: 'x', uri: '/x' }),
      emptyOk({ recordings: [] }),
      emptyOk({ sid: reSid, account_sid: ACCOUNT_SID, call_sid: 'CA' + '0'.repeat(32), status: 'completed' }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.conferences.list();
    await c.conferences.get(cfSid);
    await c.queues.list();
    await c.queues.get(quSid);
    await c.applications.list();
    await c.applications.get(apSid);
    await c.recordings.list();
    await c.recordings.get(reSid);

    for (const call of calls) {
      expect(new URL(call.url).pathname.endsWith('.json')).toBe(true);
      // No double-append.
      expect(new URL(call.url).pathname.endsWith('.json.json')).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// v0.5.0: IncomingPhoneNumbers resource — list/create/get/update/delete.
// ---------------------------------------------------------------------------

function incomingPhoneNumberPayload(
  sid: string = 'PN' + '0'.repeat(32),
  phoneNumber = '+18005551234',
) {
  return {
    sid,
    account_sid: ACCOUNT_SID,
    phone_number: phoneNumber,
    friendly_name: '',
    api_version: '2010-04-01',
    uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/IncomingPhoneNumbers/${sid}.json`,
    voice_url: 'https://example.com/voice',
    voice_method: 'POST' as const,
    voice_fallback_url: '',
    voice_fallback_method: 'POST' as const,
    capabilities: { voice: true, sms: false, mms: false, fax: false },
    date_created: 'Mon, 19 May 2026 12:00:00 +0000',
    date_updated: 'Mon, 19 May 2026 12:00:00 +0000',
  };
}

describe('incomingPhoneNumbers', () => {
  it('list — request URL has .json, response carries pagination envelope', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({
        incoming_phone_numbers: [incomingPhoneNumberPayload()],
        page: 0,
        page_size: 50,
        total: 1,
        num_pages: 1,
        start: 0,
        end: 0,
        first_page_uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/IncomingPhoneNumbers.json?PageSize=50&Page=0`,
        next_page_uri: null,
        previous_page_uri: null,
        uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/IncomingPhoneNumbers.json?PageSize=50&Page=0`,
      }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const result = await c.incomingPhoneNumbers.list({ PhoneNumber: '+18005551234' });

    expect(result.incoming_phone_numbers).toHaveLength(1);
    expect(result.incoming_phone_numbers[0]!.sid.startsWith('PN')).toBe(true);
    expect(result.page).toBe(0);
    expect(result.page_size).toBe(50);
    expect(result.next_page_uri).toBeNull();
    expect(result.first_page_uri).toBeDefined();

    const u = new URL(calls[0]!.url);
    expect(u.pathname).toBe(`/2010-04-01/Accounts/${ACCOUNT_SID}/IncomingPhoneNumbers.json`);
    expect(u.searchParams.get('PhoneNumber')).toBe('+18005551234');
  });

  it('create — POSTs form body and returns PN-prefixed sid', async () => {
    const { fetch, calls } = fakeFetch([jsonResponse(incomingPhoneNumberPayload(), 201)]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const result = await c.incomingPhoneNumbers.create({
      PhoneNumber: '+18005551234',
      VoiceUrl: 'https://example.com/voice',
      VoiceMethod: 'POST',
    });
    expect(result.sid.startsWith('PN')).toBe(true);
    expect(result.phone_number).toBe('+18005551234');
    expect(result.capabilities.voice).toBe(true);
    expect(result.capabilities.sms).toBe(false);

    expect(calls[0]!.init.method).toBe('POST');
    expect(new URL(calls[0]!.url).pathname).toBe(
      `/2010-04-01/Accounts/${ACCOUNT_SID}/IncomingPhoneNumbers.json`,
    );
    const params = calls[0]!.init.body as URLSearchParams;
    expect(params.get('PhoneNumber')).toBe('+18005551234');
    expect(params.get('VoiceUrl')).toBe('https://example.com/voice');
    expect(params.get('VoiceMethod')).toBe('POST');
  });

  it('get — fetches by PN sid with .json suffix', async () => {
    const sid = 'PN' + 'a'.repeat(32);
    const { fetch, calls } = fakeFetch([jsonResponse(incomingPhoneNumberPayload(sid))]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const result = await c.incomingPhoneNumbers.get(sid);
    expect(result.sid).toBe(sid);

    expect(new URL(calls[0]!.url).pathname).toBe(
      `/2010-04-01/Accounts/${ACCOUNT_SID}/IncomingPhoneNumbers/${sid}.json`,
    );
  });

  it('update — POSTs partial body to the {sid}.json endpoint', async () => {
    const sid = 'PN' + 'b'.repeat(32);
    const { fetch, calls } = fakeFetch([jsonResponse(incomingPhoneNumberPayload(sid))]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.incomingPhoneNumbers.update(sid, { VoiceUrl: 'https://new.example.com/voice' });

    expect(calls[0]!.init.method).toBe('POST');
    expect(new URL(calls[0]!.url).pathname).toBe(
      `/2010-04-01/Accounts/${ACCOUNT_SID}/IncomingPhoneNumbers/${sid}.json`,
    );
    const params = calls[0]!.init.body as URLSearchParams;
    expect(params.get('VoiceUrl')).toBe('https://new.example.com/voice');
  });

  it('delete — DELETE on {sid}.json, 204 returns void', async () => {
    const sid = 'PN' + 'c'.repeat(32);
    const { fetch, calls } = fakeFetch([new Response(null, { status: 204 })]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.incomingPhoneNumbers.delete(sid);

    expect(calls[0]!.init.method).toBe('DELETE');
    expect(new URL(calls[0]!.url).pathname).toBe(
      `/2010-04-01/Accounts/${ACCOUNT_SID}/IncomingPhoneNumbers/${sid}.json`,
    );
  });
});

// ---------------------------------------------------------------------------
// v0.5.0: authToken alias for the constructor.
// ---------------------------------------------------------------------------

describe('client — authToken alias', () => {
  it('accepts authToken as a drop-in alias for apiKey', async () => {
    const sid = 'CA' + '1'.repeat(32);
    const { fetch, calls } = fakeFetch([jsonResponse(callPayload(sid))]);
    const c = new Client({ accountSid: ACCOUNT_SID, authToken: API_KEY, fetch });

    const result = await c.calls.get(sid);
    expect(result.sid).toBe(sid);

    // Auth header must be the same as if apiKey had been used.
    const headers = calls[0]!.init.headers as Record<string, string>;
    const expectedAuth = 'Basic ' + Buffer.from(`${ACCOUNT_SID}:${API_KEY}`).toString('base64');
    expect(headers.Authorization).toBe(expectedAuth);
  });

  it('throws ConfigurationError when both apiKey and authToken are passed', () => {
    expect(
      () => new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, authToken: API_KEY }),
    ).toThrow(ConfigurationError);
  });

  it('throws ConfigurationError when neither apiKey nor authToken is passed', () => {
    expect(() => new Client({ accountSid: ACCOUNT_SID })).toThrow(ConfigurationError);
  });
});

// ---------------------------------------------------------------------------
// v0.5.0: ApiError.moreInfo accessor.
// ---------------------------------------------------------------------------

describe('errors — moreInfo accessor', () => {
  it('populates ApiError.moreInfo from the response more_info field', async () => {
    const sid = 'CA' + 'd'.repeat(32);
    const { fetch } = fakeFetch([
      jsonResponse(
        {
          code: 21211,
          message: "Invalid 'To' number format",
          more_info: 'https://www.twilio.com/docs/errors/21211',
          status: 400,
        },
        400,
      ),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    let err: unknown;
    try {
      await c.calls.get(sid);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).moreInfo).toBe('https://www.twilio.com/docs/errors/21211');
    expect((err as ApiError).code).toBe(21211);
    expect((err as ApiError).statusCode).toBe(400);
  });

  it('moreInfo is null when the response body has no more_info field', async () => {
    const sid = 'CA' + 'e'.repeat(32);
    const { fetch } = fakeFetch([
      jsonResponse({ code: 20404, message: 'Not Found', status: 404 }, 404),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    let err: unknown;
    try {
      await c.calls.get(sid);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(NotFoundError);
    expect((err as ApiError).moreInfo).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// v0.6.2: spec sync — Recording.media_url (D5) + IncomingPhoneNumber.type (D6).
// ---------------------------------------------------------------------------

describe('v0.6.2 — Recording.media_url (D5)', () => {
  it('deserializes a Recording with media_url present', async () => {
    const reSid = 'RE' + 'f'.repeat(32);
    const mediaUrl = `https://api.voiceml.example/2010-04-01/Accounts/${ACCOUNT_SID}/Recordings/${reSid}.wav`;
    const { fetch } = fakeFetch([
      jsonResponse({
        sid: reSid,
        account_sid: ACCOUNT_SID,
        call_sid: 'CA' + '0'.repeat(32),
        status: 'completed',
        media_url: mediaUrl,
      }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const rec = await c.recordings.get(reSid);
    expect(rec.sid).toBe(reSid);
    expect(rec.media_url).toBe(mediaUrl);
  });

  it('deserializes a Recording without media_url (field is optional)', async () => {
    const reSid = 'RE' + '1'.repeat(32);
    const { fetch } = fakeFetch([
      jsonResponse({
        sid: reSid,
        account_sid: ACCOUNT_SID,
        call_sid: 'CA' + '0'.repeat(32),
        status: 'completed',
      }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const rec = await c.recordings.get(reSid);
    expect(rec.sid).toBe(reSid);
    expect(rec.media_url).toBeUndefined();
  });
});

describe('v0.6.2 — IncomingPhoneNumber.type (D6)', () => {
  it('deserializes an IncomingPhoneNumber with type field', async () => {
    const sid = 'PN' + '2'.repeat(32);
    const { fetch } = fakeFetch([
      jsonResponse({ ...incomingPhoneNumberPayload(sid), type: '' }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const num = await c.incomingPhoneNumbers.get(sid);
    expect(num.sid).toBe(sid);
    expect(num.type).toBe('');
  });

  it('accepts Twilio enum values for type (local / mobile / toll-free)', async () => {
    const sid = 'PN' + '3'.repeat(32);
    const { fetch } = fakeFetch([
      jsonResponse({ ...incomingPhoneNumberPayload(sid), type: 'toll-free' }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const num = await c.incomingPhoneNumbers.get(sid);
    expect(num.type).toBe('toll-free');
  });
});

// ---------------------------------------------------------------------------
// v0.6.3: Participant coaching fields, Recording.error_code, list filter params.
// ---------------------------------------------------------------------------

describe('v0.6.3 — Participant coaching fields', () => {
  it('deserializes coaching, call_sid_to_coach, and queue_time', async () => {
    const cfSid = 'CF' + '6'.repeat(32);
    const callSid = 'CA' + '6'.repeat(32);
    const coachSid = 'CA' + '7'.repeat(32);
    const { fetch } = fakeFetch([
      jsonResponse({
        call_sid: callSid,
        conference_sid: cfSid,
        account_sid: ACCOUNT_SID,
        muted: false,
        hold: false,
        coaching: true,
        call_sid_to_coach: coachSid,
        queue_time: '12',
        start_conference_on_enter: true,
        end_conference_on_exit: false,
        status: 'connected',
        api_version: '2010-04-01',
        uri: '/x',
      }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const p = await c.conferences.getParticipant(cfSid, callSid);
    expect(p.coaching).toBe(true);
    expect(p.call_sid_to_coach).toBe(coachSid);
    expect(p.queue_time).toBe('12');
  });

  it('accepts complete and failed participant status values', async () => {
    for (const status of ['complete', 'failed'] as const) {
      const cfSid = 'CF' + 'c'.repeat(32);
      const callSid = 'CA' + 'd'.repeat(32);
      const { fetch } = fakeFetch([
        jsonResponse({
          call_sid: callSid,
          conference_sid: cfSid,
          account_sid: ACCOUNT_SID,
          muted: false,
          hold: false,
          coaching: false,
          queue_time: '0',
          start_conference_on_enter: true,
          end_conference_on_exit: false,
          status,
          api_version: '2010-04-01',
          uri: '/x',
        }),
      ]);
      const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
      const p = await c.conferences.getParticipant(cfSid, callSid);
      expect(p.status).toBe(status);
    }
  });
});

describe('v0.6.3 — Recording.error_code + StartConferenceRecordingAPI', () => {
  it('deserializes error_code null and StartConferenceRecordingAPI source', async () => {
    const reSid = 'RE' + '8'.repeat(32);
    const { fetch } = fakeFetch([
      jsonResponse({
        sid: reSid,
        account_sid: ACCOUNT_SID,
        call_sid: 'CA' + '0'.repeat(32),
        status: 'completed',
        source: 'StartConferenceRecordingAPI',
        error_code: null,
      }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const rec = await c.recordings.get(reSid);
    expect(rec.source).toBe('StartConferenceRecordingAPI');
    expect(rec.error_code).toBeNull();
  });

  it('deserializes a non-null error_code', async () => {
    const reSid = 'RE' + '9'.repeat(32);
    const { fetch } = fakeFetch([
      jsonResponse({
        sid: reSid,
        account_sid: ACCOUNT_SID,
        call_sid: 'CA' + '0'.repeat(32),
        status: 'absent',
        error_code: 13601,
      }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const rec = await c.recordings.get(reSid);
    expect(rec.error_code).toBe(13601);
  });
});

describe('v0.6.3 — list filter params', () => {
  it('calls.list sends StartTime/EndTime triple operators', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ calls: [], page: 0, page_size: 50, total: 0, uri: '/Calls' }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.calls.list({
      startTime: '2026-05-01',
      startTimeLt: '2026-05-02',
      startTimeGt: '2026-04-30',
      endTime: '2026-05-21',
      endTimeLt: '2026-05-22',
      endTimeGt: '2026-05-20',
    });

    const url = new URL(calls[0]!.url);
    expect(url.searchParams.get('StartTime')).toBe('2026-05-01');
    expect(url.searchParams.get('StartTime<')).toBe('2026-05-02');
    expect(url.searchParams.get('StartTime>')).toBe('2026-04-30');
    expect(url.searchParams.get('EndTime')).toBe('2026-05-21');
    expect(url.searchParams.get('EndTime<')).toBe('2026-05-22');
    expect(url.searchParams.get('EndTime>')).toBe('2026-05-20');
  });

  it('conferences.list and listParticipants forward filter params', async () => {
    const cfSid = 'CF' + 'a'.repeat(32);
    const { fetch, calls } = fakeFetch([
      jsonResponse({ conferences: [], page: 0, page_size: 50, total: 0, uri: '/x' }),
      jsonResponse({ participants: [], page: 1, page_size: 25, total: 0, uri: '/x' }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.conferences.list({ FriendlyName: 'incident-42', Status: 'in-progress', PageSize: 50 });
    await c.conferences.listParticipants(cfSid, { Muted: true, Hold: false, Coaching: true, Page: 1 });

    const confUrl = new URL(calls[0]!.url);
    expect(confUrl.searchParams.get('FriendlyName')).toBe('incident-42');
    expect(confUrl.searchParams.get('Status')).toBe('in-progress');
    expect(confUrl.searchParams.get('PageSize')).toBe('50');

    const partUrl = new URL(calls[1]!.url);
    expect(partUrl.searchParams.get('Muted')).toBe('true');
    expect(partUrl.searchParams.get('Hold')).toBe('false');
    expect(partUrl.searchParams.get('Coaching')).toBe('true');
    expect(partUrl.searchParams.get('Page')).toBe('1');
  });

  it('recordings.list and calls.listRecordings send DateCreated filters', async () => {
    const callSid = 'CA' + 'b'.repeat(32);
    const { fetch, calls } = fakeFetch([
      jsonResponse({ recordings: [], page: 0, page_size: 50, total: 0, uri: '/x' }),
      jsonResponse({ recordings: [], page: 0, page_size: 10, total: 0, uri: '/x' }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.recordings.list({
      dateCreated: '2026-05-01',
      dateCreatedLt: '2026-05-02',
      dateCreatedGt: '2026-04-30',
      CallSid: callSid,
      PageSize: 50,
    });
    await c.calls.listRecordings(callSid, { dateCreated: '2026-05-01', PageSize: 10 });

    const acctUrl = new URL(calls[0]!.url);
    expect(acctUrl.searchParams.get('DateCreated')).toBe('2026-05-01');
    expect(acctUrl.searchParams.get('DateCreated<')).toBe('2026-05-02');
    expect(acctUrl.searchParams.get('DateCreated>')).toBe('2026-04-30');
    expect(acctUrl.searchParams.get('CallSid')).toBe(callSid);

    const callUrl = new URL(calls[1]!.url);
    expect(callUrl.searchParams.get('DateCreated')).toBe('2026-05-01');
    expect(callUrl.searchParams.get('PageSize')).toBe('10');
  });

  it('calls.list sends PageToken (spec v0.6.4)', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ calls: [], page: 0, page_size: 50, total: 0, uri: '/Calls' }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.calls.list({ PageToken: 'cursor-abc123' });

    const url = new URL(calls[0]!.url);
    expect(url.searchParams.get('PageToken')).toBe('cursor-abc123');
  });

  it('queues.create accepts MaxSize=0 (unlimited)', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({
        sid: 'QU' + '0'.repeat(32),
        account_sid: ACCOUNT_SID,
        friendly_name: 'unlimited',
        current_size: 0,
        max_size: 0,
        average_wait_time: 0,
        date_created: 'x',
        date_updated: 'x',
        uri: '/x',
      }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.queues.create({ FriendlyName: 'unlimited', MaxSize: 0 });
    const params = calls[0]!.init.body as URLSearchParams;
    expect(params.get('MaxSize')).toBe('0');
  });
});

// ---------------------------------------------------------------------------
// v0.6.6: spec sync — participants, notifications, recordings, conferences.
// ---------------------------------------------------------------------------

describe('v0.6.6 — conferences.createParticipant', () => {
  it('POSTs From and To to /Conferences/{sid}/Participants', async () => {
    const cfSid = 'CF' + 'f'.repeat(32);
    const callSid = 'CA' + 'f'.repeat(32);
    const { fetch, calls } = fakeFetch([
      jsonResponse(
        {
          call_sid: callSid,
          conference_sid: cfSid,
          account_sid: ACCOUNT_SID,
          muted: false,
          hold: false,
          coaching: false,
          queue_time: '0',
          start_conference_on_enter: true,
          end_conference_on_exit: false,
          status: 'queued',
          api_version: '2010-04-01',
          uri: '/x',
        },
        201,
      ),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.conferences.createParticipant(cfSid, {
      From: '+18005550000',
      To: '+18005551234',
    });

    expect(calls[0]!.init.method).toBe('POST');
    expect(new URL(calls[0]!.url).pathname).toBe(
      `/2010-04-01/Accounts/${ACCOUNT_SID}/Conferences/${cfSid}/Participants.json`,
    );
    const params = calls[0]!.init.body as URLSearchParams;
    expect(params.get('From')).toBe('+18005550000');
    expect(params.get('To')).toBe('+18005551234');
  });
});

describe('v0.6.6 — conferences.list date filters', () => {
  it('sends DateCreated and DateUpdated triple operators', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ conferences: [], page: 0, page_size: 50, total: 0, uri: '/x' }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.conferences.list({
      dateCreated: '2026-05-01',
      dateCreatedLt: '2026-05-02',
      dateCreatedGt: '2026-04-30',
      dateUpdated: '2026-05-10',
      dateUpdatedLt: '2026-05-11',
      dateUpdatedGt: '2026-05-09',
    });

    const url = new URL(calls[0]!.url);
    expect(url.searchParams.get('DateCreated')).toBe('2026-05-01');
    expect(url.searchParams.get('DateCreated<')).toBe('2026-05-02');
    expect(url.searchParams.get('DateCreated>')).toBe('2026-04-30');
    expect(url.searchParams.get('DateUpdated')).toBe('2026-05-10');
    expect(url.searchParams.get('DateUpdated<')).toBe('2026-05-11');
    expect(url.searchParams.get('DateUpdated>')).toBe('2026-05-09');
  });
});

describe('v0.6.6 — calls.listNotifications + getNotification', () => {
  it('listNotifications sends Log and MessageDate filters', async () => {
    const callSid = 'CA' + 'f'.repeat(32);
    const { fetch, calls } = fakeFetch([
      jsonResponse({ notifications: [], page: 0, page_size: 50, total: 0 }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.calls.listNotifications(callSid, {
      Log: 1,
      messageDate: '2026-05-01',
      messageDateLt: '2026-05-02',
      messageDateGt: '2026-04-30',
    });

    const url = new URL(calls[0]!.url);
    expect(url.pathname).toBe(
      `/2010-04-01/Accounts/${ACCOUNT_SID}/Calls/${callSid}/Notifications.json`,
    );
    expect(url.searchParams.get('Log')).toBe('1');
    expect(url.searchParams.get('MessageDate')).toBe('2026-05-01');
    expect(url.searchParams.get('MessageDate<')).toBe('2026-05-02');
    expect(url.searchParams.get('MessageDate>')).toBe('2026-04-30');
  });

  it('getNotification fetches /Calls/{sid}/Notifications/{nid}', async () => {
    const callSid = 'CA' + '0'.repeat(32);
    const nid = 'NO' + '1'.repeat(32);
    const { fetch, calls } = fakeFetch([
      jsonResponse({ sid: nid, call_sid: callSid, log: 1 }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const n = await c.calls.getNotification(callSid, nid);
    expect(n.sid).toBe(nid);

    expect(new URL(calls[0]!.url).pathname).toBe(
      `/2010-04-01/Accounts/${ACCOUNT_SID}/Calls/${callSid}/Notifications/${nid}.json`,
    );
  });
});

describe('v0.6.6 — notifications resource', () => {
  it('list sends Log and MessageDate filters to /Notifications', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ notifications: [], page: 0, page_size: 50, total: 0 }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.notifications.list({
      Log: 0,
      messageDate: '2026-05-01',
    });

    const url = new URL(calls[0]!.url);
    expect(url.pathname).toBe(`/2010-04-01/Accounts/${ACCOUNT_SID}/Notifications.json`);
    expect(url.searchParams.get('Log')).toBe('0');
    expect(url.searchParams.get('MessageDate')).toBe('2026-05-01');
  });

  it('get fetches /Notifications/{sid}', async () => {
    const nid = 'NO' + '2'.repeat(32);
    const { fetch, calls } = fakeFetch([jsonResponse({ sid: nid, log: 1 })]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const n = await c.notifications.get(nid);
    expect(n.sid).toBe(nid);

    expect(new URL(calls[0]!.url).pathname).toBe(
      `/2010-04-01/Accounts/${ACCOUNT_SID}/Notifications/${nid}.json`,
    );
  });
});

describe('v0.6.6 — recordings IncludeSoftDeleted', () => {
  it('list sends IncludeSoftDeleted=true', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ recordings: [], page: 0, page_size: 50, total: 0, uri: '/x' }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.recordings.list({ IncludeSoftDeleted: true });

    const url = new URL(calls[0]!.url);
    expect(url.searchParams.get('IncludeSoftDeleted')).toBe('true');
  });

  it('get sends IncludeSoftDeleted=true', async () => {
    const reSid = 'RE' + '2'.repeat(32);
    const { fetch, calls } = fakeFetch([
      jsonResponse({
        sid: reSid,
        account_sid: ACCOUNT_SID,
        call_sid: 'CA' + '0'.repeat(32),
        status: 'deleted',
      }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.recordings.get(reSid, { IncludeSoftDeleted: true });

    const url = new URL(calls[0]!.url);
    expect(url.searchParams.get('IncludeSoftDeleted')).toBe('true');
  });
});

describe('v0.6.6 — conferences recording sub-resource', () => {
  it('getRecording, updateRecording, deleteRecording hit the right paths', async () => {
    const cfSid = 'CF' + '3'.repeat(32);
    const reSid = 'RE' + '3'.repeat(32);
    const { fetch, calls } = fakeFetch([
      jsonResponse({
        sid: reSid,
        account_sid: ACCOUNT_SID,
        call_sid: 'CA' + '0'.repeat(32),
        conference_sid: cfSid,
        status: 'completed',
      }),
      jsonResponse({
        sid: reSid,
        account_sid: ACCOUNT_SID,
        call_sid: 'CA' + '0'.repeat(32),
        conference_sid: cfSid,
        status: 'stopped',
      }),
      new Response(null, { status: 204 }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.conferences.getRecording(cfSid, reSid);
    await c.conferences.updateRecording(cfSid, reSid, { Status: 'stopped' });
    await c.conferences.deleteRecording(cfSid, reSid);

    expect(new URL(calls[0]!.url).pathname).toBe(
      `/2010-04-01/Accounts/${ACCOUNT_SID}/Conferences/${cfSid}/Recordings/${reSid}.json`,
    );
    expect(calls[1]!.init.method).toBe('POST');
    expect(new URL(calls[1]!.url).pathname).toBe(
      `/2010-04-01/Accounts/${ACCOUNT_SID}/Conferences/${cfSid}/Recordings/${reSid}.json`,
    );
    const params = calls[1]!.init.body as URLSearchParams;
    expect(params.get('Status')).toBe('stopped');
    expect(calls[2]!.init.method).toBe('DELETE');
    expect(new URL(calls[2]!.url).pathname).toBe(
      `/2010-04-01/Accounts/${ACCOUNT_SID}/Conferences/${cfSid}/Recordings/${reSid}.json`,
    );
  });
});

describe('v0.6.6 — incomingPhoneNumbers typed endpoints', () => {
  it('listLocal/createLocal hit /IncomingPhoneNumbers/Local', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ incoming_phone_numbers: [], page: 0, page_size: 50, total: 0 }),
      jsonResponse(incomingPhoneNumberPayload(), 201),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.incomingPhoneNumbers.listLocal({ FriendlyName: 'support' });
    await c.incomingPhoneNumbers.createLocal({ PhoneNumber: '+18005551234' });

    expect(new URL(calls[0]!.url).pathname).toBe(
      `/2010-04-01/Accounts/${ACCOUNT_SID}/IncomingPhoneNumbers/Local.json`,
    );
    expect(new URL(calls[0]!.url).searchParams.get('FriendlyName')).toBe('support');
    expect(calls[1]!.init.method).toBe('POST');
    expect(new URL(calls[1]!.url).pathname).toBe(
      `/2010-04-01/Accounts/${ACCOUNT_SID}/IncomingPhoneNumbers/Local.json`,
    );
  });

  it('listMobile/createMobile hit /IncomingPhoneNumbers/Mobile', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ incoming_phone_numbers: [], page: 0, page_size: 50, total: 0 }),
      jsonResponse(incomingPhoneNumberPayload(), 201),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.incomingPhoneNumbers.listMobile();
    await c.incomingPhoneNumbers.createMobile({ PhoneNumber: '+18005551234' });

    expect(new URL(calls[0]!.url).pathname).toBe(
      `/2010-04-01/Accounts/${ACCOUNT_SID}/IncomingPhoneNumbers/Mobile.json`,
    );
    expect(new URL(calls[1]!.url).pathname).toBe(
      `/2010-04-01/Accounts/${ACCOUNT_SID}/IncomingPhoneNumbers/Mobile.json`,
    );
  });

  it('listTollFree/createTollFree hit /IncomingPhoneNumbers/TollFree', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({ incoming_phone_numbers: [], page: 0, page_size: 50, total: 0 }),
      jsonResponse(incomingPhoneNumberPayload(), 201),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.incomingPhoneNumbers.listTollFree();
    await c.incomingPhoneNumbers.createTollFree({ PhoneNumber: '+18005551234' });

    expect(new URL(calls[0]!.url).pathname).toBe(
      `/2010-04-01/Accounts/${ACCOUNT_SID}/IncomingPhoneNumbers/TollFree.json`,
    );
    expect(new URL(calls[1]!.url).pathname).toBe(
      `/2010-04-01/Accounts/${ACCOUNT_SID}/IncomingPhoneNumbers/TollFree.json`,
    );
  });
});

// ---------------------------------------------------------------------------
// Pagination: iterate() async generators
// ---------------------------------------------------------------------------

function conferencePayload(sid: string = 'CF' + '0'.repeat(32)): object {
  return {
    sid,
    account_sid: ACCOUNT_SID,
    friendly_name: 'room-' + sid.slice(2, 6),
    status: 'in-progress',
    api_version: '2010-04-01',
    uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/Conferences/${sid}.json`,
  };
}

function recordingPayload(sid: string = 'RE' + '0'.repeat(32)): object {
  return {
    sid,
    account_sid: ACCOUNT_SID,
    call_sid: 'CA' + '0'.repeat(32),
    status: 'completed',
    uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/Recordings/${sid}.json`,
  };
}

function queuePayload(sid: string = 'QU' + '0'.repeat(32)): object {
  return {
    sid,
    account_sid: ACCOUNT_SID,
    friendly_name: 'q-' + sid.slice(2, 6),
    current_size: 0,
    max_size: 100,
    average_wait_time: 0,
    date_created: 'Mon, 19 May 2026 12:00:00 +0000',
    date_updated: 'Mon, 19 May 2026 12:00:00 +0000',
    uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/Queues/${sid}.json`,
  };
}

describe('calls.iterate — pagination', () => {
  it('yields items across two pages then stops', async () => {
    const { fetch } = fakeFetch([
      jsonResponse({
        calls: [callPayload('CA' + '1'.repeat(32)), callPayload('CA' + '2'.repeat(32))],
        page: 0,
        page_size: 2,
        next_page_uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/Calls.json?Page=1&PageSize=2`,
        uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/Calls.json?Page=0&PageSize=2`,
      }),
      jsonResponse({
        calls: [callPayload('CA' + '3'.repeat(32))],
        page: 1,
        page_size: 2,
        next_page_uri: null,
        uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/Calls.json?Page=1&PageSize=2`,
      }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const items: Call[] = [];
    for await (const call of c.calls.iterate()) items.push(call);

    expect(items).toHaveLength(3);
    expect(items[0]!.sid).toBe('CA' + '1'.repeat(32));
    expect(items[1]!.sid).toBe('CA' + '2'.repeat(32));
    expect(items[2]!.sid).toBe('CA' + '3'.repeat(32));
  });
});

describe('conferences.iterate — pagination', () => {
  it('yields items across two pages then stops', async () => {
    const { fetch } = fakeFetch([
      jsonResponse({
        conferences: [
          conferencePayload('CF' + '1'.repeat(32)),
          conferencePayload('CF' + '2'.repeat(32)),
        ],
        page: 0,
        page_size: 2,
        next_page_uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/Conferences.json?Page=1&PageSize=2`,
        uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/Conferences.json?Page=0&PageSize=2`,
      }),
      jsonResponse({
        conferences: [conferencePayload('CF' + '3'.repeat(32))],
        page: 1,
        page_size: 2,
        next_page_uri: null,
        uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/Conferences.json?Page=1&PageSize=2`,
      }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const items: Conference[] = [];
    for await (const conf of c.conferences.iterate()) items.push(conf);

    expect(items).toHaveLength(3);
    expect(items[0]!.sid).toBe('CF' + '1'.repeat(32));
    expect(items[1]!.sid).toBe('CF' + '2'.repeat(32));
    expect(items[2]!.sid).toBe('CF' + '3'.repeat(32));
  });
});

describe('recordings.iterate — pagination', () => {
  it('yields items across two pages then stops', async () => {
    const { fetch } = fakeFetch([
      jsonResponse({
        recordings: [
          recordingPayload('RE' + '1'.repeat(32)),
          recordingPayload('RE' + '2'.repeat(32)),
        ],
        page: 0,
        page_size: 2,
        next_page_uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/Recordings.json?Page=1&PageSize=2`,
        uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/Recordings.json?Page=0&PageSize=2`,
      }),
      jsonResponse({
        recordings: [recordingPayload('RE' + '3'.repeat(32))],
        page: 1,
        page_size: 2,
        next_page_uri: null,
        uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/Recordings.json?Page=1&PageSize=2`,
      }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const items: Recording[] = [];
    for await (const rec of c.recordings.iterate()) items.push(rec);

    expect(items).toHaveLength(3);
    expect(items[0]!.sid).toBe('RE' + '1'.repeat(32));
    expect(items[1]!.sid).toBe('RE' + '2'.repeat(32));
    expect(items[2]!.sid).toBe('RE' + '3'.repeat(32));
  });
});

describe('queues.iterate — pagination', () => {
  it('yields items across two pages then stops', async () => {
    const { fetch } = fakeFetch([
      jsonResponse({
        queues: [queuePayload('QU' + '1'.repeat(32)), queuePayload('QU' + '2'.repeat(32))],
        page: 0,
        page_size: 2,
        next_page_uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/Queues.json?Page=1&PageSize=2`,
        uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/Queues.json?Page=0&PageSize=2`,
      }),
      jsonResponse({
        queues: [queuePayload('QU' + '3'.repeat(32))],
        page: 1,
        page_size: 2,
        next_page_uri: null,
        uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/Queues.json?Page=1&PageSize=2`,
      }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const items: Queue[] = [];
    for await (const q of c.queues.iterate()) items.push(q);

    expect(items).toHaveLength(3);
    expect(items[0]!.sid).toBe('QU' + '1'.repeat(32));
    expect(items[1]!.sid).toBe('QU' + '2'.repeat(32));
    expect(items[2]!.sid).toBe('QU' + '3'.repeat(32));
  });
});

describe('iterate — single page edge case', () => {
  it('stops after one page when next_page_uri is null', async () => {
    const { fetch } = fakeFetch([
      jsonResponse({
        calls: [callPayload('CA' + 'a'.repeat(32))],
        page: 0,
        page_size: 50,
        next_page_uri: null,
        uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/Calls.json?Page=0&PageSize=50`,
      }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const items: Call[] = [];
    for await (const call of c.calls.iterate()) items.push(call);

    expect(items).toHaveLength(1);
    expect(items[0]!.sid).toBe('CA' + 'a'.repeat(32));
  });

  it('yields nothing when the single page is empty', async () => {
    const { fetch } = fakeFetch([
      jsonResponse({
        calls: [],
        page: 0,
        page_size: 50,
        next_page_uri: null,
        uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/Calls.json?Page=0&PageSize=50`,
      }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const items: Call[] = [];
    for await (const call of c.calls.iterate()) items.push(call);

    expect(items).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// v0.7.0: Messages resource (SMS — Twilio-compatible /Messages surface).
// ---------------------------------------------------------------------------

function messagePayload(sid: string = 'SM' + '0'.repeat(32)) {
  return {
    sid,
    account_sid: ACCOUNT_SID,
    api_version: '2010-04-01',
    to: '+18005551234',
    from: '+18005550000',
    body: 'hello',
    status: 'sent',
    num_segments: '1',
    num_media: '0',
    direction: 'outbound-api',
    price: null,
    price_unit: null,
    error_code: null,
    error_message: null,
    messaging_service_sid: null,
    date_created: 'Mon, 19 May 2026 12:00:00 +0000',
    date_updated: 'Mon, 19 May 2026 12:00:00 +0000',
    date_sent: 'Mon, 19 May 2026 12:00:01 +0000',
    uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/Messages/${sid}.json`,
  };
}

describe('v0.7.0 — messages.create', () => {
  it('POSTs to /Messages.json with To/Body/From URL-encoded form body', async () => {
    const { fetch, calls } = fakeFetch([jsonResponse(messagePayload(), 201)]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const msg = await c.messages.create({
      To: '+18005551234',
      Body: 'hello',
      From: '+18005550000',
    });
    expect(msg.sid.startsWith('SM')).toBe(true);
    expect(msg.num_segments).toBe('1');
    expect(msg.num_media).toBe('0');
    expect(msg.error_code).toBeNull();
    expect(msg.price).toBeNull();

    expect(calls).toHaveLength(1);
    const [{ url, init }] = calls;
    expect(url).toBe(`${BASE}/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`);
    expect(init.method).toBe('POST');

    const params = init.body as URLSearchParams;
    expect(params).toBeInstanceOf(URLSearchParams);
    expect(params.get('To')).toBe('+18005551234');
    expect(params.get('Body')).toBe('hello');
    expect(params.get('From')).toBe('+18005550000');
  });
});

describe('v0.7.0 — messages.update', () => {
  it('sends Body= (empty string) to redact', async () => {
    const sid = 'SM' + '1'.repeat(32);
    const { fetch, calls } = fakeFetch([
      jsonResponse({ ...messagePayload(sid), body: '' }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const msg = await c.messages.update(sid, { Body: '' });
    expect(msg.body).toBe('');

    expect(calls).toHaveLength(1);
    expect(calls[0]!.init.method).toBe('POST');
    expect(new URL(calls[0]!.url).pathname).toBe(
      `/2010-04-01/Accounts/${ACCOUNT_SID}/Messages/${sid}.json`,
    );

    const params = calls[0]!.init.body as URLSearchParams;
    // Empty-string Body must be sent on the wire — Twilio's documented redaction signal.
    expect(params.has('Body')).toBe(true);
    expect(params.get('Body')).toBe('');
  });
});

describe('v0.7.0 — messages.list', () => {
  it('sends DateSent / DateSent< / DateSent> and PageToken', async () => {
    const { fetch, calls } = fakeFetch([
      jsonResponse({
        messages: [messagePayload()],
        page: 0,
        page_size: 50,
        total: 1,
        next_page_uri: null,
        uri: '/Messages',
      }),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const result = await c.messages.list({
      dateSent: '2026-05-01',
      dateSentLt: '2026-05-02',
      dateSentGt: '2026-04-30',
      PageToken: 'cursor-xyz',
      PageSize: 25,
    });
    expect(result.messages).toHaveLength(1);

    const url = new URL(calls[0]!.url);
    expect(url.pathname).toBe(`/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`);
    expect(url.searchParams.get('DateSent')).toBe('2026-05-01');
    expect(url.searchParams.get('DateSent<')).toBe('2026-05-02');
    expect(url.searchParams.get('DateSent>')).toBe('2026-04-30');
    expect(url.searchParams.get('PageToken')).toBe('cursor-xyz');
    expect(url.searchParams.get('PageSize')).toBe('25');
  });
});

// ---------------------------------------------------------------------------
// v0.7.0: Payments — POST /Calls/{sid}/Payments and /Payments/{sid}.
// ---------------------------------------------------------------------------

function paymentPayload(sid: string = 'PY' + '0'.repeat(32), callSid?: string) {
  return {
    sid,
    account_sid: ACCOUNT_SID,
    call_sid: callSid ?? 'CA' + '0'.repeat(32),
    api_version: '2010-04-01',
    date_created: 'Mon, 19 May 2026 12:00:00 +0000',
    date_updated: 'Mon, 19 May 2026 12:00:00 +0000',
    uri: `/2010-04-01/Accounts/${ACCOUNT_SID}/Calls/${callSid ?? 'CA' + '0'.repeat(32)}/Payments/${sid}.json`,
  };
}

describe('v0.7.0 — calls.startPayment', () => {
  it('POSTs to /Calls/{sid}/Payments.json with the encoded fields', async () => {
    const callSid = 'CA' + '5'.repeat(32);
    const paySid = 'PY' + '1'.repeat(32);
    const { fetch, calls } = fakeFetch([
      jsonResponse(paymentPayload(paySid, callSid), 201),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    const pay = await c.calls.startPayment(callSid, {
      IdempotencyKey: 'idemp-1',
      ChargeAmount: '12.34',
      Currency: 'USD',
      PaymentMethod: 'credit-card',
      TokenType: 'one-time',
      BankAccountType: 'consumer-checking',
      Input: 'dtmf',
      PostalCode: true,
      SecurityCode: false,
      Timeout: 7,
      MinPostalCodeLength: 5,
      ValidCardTypes: 'visa mastercard',
      Confirmation: true,
    });
    expect(pay.sid.startsWith('PY')).toBe(true);
    expect(pay.call_sid).toBe(callSid);

    expect(calls).toHaveLength(1);
    expect(calls[0]!.init.method).toBe('POST');
    expect(new URL(calls[0]!.url).pathname).toBe(
      `/2010-04-01/Accounts/${ACCOUNT_SID}/Calls/${callSid}/Payments.json`,
    );

    const params = calls[0]!.init.body as URLSearchParams;
    expect(params.get('IdempotencyKey')).toBe('idemp-1');
    expect(params.get('ChargeAmount')).toBe('12.34');
    expect(params.get('Currency')).toBe('USD');
    expect(params.get('PaymentMethod')).toBe('credit-card');
    expect(params.get('TokenType')).toBe('one-time');
    expect(params.get('BankAccountType')).toBe('consumer-checking');
    expect(params.get('Input')).toBe('dtmf');
    // Booleans must serialise as the literal strings 'true' / 'false'.
    expect(params.get('PostalCode')).toBe('true');
    expect(params.get('SecurityCode')).toBe('false');
    expect(params.get('Confirmation')).toBe('true');
    expect(params.get('Timeout')).toBe('7');
    expect(params.get('MinPostalCodeLength')).toBe('5');
    expect(params.get('ValidCardTypes')).toBe('visa mastercard');
  });
});

describe('v0.7.0 — calls.updatePayment', () => {
  it('first sends Status=complete, then Capture=security-code (two separate calls)', async () => {
    const callSid = 'CA' + '6'.repeat(32);
    const paySid = 'PY' + '2'.repeat(32);
    const { fetch, calls } = fakeFetch([
      jsonResponse(paymentPayload(paySid, callSid), 202),
      jsonResponse(paymentPayload(paySid, callSid), 202),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });

    await c.calls.updatePayment(callSid, paySid, { Status: 'complete' });
    await c.calls.updatePayment(callSid, paySid, { Capture: 'security-code' });

    expect(calls).toHaveLength(2);

    const path = `/2010-04-01/Accounts/${ACCOUNT_SID}/Calls/${callSid}/Payments/${paySid}.json`;

    expect(calls[0]!.init.method).toBe('POST');
    expect(new URL(calls[0]!.url).pathname).toBe(path);
    const p0 = calls[0]!.init.body as URLSearchParams;
    expect(p0.get('Status')).toBe('complete');
    expect(p0.has('Capture')).toBe(false);

    expect(calls[1]!.init.method).toBe('POST');
    expect(new URL(calls[1]!.url).pathname).toBe(path);
    const p1 = calls[1]!.init.body as URLSearchParams;
    expect(p1.get('Capture')).toBe('security-code');
    expect(p1.has('Status')).toBe(false);
  });
});
