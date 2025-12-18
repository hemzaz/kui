/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Test environment - jsdom for browser-like environment
    environment: 'jsdom',

    // Globals - enable Jest-compatible global APIs
    globals: true,

    // Setup files
    setupFiles: ['./vitest.setup.ts'],

    // Test match patterns - only Vitest tests
    include: [
      'packages/*/src/**/*.vitest.{test,spec}.{ts,tsx}',
      'packages/*/tests/**/*.vitest.{test,spec}.{ts,tsx}',
      'plugins/*/src/**/*.vitest.{test,spec}.{ts,tsx}',
      'plugins/*/tests/**/*.vitest.{test,spec}.{ts,tsx}'
    ],

    // Exclude patterns
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/mdist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/playwright*.spec.ts', // Exclude Playwright E2E tests
      '**/tests/tauri-*.spec.ts' // Exclude Tauri integration tests
    ],

    // Coverage configuration
    coverage: {
      enabled: false, // Disabled by default due to Node.js v24 compatibility issues
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      include: [
        'packages/core/src/**/*.{ts,tsx}',
        'packages/react/src/**/*.{ts,tsx}',
        'plugins/*/src/**/*.{ts,tsx}'
      ],
      exclude: [
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/tests/**',
        '**/__tests__/**',
        '**/*.{test,spec}.{ts,tsx}',
        '**/node_modules/**',
        '**/dist/**',
        '**/mdist/**'
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60
      }
    },

    // Timeout settings
    testTimeout: 10000,
    hookTimeout: 10000,

    // Watch mode settings
    watch: false,

    // Reporter settings
    reporters: ['default', 'html'],
    outputFile: {
      html: './test-results/vitest/index.html'
    },

    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true
      }
    },

    // Number of workers - limit to 4 to avoid thread pool issues
    maxWorkers: 4,
    minWorkers: 1,

    // Disable file parallelism by default for stability
    fileParallelism: false,

    // UI settings
    ui: true,
    open: false
  },

  // Module resolution
  resolve: {
    alias: {
      '@kui-shell/core': resolve(__dirname, './packages/core/mdist'),
      '@kui-shell/react': resolve(__dirname, './packages/react/mdist'),
      '@kui-shell/test': resolve(__dirname, './packages/test/mdist'),
      '@kui-shell/client': resolve(__dirname, './plugins/plugin-client-default/mdist'),
      '@kui-shell/plugin-bash-like': resolve(__dirname, './plugins/plugin-bash-like/mdist'),
      '@kui-shell/plugin-client-common': resolve(__dirname, './plugins/plugin-client-common/mdist'),
      '@kui-shell/plugin-core-support': resolve(__dirname, './plugins/plugin-core-support/mdist'),
      '@kui-shell/plugin-kubectl': resolve(__dirname, './plugins/plugin-kubectl/mdist'),
      '@kui-shell/plugin-kubectl-ai': resolve(__dirname, './plugins/plugin-kubectl-ai/mdist'),
      '@kui-shell/plugin-kubectl-core': resolve(__dirname, './plugins/plugin-kubectl-core/mdist')
    }
  }
})
