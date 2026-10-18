/**
 * Response-model conformance: every response schema in the vendored spec is compared with
 * the exported TypeScript interface of the same name (or the mapped name for inline
 * schemas). For each spec property the interface must declare it, a spec-nullable property
 * must accept `null`, a non-required property must be optional, and a string enum must stay
 * open (accept any string) so a new server value never breaks exhaustive consumer code.
 * Interface properties the spec does not define must be optional and `@deprecated`.
 */

import { describe, expect, it } from 'vitest';
import type ts from 'typescript';

import { deref, isNullable, loadSpec, specOps, type SchemaObject } from './spec.js';
import { acceptsAnyString, acceptsNull, propsOf, sdkTypes } from './typeinfo.js';

/** Inline (non-component) 2xx response schemas → exported interface name. */
const INLINE_RESPONSES: Record<string, string> = {
  'balance.fetch': 'Balance',
  'exports.list': 'ExportList',
  'transcriptions.listAccount': 'TranscriptionList',
  'recording.transcriptions.list': 'TranscriptionList',
  'callNotifications.list': 'NotificationList',
  'notifications.list': 'NotificationList',
  'callEvents.list': 'CallEventList',
  'health.check': 'HealthStatus',
};

/** Spec schema → exported interface, where the names differ. */
const RENAMED: Record<string, string> = { Error: 'ErrorBody' };

/**
 * Component schemas that are not standalone response models. `ServicesSharedResponse` is a
 * `oneOf` over `ConversationsV1Service` / `MessagingService` (each checked on its own).
 */
const NOT_MODELS = new Set(['ServicesSharedResponse', 'ServicesSharedListResponse']);

function collectResponseSchemas(): Map<string, SchemaObject> {
  const spec = loadSpec();
  const out = new Map<string, SchemaObject>();
  const visit = (name: string, schema: SchemaObject | undefined): void => {
    if (!schema || out.has(name) || NOT_MODELS.has(name)) return;
    out.set(name, schema);
    for (const prop of Object.values(schema.properties ?? {})) {
      for (const ref of [prop.$ref, prop.items?.$ref]) {
        if (ref) {
          const refName = ref.split('/').pop() as string;
          visit(refName, spec.components.schemas[refName]);
        }
      }
    }
  };
  for (const op of specOps()) {
    const s = op.responseSchema;
    if (!s) continue;
    if (s.$ref) {
      const name = s.$ref.split('/').pop() as string;
      visit(name, spec.components.schemas[name]);
    } else if (op.operationId === 'health.check') {
      visit('HealthStatus', healthSchema(s));
    } else if (INLINE_RESPONSES[op.operationId]) {
      visit(INLINE_RESPONSES[op.operationId] as string, s);
    }
  }
  return out;
}

/** `HealthStatus` models both the 200 body and the 503 body (which adds `failures`). */
function healthSchema(ok: SchemaObject): SchemaObject {
  const health = loadSpec().paths['/health']?.get as {
    responses: Record<string, { content?: Record<string, { schema?: SchemaObject }> }>;
  };
  const failed = health.responses['503']?.content?.['application/json']?.schema ?? {};
  return { ...ok, properties: { ...ok.properties, ...failed.properties }, required: ['ok'] };
}

function isStringEnum(s: SchemaObject): boolean {
  return Array.isArray(s.enum) && s.enum.some((v) => typeof v === 'string');
}

describe('response models match the spec', () => {
  const t = sdkTypes();
  const schemas = collectResponseSchemas();

  it('covers every response schema', () => {
    expect(schemas.size).toBeGreaterThan(120);
    const missing = [...schemas.keys()].filter((n) => !t.exports.has(RENAMED[n] ?? n));
    expect(missing).toEqual([]);
  });

  it('declares every spec property with spec nullability, optionality and open enums', () => {
    const spec = loadSpec();
    const problems: string[] = [];
    for (const [name, schema] of schemas) {
      const sym = t.exports.get(RENAMED[name] ?? name);
      if (!sym) continue;
      const type: ts.Type = t.checker.getDeclaredTypeOfSymbol(sym);
      const props = new Map(propsOf(t, type).map((p) => [p.name, p]));
      const required = new Set(schema.required ?? []);
      for (const [propName, raw] of Object.entries(schema.properties ?? {})) {
        const prop = props.get(propName);
        if (!prop) {
          problems.push(`${name}.${propName}: missing`);
          continue;
        }
        const ps = deref(spec, raw) ?? raw;
        if ((isNullable(raw) || isNullable(ps)) && !acceptsNull(t, prop.type)) {
          problems.push(`${name}.${propName}: spec-nullable but type rejects null`);
        }
        if (!required.has(propName) && !prop.optional) {
          problems.push(`${name}.${propName}: not required by the spec but not optional`);
        }
        if (isStringEnum(ps) && !acceptsAnyString(t, t.checker.getNonNullableType(prop.type))) {
          problems.push(`${name}.${propName}: closed enum (unknown server values must type-check)`);
        }
      }
      for (const prop of props.values()) {
        if (schema.properties?.[prop.name]) continue;
        if (!prop.optional || !prop.deprecated) {
          problems.push(`${name}.${prop.name}: not in the spec (must be optional + @deprecated)`);
        }
      }
    }
    expect(problems).toEqual([]);
  });
});
