import { defineConfig } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default defineConfig([
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: [
      'src/server/**/*.{ts,tsx,mjs,cjs,js}',
      'app/server/**/*.{ts,tsx,mjs,cjs,js}',
      'services/**/*.{ts,tsx,mjs,cjs,js}',
      'lib/config/**/*.{ts,tsx,mjs,cjs,js}',
      'lib/server/**/*.{ts,tsx,mjs,cjs,js}',
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.node,
      parserOptions: {
        project: ['./tools/tsconfig.server.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['src/shared/**/*.{ts,tsx,mjs,cjs,js}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        project: ['./tools/tsconfig.shared.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: [
      'src/client/**/*.{ts,tsx}',
      'app/client/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      'lib/client/**/*.{ts,tsx}',
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        project: ['./tools/tsconfig.client.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['app/client/entrypoints/**/*.{ts,tsx}', 'src/client/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['off'],
      'no-unused-vars': ['off'],
    },
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      'eslint.config.js',
      '**/vite.config.ts',
      'devvit.config.ts',
    ],
    languageOptions: {
      parserOptions: {
        project: [
          './tools/tsconfig.client.json',
          './tools/tsconfig.server.json',
          './tools/tsconfig.shared.json',
          './tools/tsconfig.vite.json',
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      js,
      '@typescript-eslint': tseslint.plugin,
    },
    extends: ['js/recommended'],
  },
]);
