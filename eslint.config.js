// Flat ESLint config (v9). Runs on the bot + extracted modules + tests.
// Posture: catch real errors (recommended), but treat unused vars / empty catch as
// warnings so the pre-existing 893-line entrypoint surfaces issues without failing the
// run. Formatting is delegated to Prettier (eslint-config-prettier disables stylistic
// rules). Full legacy cleanup is out of scope (issue 6115cc3); see issue 950dc54.

'use strict';

const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier');

module.exports = [
  { ignores: ['node_modules/**', '.artifacts/**', 'evals/**'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
  prettier,
];
