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

import type { AIResponse, AIChunk, AICompletionRequest } from '../../src/types/ai-types'
import type { ClusterSnapshot } from '../../src/types/cluster-types'

/**
 * Test utility functions for plugin-kubectl-ai
 */

/**
 * Create a mock AI completion request
 */
export function createMockCompletionRequest(
  overrides: Partial<AICompletionRequest> = {}
): AICompletionRequest {
  return {
    prompt: 'Test prompt',
    systemPrompt: 'You are a Kubernetes assistant',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 4096,
    temperature: 0.7,
    stream: false,
    ...overrides
  }
}

/**
 * Create a mock AI response
 */
export function createMockAIResponse(overrides: Partial<AIResponse> = {}): AIResponse {
  return {
    content: 'This is a test response',
    model: 'claude-3-5-sonnet-20241022',
    usage: {
      inputTokens: 100,
      outputTokens: 50
    },
    latency: 1000,
    cached: false,
    ...overrides
  }
}

/**
 * Create a mock streaming chunk
 */
export function createMockAIChunk(overrides: Partial<AIChunk> = {}): AIChunk {
  return {
    delta: 'Test chunk',
    done: false,
    ...overrides
  }
}

/**
 * Create mock streaming chunks from text
 */
export function createMockStreamingChunks(text: string, chunkSize = 10): AIChunk[] {
  const chunks: AIChunk[] = []
  let currentPos = 0

  while (currentPos < text.length) {
    const delta = text.slice(currentPos, currentPos + chunkSize)
    chunks.push({
      delta,
      done: false
    })
    currentPos += chunkSize
  }

  // Add final chunk with usage info
  chunks.push({
    delta: '',
    done: true,
    usage: {
      inputTokens: Math.ceil(text.length / 4),
      outputTokens: Math.ceil(text.length / 4)
    }
  })

  return chunks
}

/**
 * Create an async iterator from chunks
 */
export async function* createAsyncIterator<T>(items: T[], delayMs = 10): AsyncIterator<T> {
  for (const item of items) {
    await new Promise(resolve => setTimeout(resolve, delayMs))
    yield item
  }
}

/**
 * Collect all items from an async iterator
 */
export async function collectAsyncIterator<T>(iterator: AsyncIterator<T>): Promise<T[]> {
  const items: T[] = []
  let result = await iterator.next()

  while (!result.done) {
    items.push(result.value)
    result = await iterator.next()
  }

  return items
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeoutMs = 5000,
  intervalMs = 100
): Promise<void> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    const result = await condition()
    if (result) {
      return
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  throw new Error(`Timeout waiting for condition after ${timeoutMs}ms`)
}

/**
 * Create a mock cluster snapshot with custom values
 */
export function createMockClusterSnapshot(overrides: Partial<ClusterSnapshot> = {}): ClusterSnapshot {
  return {
    cluster: {
      name: 'test-cluster',
      version: '1.28.0',
      provider: 'minikube',
      nodeCount: 3
    },
    namespace: {
      name: 'default',
      resourceCounts: {
        pods: 5,
        services: 3,
        deployments: 2,
        configmaps: 4,
        secrets: 2
      }
    },
    tokenEstimate: 150,
    priority: 'medium',
    ...overrides
  }
}

/**
 * Measure execution time of a function
 */
export async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const startTime = Date.now()
  const result = await fn()
  const durationMs = Date.now() - startTime

  return { result, durationMs }
}

/**
 * Mock kubectl exec with predefined responses
 */
export interface MockKubectlResponse {
  command: string | RegExp
  response: string
  error?: Error
}

export class MockKubectlExecutor {
  private responses: MockKubectlResponse[] = []

  addResponse(command: string | RegExp, response: string): this {
    this.responses.push({ command, response })
    return this
  }

  addError(command: string | RegExp, error: Error): this {
    this.responses.push({ command, response: '', error })
    return this
  }

  exec(command: string): Promise<{ content: { stdout: string } }> {
    for (const mock of this.responses) {
      const matches =
        typeof mock.command === 'string'
          ? command.includes(mock.command)
          : mock.command.test(command)

      if (matches) {
        if (mock.error) {
          return Promise.reject(mock.error)
        }
        return Promise.resolve({ content: { stdout: mock.response } })
      }
    }

    // Default response for unmatched commands
    return Promise.resolve({ content: { stdout: '' } })
  }

