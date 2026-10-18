/**
 * Webhook signature validation (`X-Twilio-Signature`).
 *
 * VoiceML signs every webhook it sends with your **account API key**:
 *
 * 1. Take the full URL the webhook was sent to, without any `#fragment`.
 * 2. For a POST, append every form parameter as `key + value`, keys sorted ascending by
 *    byte order. A repeated key contributes each of its values in the order received. A GET
 *    signs the URL alone (its query string is part of the URL).
 * 3. HMAC-SHA1 the result with the API key and Base64-encode the digest (standard, padded).
 *
 * Validation compares in constant time and, like Twilio's validators, also accepts the URL
 * with the scheme's default port (`:443` / `:80`) added or removed, since proxies differ on
 * whether they keep it.
 *
 * Runs on any JavaScript runtime: the HMAC-SHA1 is implemented here, so no `node:crypto`
 * import is needed (and bundlers never see one).
 */

/**
 * Webhook form parameters: a `URLSearchParams` (keeps repeated keys in received order), an
 * array of `[key, value]` pairs, or a plain object whose values are strings or string arrays.
 */
export type WebhookParams =
  | URLSearchParams
  | ReadonlyArray<readonly [string, string]>
  | Readonly<Record<string, string | readonly string[] | undefined>>;

/** Compute the `X-Twilio-Signature` value VoiceML sends for `url` + `params`. */
export function computeSignature(apiKey: string, url: string, params?: WebhookParams): string {
  return base64(hmacSha1(utf8(apiKey), utf8(signingPayload(url, params))));
}

/**
 * `true` when `signature` (the `X-Twilio-Signature` header) is valid for the request.
 * Argument order matches twilio-node's `validateRequest(authToken, signature, url, params)`.
 *
 * @param apiKey Your VoiceML API key (the HTTP Basic password).
 * @param signature The received `X-Twilio-Signature` header value.
 * @param url The full URL the webhook was sent to, including any query string.
 * @param params POST form parameters; omit (or pass `{}`) for GET webhooks.
 */
export function validateRequest(
  apiKey: string,
  signature: string,
  url: string,
  params?: WebhookParams,
): boolean {
  if (!apiKey || typeof signature !== 'string' || signature === '') return false;
  let valid = false;
  for (const candidate of urlVariants(url)) {
    // Evaluate every variant so timing does not depend on which one matched.
    valid = constantTimeEqual(computeSignature(apiKey, candidate, params), signature) || valid;
  }
  return valid;
}

/** Reusable validator bound to one API key (migration-compatible with twilio-node's `RequestValidator`). */
export class RequestValidator {
  readonly #apiKey: string;

  constructor(apiKey: string) {
    this.#apiKey = apiKey;
  }

