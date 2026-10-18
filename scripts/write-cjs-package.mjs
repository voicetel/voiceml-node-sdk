// dist/cjs is compiled with `module: CommonJS`, but the root package.json declares
// `"type": "module"`. A nested package.json scopes dist/cjs back to CommonJS so Node
// loads the `.js` files with `require()` semantics and TypeScript reads the sibling
// `.d.ts` files as CommonJS declarations.
import { writeFileSync } from 'node:fs';

writeFileSync(
  new URL('../dist/cjs/package.json', import.meta.url),
  `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`,
);
