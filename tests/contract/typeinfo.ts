/**
 * TypeScript compiler-API view of the SDK's public surface: the exported interfaces (for the
 * response-model conformance test) and the parameter types of every public method (so the
 * contract test can build "required only" and "every field" arguments without hand-written
 * fixtures).
 */

import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const INDEX = fileURLToPath(new URL('../../src/index.ts', import.meta.url));

export interface SdkTypes {
  checker: ts.TypeChecker;
  exports: Map<string, ts.Symbol>;
  clientType: ts.Type;
  node: ts.Node;
}

let cached: SdkTypes | null = null;

export function sdkTypes(): SdkTypes {
  if (cached) return cached;
  const program = ts.createProgram([INDEX], {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
    types: ['node'],
    strict: true,
    noEmit: true,
    skipLibCheck: true,
  });
  const checker = program.getTypeChecker();
  const sf = program.getSourceFile(INDEX);
  if (!sf) throw new Error('src/index.ts not found');
  const moduleSymbol = checker.getSymbolAtLocation(sf);
  if (!moduleSymbol) throw new Error('src/index.ts has no module symbol');
  const exports = new Map<string, ts.Symbol>();
  for (const sym of checker.getExportsOfModule(moduleSymbol)) {
    const target = sym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(sym) : sym;
    exports.set(sym.name, target);
  }
  const client = exports.get('Client');
  if (!client) throw new Error('Client is not exported');
  cached = { checker, exports, clientType: checker.getDeclaredTypeOfSymbol(client), node: sf };
  return cached;
}

export interface PropInfo {
  name: string;
  optional: boolean;
  type: ts.Type;
  deprecated: boolean;
}

export function propsOf(t: SdkTypes, type: ts.Type): PropInfo[] {
  return t.checker.getPropertiesOfType(type).map((p) => ({
    name: p.name,
    optional: (p.flags & ts.SymbolFlags.Optional) !== 0,
    type: t.checker.getTypeOfSymbolAtLocation(p, t.node),
    deprecated: p.getJsDocTags().some((tag) => tag.name === 'deprecated'),
  }));
}

export function acceptsNull(t: SdkTypes, type: ts.Type): boolean {
  return t.checker.isTypeAssignableTo(t.checker.getNullType(), type);
}

export function acceptsAnyString(t: SdkTypes, type: ts.Type): boolean {
  return t.checker.isTypeAssignableTo(t.checker.getStringType(), type);
}

/** Build a sample value for a TS type: `full` fills every optional property too. */
export function sampleValue(t: SdkTypes, type: ts.Type, full: boolean, depth = 0): unknown {
  const { checker } = t;
  if (depth > 4) return undefined;
  if (type.isUnion()) {
    const members = type.types.filter(
      (m) => !(m.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Void)),
    );
    // Prefer a string literal / string member (Attributes: string | JsonObject → string).
    const lit = members.find((m) => m.isStringLiteral());
    if (lit && lit.isStringLiteral()) return lit.value;
    const str = members.find((m) => m.flags & ts.TypeFlags.String);
    if (str) return 'v';
    const boolLit = members.find((m) => m.flags & ts.TypeFlags.BooleanLiteral);
    if (boolLit) return true;
    if (members[0]) return sampleValue(t, members[0], full, depth + 1);
    return undefined;
  }
  if (type.flags & ts.TypeFlags.StringLiteral) return (type as ts.StringLiteralType).value;
  if (type.flags & ts.TypeFlags.NumberLiteral) return (type as ts.NumberLiteralType).value;
  if (type.flags & (ts.TypeFlags.String | ts.TypeFlags.TemplateLiteral)) return 'v';
  if (type.flags & ts.TypeFlags.Number) return 1;
  if (type.flags & (ts.TypeFlags.Boolean | ts.TypeFlags.BooleanLiteral)) return true;
  if (type.flags & (ts.TypeFlags.Unknown | ts.TypeFlags.Any)) return 'v';
  if (checker.isArrayType(type)) {
    const [elem] = checker.getTypeArguments(type as ts.TypeReference);
    return elem ? [sampleValue(t, elem, full, depth + 1), sampleValue(t, elem, full, depth + 1)] : [];
  }
  const sym = type.getSymbol();
  if (sym?.name === 'Date') return new Date(Date.UTC(2026, 8, 30, 12, 0, 0));
  if (type.flags & (ts.TypeFlags.Object | ts.TypeFlags.Intersection)) {
    const out: Record<string, unknown> = {};
    const props = propsOf(t, type);
    if (props.length === 0) return { key: 'v' };
    for (const p of props) {
      if (p.optional && !full) continue;
      out[p.name] = sampleValue(t, checker.getNonNullableType(p.type), full, depth + 1);
    }
    return out;
  }
  return undefined;
}

export interface CallableMember {
  name: string;
  /** The callable's signature (methods, arrow properties, or callable objects). */
  signature: ts.Signature;
  /** `true` when the member is itself an object with further members (a callable scope). */
  hasMembers: boolean;
  type: ts.Type;
}

export function membersOf(t: SdkTypes, type: ts.Type): Array<{ name: string; type: ts.Type }> {
  return t.checker
    .getPropertiesOfType(type)
    .filter((p) => {
      const decl = p.valueDeclaration ?? p.declarations?.[0];
      if (!decl) return true;
      const mods = ts.canHaveModifiers(decl) ? (ts.getModifiers(decl) ?? []) : [];
      const isPrivate = mods.some(
        (m) => m.kind === ts.SyntaxKind.PrivateKeyword || m.kind === ts.SyntaxKind.ProtectedKeyword,
      );
      return !isPrivate && !p.name.startsWith('#') && !p.name.startsWith('__');
    })
    .map((p) => ({ name: p.name, type: t.checker.getTypeOfSymbolAtLocation(p, t.node) }));
}

export function returnKind(t: SdkTypes, sig: ts.Signature): 'promise' | 'iterator' | 'scope' {
  const ret = t.checker.getReturnTypeOfSignature(sig);
  const name = ret.getSymbol()?.name;
  if (name === 'Promise') return 'promise';
  if (name === 'AsyncGenerator' || name === 'AsyncIterableIterator') return 'iterator';
  return 'scope';
}

/** Sample positional arguments for a signature. `full` fills optional params/properties. */
export function sampleArgs(t: SdkTypes, sig: ts.Signature, full: boolean, prefix: string): unknown[] {
  const args: unknown[] = [];
  sig.getParameters().forEach((p, i) => {
    const decl = p.valueDeclaration as ts.ParameterDeclaration | undefined;
    const optional = !!decl && (!!decl.questionToken || !!decl.initializer);
    if (optional && !full) return;
    const type = t.checker.getNonNullableType(t.checker.getTypeOfSymbolAtLocation(p, t.node));
    if (type.flags & ts.TypeFlags.String) args.push(`${prefix}${i}`);
    else args.push(sampleValue(t, type, full));
  });
  return args;
}
