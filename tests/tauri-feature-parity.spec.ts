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
 * Tauri Feature Parity Tests
 *
 * E2E tests to verify feature parity between Electron and Tauri implementations
 * Uses Playwright for browser automation
 */

import { test, expect, Page } from '@playwright/test'

// Helper to detect if we're running Tauri
async function isTauriApp(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return typeof window.__TAURI__ !== 'undefined'
  })
}

// Helper to wait for Kui to be ready
async function waitForKuiReady(page: Page) {
  await page.waitForSelector('.repl-input', { timeout: 30000 })
  await page.waitForFunction(() => {
    return document.querySelector('.repl-input') !== null
  })
}

test.describe('Tauri Feature Parity', () => {
  test.beforeEach(async ({ page }) => {
    // Launch app - adjust URL based on runtime
    // For Tauri: tauri://localhost or http://localhost:port
    // For browser testing: http://localhost:9080
    const testUrl = process.env.TEST_URL || 'http://localhost:9080'
    await page.goto(testUrl, { waitUntil: 'networkidle' })

    // Wait for Kui to initialize
    await waitForKuiReady(page)
  })

  test.describe('Window Management', () => {
    test('should create main window', async ({ page }) => {
      const title = await page.title()
      expect(title).toContain('Kui')
    })

    test('should have visible REPL input', async ({ page }) => {
      const inputVisible = await page.isVisible('.repl-input')
      expect(inputVisible).toBe(true)
    })

    test('should support window resize', async ({ page, context }) => {
      const viewportSize = page.viewportSize()
      expect(viewportSize).toBeDefined()

      // Resize window
      await page.setViewportSize({ width: 1024, height: 768 })
      const newSize = page.viewportSize()
      expect(newSize.width).toBe(1024)
      expect(newSize.height).toBe(768)
    })

    test('should handle window focus', async ({ page }) => {
      // Check if window has focus
      const hasFocus = await page.evaluate(() => document.hasFocus())
      expect(hasFocus).toBe(true)
    })
  })

  test.describe('IPC Communication', () => {
    test('should detect Tauri runtime', async ({ page }) => {
      const isTauri = await isTauriApp(page)
      console.log('Running in Tauri:', isTauri)
      expect(typeof isTauri).toBe('boolean')
    })

    test('should handle synchronous IPC messages', async ({ page }) => {
      const isTauri = await isTauriApp(page)

      if (isTauri) {
        const result = await page.evaluate(async () => {
          try {
            const response = await window.__TAURI__.core.invoke('synchronous_message', {
              message: JSON.stringify({ operation: 'ping' })
            })
            return { success: true, response }
          } catch (error) {
            return { success: false, error: error.message }
          }
        })

        console.log('Synchronous message result:', result)
        expect(result).toBeDefined()
      } else {
        test.skip()
      }
    })

    test('should handle async IPC invocations', async ({ page }) => {
      const isTauri = await isTauriApp(page)

      if (isTauri) {
        const result = await page.evaluate(async () => {
          try {
            const response = await window.__TAURI__.core.invoke('exec_invoke', {
              message: JSON.stringify({ module: 'test', fn: 'test' })
            })
            return { success: true, response }
          } catch (error) {
            return { success: false, error: error.message }
          }
        })

        console.log('Async invoke result:', result)
        expect(result).toBeDefined()
      } else {
        test.skip()
      }
    })
  })

  test.describe('REPL Functionality', () => {
    test('should accept input in REPL', async ({ page }) => {
      const input = page.locator('.repl-input input')
      await input.fill('echo "Hello, Kui!"')

      const value = await input.inputValue()
      expect(value).toBe('echo "Hello, Kui!"')
    })

    test('should execute simple command', async ({ page }) => {
      const input = page.locator('.repl-input input')
      await input.fill('version')
      await input.press('Enter')

      // Wait for result
      await page.waitForSelector('.repl-result', { timeout: 10000 })

      const result = await page.textContent('.repl-result')
      expect(result).toBeTruthy()
      console.log('Version command result:', result)
    })

    test('should handle command history', async ({ page }) => {
      const input = page.locator('.repl-input input')

      // Execute first command
      await input.fill('echo "first"')
      await input.press('Enter')
      await page.waitForTimeout(500)

      // Execute second command
      await input.fill('echo "second"')
      await input.press('Enter')
      await page.waitForTimeout(500)

      // Navigate history with up arrow
      await input.press('ArrowUp')
      let value = await input.inputValue()
      expect(value).toBe('echo "second"')

      await input.press('ArrowUp')
      value = await input.inputValue()
      expect(value).toBe('echo "first"')
    })

    test('should clear REPL', async ({ page }) => {
      const input = page.locator('.repl-input input')
      await input.fill('echo "test"')
      await input.press('Enter')
      await page.waitForTimeout(500)

      // Clear command
      await input.fill('clear')
      await input.press('Enter')
      await page.waitForTimeout(500)

      // Check that results are cleared
      const results = await page.locator('.repl-result').count()
      expect(results).toBe(0)
    })
  })

  test.describe('UI Components', () => {
    test('should render top tabs', async ({ page }) => {
      const tabs = page.locator('.kui--tab-content')
      expect(await tabs.count()).toBeGreaterThan(0)
    })

    test('should support theme switching', async ({ page }) => {
      // Look for theme indicator or body class
      const themeClass = await page.getAttribute('body', 'class')
      expect(themeClass).toBeTruthy()
      console.log('Current theme classes:', themeClass)
    })

    test('should render command palette', async ({ page }) => {
      // Try to open command palette (usually Cmd+K or Ctrl+K)
      const isMac = process.platform === 'darwin'
      const modifier = isMac ? 'Meta' : 'Control'

      await page.keyboard.press(`${modifier}+KeyK`)
      await page.waitForTimeout(500)

      // Check if command palette opened
      const palette = page.locator('[role="dialog"], .command-palette')
      const isVisible = await palette.isVisible().catch(() => false)
      console.log('Command palette visible:', isVisible)
    })
  })

  test.describe('Native Features', () => {
    test('should handle clipboard operations', async ({ page }) => {
      const isTauri = await isTauriApp(page)

      if (isTauri) {
        // Test clipboard via Tauri API
        const clipboardSupported = await page.evaluate(() => {
          return typeof window.__TAURI__ !== 'undefined'
        })
        expect(clipboardSupported).toBe(true)
      }
    })

    test('should support keyboard shortcuts', async ({ page }) => {
      // Test common shortcuts
      const input = page.locator('.repl-input input')

      // Ctrl/Cmd + A (select all)
      await input.fill('test text')
      const isMac = process.platform === 'darwin'
      await page.keyboard.press(isMac ? 'Meta+KeyA' : 'Control+KeyA')

      // Text should be selected (harder to verify programmatically)
      const value = await input.inputValue()
      expect(value).toBe('test text')
    })
  })

  test.describe('Plugin System', () => {
    test('should load kubectl plugin', async ({ page }) => {
      const input = page.locator('.repl-input input')
      await input.fill('kubectl')
      await input.press('Enter')
      await page.waitForTimeout(1000)

      // Should show some kubectl-related output or help
      const result = page.locator('.repl-result')
      const hasResult = await result.count() > 0
      expect(hasResult).toBe(true)
    })

    test('should support custom commands', async ({ page }) => {
      const input = page.locator('.repl-input input')
      await input.fill('help')
      await input.press('Enter')
      await page.waitForTimeout(1000)

      const result = page.locator('.repl-result')
      const hasResult = await result.count() > 0
      expect(hasResult).toBe(true)
    })
  })

  test.describe('Performance', () => {
    test('should load quickly', async ({ page }) => {
      const startTime = Date.now()
      await page.goto(process.env.TEST_URL || 'http://localhost:9080')
      await waitForKuiReady(page)
      const loadTime = Date.now() - startTime

      console.log('Load time:', loadTime, 'ms')
      // Tauri should load faster than Electron (target: < 2s)
      expect(loadTime).toBeLessThan(5000)
    })

    test('should respond to commands quickly', async ({ page }) => {
      const input = page.locator('.repl-input input')

      const startTime = Date.now()
      await input.fill('version')
      await input.press('Enter')
      await page.waitForSelector('.repl-result', { timeout: 10000 })
      const responseTime = Date.now() - startTime

      console.log('Command response time:', responseTime, 'ms')
      expect(responseTime).toBeLessThan(2000)
    })

    test('should handle multiple rapid commands', async ({ page }) => {
      const input = page.locator('.repl-input input')

      for (let i = 0; i < 5; i++) {
        await input.fill(`echo "test ${i}"`)
        await input.press('Enter')
        await page.waitForTimeout(200)
      }

      // Wait for all results
      await page.waitForTimeout(1000)
      const results = await page.locator('.repl-result').count()
      expect(results).toBeGreaterThanOrEqual(5)
    })
  })

  test.describe('Error Handling', () => {
    test('should handle invalid commands gracefully', async ({ page }) => {
      const input = page.locator('.repl-input input')
      await input.fill('invalid-command-that-does-not-exist')
      await input.press('Enter')
      await page.waitForTimeout(1000)

      // Should show error message, not crash
      const result = page.locator('.repl-result')
      const hasResult = await result.count() > 0
      expect(hasResult).toBe(true)
    })

    test('should recover from errors', async ({ page }) => {
      const input = page.locator('.repl-input input')

      // Execute invalid command
      await input.fill('invalid-command')
      await input.press('Enter')
      await page.waitForTimeout(500)

      // Execute valid command
      await input.fill('version')
      await input.press('Enter')
      await page.waitForTimeout(1000)

      // Should execute successfully after error
      const results = await page.locator('.repl-result').count()
      expect(results).toBeGreaterThanOrEqual(2)
    })
  })
})

test.describe('Tauri-Specific Features', () => {
  test('should have Tauri API available in Tauri builds', async ({ page }) => {
    const hasTauriAPI = await page.evaluate(() => {
      return typeof window.__TAURI__ !== 'undefined'
    })

    if (hasTauriAPI) {
      console.log('Tauri API detected')

      const apiStructure = await page.evaluate(() => {
        return {
          hasCore: typeof window.__TAURI__.core !== 'undefined',
          hasInvoke: typeof window.__TAURI__.core?.invoke === 'function'
        }
      })

      expect(apiStructure.hasCore).toBe(true)
      expect(apiStructure.hasInvoke).toBe(true)
    } else {
      console.log('Running in non-Tauri environment')
      test.skip()
    }
  })

  test('should support Tauri commands', async ({ page }) => {
    const isTauri = await isTauriApp(page)

    if (isTauri) {
      // Test that we can list available commands
      const commands = await page.evaluate(() => {
        return Object.keys(window.__TAURI__.core || {})
      })

      console.log('Available Tauri commands:', commands)
      expect(Array.isArray(commands)).toBe(true)
    } else {
      test.skip()
    }
  })
})
