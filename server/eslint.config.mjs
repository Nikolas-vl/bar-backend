import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettierConfig,

  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      globals: globals.node,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettierPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'lf',
        },
      ],
      '@typescript-eslint/no-unused-vars': ['warn'],
    },
    ignores: ['node_modules', 'dist', 'prisma', 'src/generated'],
  },
];
