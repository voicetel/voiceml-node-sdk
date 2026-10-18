/** Request value serialisation (C8): exact wire bytes for every value kind. */

import { describe, expect, it } from 'vitest';

import { Client, ConfigurationError } from '../src/index.js';
import { ACCOUNT_SID, API_KEY, json, scriptedFetch } from './helpers.js';

function setup(n = 1) {
  const { fetch, calls } = scriptedFetch(Array.from({ length: n }, () => json({}, 201)));
  return { c: new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch }), calls };
}

describe('form and query serialisation', () => {
  it('booleans are true/false; arrays repeat the key (never Key[0]); + is %2B', async () => {
    const { c, calls } = setup();
    await c.calls.create({
      To: '+14155550100',
      From: '+14155550101',
      Url: 'https://example.com/a b',
      Record: true,
      AsyncAmd: false,
      Timeout: 30,
      StatusCallbackEvent: ['initiated', 'answered'],
    });
    expect(calls[0]!.body).toBe(
      'To=%2B14155550100&From=%2B14155550101&Url=https%3A%2F%2Fexample.com%2Fa+b' +
        '&Record=true&AsyncAmd=false&Timeout=30' +
        '&StatusCallbackEvent=initiated&StatusCallbackEvent=answered',
    );
  });

  it('MMS: MediaUrl is sent as repeated keys and Body is optional', async () => {
    const { c, calls } = setup();
    await c.messages.create({
      To: '+14155550100',
      MediaUrl: ['https://example.com/1.png', 'https://example.com/2.png'],
      ValidityPeriod: 600,
      StatusCallback: 'https://example.com/dlr',
      StatusCallbackMethod: 'POST',
    });
    expect(calls[0]!.body).toBe(
      'To=%2B14155550100' +
        '&MediaUrl=https%3A%2F%2Fexample.com%2F1.png&MediaUrl=https%3A%2F%2Fexample.com%2F2.png' +
        '&ValidityPeriod=600&StatusCallback=https%3A%2F%2Fexample.com%2Fdlr&StatusCallbackMethod=POST',
    );
  });

  it('messages.create requires Body or MediaUrl (checked client-side)', async () => {
    const { c, calls } = setup();
    const bare = { To: '+14155550100' } as unknown as Parameters<typeof c.messages.create>[0];
    await expect(c.messages.create(bare)).rejects.toBeInstanceOf(ConfigurationError);
    expect(calls).toHaveLength(0);
  });

  it('Date values: ISO-8601 UTC for bounds, the UTC day for equality filters', async () => {
    const { c, calls } = setup(2);
    const evening = new Date(Date.UTC(2026, 8, 30, 20, 0, 0, 123));
    await c.recordings.list({ dateCreated: evening, dateCreatedGt: evening });
    await c.usageRecords.listDaily({ StartDate: evening, EndDate: '2026-10-01' });
    expect(new URL(calls[0]!.url).search).toBe(
      '?DateCreated=2026-09-30&DateCreated%3E=2026-09-30T20%3A00%3A00Z',
    );
    expect(new URL(calls[1]!.url).search).toBe('?StartDate=2026-09-30&EndDate=2026-10-01');
  });

  it('rejects plain objects, invalid dates and non-finite numbers before sending', async () => {
    const { c, calls } = setup();
    const withObject = { FriendlyName: { nested: true } } as unknown as { FriendlyName: string };
    await expect(c.queues.create(withObject)).rejects.toThrow(ConfigurationError);
    await expect(c.recordings.list({ dateCreatedGt: new Date('nope') })).rejects.toThrow(
      ConfigurationError,
    );
    await expect(c.queues.create({ FriendlyName: 'q', MaxSize: Number.NaN })).rejects.toThrow(
      ConfigurationError,
    );
    expect(calls).toHaveLength(0);
  });

  it('JSON-typed form fields accept an object and send compact JSON', async () => {
    const { c, calls } = setup();
    await c.conversationsV1.conversations.create({
      FriendlyName: 'support',
      Attributes: { tier: 'gold', tags: ['a', 'b'] },
    });
    expect(calls[0]!.body).toBe(
      'FriendlyName=support&Attributes=%7B%22tier%22%3A%22gold%22%2C%22tags%22%3A%5B%22a%22%2C%22b%22%5D%7D',
    );
  });

  it('drops undefined and null values', async () => {
    const { c, calls } = setup();
    await c.applications.create({ FriendlyName: 'app', VoiceUrl: undefined });
    expect(calls[0]!.body).toBe('FriendlyName=app');
  });

  it('JSON bodies (Assistants) are sent as compact JSON with a JSON content type', async () => {
    const { c, calls } = setup();
    await c.assistantsV1.assistants.create({ name: 'bot', personality_prompt: 'kind' });
    expect(calls[0]!.headers['Content-Type']).toBe('application/json');
    expect(calls[0]!.body).toBe('{"name":"bot","personality_prompt":"kind"}');
  });
});
