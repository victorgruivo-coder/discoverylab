import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import {
  createNodeResolver,
  flatConfigs as importXFlatConfigs,
} from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      // Prisma 7 generates the client into a real directory; it is not ours to lint.
      '**/generated/**',
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
      'import-x/resolver-next': [
        createNodeResolver({
          extensions: ['.js', '.mjs', '.cjs', '.ts', '.mts', '.cts', '.json'],
          // NodeNext requires `./x.js` specifiers that map to `x.ts` sources.
          extensionAlias: {
            '.js': ['.ts', '.js'],
            '.mjs': ['.mts', '.mjs'],
            '.cjs': ['.cts', '.cjs'],
          },
        }),
      ],
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
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-duplicates': 'error',
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
