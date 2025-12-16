import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import importPlugin from 'eslint-plugin-import'
import promisePlugin from 'eslint-plugin-promise'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  // Ignore patterns (migrated from .eslintignore)
  {
    ignores: [
      'build/',
      'packages/builder',
      'clients/**/*/dist/',
      'plugins/**/*/dist/',
      'plugins/**/*/mdist/',
      'plugins/*/lib/**/*.js',
      'plugins/*/i18n/**/*.js',
      'plugins/*/*.js',
      'packages/core/index.js',
      'packages/core/api/',
      'packages/core/dist/',
      'packages/core/core/',
      'packages/core/commands/',
      'packages/core/main/',
      'packages/core/models/',
      'packages/core/plugins/',
      'packages/core/repl/',
      'packages/core/test/',
      'packages/core/util/',
      'packages/core/webapp/',
      'packages/proxy/kui',
      'packages/react/dist/',
      'packages/test/dist/',
      'packages/*/mdist/',
      'plugins/*/mdist/',
      'plugins/*/dist/',
      '**/*/node_modules/',
      '**/*.d.ts',
      'plugins/plugin-apache-composer/tests/data/composer/composer-source-expect-errors/if-bad.js',
      'kui-stage',
      '*flycheck*.js',
      '/dist',
      '**/coverage/**',
      '**/.nyc_output/**',
      'src-tauri/target/**'
    ]
  },

  // Base ESLint recommended rules
  js.configs.recommended,

  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react,
      import: importPlugin,
      promise: promisePlugin
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2018
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      // TypeScript ESLint recommended rules (manually specified for compatibility)
      ...tseslint.configs.recommended.reduce((acc, config) => {
        if (config.rules) {
          return { ...acc, ...config.rules }
        }
        return acc
      }, {}),

      // React recommended rules
      ...react.configs.recommended.rules,

      // Custom overrides from original config
      'dot-notation': 'off',
      'no-undef': 'off',
      'import/first': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'error',
      '@typescript-eslint/no-var-requires': 'off',

      // Standard-style rules (replacing eslint-config-standard)
      'no-var': 'error',
      'prefer-const': 'error',
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 0 }],
      'comma-dangle': ['error', 'never'],
      semi: ['error', 'never'],
      quotes: ['error', 'single', { avoidEscape: true }],
      'space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always'
        }
      ]
    }
  },

  // JavaScript files - relax TypeScript rules
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2018
      }
    },
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/no-var-requires': 'off'
    }
  },

  // Test files - relax some rules for compatibility
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/test/**/*.ts', '**/test/**/*.tsx', 'packages/test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-unused-expressions': 'warn'
    }
  },

  // Compatibility/bridge files - allow any for type bridging
  {
    files: ['**/tauri-bridge.ts', '**/electron-compat.ts', '**/spectron-compat.ts', '**/*-compat.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },

  // Prettier config (must be last to override other formatting rules)
  prettier
)
