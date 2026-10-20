import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import stylistic from '@stylistic/eslint-plugin';

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    files: ['**/*.{js,jsx,mjs}'],
    ...js.configs.recommended,
    plugins: { '@stylistic': stylistic },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/comma-spacing': 'error',
      '@stylistic/key-spacing': 'error',
    },
  },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['src/**/*.jsx'],
    ...react.configs.flat.recommended,
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      globals: globals.browser,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.flat.recommended.rules,
      // This JavaScript learning project does not use runtime prop-type declarations.
      'react/prop-types': 'off',
    },
  },
  {
    files: ['tests/**/*.mjs', '*.config.js'],
    languageOptions: { globals: globals.node },
  },
];
