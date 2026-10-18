/** Shared test doubles: a scripted `fetch` that records every request it receives. */

export const ACCOUNT_SID = 'AC' + 'f'.repeat(32);
export const API_KEY = 'secret-key-1234';
export const BASE = 'https://voiceml.voicetel.com';
export const BASIC = 'Basic ' + Buffer.from(`${ACCOUNT_SID}:${API_KEY}`).toString('base64');

export interface Captured {
  url: string;
  init: RequestInit;
  headers: Record<string, string>;
  /** Exact form-encoded body bytes (`URLSearchParams#toString`), or the JSON text. */
  body: string | null;
}

export type Step = Response | Error | ((url: string, init: RequestInit) => Response | Promise<Response>);

export function scriptedFetch(steps: Step[]): { fetch: typeof fetch; calls: Captured[] } {
  const calls: Captured[] = [];
  let i = 0;
  const fn = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
    const url = String(input);
    const body =
      init.body instanceof URLSearchParams
        ? init.body.toString()
        : typeof init.body === 'string'
          ? init.body
          : null;
    calls.push({ url, init, headers: { ...(init.headers as Record<string, string>) }, body });
    const step = steps[i++];
    if (step === undefined) throw new Error(`scriptedFetch: out of steps (${i - 1} consumed)`);
    if (step instanceof Error) throw step;
    return typeof step === 'function' ? step(url, init) : step;
  };
  return { fetch: fn as typeof fetch, calls };
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

/** A network failure shaped like undici's (`TypeError: fetch failed` with a coded cause). */
export function networkError(code: string, message = `connect ${code}`): TypeError {
  const cause = Object.assign(new Error(message), { code });
  return new TypeError('fetch failed', { cause });
}

export function callPayload(sid = 'CA' + '0'.repeat(32)): Record<string, unknown> {
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
