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
 * Custom render helpers for testing React components
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { vi } from 'vitest'

/**
 * Custom render function that wraps components with common providers
 */
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add any custom options here
  initialState?: any
  theme?: string
}

/**
 * Renders a React component with all necessary providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult {
  const { initialState, theme = 'dark', ...renderOptions } = options || {}

  // Create wrapper component with providers - NO Suspense wrapper
  // Tests should handle Suspense/lazy loading at component level if needed
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    // Add your providers here (ThemeProvider, Router, etc.)
    return <div data-theme={theme}>{children}</div>
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

/**
 * Creates mock callbacks with spies
 */
export function createMockCallbacks<T extends Record<string, (...args: any[]) => any>>(
  callbacks: (keyof T)[]
): Record<keyof T, ReturnType<typeof vi.fn>> {
  const mocks = {} as Record<keyof T, ReturnType<typeof vi.fn>>

  callbacks.forEach(callback => {
    mocks[callback] = vi.fn()
  })

  return mocks
}

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout = 5000,
  interval = 50
): Promise<void> {
  const startTime = Date.now()

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition')
    }
    await new Promise(resolve => setTimeout(resolve, interval))
  }
}

/**
 * Flush all pending promises
 */
export function flushPromises(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve))
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
