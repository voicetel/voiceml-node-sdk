// Rename .js → .cjs in dist/cjs so package.json's `require` export points at a real .cjs file.
// Keeps Node's ESM/CJS resolver happy without a sub-package `package.json` hack.

import { readdir, rename, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const root = new URL('../dist/cjs', import.meta.url).pathname;
const files = await walk(root);

// First pass: rename .js → .cjs.
const renames = new Map();
for (const f of files) {
  if (extname(f) === '.js') {
    const dst = f.slice(0, -3) + '.cjs';
    await rename(f, dst);
    renames.set(f, dst);
  }
}

// Second pass: rewrite require() targets so `./foo.js` → `./foo.cjs`.
for (const dst of renames.values()) {
  let src = await readFile(dst, 'utf8');
  src = src.replace(/require\("(\.\.?\/[^"]+?)\.js"\)/g, 'require("$1.cjs")');
  src = src.replace(/require\('(\.\.?\/[^']+?)\.js'\)/g, "require('$1.cjs')");
  await writeFile(dst, src);
}
