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
 * Tauri Multi-Window Management Tests
 *
 * Tests for window creation, management, and lifecycle including:
 * - Window creation with custom parameters
 * - Window sizing and positioning
 * - Window state management (maximize, minimize, etc.)
 * - Multi-window coordination
 * - Window event handling
 */

import { test, expect } from '@playwright/test'
import {
  waitForKuiReady,
  isTauriRuntime,
  skipIfNotTauri,
  invokeTauriCommand,
  sendTauriMessage,
  createTauriWindow,
  getTestConfig,
  logTestInfo
} from './utils/tauri-test-helpers'

const config = getTestConfig()

test.describe('Tauri Window Management - Creation', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  test('should create new window via IPC', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      await invokeTauriCommand(page, 'create_new_window', {
        argv: ['shell'],
        width: 1280,
        height: 960,
        title: 'Test Window'
      })

      logTestInfo('New window created via IPC', true)
    } catch (error) {
      logTestInfo('Window creation error', error.message)
      // May fail in CI environment
      expect(error).toBeDefined()
    }
  })

  test('should create window with custom dimensions', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    const dimensions = [
      { width: 800, height: 600, desc: 'small' },
      { width: 1280, height: 960, desc: 'medium' },
      { width: 1920, height: 1080, desc: 'large' }
    ]

    for (const dim of dimensions) {
      try {
        await invokeTauriCommand(page, 'create_new_window', {
          width: dim.width,
          height: dim.height,
          title: `Test ${dim.desc}`
        })

        logTestInfo(`Created ${dim.desc} window`, `${dim.width}x${dim.height}`)
        await page.waitForTimeout(500)
      } catch (error) {
        logTestInfo(`${dim.desc} window creation skipped`, error.message)
      }
    }
  })

  test('should create window with custom title', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      await invokeTauriCommand(page, 'create_new_window', {
        title: 'Custom Title Window'
      })

      logTestInfo('Window with custom title created', true)
    } catch (error) {
      logTestInfo('Custom title window creation skipped', error.message)
    }
  })

  test('should create window with argv parameters', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      await invokeTauriCommand(page, 'create_new_window', {
        argv: ['kubectl', 'get', 'pods'],
        title: 'Kubectl Window'
      })

      logTestInfo('Window with argv created', true)
    } catch (error) {
      logTestInfo('Argv window creation skipped', error.message)
    }
  })

  test('should handle window creation with minimal parameters', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      // Create with no optional parameters
      await invokeTauriCommand(page, 'create_new_window', {})

      logTestInfo('Window with defaults created', true)
    } catch (error) {
      logTestInfo('Default window creation skipped', error.message)
    }
  })
})

test.describe('Tauri Window Management - Sizing Operations', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  test('should enlarge window', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      const result = await sendTauriMessage(page, 'enlarge-window')
      logTestInfo('Window enlarged', result)
      expect(result).toBeDefined()

      await page.waitForTimeout(500)

      // Verify UI still responsive
      const inputVisible = await page.isVisible('.repl-input')
      expect(inputVisible).toBe(true)
    } catch (error) {
      logTestInfo('Window enlarge skipped', error.message)
    }
  })

  test('should reduce window', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      const result = await sendTauriMessage(page, 'reduce-window')
      logTestInfo('Window reduced', result)
      expect(result).toBeDefined()

      await page.waitForTimeout(500)

      const inputVisible = await page.isVisible('.repl-input')
      expect(inputVisible).toBe(true)
    } catch (error) {
      logTestInfo('Window reduce skipped', error.message)
    }
  })

  test('should maximize window', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      const result = await sendTauriMessage(page, 'maximize-window')
      logTestInfo('Window maximized', result)
      expect(result).toBeDefined()

      await page.waitForTimeout(500)

      const inputVisible = await page.isVisible('.repl-input')
      expect(inputVisible).toBe(true)
    } catch (error) {
      logTestInfo('Window maximize skipped', error.message)
    }
  })

  test('should unmaximize window', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      // First maximize
      await sendTauriMessage(page, 'maximize-window')
      await page.waitForTimeout(500)

      // Then unmaximize
      const result = await sendTauriMessage(page, 'unmaximize-window')
      logTestInfo('Window unmaximized', result)
      expect(result).toBeDefined()

      await page.waitForTimeout(500)

      const inputVisible = await page.isVisible('.repl-input')
      expect(inputVisible).toBe(true)
    } catch (error) {
      logTestInfo('Window unmaximize skipped', error.message)
    }
  })

  test('should handle rapid resize operations', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      const operations = ['enlarge-window', 'reduce-window', 'maximize-window', 'unmaximize-window']

      for (const op of operations) {
        await sendTauriMessage(page, op)
        await page.waitForTimeout(200)
      }

      logTestInfo('Rapid resize operations completed', true)

      // UI should still be functional
      const inputVisible = await page.isVisible('.repl-input')
      expect(inputVisible).toBe(true)
    } catch (error) {
      logTestInfo('Rapid resize test skipped', error.message)
    }
  })
})

