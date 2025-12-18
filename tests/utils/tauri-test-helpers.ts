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
 * Tauri Test Helpers
 *
 * Utilities for testing Tauri-specific functionality
 */

import { Page, Browser, BrowserContext } from '@playwright/test'

export interface TauriTestContext {
  page: Page
  browser?: Browser
  context?: BrowserContext
  isTauri: boolean
}

export interface TauriInvokeOptions {
  command: string
  args?: Record<string, unknown>
  timeout?: number
}

export interface TauriTestConfig {
  appUrl?: string
  timeout?: number
  headless?: boolean
  slowMo?: number
}

/**
 * Check if running in Tauri environment
 */
export async function isTauriRuntime(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return typeof window.__TAURI__ !== 'undefined'
  })
}

/**
 * Get Tauri runtime information
 */
export async function getTauriRuntimeInfo(page: Page): Promise<Record<string, unknown>> {
  return await page.evaluate(() => {
    if (typeof window.__TAURI__ === 'undefined') {
      return { available: false }
    }

    return {
      available: true,
      hasCore: typeof window.__TAURI__.core !== 'undefined',
      hasInvoke: typeof window.__TAURI__.core?.invoke === 'function',
      version: (window as any).__TAURI_METADATA__?.version || 'unknown'
    }
  })
}

/**
 * Invoke Tauri command
 */
export async function invokeTauriCommand(
  page: Page,
  command: string,
  args?: Record<string, unknown>
): Promise<unknown> {
  const isTauri = await isTauriRuntime(page)
  if (!isTauri) {
    throw new Error('Tauri runtime not available')
  }

  return await page.evaluate(
    async ({ cmd, cmdArgs }) => {
      return await window.__TAURI__.core.invoke(cmd, cmdArgs || {})
    },
    { cmd: command, cmdArgs: args }
  )
}

/**
 * Send synchronous message via Tauri IPC
 */
export async function sendTauriMessage(page: Page, operation: string, data?: unknown): Promise<unknown> {
  const message = JSON.stringify({ operation, ...data })

  return await invokeTauriCommand(page, 'synchronous_message', { message })
}

/**
 * Wait for Tauri app to be ready
 */
export async function waitForTauriReady(page: Page, timeout = 30000): Promise<void> {
  await page.waitForFunction(
    () => {
      return (
        typeof window.__TAURI__ !== 'undefined' && document.querySelector('.repl-input') !== null
      )
    },
    { timeout }
  )
}

/**
 * Wait for Kui REPL to be ready
 */
export async function waitForKuiReady(page: Page, timeout = 30000): Promise<void> {
  await page.waitForSelector('.repl-input', { timeout, state: 'visible' })
  await page.waitForFunction(() => {
    const input = document.querySelector('.repl-input input') as HTMLInputElement
    return input !== null && !input.disabled
  })
}

/**
 * Execute command in Kui REPL
 */
export async function executeKuiCommand(
  page: Page,
  command: string,
  options?: { waitForResult?: boolean; timeout?: number }
): Promise<void> {
  const { waitForResult = true, timeout = 10000 } = options || {}

  const input = page.locator('.repl-input input')
  await input.fill(command)
  await input.press('Enter')

  if (waitForResult) {
    await page.waitForSelector('.repl-result', { timeout, state: 'visible' })
  }
}

/**
 * Get last REPL result
 */
export async function getLastReplResult(page: Page): Promise<string | null> {
  const results = page.locator('.repl-result')
  const count = await results.count()

  if (count === 0) {
    return null
  }

  return await results.nth(count - 1).textContent()
}

/**
 * Clear REPL
 */
export async function clearRepl(page: Page): Promise<void> {
  await executeKuiCommand(page, 'clear')
  await page.waitForTimeout(500)
}

/**
 * Create new Tauri window
 */
export async function createTauriWindow(
  page: Page,
  options?: {
    argv?: string[]
    width?: number
    height?: number
    title?: string
  }
): Promise<void> {
  const isTauri = await isTauriRuntime(page)
  if (!isTauri) {
    throw new Error('Tauri runtime not available')
  }

  await invokeTauriCommand(page, 'create_new_window', {
    argv: options?.argv || [],
    width: options?.width,
    height: options?.height,
    title: options?.title
  })
}

/**
 * Mock Tauri environment for testing
 */
