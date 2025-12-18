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

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/packages/core/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          resolveJsonModule: true,
          moduleResolution: 'node',
          target: 'es2020',
          module: 'commonjs',
          lib: ['es2020', 'dom']
        }
      }
    ]
  },
  moduleNameMapper: {
    '^@kui-shell/core/(.*)$': '<rootDir>/packages/core/mdist/$1',
    '^@kui-shell/(.*)$': '<rootDir>/packages/$1/mdist'
  },
  collectCoverageFrom: [
    'packages/core/src/**/*.{ts,tsx}',
    '!packages/core/src/**/*.d.ts',
    '!packages/core/src/test/**/*'
  ],
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 10000,
  verbose: true,
  maxWorkers: '50%'
}