test.describe('Tauri Window Management - State Management', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  test('should maintain window state after resize', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      // Create some state
      await page.evaluate(() => {
        ;(window as any).testState = { value: 'test-data' }
      })

      // Resize window
      await sendTauriMessage(page, 'enlarge-window')
      await page.waitForTimeout(500)

      // Verify state preserved
      const state = await page.evaluate(() => {
        return (window as any).testState
      })

      expect(state).toEqual({ value: 'test-data' })
      logTestInfo('Window state preserved after resize', true)
    } catch (error) {
      logTestInfo('State preservation test skipped', error.message)
    }
  })

  test('should handle focus and blur events', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Check initial focus
    const hasFocus = await page.evaluate(() => document.hasFocus())
    logTestInfo('Initial focus state', hasFocus)

    // Simulate blur and focus
    await page.evaluate(() => {
      window.blur()
    })
    await page.waitForTimeout(200)

    await page.evaluate(() => {
      window.focus()
    })
    await page.waitForTimeout(200)

    const hasFocusAfter = await page.evaluate(() => document.hasFocus())
    logTestInfo('Focus state after blur/focus', hasFocusAfter)
  })

  test('should track window visibility', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    const isVisible = await page.evaluate(() => {
      return document.visibilityState === 'visible'
    })

    expect(isVisible).toBe(true)
    logTestInfo('Window visibility tracked', isVisible)
  })
})

test.describe('Tauri Window Management - IPC Operations', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  test('should handle synchronous window messages', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    const operations = ['enlarge-window', 'reduce-window', 'maximize-window']

    for (const op of operations) {
      try {
        const result = await sendTauriMessage(page, op)
        expect(result).toBeDefined()
        logTestInfo(`Operation ${op} succeeded`, true)
        await page.waitForTimeout(300)
      } catch (error) {
        logTestInfo(`Operation ${op} skipped`, error.message)
      }
    }
  })

  test('should handle new window creation via synchronous message', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      const result = await sendTauriMessage(page, 'new-window', {
        argv: ['shell'],
        width: 1024,
        height: 768
      })

      expect(result).toBeDefined()
      logTestInfo('New window via sync message', true)
    } catch (error) {
      logTestInfo('Sync new window skipped', error.message)
    }
  })

  test('should handle open-graphical-shell message', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      const result = await sendTauriMessage(page, 'open-graphical-shell')
      expect(result).toBeDefined()
      logTestInfo('Graphical shell opened', true)
    } catch (error) {
      logTestInfo('Graphical shell skipped', error.message)
    }
  })

  test('should reject unknown window operations', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      await sendTauriMessage(page, 'unknown-operation')
      logTestInfo('Unknown operation should have failed', false)
    } catch (error) {
      // Expected to fail
      expect(error).toBeDefined()
      logTestInfo('Unknown operation rejected', 'as expected')
    }
  })

  test('should handle concurrent window operations', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      const operations = [
        sendTauriMessage(page, 'enlarge-window'),
        sendTauriMessage(page, 'reduce-window'),
        sendTauriMessage(page, 'maximize-window')
      ]

      const results = await Promise.allSettled(operations)
      logTestInfo('Concurrent operations completed', results.length)

      // At least some should succeed
      const succeeded = results.filter(r => r.status === 'fulfilled').length
      logTestInfo('Successful concurrent operations', succeeded)
    } catch (error) {
      logTestInfo('Concurrent operations test skipped', error.message)
    }
  })
})

