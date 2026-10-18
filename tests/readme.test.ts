/**
 * Every ```ts block in README.md must compile against the SDK under `strict`. Each block is
 * type-checked as its own module, with `@voicetel.com/voiceml` resolved to `src/index.ts`.
 * The CommonJS ```js example is checked to `require()` only names the package exports.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import * as sdk from '../src/index.js';

const README = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const INDEX = fileURLToPath(new URL('../src/index.ts', import.meta.url));
const SNIPPET_DIR = fileURLToPath(new URL('./__readme__/', import.meta.url));

const blocks = (lang: string): string[] =>
  [...README.matchAll(new RegExp('```' + lang + '\\n([\\s\\S]*?)```', 'g'))].map((m) => m[1] as string);

describe('README', () => {
  const snippets = blocks('ts');

  it('has TypeScript examples', () => {
    expect(snippets.length).toBeGreaterThanOrEqual(10);
  });

  it('every ```ts snippet type-checks under strict', () => {
    const files = new Map(snippets.map((code, i) => [`${SNIPPET_DIR}snippet-${i + 1}.ts`, code]));
    const options: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
      types: ['node'],
      strict: true,
      noEmit: true,
      skipLibCheck: true,
      noUnusedLocals: false,
      paths: { '@voicetel.com/voiceml': [INDEX] },
    };
    const host = ts.createCompilerHost(options);
    const getSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (name, lang, onError, shouldCreate) => {
      const text = files.get(name);
      if (text !== undefined) return ts.createSourceFile(name, text, lang);
      return getSourceFile(name, lang, onError, shouldCreate);
    };
    const fileExists = host.fileExists.bind(host);
    host.fileExists = (name) => files.has(name) || fileExists(name);
    const readFile = host.readFile.bind(host);
    host.readFile = (name) => files.get(name) ?? readFile(name);

    const program = ts.createProgram([...files.keys()], options, host);
    const problems = ts
      .getPreEmitDiagnostics(program)
      .filter((d) => d.file && files.has(d.file.fileName))
      .map((d) => {
        const file = d.file as ts.SourceFile;
        const { line } = file.getLineAndCharacterOfPosition(d.start ?? 0);
        const snippet = file.fileName.slice(SNIPPET_DIR.length);
        return `${snippet}:${line + 1}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`;
      });
    expect(problems).toEqual([]);
  });

  it('the CommonJS example only requires real exports', () => {
    for (const code of blocks('js')) {
      const m = /const \{([^}]+)\} = require\('@voicetel\.com\/voiceml'\);/.exec(code);
      expect(m).not.toBeNull();
      for (const name of (m?.[1] ?? '').split(',').map((s) => s.trim())) {
        expect(sdk).toHaveProperty(name);
      }
    }
  });
});
