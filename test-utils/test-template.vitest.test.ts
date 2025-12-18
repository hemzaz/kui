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

/**
 * Vitest Test Template
 *
 * This is a comprehensive template showing various test patterns for Kui.
 * Copy and adapt this for your own tests.
 *
 * File naming: Use .vitest.test.ts or .vitest.spec.ts suffix
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'

// ==========================
// BASIC TEST STRUCTURE
// ==========================

describe('Feature Name', () => {
  // Setup that runs once before all tests
  beforeAll(() => {
    // Initialize test resources
    console.log('Setting up test suite')
  })

  // Cleanup that runs once after all tests
  afterAll(() => {
    // Clean up test resources
    console.log('Tearing down test suite')
  })

  // Setup that runs before each test
  beforeEach(() => {
    // Reset state before each test
  })

  // Cleanup that runs after each test
  afterEach(() => {
    // Clean up after each test
    vi.clearAllMocks()
  })

  it('should do something specific', () => {
    // Arrange - Set up test data and conditions
    const input = 'test'

    // Act - Execute the code under test
    const result = input.toUpperCase()

    // Assert - Verify the result
    expect(result).toBe('TEST')
  })
})

// ==========================
// ASYNC/AWAIT PATTERNS
// ==========================

describe('Async Operations', () => {
  it('should handle promises', async () => {
    const result = await Promise.resolve('success')
    expect(result).toBe('success')
  })

  it('should handle async/await', async () => {
    const asyncFunction = async () => {
      await new Promise(resolve => setTimeout(resolve, 10))
      return 'done'
    }

    const result = await asyncFunction()
    expect(result).toBe('done')
  })

  it('should handle promise rejections', async () => {
    const failingPromise = Promise.reject(new Error('Failed'))

    await expect(failingPromise).rejects.toThrow('Failed')
  })
})

// ==========================
// MOCKING PATTERNS
// ==========================

describe('Mocking Functions and Modules', () => {
  it('should mock a function', () => {
    const mockFn = vi.fn()
    mockFn.mockReturnValue('mocked')

    const result = mockFn()

    expect(result).toBe('mocked')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should mock with implementation', () => {
    const mockFn = vi.fn((x: number) => x * 2)

    expect(mockFn(5)).toBe(10)
    expect(mockFn).toHaveBeenCalledWith(5)
  })

  it('should spy on object methods', () => {
    const obj = {
      method: () => 'original'
    }

    const spy = vi.spyOn(obj, 'method').mockReturnValue('mocked')

    expect(obj.method()).toBe('mocked')
    expect(spy).toHaveBeenCalled()

    spy.mockRestore()
  })

  it('should mock async functions', async () => {
    const mockFn = vi.fn().mockResolvedValue('async result')

    const result = await mockFn()

    expect(result).toBe('async result')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})

// ==========================
// MODULE MOCKING
// ==========================

// Mock at module level
vi.mock('./example-module', () => ({
  exportedFunction: vi.fn().mockReturnValue('mocked'),
  exportedValue: 'mocked value'
}))

describe('Module Mocking', () => {
  it('should use mocked module', async () => {
    const module = await import('./example-module')
    expect(module.exportedValue).toBe('mocked value')
  })
})

// ==========================
// ERROR HANDLING
// ==========================

describe('Error Handling', () => {
  it('should throw error', () => {
    const throwError = () => {
      throw new Error('Test error')
    }

    expect(throwError).toThrow('Test error')
    expect(throwError).toThrow(Error)
  })

  it('should handle try-catch', () => {
    try {
      throw new Error('Test error')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('Test error')
    }
  })
})

// ==========================
// MATCHERS
// ==========================

describe('Common Matchers', () => {
  it('should use equality matchers', () => {
    expect(1 + 1).toBe(2) // Strict equality
    expect({ a: 1 }).toEqual({ a: 1 }) // Deep equality
    expect([1, 2, 3]).toStrictEqual([1, 2, 3]) // Strict deep equality
  })

  it('should use truthiness matchers', () => {
    expect(true).toBeTruthy()
    expect(false).toBeFalsy()
    expect(null).toBeNull()
    expect(undefined).toBeUndefined()
    expect('value').toBeDefined()
  })

  it('should use number matchers', () => {
    expect(5).toBeGreaterThan(4)
    expect(5).toBeGreaterThanOrEqual(5)
    expect(5).toBeLessThan(6)
    expect(5).toBeLessThanOrEqual(5)
    expect(0.1 + 0.2).toBeCloseTo(0.3)
  })

  it('should use string matchers', () => {
    expect('hello world').toContain('world')
    expect('hello world').toMatch(/world/)
    expect('hello').toHaveLength(5)
  })

  it('should use array/object matchers', () => {
    expect([1, 2, 3]).toContain(2)
    expect([1, 2, 3]).toHaveLength(3)
    expect({ a: 1, b: 2 }).toHaveProperty('a')
    expect({ a: 1, b: 2 }).toHaveProperty('a', 1)
  })

  it('should use custom matchers', () => {
    expect(50).toBeWithinRange(0, 100)
  })
})

// ==========================
// CONDITIONAL TESTS
// ==========================

describe('Conditional Test Execution', () => {
  // Skip this test
  it.skip('should skip this test', () => {
    expect(true).toBe(false) // This won't run
  })

  // Only run this test (comment out in real tests)
  // it.only('should only run this test', () => {
  //   expect(true).toBe(true)
  // })

  // Todo test (shown as pending)
  it.todo('should implement this later')

  // Concurrent tests (run in parallel)
  it.concurrent('should run concurrently 1', async () => {
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(true).toBe(true)
  })

  it.concurrent('should run concurrently 2', async () => {
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(true).toBe(true)
  })
})

// ==========================
// PARAMETERIZED TESTS
// ==========================

describe('Parameterized Tests', () => {
  const testCases = [
    { input: 1, expected: 2 },
    { input: 2, expected: 4 },
    { input: 3, expected: 6 }
  ]

  testCases.forEach(({ input, expected }) => {
    it(`should multiply ${input} by 2 to get ${expected}`, () => {
      expect(input * 2).toBe(expected)
    })
  })

  // Or using test.each
  it.each([
    [1, 2],
    [2, 4],
    [3, 6]
  ])('should multiply %i by 2 to get %i', (input, expected) => {
    expect(input * 2).toBe(expected)
  })
})

// ==========================
// TIMERS
// ==========================

describe('Timers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should fast-forward time', () => {
    const callback = vi.fn()

    setTimeout(callback, 1000)

    // Fast-forward 1 second
    vi.advanceTimersByTime(1000)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should run all timers', () => {
    const callback = vi.fn()

    setTimeout(callback, 1000)
    setTimeout(callback, 2000)

    vi.runAllTimers()

    expect(callback).toHaveBeenCalledTimes(2)
  })
})

// ==========================
// SNAPSHOT TESTING
// ==========================

describe('Snapshot Testing', () => {
  it('should match snapshot', () => {
    const data = {
      name: 'Test',
      value: 42,
      items: [1, 2, 3]
    }

    expect(data).toMatchSnapshot()
  })

  it('should match inline snapshot', () => {
    const value = 'test'
    expect(value).toMatchInlineSnapshot()
  })
})

// ==========================
// COVERAGE NOTES
// ==========================

/*
 * To run tests with coverage:
 *   npm run test:coverage
 *
 * To view coverage report:
 *   open coverage/index.html
 *
 * Coverage thresholds are set in vitest.config.ts
 */

// ==========================
// BEST PRACTICES
// ==========================

/*
 * 1. One concept per test
 * 2. Use descriptive test names (should/when/given format)
 * 3. Follow Arrange-Act-Assert pattern
 * 4. Clean up after tests (mocks, timers, etc.)
 * 5. Keep tests independent (no shared state)
 * 6. Test behavior, not implementation
 * 7. Use meaningful variable names
 * 8. Add comments for complex test logic
 * 9. Group related tests with describe blocks
 * 10. Mock external dependencies
 */
