/** Pagination (C1): follow `next_page_uri` / `meta.next_page_url` verbatim, lazily. */

import { describe, expect, it } from 'vitest';

import { Client, PaginationError, type Call } from '../src/index.js';
import { ACCOUNT_SID, API_KEY, BASE, callPayload, json, scriptedFetch, type Step } from './helpers.js';

const CALLS = `/2010-04-01/Accounts/${ACCOUNT_SID}/Calls.json`;

function page(sids: string[], next: string | null | undefined, extra: Record<string, unknown> = {}) {
  const body: Record<string, unknown> = {
    calls: sids.map((s) => callPayload(s)),
    page: 0,
    page_size: 2,
    start: 0,
    end: sids.length - 1,
    first_page_uri: `${CALLS}?PageSize=2&Page=0`,
    previous_page_uri: null,
    uri: `${CALLS}?PageSize=2&Page=0`,
    ...extra,
  };
  if (next !== undefined) body.next_page_uri = next;
  return json(body);
}

function setup(steps: Step[]) {
  const { fetch, calls } = scriptedFetch(steps);
  return { c: new Client({ accountSid: ACCOUNT_SID, apiKey: API_KEY, fetch }), calls };
}

const sid = (n: number) => 'CA' + String(n).repeat(32);

describe('2010 lists — next_page_uri', () => {
  it('sends the PageToken from next_page_uri verbatim and stops on null', async () => {
    const next1 = `${CALLS}?PageSize=2&Page=1&PageToken=PACA${'1'.repeat(32)}`;
    const next2 = `${CALLS}?PageSize=2&Page=2&PageToken=PACA${'3'.repeat(32)}`;
    const { c, calls } = setup([
      page([sid(1), sid(2)], next1),
      page([sid(3), sid(4)], next2),
      page([sid(5)], null),
    ]);
    const seen: Call[] = [];
    for await (const call of c.calls.iterate({ Status: 'completed', PageSize: 2 })) seen.push(call);

    expect(seen.map((x) => x.sid)).toEqual([sid(1), sid(2), sid(3), sid(4), sid(5)]);
    expect(calls.map((x) => x.url)).toEqual([
      `${BASE}${CALLS}?Status=completed&PageSize=2`,
      `${BASE}${next1}`,
      `${BASE}${next2}`,
    ]);
    // Every request is authenticated; none invents `Page=N`.
    expect(calls.every((x) => typeof x.headers.Authorization === 'string')).toBe(true);
  });

  it.each([
    ['null', null],
    ['empty', ''],
    ['absent', undefined],
  ])('stops when next_page_uri is %s', async (_label, next) => {
    const { c, calls } = setup([page([sid(1), sid(2)], next)]);
    const seen: Call[] = [];
    for await (const call of c.calls.iterate()) seen.push(call);
    expect(seen).toHaveLength(2);
    expect(calls).toHaveLength(1);
  });

  it('follows an onward link from a full page even when the server ignores Page', async () => {
    // Calls / Conferences answer page 0 without a token: following next_page_uri (with its
    // token) is what makes iteration terminate.
    const next = `${CALLS}?PageSize=2&Page=1&PageToken=PA1`;
    const { c, calls } = setup([page([sid(1), sid(2)], next), page([], null)]);
    const seen: Call[] = [];
    for await (const call of c.calls.iterate()) seen.push(call);
    expect(seen).toHaveLength(2);
    expect(calls).toHaveLength(2);
  });

  it('is lazy: breaking out early stops all further requests', async () => {
    const { c, calls } = setup([page([sid(1), sid(2)], `${CALLS}?Page=1&PageToken=PA1`)]);
    const it = c.calls.iterate();
    expect(calls).toHaveLength(0);
    for await (const call of it) {
      expect(call.sid).toBe(sid(1));
      break;
    }
    expect(calls).toHaveLength(1);
  });

  it('client.nextPage fetches the linked page and returns null on the last page', async () => {
    const next = `${CALLS}?PageSize=2&Page=1&PageToken=PA1`;
    const { c, calls } = setup([page([sid(1), sid(2)], next), page([sid(3)], null)]);
    const first = await c.calls.list({ PageSize: 2 });
    const second = await c.nextPage(first);
    expect(second?.calls.map((x) => x.sid)).toEqual([sid(3)]);
    expect(calls[1]!.url).toBe(`${BASE}${next}`);
    expect(second && (await c.nextPage(second))).toBeNull();
    expect(calls).toHaveLength(2);
  });

  it('client.paginate walks any list envelope', async () => {
    const next = `${CALLS}?Page=1&PageToken=PA1`;
    const { c } = setup([page([sid(1)], next), page([sid(2)], null)]);
    const seen: string[] = [];
    for await (const call of c.paginate(await c.calls.list())) seen.push(call.sid ?? '');
    expect(seen).toEqual([sid(1), sid(2)]);
  });

  it('refuses a next_page_uri that points at another host', async () => {
    const { c, calls } = setup([page([sid(1)], 'https://evil.example.com/steal')]);
    const first = await c.calls.list();
    await expect(c.nextPage(first)).rejects.toBeInstanceOf(PaginationError);
    const it = c.paginate(first);
    await expect(
      (async () => {
        for await (const call of it) void call;
      })(),
    ).rejects.toBeInstanceOf(PaginationError);
    expect(calls).toHaveLength(1);
  });

  it('list envelopes no longer carry total / num_pages', async () => {
    const { c } = setup([page([sid(1)], null)]);
    const list = await c.calls.list();
    expect(list).not.toHaveProperty('total');
    expect(list.start).toBe(0);
    expect(list.end).toBe(0);
  });
});

describe('v1 lists — meta.next_page_url', () => {
  const meta = (next: string | null) => ({
    first_page_url: 'x',
    next_page_url: next,
    previous_page_url: null,
    url: 'x',
    page: 0,
    page_size: 1,
    key: 'conversations',
  });

  it('follows next_page_url on the same product host', async () => {
    const next = 'https://conversations.voicetel.com/v1/Conversations?PageSize=1&Page=1&PageToken=PT1';
    const { c, calls } = setup([
      json({ conversations: [{ sid: 'CH1' }], meta: meta(next) }),
      json({ conversations: [{ sid: 'CH2' }], meta: meta(null) }),
    ]);
    const first = await c.conversationsV1.conversations.list({ PageSize: 1 });
    const sids: unknown[] = [];
    for await (const conv of c.paginate(first)) sids.push(conv.sid);
    expect(sids).toEqual(['CH1', 'CH2']);
    expect(calls[1]!.url).toBe(next);
    expect(calls[1]!.headers.Authorization).toBeDefined();
  });

  it('refuses a next_page_url on a different host, without sending a request', async () => {
    const { c, calls } = setup([
      json({ conversations: [{ sid: 'CH1' }], meta: meta('https://other.example.com/v1/Conversations?Page=1') }),
    ]);
    const first = await c.conversationsV1.conversations.list();
    await expect(c.nextPage(first)).rejects.toBeInstanceOf(PaginationError);
    expect(calls).toHaveLength(1);
  });

  it('refuses a scheme downgrade of the product host', async () => {
    const { c } = setup([
      json({ services: [], meta: meta('http://messaging.voicetel.com/v1/Services?Page=1') }),
    ]);
    const first = await c.messagingV1.services.list();
    await expect(c.nextPage(first)).rejects.toBeInstanceOf(PaginationError);
  });
});
