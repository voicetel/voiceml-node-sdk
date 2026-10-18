/**
 * Spec-driven contract test.
 *
 * Every public method reachable from `Client` is discovered through the TypeScript type
 * checker and called twice through a recording `fetch` — once with required arguments only,
 * once with every optional argument and property filled. Each recorded request must match a
 * spec operation (method + path template, including the `.json` / `.wav` suffix rules) and:
 *   - go to the product host for the operation's tag,
 *   - carry HTTP Basic auth exactly when the operation's `security` requires it,
 *   - send only query / form / JSON keys the operation declares, with required ones present,
 *     a declared content type, and repeated keys only for array-typed parameters.
 * Finally every operation in the spec must be reached (333/333), and every declared
 * parameter must be sendable through the SDK.
 */

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { Client, ConfigurationError } from '../../src/index.js';
import { hostsForTags, loadSpec, specOps, type SpecOp } from './spec.js';
import {
  acceptsAnyString,
  membersOf,
  propsOf,
  returnKind,
  sampleArgs,
  sdkTypes,
  type SdkTypes,
} from './typeinfo.js';

const ACCOUNT_SID = 'AC' + '0'.repeat(32);

/** Ops impossible to reach from the SDK. Intentionally empty. */
const UNCOVERABLE_OPS: string[] = [];

interface Recorded {
  method: string;
  host: string;
  pathname: string;
  query: Array<[string, string]>;
  auth: boolean;
  contentType: string | null;
  body: Array<[string, string]> | Record<string, unknown> | null;
}

interface CallRecord {
  label: string;
  root: string;
  full: boolean;
  requests: Recorded[];
  error: unknown;
  /** Declared types of the method's parameters (to check enum constraints). */
  paramTypes: ts.Type[];
}

