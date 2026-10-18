/**
 * Loader for the vendored public OpenAPI spec (`tests/fixtures/voiceml-openapi.json`).
 * The fixture is test-only and is excluded from the published package (`files` in
 * package.json ships `dist` only).
 */

import { readFileSync } from 'node:fs';

export interface SchemaObject {
  type?: string | string[];
  nullable?: boolean;
  enum?: unknown[];
  format?: string;
  pattern?: string;
  items?: SchemaObject;
  properties?: Record<string, SchemaObject>;
  required?: string[];
  $ref?: string;
  description?: string;
}

interface ParameterObject {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  schema?: SchemaObject;
  $ref?: string;
}

interface OperationObject {
  operationId: string;
  tags?: string[];
  security?: unknown[];
  parameters?: ParameterObject[];
  requestBody?: { required?: boolean; content: Record<string, { schema: SchemaObject }> };
  responses: Record<string, { content?: Record<string, { schema?: SchemaObject }>; $ref?: string }>;
}

export interface Spec {
  info: { version: string };
  security?: unknown[];
  paths: Record<string, Record<string, unknown>>;
  components: {
    schemas: Record<string, SchemaObject>;
    parameters: Record<string, ParameterObject>;
  };
}

export interface BodySpec {
  required: boolean;
  /** content-type → { props, required props, array-typed props } */
  content: Record<
    string,
    {
      props: Set<string>;
      required: Set<string>;
      arrays: Set<string>;
      enums: Map<string, Set<string>>;
    }
  >;
}

export interface SpecOp {
  operationId: string;
  method: string;
  path: string;
  tags: string[];
  auth: boolean;
  pathParams: string[];
  query: Map<string, { required: boolean; array: boolean; enum: Set<string> | null }>;
  body: BodySpec | null;
  /** Path template as a regex over the request pathname. */
  regex: RegExp;
  /** Number of literal (non-template) path characters, used to prefer specific matches. */
  literalWeight: number;
  /** Response schema (2xx JSON), if any. */
  responseSchema: SchemaObject | null;
}

const SPEC_URL = new URL('../fixtures/voiceml-openapi.json', import.meta.url);

let cached: Spec | null = null;
export function loadSpec(): Spec {
  cached ??= JSON.parse(readFileSync(SPEC_URL, 'utf8')) as Spec;
  return cached;
}

export function deref(spec: Spec, s: SchemaObject | undefined): SchemaObject | undefined {
  let cur = s;
  for (let i = 0; cur?.$ref && i < 10; i++) {
    cur = spec.components.schemas[cur.$ref.split('/').pop() as string];
  }
  return cur;
}

export function isNullable(s: SchemaObject): boolean {
  return s.nullable === true || (Array.isArray(s.type) && s.type.includes('null'));
}

/** String enum values of a schema (or of its array items), or `null` when not an enum. */
export function enumValues(s: SchemaObject | undefined): Set<string> | null {
  const target = s?.type === 'array' ? s.items : s;
  if (!Array.isArray(target?.enum)) return null;
  const values = target.enum.filter((v): v is string => typeof v === 'string');
  return values.length > 0 ? new Set(values) : null;
}

export function isArrayType(s: SchemaObject): boolean {
  return s.type === 'array' || (Array.isArray(s.type) && s.type.includes('array'));
}

function resolveParam(spec: Spec, p: ParameterObject): ParameterObject {
  if (p.$ref) return spec.components.parameters[p.$ref.split('/').pop() as string] as ParameterObject;
  return p;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function specOps(): SpecOp[] {
  const spec = loadSpec();
  const out: SpecOp[] = [];
  for (const [path, item] of Object.entries(spec.paths)) {
    const shared = ((item.parameters as ParameterObject[] | undefined) ?? []).map((p) =>
      resolveParam(spec, p),
    );
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      const op = item[method] as OperationObject | undefined;
      if (!op) continue;
      const params = [...shared, ...(op.parameters ?? []).map((p) => resolveParam(spec, p))];
      const query = new Map<string, { required: boolean; array: boolean; enum: Set<string> | null }>();
      const pathParams: string[] = [];
      for (const p of params) {
        if (p.in === 'query') {
          query.set(p.name, {
            required: !!p.required,
            array: !!p.schema && isArrayType(p.schema),
            enum: enumValues(p.schema),
          });
        } else if (p.in === 'path') pathParams.push(p.name);
      }
      let body: BodySpec | null = null;
      if (op.requestBody) {
        body = { required: !!op.requestBody.required, content: {} };
        for (const [ct, c] of Object.entries(op.requestBody.content)) {
          const schema = deref(spec, c.schema) ?? {};
          const props = new Set(Object.keys(schema.properties ?? {}));
          const arrays = new Set(
            Object.entries(schema.properties ?? {})
              .filter(([, v]) => isArrayType(deref(spec, v) ?? {}))
              .map(([k]) => k),
          );
          const enums = new Map<string, Set<string>>();
          for (const [k, v] of Object.entries(schema.properties ?? {})) {
            const values = enumValues(deref(spec, v));
            if (values) enums.set(k, values);
          }
          body.content[ct] = { props, required: new Set(schema.required ?? []), arrays, enums };
        }
      }
      const security = op.security ?? spec.security ?? [];
      let responseSchema: SchemaObject | null = null;
      for (const [code, r] of Object.entries(op.responses)) {
        if (!code.startsWith('2')) continue;
        const json = r.content?.['application/json']?.schema;
        if (json) {
          responseSchema = json;
          break;
        }
      }
      const pattern = path.split(/\{[^}]+\}/).map(escapeRegex).join('[^/]+');
      out.push({
        operationId: op.operationId,
        method: method.toUpperCase(),
        path,
        tags: op.tags ?? [],
        auth: security.length > 0,
        pathParams,
        query,
        body,
        regex: new RegExp(`^${pattern}$`),
        literalWeight: path.replace(/\{[^}]+\}/g, '').length,
        responseSchema,
      });
    }
  }
  return out;
}

/** Host each tag is served on (relative to the configured base domain). */
export function hostsForTags(tags: string[]): Set<string> {
  const hosts = new Set<string>();
  for (const t of tags) {
    if (t.startsWith('ConversationsV1')) hosts.add('conversations.voicetel.com');
    else if (t === 'MessagingV1Service') hosts.add('messaging.voicetel.com');
    else hosts.add('voiceml.voicetel.com');
  }
  return hosts;
}