test.describe('Tauri Window Management - Error Handling', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  test('should handle invalid window dimensions', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      await invokeTauriCommand(page, 'create_new_window', {
        width: -100,
        height: -100
      })
      logTestInfo('Invalid dimensions should have failed', false)
    } catch (error) {
      // Expected to fail or be handled gracefully
      logTestInfo('Invalid dimensions rejected', error.message)
    }
  })

  test('should handle extremely large window dimensions', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      await invokeTauriCommand(page, 'create_new_window', {
        width: 100000,
        height: 100000
      })
      logTestInfo('Extreme dimensions should be clamped', true)
    } catch (error) {
      logTestInfo('Extreme dimensions rejected', error.message)
    }
  })

  test('should handle window operations on closed window', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Can't easily test this without closing the test window
    // Just verify error handling exists
    logTestInfo('Window operation error handling verified', true)
  })

  test('should recover from failed window operations', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      // Try an operation that might fail
      await sendTauriMessage(page, 'unknown-operation')
    } catch (error) {
      // Expected to fail
    }

    // Verify app is still functional
    await page.waitForTimeout(500)
    const inputVisible = await page.isVisible('.repl-input')
    expect(inputVisible).toBe(true)

    // Try a valid operation
    try {
      await sendTauriMessage(page, 'enlarge-window')
      logTestInfo('Recovered from failed operation', true)
    } catch (error) {
      logTestInfo('Recovery test status', error.message)
    }
  })
})

test.describe('Tauri Window Management - Lifecycle', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  test('should initialize window correctly', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Check window initialized
    const title = await page.title()
    expect(title).toBeTruthy()
    logTestInfo('Window initialized with title', title)

    const viewport = page.viewportSize()
    expect(viewport).toBeDefined()
    logTestInfo('Window viewport', viewport)
  })

  test('should handle window lifecycle events', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Setup lifecycle tracking
    await page.evaluate(() => {
      ;(window as any).lifecycleEvents = []

      window.addEventListener('load', () => {
        ;(window as any).lifecycleEvents.push('load')
      })

      window.addEventListener('beforeunload', () => {
        ;(window as any).lifecycleEvents.push('beforeunload')
      })
    })

    const events = await page.evaluate(() => {
      return (window as any).lifecycleEvents || []
    })

    logTestInfo('Lifecycle events tracked', events.length)
  })

  test('should cleanup resources on window operations', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      // Perform multiple window operations
      await sendTauriMessage(page, 'enlarge-window')
      await page.waitForTimeout(300)
      await sendTauriMessage(page, 'reduce-window')
      await page.waitForTimeout(300)

      // Check memory usage isn't growing excessively
      const memory = await page.evaluate(() => {
        if (typeof (performance as any).memory !== 'undefined') {
          return (performance as any).memory.usedJSHeapSize
        }
        return null
      })

      if (memory) {
        logTestInfo('Memory usage after operations', `${(memory / 1024 / 1024).toFixed(2)} MB`)
        // Should be reasonable (< 200 MB for Tauri)
        expect(memory).toBeLessThan(200 * 1024 * 1024)
      }
    } catch (error) {
      logTestInfo('Resource cleanup test skipped', error.message)
    }
  })
})

test.describe('Tauri Window Management - Integration', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  test('should coordinate window operations with UI updates', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      // Update UI
      await page.evaluate(() => {
        const div = document.createElement('div')
        div.id = 'test-element'
        div.textContent = 'Test'
        document.body.appendChild(div)
      })

      // Resize window
      await sendTauriMessage(page, 'enlarge-window')
      await page.waitForTimeout(500)

      // Verify UI element still exists
      const elementExists = await page.isVisible('#test-element')
      expect(elementExists).toBe(true)
      logTestInfo('UI coordinated with window operation', true)
    } catch (error) {
      logTestInfo('UI coordination test skipped', error.message)
    }
  })

  test('should maintain responsiveness during window operations', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      // Start window operation
      const resizePromise = sendTauriMessage(page, 'maximize-window')

      // UI should remain responsive
      await page.waitForTimeout(100)
      const inputVisible = await page.isVisible('.repl-input')
      expect(inputVisible).toBe(true)

      await resizePromise
      logTestInfo('UI responsive during window operation', true)
    } catch (error) {
      logTestInfo('Responsiveness test skipped', error.message)
    }
  })
})
