// Flat-config ESLint setup for VoiceML's TypeScript SDK.
//
// typescript-eslint's recommended rules on top of the "@eslint/js" baseline, applied to the
// SDK sources, the tests and the build scripts alike — no rule is relaxed anywhere.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', '**/*.d.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.mjs', '**/*.js'],
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
  },
);
