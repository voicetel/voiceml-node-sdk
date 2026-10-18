// Packed-tarball smoke test: `npm pack`, install the tarball into four scratch consumers, and
// check that each one loads the SDK and type-checks against it:
//   - CommonJS JavaScript (`require`)
//   - ESM JavaScript (`import`)
//   - TypeScript, `module: node16` + `"type": "commonjs"` (resolves the `require` types)
//   - TypeScript, `module: node16` + `"type": "module"` (resolves the `import` types)
//
// Usage: node scripts/smoke-pack.mjs [workdir]   (run `npm run build` first)

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(fileURLToPath(new URL('..', import.meta.url)));
const work = process.argv[2] ? resolve(process.argv[2]) : mkdtempSync(join(tmpdir(), 'voiceml-smoke-'));
rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const run = (cmd, args, cwd) => {
  try {
    return execFileSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] }).toString();
  } catch (err) {
    process.stderr.write(String(err.stdout ?? ''));
    throw new Error(`${[cmd, ...args].join(' ')} failed in ${cwd}`, { cause: err });
  }
};

const [packed] = JSON.parse(run(npm, ['pack', '--json', '--pack-destination', work], repo));
const tarball = join(work, packed.filename);
console.log(`packed ${packed.filename} (${packed.files.length} files)`);
const leaked = packed.files.map((f) => f.path).filter((p) => !/^(dist\/|README\.md$|CHANGELOG\.md$|LICENSE$|package\.json$)/.test(p));
if (leaked.length > 0) throw new Error(`unexpected files in the tarball: ${leaked.join(', ')}`);

const tsc = join(repo, 'node_modules', 'typescript', 'bin', 'tsc');
const typeRoots = [join(repo, 'node_modules', '@types')];

// Exercised by every consumer: a request through a stub fetch, error classes, the validator.
// `ts` adds the annotations strict TypeScript needs.
const body = (ts) => `
const calls${ts ? ': Array<{ url: string; auth: string }>' : ''} = [];
const stub = async (url${ts ? ': string | URL | Request' : ''}, init${ts ? '?: RequestInit' : ''}) => {
  calls.push({ url: String(url), auth: (init${ts ? '?.headers as Record<string, string>' : '.headers'}).Authorization });
  return new Response(JSON.stringify({ calls: [], page: 0, page_size: 50, next_page_uri: null }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
const client = new sdk.Client({ accountSid: 'AC' + '0'.repeat(32), apiKey: 'smoke-key', fetch: stub${ts ? ' as typeof fetch' : ''} });
const list = await client.calls.list({ PageSize: 50 });
if (!Array.isArray(list.calls)) throw new Error('calls.list did not decode');
if (calls[0]${ts ? '!' : ''}.url !== 'https://voiceml.voicetel.com/2010-04-01/Accounts/AC' + '0'.repeat(32) + '/Calls.json?PageSize=50') {
  throw new Error('unexpected URL ' + calls[0]${ts ? '!' : ''}.url);
}
if (!calls[0]${ts ? '!' : ''}.auth.startsWith('Basic ')) throw new Error('missing auth');
if (!(new sdk.RateLimitError('x', { statusCode: 429 }) instanceof sdk.ApiError)) throw new Error('error hierarchy broken');
if (sdk.computeSignature('test-api-key-0123456789', 'https://example.com/hook', [['To', '+14155550101'], ['Event', 'answered'], ['Event', 'initiated']]) !== 'jCnpBgyg45aZYwUie5fmq4EYUic=') {
  throw new Error('signature mismatch');
}
if (JSON.stringify(client).includes('smoke-key')) throw new Error('API key leaked');
console.log('ok', sdk.VERSION);
`;

const consumers = [
  {
    name: 'cjs-js',
    type: 'commonjs',
    files: { 'index.js': `const sdk = require('@voicetel.com/voiceml');\n(async () => {${body(false)}})().catch((e) => { console.error(e); process.exit(1); });\n` },
    run: 'index.js',
  },
  {
    name: 'esm-js',
    type: 'module',
    files: { 'index.mjs': `import * as sdk from '@voicetel.com/voiceml';\n${body(false)}` },
    run: 'index.mjs',
  },
  {
    name: 'ts-node16-cjs',
    type: 'commonjs',
    ts: true,
    files: {
      'index.ts': `import * as sdk from '@voicetel.com/voiceml';
import type { Call, CallList } from '@voicetel.com/voiceml';
const typed: (l: CallList) => Call[] = (l) => l.calls;
void typed;
(async () => {${body(true)}})().catch((e: unknown) => { console.error(e); process.exit(1); });
`,
    },
    run: 'out/index.js',
  },
  {
    name: 'ts-node16-esm',
    type: 'module',
    ts: true,
    files: {
      'index.ts': `import * as sdk from '@voicetel.com/voiceml';
import type { Call, CallList } from '@voicetel.com/voiceml';
const typed: (l: CallList) => Call[] = (l) => l.calls;
void typed;
${body(true)}`,
    },
    run: 'out/index.js',
  },
];

for (const c of consumers) {
  const dir = join(work, c.name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: `smoke-${c.name}`, private: true, type: c.type }, null, 2));
  for (const [file, text] of Object.entries(c.files)) writeFileSync(join(dir, file), text);
  run(npm, ['install', '--no-audit', '--no-fund', '--no-package-lock', tarball], dir);
  if (c.ts) {
    writeFileSync(
      join(dir, 'tsconfig.json'),
      JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            module: 'node16',
            moduleResolution: 'node16',
            strict: true,
            outDir: 'out',
            types: ['node'],
            typeRoots,
            skipLibCheck: false,
          },
          include: ['index.ts'],
        },
        null,
        2,
      ),
    );
    run(process.execPath, [tsc, '-p', dir], dir);
    console.log(`${c.name}: type-check ok`);
  }
  process.stdout.write(`${c.name}: ${run(process.execPath, [c.run], dir)}`);
}
console.log(`smoke tests passed in ${work}`);
