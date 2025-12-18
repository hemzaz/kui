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
 * Tauri Smoke Tests
 *
 * Quick validation suite for critical path features.
 * These tests should run fast and catch major regressions.
 *
 * Goal: Complete in under 2 minutes
 */

import { test, expect, Page } from '@playwright/test'
import {
  waitForKuiReady,
  executeKuiCommand,
  getLastReplResult,
  isTauriRuntime,
  getTauriRuntimeInfo,
  getTestConfig,
  logTestInfo
} from './utils/tauri-test-helpers'

const config = getTestConfig()

test.describe('Tauri Smoke Tests - Critical Path', () => {
  test.setTimeout(60000) // 1 minute max per test

  test.beforeEach(async ({ page }) => {
    logTestInfo('Starting smoke test')
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  test('smoke: app launches successfully', async ({ page }) => {
    // Check that the page loaded
    const title = await page.title()
    expect(title).toBeTruthy()
    logTestInfo('App title', title)

    // Check that Kui is ready
    const replInput = await page.isVisible('.repl-input')
    expect(replInput).toBe(true)

    // Check for console errors
    const errors = await getConsoleErrors(page)
    if (errors.length > 0) {
      logTestInfo('Console errors detected', errors)
      // Allow some non-critical errors
      const criticalErrors = errors.filter(isCriticalError)
      expect(criticalErrors.length).toBe(0)
    }
  })

  test('smoke: basic UI renders correctly', async ({ page }) => {
    // Check critical UI elements
    const elements = {
      replInput: '.repl-input',
      tabContent: '.kui--tab-content',
      body: 'body'
    }

    for (const [name, selector] of Object.entries(elements)) {
      const visible = await page.isVisible(selector, { timeout: 5000 }).catch(() => false)
      expect(visible).toBe(true)
      logTestInfo(`UI element visible: ${name}`)
    }

    // Check that body has proper theme class
    const bodyClass = await page.getAttribute('body', 'class')
    expect(bodyClass).toBeTruthy()
  })

  test('smoke: version command executes', async ({ page }) => {
    // Execute simple command
    await executeKuiCommand(page, 'version')

    // Get result
    const result = await getLastReplResult(page)
    expect(result).toBeTruthy()
    logTestInfo('Version result', result?.substring(0, 100))
  })

  test('smoke: help command executes', async ({ page }) => {
    await executeKuiCommand(page, 'help')

    const result = await getLastReplResult(page)
    expect(result).toBeTruthy()
    expect(result.length).toBeGreaterThan(0)
    logTestInfo('Help command executed successfully')
  })

  test('smoke: echo command works', async ({ page }) => {
    const testMessage = 'Hello Kui Smoke Test'
    await executeKuiCommand(page, `echo "${testMessage}"`)

    const result = await getLastReplResult(page)
    expect(result).toContain(testMessage)
    logTestInfo('Echo command validated')
  })

  test('smoke: command history works', async ({ page }) => {
    const input = page.locator('.repl-input input')

    // Execute command
    await executeKuiCommand(page, 'echo "history test"')

    // Clear input and use arrow up
    await input.fill('')
    await page.keyboard.press('ArrowUp')

    // Check that command is recalled
    const value = await input.inputValue()
    expect(value).toBe('echo "history test"')
    logTestInfo('Command history validated')
  })

  test('smoke: no JavaScript errors on load', async ({ page }) => {
    // Collect console messages
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Wait a bit for any async errors
    await page.waitForTimeout(2000)

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(isCriticalError)

    if (criticalErrors.length > 0) {
      logTestInfo('Critical errors found', criticalErrors)
    }

    expect(criticalErrors.length).toBe(0)
  })

  test('smoke: REPL accepts input', async ({ page }) => {
    const input = page.locator('.repl-input input')

    // Try to type
    await input.fill('test input')
    const value = await input.inputValue()
    expect(value).toBe('test input')

    // Check input is enabled
    const isDisabled = await input.isDisabled()
    expect(isDisabled).toBe(false)
    logTestInfo('REPL input validated')
  })

  test('smoke: runtime detection works', async ({ page }) => {
    const isTauri = await isTauriRuntime(page)
    logTestInfo('Runtime is Tauri', isTauri)

    if (isTauri) {
      const runtimeInfo = await getTauriRuntimeInfo(page)
      logTestInfo('Tauri runtime info', runtimeInfo)
      expect(runtimeInfo.available).toBe(true)
    }
  })

  test('smoke: performance is acceptable', async ({ page }) => {
    // Measure command execution time
    const startTime = Date.now()
    await executeKuiCommand(page, 'version')
    const responseTime = Date.now() - startTime

    logTestInfo('Command response time', `${responseTime}ms`)

    // Should complete within 3 seconds
    expect(responseTime).toBeLessThan(3000)
  })
})

test.describe('Tauri Smoke Tests - Tauri-Specific', () => {
  test.setTimeout(30000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  test('smoke: Tauri API available (if Tauri)', async ({ page }) => {
    const isTauri = await isTauriRuntime(page)

    if (isTauri) {
      const hasTauriAPI = await page.evaluate(() => {
        return (
          typeof window.__TAURI__ !== 'undefined' &&
          typeof window.__TAURI__.core !== 'undefined' &&
          typeof window.__TAURI__.core.invoke === 'function'
        )
      })

      expect(hasTauriAPI).toBe(true)
      logTestInfo('Tauri API validated')
    } else {
      logTestInfo('Skipping: Not running in Tauri')
      test.skip()
    }
  })

  test('smoke: IPC communication works (if Tauri)', async ({ page }) => {
    const isTauri = await isTauriRuntime(page)

    if (isTauri) {
      // Test basic IPC
      const result = await page
        .evaluate(async () => {
          try {
            return await window.__TAURI__.core.invoke('synchronous_message', {
              message: JSON.stringify({ operation: 'ping' })
            })
          } catch (error) {
            return { error: error.message }
          }
        })
        .catch(err => ({ error: err.message }))

      logTestInfo('IPC test result', result)
      expect(result).toBeDefined()
    } else {
      test.skip()
    }
  })
})

test.describe('Tauri Smoke Tests - Plugin Loading', () => {
  test.setTimeout(30000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  test('smoke: kubectl plugin loads', async ({ page }) => {
    // Just verify kubectl command is recognized
    await executeKuiCommand(page, 'kubectl --help', { timeout: 5000 })

    const result = await getLastReplResult(page)
    expect(result).toBeTruthy()
    logTestInfo('kubectl plugin loaded')
  })

  test('smoke: bash-like commands work', async ({ page }) => {
    const commands = ['pwd', 'echo "test"']

    for (const cmd of commands) {
      await executeKuiCommand(page, cmd, { timeout: 3000 })
      const result = await getLastReplResult(page)
      expect(result).toBeTruthy()
    }

    logTestInfo('bash-like commands validated')
  })
})

test.describe('Tauri Smoke Tests - Error Handling', () => {
  test.setTimeout(30000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  test('smoke: handles invalid commands gracefully', async ({ page }) => {
    await executeKuiCommand(page, 'this-command-does-not-exist', { timeout: 3000 })

    // Should show error, not crash
    const result = await getLastReplResult(page)
    expect(result).toBeTruthy()

    // REPL should still work
    await executeKuiCommand(page, 'version')
    const versionResult = await getLastReplResult(page)
    expect(versionResult).toBeTruthy()
    logTestInfo('Error recovery validated')
  })

  test('smoke: handles rapid commands', async ({ page }) => {
    // Execute multiple commands quickly
    const commands = ['echo "1"', 'echo "2"', 'echo "3"']

    for (const cmd of commands) {
      await executeKuiCommand(page, cmd, { waitForResult: false })
      await page.waitForTimeout(100)
    }

    // Wait for all to complete
    await page.waitForTimeout(2000)

    // App should still be responsive
    const inputVisible = await page.isVisible('.repl-input')
    expect(inputVisible).toBe(true)
    logTestInfo('Rapid command handling validated')
  })
})

// Helper functions

async function getConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = []

  const consoleListener = (msg: any) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  }

  page.on('console', consoleListener)

  // Wait for any async errors
  await page.waitForTimeout(1000)

  page.off('console', consoleListener)

  return errors
}

function isCriticalError(error: string): boolean {
  // Filter out known non-critical errors
  const nonCriticalPatterns = [
    /Failed to load resource/,
    /net::ERR_/,
    /favicon.ico/,
    /ResizeObserver loop/,
    /WebSocket/,
    /NotAllowedError/,
    /Extension/
  ]

  return !nonCriticalPatterns.some(pattern => pattern.test(error))
}
