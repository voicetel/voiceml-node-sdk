/**
 * Wire encoding helpers shared by the transport and every resource.
 *
 * - Path segments: every caller-supplied value interpolated into a URL path goes through
 *   {@link encodePathSegment}, which keeps only the RFC 3986 unreserved set
 *   (`A-Z a-z 0-9 - . _ ~`) and percent-encodes everything else as UTF-8 `%XX`.
 * - Query / form values: booleans as `true`/`false`, `Date` as ISO-8601 UTC, arrays as
 *   repeated keys. Plain objects are rejected (except the JSON-typed form fields listed in
 *   {@link JSON_FORM_FIELDS}, which are sent as compact JSON strings).
 */

import { ConfigurationError } from './errors.js';

/** A JSON object value, accepted by the JSON-typed form fields (`Attributes`, …). */
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;

/** Scalar values accepted in query strings and form bodies. */
export type WireScalar = string | number | boolean | bigint | Date;

/**
 * Form fields the API documents as JSON-encoded strings. A plain object passed for one of
 * these keys is serialised with `JSON.stringify` (compact); any other plain object is a
 * {@link ConfigurationError}.
 */
export const JSON_FORM_FIELDS: ReadonlySet<string> = new Set([
  'Attributes',
  'Parameter',
  'Participant',
]);

/**
 * Percent-encode one path segment. Only the RFC 3986 unreserved characters pass through;
 * `+`→`%2B`, space→`%20`, `/`→`%2F`, `?`→`%3F`, `#`→`%23`, `%`→`%25`.
 *
 * Empty segments and the dot segments `.` / `..` are rejected: URL parsers collapse them,
 * which would silently retarget the request.
 */
export function encodePathSegment(value: string | number): string {
  const s = String(value);
  if (s === '' || s === '.' || s === '..') {
    throw new ConfigurationError(`invalid path segment ${JSON.stringify(s)}`);
  }
  let encoded: string;
  try {
    encoded = encodeURIComponent(s);
  } catch (err) {
    throw new ConfigurationError(`path segment is not valid UTF-16: ${JSON.stringify(s)}`, {
      cause: err,
    });
  }
  // encodeURIComponent leaves the RFC 3986 sub-delims `! ' ( ) *` unescaped.
  return encoded.replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

/**
 * Tagged template that percent-encodes every interpolated value as a path segment:
 * `` route`/v1/Roles/${sid}` `` → `/v1/Roles/RL…`.
 */
export function route(strings: TemplateStringsArray, ...values: Array<string | number>): string {
  let out = strings[0] ?? '';
  for (let i = 0; i < values.length; i++) {
    out += encodePathSegment(values[i] as string | number) + (strings[i + 1] ?? '');
  }
  return out;
}

/** ISO-8601 UTC without fractional seconds, e.g. `2026-09-30T20:00:00Z`. */
export function isoDateTime(d: Date): string {
  if (Number.isNaN(d.getTime())) throw new ConfigurationError('invalid Date value');
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Normalise a date-only filter (`DateCreated`, `StartTime`, `StartDate`, …): a `Date` is sent
 * as its UTC calendar day `YYYY-MM-DD`; strings pass through unchanged.
 */
export function dateOnly(v: string | Date | undefined | null): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'string') return v;
  return isoDateTime(v).slice(0, 10);
}

/** Serialise one scalar query/form value. */
export function encodeScalar(key: string, v: unknown): string {
  switch (typeof v) {
    case 'string':
      return v;
    case 'boolean':
      return v ? 'true' : 'false';
    case 'bigint':
      return v.toString();
    case 'number':
      if (!Number.isFinite(v)) throw new ConfigurationError(`${key}: number must be finite`);
      return String(v);
    case 'object':
      if (v instanceof Date) return isoDateTime(v);
      if (v !== null && JSON_FORM_FIELDS.has(key) && isPlainObject(v)) return JSON.stringify(v);
      throw new ConfigurationError(
        `${key}: objects cannot be form/query encoded — pass a string, number, boolean, Date or array`,
      );
    default:
      throw new ConfigurationError(`${key}: unsupported value of type ${typeof v}`);
  }
}

/**
 * Append every defined entry of `source` to `target`. `undefined`/`null` values are dropped;
 * arrays become repeated keys (`Key=a&Key=b`, never `Key[0]=a`).
 */
export function appendParams(target: URLSearchParams, source: object): void {
  for (const [k, v] of Object.entries(source)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      for (const entry of v) {
        if (entry === undefined || entry === null) continue;
        if (Array.isArray(entry)) throw new ConfigurationError(`${k}: nested arrays are not supported`);
        target.append(k, encodeScalar(k, entry));
      }
    } else {
      target.append(k, encodeScalar(k, v));
    }
  }
}

function isPlainObject(v: object): boolean {
  const proto = Object.getPrototypeOf(v) as unknown;
  return proto === Object.prototype || proto === null;
}

/** UTF-8 safe Base64 using only web-standard globals (`btoa`, `TextEncoder`). */
export function base64(input: string): string {
  let binary = '';
  for (const byte of new TextEncoder().encode(input)) binary += String.fromCharCode(byte);
  return btoa(binary);
}