  clear(): void {
    this.responses = []
  }
}

/**
 * Create a spy function that tracks calls and arguments
 */
export function createSpy<T extends (...args: any[]) => any>(): jest.Mock<T> {
  const calls: any[][] = []

  const spy = jest.fn((...args: any[]) => {
    calls.push(args)
  })

  return spy
}

/**
 * Assert that an object matches a partial shape
 */
export function assertPartialMatch<T>(actual: T, expected: Partial<T>): void {
  for (const key in expected) {
    if (Object.prototype.hasOwnProperty.call(expected, key)) {
      expect(actual[key]).toEqual(expected[key])
    }
  }
}

/**
 * Generate random test data
 */
export const testData = {
  randomString: (length = 10): string => {
    return Math.random().toString(36).substring(2, 2 + length)
  },

  randomNumber: (min = 0, max = 100): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  },

  randomPodName: (): string => {
    return `pod-${testData.randomString(8)}`
  },

  randomNamespace: (): string => {
    const namespaces = ['default', 'production', 'staging', 'development', 'testing']
    return namespaces[testData.randomNumber(0, namespaces.length - 1)]
  },

  randomClusterName: (): string => {
    const prefixes = ['dev', 'prod', 'staging', 'test']
    const suffixes = ['cluster', 'k8s', 'kube']
    return `${prefixes[testData.randomNumber(0, prefixes.length - 1)]}-${
      suffixes[testData.randomNumber(0, suffixes.length - 1)]
    }`
  }
}

/**
 * Snapshot testing helpers
 */
export const snapshotHelpers = {
  /**
   * Normalize timestamps in objects for consistent snapshots
   */
  normalizeTimestamps: <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (obj instanceof Date) {
      return '2024-01-01T00:00:00.000Z' as any
    }

    if (Array.isArray(obj)) {
      return obj.map(snapshotHelpers.normalizeTimestamps) as any
    }

    const normalized: any = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        normalized[key] = snapshotHelpers.normalizeTimestamps(obj[key])
      }
    }
    return normalized
  },

  /**
   * Remove fields that change between test runs
   */
  removeVolatileFields: <T extends Record<string, any>>(
    obj: T,
    fields: string[] = ['timestamp', 'id', 'latency']
  ): Partial<T> => {
    const result = { ...obj }
    for (const field of fields) {
      delete result[field]
    }
    return result
  }
}

/**
 * Performance testing helpers
 */
export const performanceHelpers = {
  /**
   * Assert that operation completes within time limit
   */
  assertPerformance: async (
    operation: () => Promise<any>,
    maxDurationMs: number,
    label = 'Operation'
  ): Promise<void> => {
    const { durationMs } = await measureTime(operation)
    expect(durationMs).toBeLessThan(maxDurationMs)
  },

  /**
   * Measure average execution time over multiple runs
   */
  measureAverage: async (operation: () => Promise<any>, runs = 10): Promise<number> => {
    const durations: number[] = []

    for (let i = 0; i < runs; i++) {
      const { durationMs } = await measureTime(operation)
      durations.push(durationMs)
    }

    return durations.reduce((sum, d) => sum + d, 0) / durations.length
  }
}

/**
 * Memory testing helpers
 */
export const memoryHelpers = {
  /**
   * Get current memory usage
   */
  getMemoryUsage: (): NodeJS.MemoryUsage => {
    return process.memoryUsage()
  },

  /**
   * Assert that operation doesn't leak memory
   */
  assertNoMemoryLeak: async (
    operation: () => Promise<any>,
    iterations = 100,
    maxGrowthMB = 10
  ): Promise<void> => {
    const initialMemory = memoryHelpers.getMemoryUsage().heapUsed

    for (let i = 0; i < iterations; i++) {
      await operation()
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }

    const finalMemory = memoryHelpers.getMemoryUsage().heapUsed
    const growthMB = (finalMemory - initialMemory) / 1024 / 1024

    expect(growthMB).toBeLessThan(maxGrowthMB)
  }
}
