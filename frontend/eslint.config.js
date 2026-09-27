import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Dependency direction: app → pages → features → shared. Lower layers never import upward.
const layer = (forbidden) => ({
  'no-restricted-imports': [
    'error',
    {
      patterns: [
        { group: forbidden, message: 'Import direction is app → pages → features → shared.' },
      ],
    },
  ],
});

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: { ecmaVersion: 2023, globals: globals.browser },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  { files: ['src/shared/**'], rules: layer(['@/app/*', '@/pages/*', '@/features/*']) },
  { files: ['src/features/**'], rules: layer(['@/app/*', '@/pages/*']) },
  { files: ['src/pages/**'], rules: layer(['@/app/*']) },
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
]);