export function mockTauriEnvironment(page: Page): Promise<void> {
  return page.evaluateOnNewDocument(() => {
    const mockInvoke = async (cmd: string, args?: Record<string, unknown>) => {
      console.log('[Mock Tauri] Invoke:', cmd, args)

      // Mock common commands
      switch (cmd) {
        case 'synchronous_message':
          return { success: true }
        case 'exec_invoke':
          return { success: true, returnValue: null }
        case 'create_new_window':
          return { success: true }
        default:
          return { success: true }
      }
    }

    ;(window as any).__TAURI__ = {
      core: {
        invoke: mockInvoke
      }
    }
  })
}

/**
 * Measure command execution time
 */
export async function measureCommandTime(page: Page, command: string): Promise<number> {
  const startTime = Date.now()
  await executeKuiCommand(page, command, { waitForResult: true })
  return Date.now() - startTime
}

/**
 * Get memory usage (if available)
 */
export async function getMemoryUsage(page: Page): Promise<Record<string, number> | null> {
  return await page.evaluate(() => {
    if (typeof (performance as any).memory !== 'undefined') {
      return {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      }
    }
    return null
  })
}

/**
 * Take screenshot and save
 */
export async function takeScreenshot(
  page: Page,
  filename: string,
  options?: { fullPage?: boolean }
): Promise<void> {
  const { fullPage = false } = options || {}
  await page.screenshot({ path: filename, fullPage })
  console.log(`Screenshot saved: ${filename}`)
}

/**
 * Check if element is visible
 */
export async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  try {
    return await page.isVisible(selector, { timeout: 1000 })
  } catch {
    return false
  }
}

/**
 * Wait for selector with retry
 */
export async function waitForSelectorWithRetry(
  page: Page,
  selector: string,
  options?: { timeout?: number; retries?: number }
): Promise<boolean> {
  const { timeout = 5000, retries = 3 } = options || {}

  for (let i = 0; i < retries; i++) {
    try {
      await page.waitForSelector(selector, { timeout, state: 'visible' })
      return true
    } catch (error) {
      if (i === retries - 1) {
        return false
      }
      await page.waitForTimeout(1000)
    }
  }

  return false
}

/**
 * Get test configuration
 */
export function getTestConfig(): TauriTestConfig {
  return {
    appUrl: process.env.TEST_URL || 'http://localhost:9080',
    timeout: parseInt(process.env.TEST_TIMEOUT || '30000', 10),
    headless: process.env.TEST_HEADLESS !== 'false',
    slowMo: parseInt(process.env.TEST_SLOW_MO || '0', 10)
  }
}

/**
 * Skip test if not in Tauri environment
 */
export async function skipIfNotTauri(page: Page): Promise<boolean> {
  const isTauri = await isTauriRuntime(page)
  if (!isTauri) {
    console.log('Skipping test: Tauri runtime not detected')
    return true
  }
  return false
}

/**
 * Skip test if not in browser environment
 */
export async function skipIfNotBrowser(page: Page): Promise<boolean> {
  const isTauri = await isTauriRuntime(page)
  if (isTauri) {
    console.log('Skipping test: Browser environment required')
    return true
  }
  return false
}

/**
 * Assert Tauri command succeeds
 */
export async function assertTauriCommandSucceeds(
  page: Page,
  command: string,
  args?: Record<string, unknown>
): Promise<void> {
  try {
    const result = await invokeTauriCommand(page, command, args)
    console.log(`Tauri command '${command}' succeeded:`, result)
  } catch (error) {
    throw new Error(`Tauri command '${command}' failed: ${error.message}`)
  }
}

/**
 * Get Tauri app version
 */
export async function getTauriVersion(page: Page): Promise<string> {
  const info = await getTauriRuntimeInfo(page)
  return (info.version as string) || 'unknown'
}

/**
 * Check if feature is supported
 */
export async function isFeatureSupported(page: Page, feature: string): Promise<boolean> {
  return await page.evaluate(
    feat => {
      const features: Record<string, boolean> = {
        tauri: typeof window.__TAURI__ !== 'undefined',
        clipboard: typeof window.__TAURI__?.clipboard !== 'undefined',
        dialog: typeof window.__TAURI__?.dialog !== 'undefined',
        shell: typeof window.__TAURI__?.shell !== 'undefined'
      }
      return features[feat] || false
    },
    feature
  )
}

/**
 * Log test info
 */
export function logTestInfo(message: string, data?: unknown): void {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '')
}

/**
 * Delay execution
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