function recordingFetch(sink: Recorded[]): typeof fetch {
  return (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const u = new URL(String(input));
    const headers = (init.headers ?? {}) as Record<string, string>;
    let body: Recorded['body'] = null;
    if (init.body instanceof URLSearchParams) body = [...init.body.entries()];
    else if (typeof init.body === 'string') body = JSON.parse(init.body) as Record<string, unknown>;
    sink.push({
      method: (init.method ?? 'GET').toUpperCase(),
      host: u.host,
      pathname: u.pathname,
      query: [...u.searchParams.entries()],
      auth: typeof headers.Authorization === 'string',
      contentType:
        headers['Content-Type'] ?? (init.body instanceof URLSearchParams ? 'form' : null),
      body,
    });
    return new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
}

const SKIP_MEMBERS = new Set(['close', 'toJSON', 'nextPage', 'paginate', 'accountSid', 'baseUrl']);

async function walkClient(t: SdkTypes): Promise<CallRecord[]> {
  const sink: Recorded[] = [];
  const client = new Client({
    accountSid: ACCOUNT_SID,
    apiKey: 'contract-test-key',
    fetch: recordingFetch(sink),
    maxRetries: 0,
  });
  const out: CallRecord[] = [];
  const seen = new Set<unknown>();

  const invoke = async (fn: (...a: unknown[]) => unknown, self: unknown, args: unknown[]) => {
    const before = sink.length;
    let error: unknown = null;
    try {
      await fn.apply(self, args);
    } catch (err) {
      error = err;
    }
    return { requests: sink.slice(before), error };
  };

  const walk = async (value: unknown, type: ts.Type, label: string, root: string, depth: number) => {
    if (depth > 6 || value === null || value === undefined || seen.has(value)) return;
    seen.add(value);
    for (const member of membersOf(t, type)) {
      if (depth === 0 && SKIP_MEMBERS.has(member.name)) continue;
      const runtime = (value as Record<string, unknown>)[member.name];
      const memberLabel = `${label}.${member.name}`;
      const memberRoot = depth === 0 ? member.name : root;
      const sigs = member.type.getCallSignatures();
      if (sigs.length > 0 && typeof runtime === 'function') {
        const sig = sigs[0] as ts.Signature;
        const kind = returnKind(t, sig);
        if (kind === 'promise') {
          for (const full of [false, true]) {
            const args = sampleArgs(t, sig, full, 'P');
            const res = await invoke(runtime as (...a: unknown[]) => unknown, value, args);
            const paramTypes = sig
              .getParameters()
              .map((p) => t.checker.getNonNullableType(t.checker.getTypeOfSymbolAtLocation(p, t.node)));
            out.push({ label: memberLabel, root: memberRoot, full, paramTypes, ...res });
          }
        } else if (kind === 'scope') {
          const args = sampleArgs(t, sig, true, 'S');
          const scope = (runtime as (...a: unknown[]) => unknown).apply(value, args);
          await walk(scope, t.checker.getReturnTypeOfSignature(sig), `${memberLabel}()`, memberRoot, depth + 1);
        }
        // Callable objects (`users(sid)` + `users.list()`) also carry methods.
        if (t.checker.getPropertiesOfType(member.type).length > 0) {
          await walk(runtime, member.type, memberLabel, memberRoot, depth + 1);
        }
      } else if (runtime && typeof runtime === 'object') {
        await walk(runtime, member.type, memberLabel, memberRoot, depth + 1);
      }
    }
  };
  await walk(client, t.clientType, 'client', '', 0);
  return out;
}

function matchOp(ops: SpecOp[], r: Recorded): SpecOp | null {
  const hits = ops.filter((o) => o.method === r.method && o.regex.test(r.pathname));
  hits.sort((a, b) => b.literalWeight - a.literalWeight);
  return hits[0] ?? null;
}

function expectedHost(root: string): string {
  if (root === 'conversationsV1') return 'conversations.voicetel.com';
  if (root === 'messagingV1') return 'messaging.voicetel.com';
  return 'voiceml.voicetel.com';
}

function keysOf(body: Recorded['body']): Array<[string, number]> {
  if (!body) return [];
  const counts = new Map<string, number>();
  const pairs: Array<[string, unknown]> = Array.isArray(body) ? body : Object.entries(body);
  for (const [k] of pairs) counts.set(k, (counts.get(k) ?? 0) + 1);
  return [...counts.entries()];
}

describe('spec contract', async () => {
  const t = sdkTypes();
  const ops = specOps();
  const calls = await walkClient(t);

  it('loads the vendored public spec', () => {
    expect(loadSpec().info.version).toBe('0.9.2');
    expect(ops).toHaveLength(333);
  });

  it('issues exactly one request per call (or a client-side ConfigurationError)', () => {
    const problems: string[] = [];
    for (const c of calls) {
      if (c.requests.length === 1) continue;
      if (c.requests.length === 0 && c.error instanceof ConfigurationError && !c.full) continue;
      problems.push(`${c.label} (${c.full ? 'full' : 'minimal'}): ${c.requests.length} requests, error=${String(c.error)}`);
    }
    expect(problems).toEqual([]);
    expect(calls.length).toBeGreaterThan(600);
  });

  it('matches every request to a spec operation with the right host, auth and keys', () => {
    const problems: string[] = [];
    for (const c of calls) {
      for (const r of c.requests) {
        const op = matchOp(ops, r);
        const where = `${c.label} → ${r.method} ${r.pathname}`;
        if (!op) {
          problems.push(`${where}: no spec operation`);
          continue;
        }
        const host = expectedHost(c.root);
        if (r.host !== host || !hostsForTags(op.tags).has(r.host)) {
          problems.push(`${where}: host ${r.host}, expected ${host} for tags ${op.tags.join(',')}`);
        }
        if (r.auth !== op.auth) problems.push(`${where}: auth=${r.auth}, spec auth=${op.auth}`);

        const queryCounts = new Map<string, number>();
        for (const [k] of r.query) queryCounts.set(k, (queryCounts.get(k) ?? 0) + 1);
        for (const [k, n] of queryCounts) {
          const decl = op.query.get(k);
          if (!decl) problems.push(`${where}: query key ${k} not declared by ${op.operationId}`);
          else if (n > 1 && !decl.array) problems.push(`${where}: query key ${k} repeated`);
        }
        for (const [k, decl] of op.query) {
          if (decl.required && !queryCounts.has(k)) problems.push(`${where}: missing required query ${k}`);
        }

        if (!op.body) {
          if (r.body && keysOf(r.body).length > 0) problems.push(`${where}: sends a body; spec has none`);
          continue;
        }
        const ct = r.contentType === 'form' ? 'application/x-www-form-urlencoded' : r.contentType;
        const content = ct ? op.body.content[ct] : undefined;
        if (r.body === null) {
          if (op.body.required) problems.push(`${where}: missing required body`);
          continue;
        }
        if (!content) {
          problems.push(`${where}: content type ${ct} not declared (${Object.keys(op.body.content).join(', ')})`);
          continue;
        }
        for (const [k, n] of keysOf(r.body)) {
          if (!content.props.has(k)) {
            problems.push(`${where}: body key ${k} not declared by ${op.operationId}`);
          }
          if (n > 1 && !content.arrays.has(k)) problems.push(`${where}: body key ${k} repeated`);
        }
        const sent = new Set(keysOf(r.body).map(([k]) => k));
        for (const k of content.required) {
          if (!sent.has(k)) problems.push(`${where}: missing required body key ${k}`);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it('reaches every spec operation (333/333)', () => {
    const covered = new Set<string>();
    for (const c of calls) {
      for (const r of c.requests) {
        const op = matchOp(ops, r);
        if (op) covered.add(op.operationId);
      }
    }
    const missing = ops
      .map((o) => o.operationId)
      .filter((id) => !covered.has(id) && !UNCOVERABLE_OPS.includes(id));
    expect(missing).toEqual([]);
    expect(covered.size).toBe(333);
  });

  it('can send every parameter the spec declares', () => {
    const sent = new Map<string, Set<string>>();
    for (const c of calls) {
      if (!c.full) continue;
      for (const r of c.requests) {
        const op = matchOp(ops, r);
        if (!op) continue;
        const keys = sent.get(op.operationId) ?? new Set<string>();
        for (const [k] of r.query) keys.add(k);
        for (const [k] of keysOf(r.body)) keys.add(k);
        sent.set(op.operationId, keys);
      }
    }
    const unexposed: string[] = [];
    for (const op of ops) {
      const keys = sent.get(op.operationId) ?? new Set<string>();
      const declared = new Set<string>(op.query.keys());
      for (const content of Object.values(op.body?.content ?? {})) {
        for (const p of content.props) declared.add(p);
      }
      for (const k of declared) {
        if (!keys.has(k)) unexposed.push(`${op.operationId}: ${k}`);
      }
    }
    expect(unexposed).toEqual([]);
  });

  it('keeps enum-typed request parameters constrained to the spec values', () => {
    const problems = new Set<string>();
    for (const c of calls) {
      if (!c.full) continue;
      for (const r of c.requests) {
        const op = matchOp(ops, r);
        if (!op) continue;
        const enums = new Map<string, Set<string>>();
        for (const [k, q] of op.query) if (q.enum) enums.set(k, q.enum);
        for (const content of Object.values(op.body?.content ?? {})) {
          for (const [k, v] of content.enums) enums.set(k, v);
        }
        for (const type of c.paramTypes) {
          for (const prop of propsOf(t, type)) {
            const allowed = enums.get(prop.name);
            if (!allowed) continue;
            const pt = t.checker.getNonNullableType(prop.type);
            const elem = t.checker.isArrayType(pt)
              ? (t.checker.getTypeArguments(pt as ts.TypeReference)[0] ?? pt)
              : pt;
            if (acceptsAnyString(t, elem)) {
              problems.add(`${c.label}: ${prop.name} accepts any string`);
              continue;
            }
            const members = elem.isUnion() ? elem.types : [elem];
            for (const m of members) {
              if (m.isStringLiteral() && !allowed.has(m.value)) {
                problems.add(`${c.label}: ${prop.name} allows '${m.value}', not in the spec enum`);
              }
            }
          }
        }
      }
    }
    expect([...problems]).toEqual([]);
  });
});