  /** See {@link validateRequest}. */
  validate(url: string, params: WebhookParams | undefined, signature: string): boolean {
    return validateRequest(this.#apiKey, signature, url, params);
  }

  /** See {@link computeSignature}. */
  computeSignature(url: string, params?: WebhookParams): string {
    return computeSignature(this.#apiKey, url, params);
  }

  toJSON(): Record<string, unknown> {
    return { apiKey: '[redacted]' };
  }
}

Object.defineProperty(RequestValidator.prototype, Symbol.for('nodejs.util.inspect.custom'), {
  value: (): string => 'RequestValidator { apiKey: [redacted] }',
});

function signingPayload(url: string, params: WebhookParams | undefined): string {
  const hash = url.indexOf('#');
  let data = hash === -1 ? url : url.slice(0, hash);
  const groups = new Map<string, string[]>();
  const add = (k: string, v: string): void => {
    const list = groups.get(k);
    if (list) list.push(v);
    else groups.set(k, [v]);
  };
  if (params instanceof URLSearchParams) {
    params.forEach((v, k) => add(k, v));
  } else if (Array.isArray(params)) {
    for (const [k, v] of params as ReadonlyArray<readonly [string, string]>) add(k, v);
  } else if (params) {
    for (const [k, v] of Object.entries(params as Record<string, string | readonly string[] | undefined>)) {
      if (v === undefined) continue;
      if (typeof v === 'string') add(k, v);
      else for (const each of v) add(k, each);
    }
  }
  const keys = [...groups.keys()].sort(compareBytes);
  for (const k of keys) {
    for (const v of groups.get(k) ?? []) data += k + v;
  }
  return data;
}

/** The URL as given plus the variant with the scheme's default port added or removed. */
function urlVariants(url: string): string[] {
  const m = /^(https?):\/\/([^/?#]*)(.*)$/is.exec(url);
  if (!m) return [url];
  const scheme = m[1] as string;
  const authority = m[2] as string;
  const rest = m[3] as string;
  const defaultPort = scheme.toLowerCase() === 'https' ? '443' : '80';
  const at = authority.lastIndexOf('@');
  const userinfo = at === -1 ? '' : authority.slice(0, at + 1);
  const hostPort = authority.slice(at + 1);
  const hp = /^(\[[^\]]*\]|[^:]*)(?::(\d*))?$/.exec(hostPort);
  if (!hp) return [url];
  const host = hp[1] as string;
  const port = hp[2];
  if (port === undefined || port === '') {
    return [url, `${scheme}://${userinfo}${host}:${defaultPort}${rest}`];
  }
  if (port === defaultPort) return [url, `${scheme}://${userinfo}${host}${rest}`];
  return [url];
}

function compareBytes(a: string, b: string): number {
  const x = utf8(a);
  const y = utf8(b);
  const n = Math.min(x.length, y.length);
  for (let i = 0; i < n; i++) {
    const d = (x[i] as number) - (y[i] as number);
    if (d !== 0) return d;
  }
  return x.length - y.length;
}

function constantTimeEqual(a: string, b: string): boolean {
  const x = utf8(a);
  const y = utf8(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= (x[i] as number) ^ (y[i] as number);
  return diff === 0;
}

function utf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function base64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

/** HMAC (RFC 2104) over SHA-1. */
function hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
  const BLOCK = 64;
  const k = key.length > BLOCK ? sha1(key) : key;
  const inner = new Uint8Array(BLOCK + message.length);
  const outer = new Uint8Array(BLOCK + 20);
  for (let i = 0; i < BLOCK; i++) {
    const byte = i < k.length ? (k[i] as number) : 0;
    inner[i] = byte ^ 0x36;
    outer[i] = byte ^ 0x5c;
  }
  inner.set(message, BLOCK);
  outer.set(sha1(inner), BLOCK);
  return sha1(outer);
}

/** SHA-1 (FIPS 180-4). Used only for HMAC-SHA1 webhook signatures. */
function sha1(data: Uint8Array): Uint8Array {
  const length = data.length;
  const padded = new Uint8Array((((length + 8) >> 6) + 1) << 6);
  padded.set(data);
  padded[length] = 0x80;
  const view = new DataView(padded.buffer);
  const bits = length * 8;
  view.setUint32(padded.length - 8, Math.floor(bits / 0x1_0000_0000));
  view.setUint32(padded.length - 4, bits >>> 0);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;
  const w = new Uint32Array(80);
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 80; i++) {
      const x = (w[i - 3] as number) ^ (w[i - 8] as number) ^ (w[i - 14] as number) ^ (w[i - 16] as number);
      w[i] = (x << 1) | (x >>> 31);
    }
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    for (let i = 0; i < 80; i++) {
      let f: number;
      let k: number;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }
      const temp = (((a << 5) | (a >>> 27)) + f + e + k + (w[i] as number)) >>> 0;
      e = d;
      d = c;
      c = ((b << 30) | (b >>> 2)) >>> 0;
      b = a;
      a = temp;
    }
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }
  const out = new Uint8Array(20);
  const outView = new DataView(out.buffer);
  [h0, h1, h2, h3, h4].forEach((h, i) => outView.setUint32(i * 4, h));
  return out;
}
