import path from 'node:path';

import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import {
  createNodeResolver,
  flatConfigs as importXFlatConfigs,
} from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const nodeResolutionOptions = {
  extensions: ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.mts', '.cts', '.json'],
  // NodeNext requires `./x.js` specifiers that map to `x.ts` sources.
  extensionAlias: {
    '.js': ['.ts', '.js'],
    '.mjs': ['.mts', '.mjs'],
    '.cjs': ['.cts', '.cjs'],
  },
};

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      // Prisma 7 generates the client into a real directory; it is not ours to lint.
      '**/generated/**',
      // Session scratch (local CLI caches, background-job snapshots).
      '.reasonix/**',
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  importXFlatConfigs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
      },
    },
    settings: {
      'import-x/resolver-next': [createNodeResolver(nodeResolutionOptions)],
    },
    rules: {
      // Contracts from docs/decisions.md: no `any`, and no floating promises.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/only-throw-error': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Import ordering: groups separated by a blank line, alphabetical inside.
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling', 'index'],
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: '@discoverylab/**',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-duplicates': 'error',

      // tsc already rejects imports of names that do not exist, and import-x
      // cannot see the default export of `export =` CJS typings such as
      // @fastify/cookie. (Upstream import-x switches off `named` for TS files
      // for the same reason.)
      'import-x/default': 'off',
    },
  },
  {
    // The web app runs in the browser; its tsconfig already supplies the DOM
    // types, but ESLint's no-undef rule needs the matching globals. Its own
    // tsconfig also teaches the resolver the `@/*` alias.
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    settings: {
      'import-x/resolver-next': [
        createNodeResolver({
          ...nodeResolutionOptions,
          tsconfig: {
            configFile: path.resolve(
              import.meta.dirname,
              'apps/web/tsconfig.json',
            ),
          },
        }),
      ],
    },
  },
  {
    // Config and build scripts live outside every tsconfig project, so parse
    // them without type information and skip the type-checked rules. This must
    // come after the block above: later configs win for parserOptions.
    files: ['**/*.js', '**/*.mjs', '**/*.cjs', '**/prisma.config.ts'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
  },
  prettier,
);
