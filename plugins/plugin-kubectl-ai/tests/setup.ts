/*
 * Copyright 2024 The Kubernetes Authors
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

import { jest } from '@jest/globals'

/**
 * Global test setup for plugin-kubectl-ai
 *
 * This file runs once before all tests and sets up:
 * - Mock implementations for external dependencies
 * - Environment variables
 * - Global test utilities
 */

// Suppress console output during tests (unless DEBUG=true)
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.ANTHROPIC_API_KEY = 'test-api-key-12345'
process.env.OPENAI_API_KEY = 'test-openai-key-12345'

/**
 * Mock @kui-shell/core rexec function
 * This is used by ClusterDataCollector to execute kubectl commands
 */
jest.mock('@kui-shell/core', () => ({
  rexec: jest.fn(),
  PreloadRegistrar: jest.fn(),
  Arguments: jest.fn(),
  UsageError: class UsageError extends Error {
    constructor(options: { message: string; usage?: any }) {
      super(options.message)
      this.name = 'UsageError'
    }
  }
}))

/**
 * Mock Anthropic SDK
 */
jest.mock('@anthropic-ai/sdk', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn(),
        stream: jest.fn()
      }
    })),
    Anthropic: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn(),
        stream: jest.fn()
      }
    }))
  }
})

/**
 * Mock OpenAI SDK
 */
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    })),
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    }))
  }
})

/**
 * Mock node-cache
 */
jest.mock('node-cache', () => {
  return jest.fn().mockImplementation(() => {
    const store = new Map()
    return {
      get: jest.fn((key: string) => store.get(key)),
      set: jest.fn((key: string, value: any) => {
        store.set(key, value)
        return true
      }),
      del: jest.fn((key: string) => store.delete(key)),
      has: jest.fn((key: string) => store.has(key)),
      keys: jest.fn(() => Array.from(store.keys())),
      getStats: jest.fn(() => ({
        hits: 0,
        misses: 0,
        ksize: store.size,
        vsize: 0
      })),
      flushAll: jest.fn(() => store.clear()),
      getTtl: jest.fn(),
      ttl: jest.fn(() => true),
      close: jest.fn(),
      on: jest.fn()
    }
  })
})

/**
 * Global test utilities
 */
export const testUtils = {
  /**
   * Wait for a specified time
   */
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Create a mock async iterator for streaming responses
   */
  createMockAsyncIterator: function* <T>(items: T[]): Generator<T> {
    for (const item of items) {
      yield item
    }
  },

  /**
   * Simulate streaming chunks with delay
   */
  async* createStreamingIterator<T>(items: T[], delayMs = 10): AsyncGenerator<T> {
    for (const item of items) {
      await testUtils.wait(delayMs)
      yield item
    }
  }
}

// Make test utils globally available
;(global as any).testUtils = testUtils

/**
 * Setup and teardown hooks
 */
beforeAll(() => {
  // Global setup
})

afterAll(() => {
  // Global cleanup
})

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks()
})

afterEach(() => {
  // Cleanup after each test
})
