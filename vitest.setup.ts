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
 * Vitest setup file
 * This file is executed once before all tests run
 */

import { expect, vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock Debug module (commonly used in Kui)
vi.mock('debug', () => {
  const mockDebug = () => () => {}
  mockDebug.enable = () => {}
  mockDebug.disable = () => {}
  return { default: mockDebug }
})

// Setup jsdom environment
if (typeof window !== 'undefined') {
  // Mock window.matchMedia (used by many UI components)
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // Deprecated
      removeListener: vi.fn(), // Deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  })

  // Mock IntersectionObserver (used for lazy loading)
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: []
  }))

  // Mock ResizeObserver (used for responsive components)
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }))

  // Mock localStorage if not available
  if (!window.localStorage) {
    const localStorageMock = (() => {
      let store: Record<string, string> = {}
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value.toString()
        },
        removeItem: (key: string) => {
          delete store[key]
        },
        clear: () => {
          store = {}
        }
      }
    })()
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })
  }
}

// Custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true
      }
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false
      }
    }
  }
})

// Suppress console errors/warnings in tests (optional - uncomment if needed)
// const originalError = console.error
// const originalWarn = console.warn
// beforeAll(() => {
//   console.error = vi.fn()
//   console.warn = vi.fn()
// })
// afterAll(() => {
//   console.error = originalError
//   console.warn = originalWarn
// })

// Global test utilities
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const flushPromises = () => new Promise(resolve => setImmediate(resolve))

// Type augmentation for custom matchers
declare module 'vitest' {
  interface Assertion {
    toBeWithinRange(floor: number, ceiling: number): void
  }
  interface AsymmetricMatchersContaining {
    toBeWithinRange(floor: number, ceiling: number): void
  }
}
