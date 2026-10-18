/** Path-segment encoding (C3) and the route-derived `.json` suffix (C4). */

import { describe, expect, it } from 'vitest';

import { Client, ConfigurationError, encodePathSegment } from '../src/index.js';
import { ACCOUNT_SID, API_KEY, json, scriptedFetch } from './helpers.js';

const ACCT = `/2010-04-01/Accounts/${ACCOUNT_SID}`;

function setup(n = 1) {
  const { fetch, calls } = scriptedFetch(Array.from({ length: n }, () => json({})));
  return { c: new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch }), calls };
}

/** The raw request path, exactly as sent (no URL normalisation on the way back). */
function rawPath(url: string): string {
  return url.slice(url.indexOf('/', url.indexOf('//') + 2)).split('?')[0] as string;
}

describe('encodePathSegment', () => {
  it.each([
    ['CA0123', 'CA0123'],
    ['A-Z_a.z~09', 'A-Z_a.z~09'],
    ['+14155550100', '%2B14155550100'],
    ['a b', 'a%20b'],
    ['a/b', 'a%2Fb'],
    ['a?b', 'a%3Fb'],
    ['a#b', 'a%23b'],
    ['100%', '100%25'],
    ["it's(*)!", 'it%27s%28%2A%29%21'],
    ['café', 'caf%C3%A9'],
  ])('%s → %s', (input, expected) => {
    expect(encodePathSegment(input)).toBe(expected);
  });

  it.each(['', '.', '..', '\uD800'])('rejects %j', (bad) => {
    expect(() => encodePathSegment(bad)).toThrow(ConfigurationError);
  });
});

describe('caller-supplied path segments are encoded on every surface', () => {
  it('2010 API: `?`, `#` and `/` cannot retarget the request', async () => {
    const { c, calls } = setup(3);
    await c.calls.get('CA1?Status=x');
    await c.queues.get('QU1#frag');
    await c.applications.get('../Calls');
    expect(rawPath(calls[0]!.url)).toBe(`${ACCT}/Calls/CA1%3FStatus%3Dx.json`);
    expect(new URL(calls[0]!.url).search).toBe('');
    expect(rawPath(calls[1]!.url)).toBe(`${ACCT}/Queues/QU1%23frag.json`);
    expect(rawPath(calls[2]!.url)).toBe(`${ACCT}/Applications/..%2FCalls.json`);
  });

  it('E.164 path ids are percent-encoded once (`+` → %2B)', async () => {
    const { c, calls } = setup(4);
    await c.incomingPhoneNumbers.get('+14155550100');
    await c.routesV2.phoneNumbers.fetch('+14155550100');
    await c.pricing.v1.voice.numbers.fetch('+14155550100');
    await c.pricing.v2.trunking.numbers.fetch('+14155550100', { originationNumber: '+14155550101' });
    expect(rawPath(calls[0]!.url)).toBe(`${ACCT}/IncomingPhoneNumbers/%2B14155550100.json`);
    expect(rawPath(calls[1]!.url)).toBe('/v2/PhoneNumbers/%2B14155550100');
    expect(rawPath(calls[2]!.url)).toBe('/v1/Voice/Numbers/%2B14155550100');
    expect(calls[3]!.url).toBe(
      'https://voiceml.voicetel.com/v2/Trunking/Numbers/%2B14155550100?OriginationNumber=%2B14155550101',
    );
  });

  it('v1 resources encode every interpolated segment', async () => {
    const { c, calls } = setup(4);
    await c.conversationsV1.conversations.fetch('CH 1');
    await c.conversationsV1.services('IS/1').roles.fetch('RL?1');
    await c.voiceV1.connectionPolicies('NY#1').targets.fetch('NE%1');
    await c.pricing.v1.messaging.countries.fetch('U S');
    expect(rawPath(calls[0]!.url)).toBe('/v1/Conversations/CH%201');
    expect(rawPath(calls[1]!.url)).toBe('/v1/Services/IS%2F1/Roles/RL%3F1');
    expect(rawPath(calls[2]!.url)).toBe('/v1/ConnectionPolicies/NY%231/Targets/NE%251');
    expect(rawPath(calls[3]!.url)).toBe('/v1/Messaging/Countries/U%20S');
  });

  it('rejects empty and dot segments before any request', async () => {
    const { c, calls } = setup();
    await expect(c.calls.get('')).rejects.toBeInstanceOf(ConfigurationError);
    await expect(c.calls.get('..')).rejects.toBeInstanceOf(ConfigurationError);
    await expect(c.conversationsV1.conversations.fetch('')).rejects.toBeInstanceOf(
      ConfigurationError,
    );
    expect(calls).toHaveLength(0);
  });
});

describe('.json suffix comes from the route, not the segment text', () => {
  it('Twilio.CURRENT keeps the .json suffix', async () => {
    const { c, calls } = setup();
    await c.calls.updateRecording('CA1', 'Twilio.CURRENT', { Status: 'paused', PauseBehavior: 'skip' });
    expect(rawPath(calls[0]!.url)).toBe(`${ACCT}/Calls/CA1/Recordings/Twilio.CURRENT.json`);
    expect(calls[0]!.body).toBe('Status=paused&PauseBehavior=skip');
  });

  it('a sid ending in .wav or .json is still suffixed', async () => {
    const { c, calls } = setup(2);
    await c.recordings.get('RE1.wav');
    await c.recordings.get('RE1.json');
    expect(rawPath(calls[0]!.url)).toBe(`${ACCT}/Recordings/RE1.wav.json`);
    expect(rawPath(calls[1]!.url)).toBe(`${ACCT}/Recordings/RE1.json.json`);
  });

  it('audio uses .wav, exports.download has no suffix, /v1 and /v2 have none', async () => {
    const { fetch, calls } = scriptedFetch([
      new Response(new Uint8Array([1]), { status: 200 }),
      new Response(new Uint8Array([2]), { status: 200 }),
      json({}),
    ]);
    const c = new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch });
    await c.recordings.getAudio('RE1');
    await c.exports.download('2026-09-30');
    await c.routesV2.sipDomains.fetch('sip.example.com');
    expect(rawPath(calls[0]!.url)).toBe(`${ACCT}/Recordings/RE1.wav`);
    expect(rawPath(calls[1]!.url)).toBe(`${ACCT}/Exports/2026-09-30`);
    expect(rawPath(calls[2]!.url)).toBe('/v2/SipDomains/sip.example.com');
  });
});
