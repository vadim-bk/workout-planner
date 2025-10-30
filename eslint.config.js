import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  {
    ignores: ['dist', 'node_modules', '**/coverage', '**/.vercel', '**/.cache'],
  },
  js.configs.recommended,
  {
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
      },
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      camelcase: 'off',
      'no-alert': 'error',
      'no-bitwise': 'error',
      'no-new': 'error',
      'no-param-reassign': 'error',
      'no-plusplus': 'off',
      'no-restricted-imports': 'error',
      'no-unused-expressions': ['error', { allowTernary: true, allowShortCircuit: true }],
      'prefer-rest-params': 'error',
      'quote-props': 'off',
      'no-restricted-syntax': 'error',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-redeclare': 'error',

      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      'import/extensions': ['error', 'never'],
      'import/no-cycle': 'error',
      'import/no-amd': 'error',
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
          pathGroupsExcludedImportTypes: ['builtin'],
          pathGroups: [
            {
              pattern: 'react-app-polyfill/**',
              group: 'external',
              position: 'before',
            },
            { pattern: '*polyfill*', group: 'external', position: 'before' },
          ],
          warnOnUnassignedImports: true,
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-refresh/only-export-components': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  eslintPluginPrettierRecommended,
];
