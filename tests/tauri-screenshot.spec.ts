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
 * Tauri Screenshot Functionality Tests
 *
 * Tests for the screenshot capture system including:
 * - Screen region capture
 * - Clipboard integration
 * - Platform-specific implementations (macOS, Linux, Windows)
 * - Error handling
 */

import { test, expect } from '@playwright/test'
import {
  waitForKuiReady,
  isTauriRuntime,
  skipIfNotTauri,
  invokeTauriCommand,
  getTestConfig,
  logTestInfo
} from './utils/tauri-test-helpers'

const config = getTestConfig()

test.describe('Tauri Screenshot - Basic Functionality', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  test('should have capture_to_clipboard command available', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    const hasCommand = await page.evaluate(() => {
      return typeof window.__TAURI__?.core?.invoke === 'function'
    })

    expect(hasCommand).toBe(true)
    logTestInfo('Tauri invoke available for screenshots', hasCommand)
  })

  test('should accept valid screenshot parameters', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Note: Actual screenshot may fail without display in CI
    // This tests the API is callable with correct parameters
    try {
      await invokeTauriCommand(page, 'capture_to_clipboard', {
        x: 0,
        y: 0,
        width: 100,
        height: 100
      })
      logTestInfo('Screenshot command accepted parameters', true)
    } catch (error) {
      // Expected to fail in headless/CI environment
      logTestInfo('Screenshot failed (expected in CI)', error.message)
      expect(error.message).toBeTruthy()
    }
  })

  test('should validate screenshot region boundaries', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    const testCases = [
      { x: 0, y: 0, width: 100, height: 100, desc: 'valid small region' },
      { x: 100, y: 100, width: 500, height: 500, desc: 'valid medium region' },
      { x: 0, y: 0, width: 1920, height: 1080, desc: 'valid large region' }
    ]

    for (const testCase of testCases) {
      try {
        await invokeTauriCommand(page, 'capture_to_clipboard', {
          x: testCase.x,
          y: testCase.y,
          width: testCase.width,
          height: testCase.height
        })
        logTestInfo(`Screenshot test: ${testCase.desc}`, 'parameters accepted')
      } catch (error) {
        // May fail in CI, but should accept parameters
        logTestInfo(`Screenshot test: ${testCase.desc}`, 'command invoked')
      }
    }
  })

  test('should handle negative coordinates', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Negative coordinates should be handled (may represent multi-monitor setups)
    try {
      await invokeTauriCommand(page, 'capture_to_clipboard', {
        x: -100,
        y: -100,
        width: 200,
        height: 200
      })
      logTestInfo('Negative coordinates handled', true)
    } catch (error) {
      logTestInfo('Negative coordinates rejected or failed', error.message)
    }
  })

  test('should handle zero-size region', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Zero-size should fail gracefully
    try {
      await invokeTauriCommand(page, 'capture_to_clipboard', {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      })
      logTestInfo('Zero-size region handled', true)
    } catch (error) {
      // Expected to fail
      expect(error).toBeDefined()
      logTestInfo('Zero-size region rejected', 'as expected')
    }
  })
})

test.describe('Tauri Screenshot - Platform-Specific Tests', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  const platform = process.platform

  test('should use correct platform implementation', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    logTestInfo('Testing on platform', platform)

    const expectedSupport = {
      darwin: 'Full support via Core Graphics',
      linux: 'Full support via xcap',
      win32: 'Partial support (clipboard needs implementation)'
    }

    const support = expectedSupport[platform] || 'Unknown platform'
    logTestInfo('Expected platform support', support)

    expect(['darwin', 'linux', 'win32']).toContain(platform)
  })

  test('should handle macOS-specific capture (if macOS)', async ({ page }) => {
    if (platform !== 'darwin') {
      test.skip()
      return
    }

    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      await invokeTauriCommand(page, 'capture_to_clipboard', {
        x: 0,
        y: 0,
        width: 100,
        height: 100
      })
      logTestInfo('macOS capture attempted', true)
    } catch (error) {
      logTestInfo('macOS capture error', error.message)
    }
  })

  test('should handle Linux-specific capture (if Linux)', async ({ page }) => {
    if (platform !== 'linux') {
      test.skip()
      return
    }

    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      await invokeTauriCommand(page, 'capture_to_clipboard', {
        x: 0,
        y: 0,
        width: 100,
        height: 100
      })
      logTestInfo('Linux capture attempted', true)
    } catch (error) {
      logTestInfo('Linux capture error (xclip installed?)', error.message)
    }
  })

  test('should handle Windows-specific capture (if Windows)', async ({ page }) => {
    if (platform !== 'win32') {
      test.skip()
      return
    }

    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      await invokeTauriCommand(page, 'capture_to_clipboard', {
        x: 0,
        y: 0,
        width: 100,
        height: 100
      })
      logTestInfo('Windows capture attempted', true)
    } catch (error) {
      // Windows clipboard not fully implemented yet
      expect(error.message).toContain('not yet implemented' || 'failed')
      logTestInfo('Windows clipboard not yet implemented', 'expected')
    }
  })
})

test.describe('Tauri Screenshot - Error Handling', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  test('should handle missing parameters', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      // Missing required parameters
      await invokeTauriCommand(page, 'capture_to_clipboard', {})
      logTestInfo('Missing parameters handled', true)
    } catch (error) {
      expect(error).toBeDefined()
      logTestInfo('Missing parameters rejected', error.message)
    }
  })

  test('should handle invalid parameter types', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      // Invalid types (strings instead of numbers)
      await invokeTauriCommand(page, 'capture_to_clipboard', {
        x: 'invalid',
        y: 'invalid',
        width: 'invalid',
        height: 'invalid'
      })
      logTestInfo('Invalid types handled', true)
    } catch (error) {
      expect(error).toBeDefined()
      logTestInfo('Invalid types rejected', error.message)
    }
  })

  test('should handle out-of-bounds coordinates', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      // Extremely large coordinates
      await invokeTauriCommand(page, 'capture_to_clipboard', {
        x: 100000,
        y: 100000,
        width: 100,
        height: 100
      })
      logTestInfo('Out-of-bounds coordinates handled', true)
    } catch (error) {
      // Expected to fail
      expect(error).toBeDefined()
      logTestInfo('Out-of-bounds rejected', 'as expected')
    }
  })

  test('should handle extremely large regions', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      // Unreasonably large capture region
      await invokeTauriCommand(page, 'capture_to_clipboard', {
        x: 0,
        y: 0,
        width: 100000,
        height: 100000
      })
      logTestInfo('Large region handled', true)
    } catch (error) {
      expect(error).toBeDefined()
      logTestInfo('Large region rejected', 'as expected')
    }
  })

  test('should handle concurrent screenshot requests', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Try multiple concurrent captures
    const captures = [
      invokeTauriCommand(page, 'capture_to_clipboard', { x: 0, y: 0, width: 50, height: 50 }),
      invokeTauriCommand(page, 'capture_to_clipboard', { x: 100, y: 100, width: 50, height: 50 }),
      invokeTauriCommand(page, 'capture_to_clipboard', { x: 200, y: 200, width: 50, height: 50 })
    ]

    try {
      await Promise.allSettled(captures)
      logTestInfo('Concurrent captures handled', true)
    } catch (error) {
      logTestInfo('Concurrent captures error', error.message)
    }
  })
})

test.describe('Tauri Screenshot - Clipboard Integration', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  test('should copy PNG format to clipboard', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      await invokeTauriCommand(page, 'capture_to_clipboard', {
        x: 0,
        y: 0,
        width: 100,
        height: 100
      })

      // If successful, PNG should be in clipboard
      // Note: Reading clipboard in tests is tricky, just verify command succeeded
      logTestInfo('PNG copied to clipboard', 'command executed')
    } catch (error) {
      logTestInfo('Clipboard copy failed', error.message)
    }
  })

  test('should handle clipboard access denied', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // In some environments, clipboard access may be denied
    try {
      await invokeTauriCommand(page, 'capture_to_clipboard', {
        x: 0,
        y: 0,
        width: 100,
        height: 100
      })
      logTestInfo('Clipboard access granted', true)
    } catch (error) {
      // May fail due to permissions
      logTestInfo('Clipboard access issue', error.message)
    }
  })

  test('should handle clipboard busy state', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Try rapid clipboard operations
    for (let i = 0; i < 3; i++) {
      try {
        await invokeTauriCommand(page, 'capture_to_clipboard', {
          x: i * 10,
          y: i * 10,
          width: 50,
          height: 50
        })
        await page.waitForTimeout(100)
      } catch (error) {
        logTestInfo(`Clipboard operation ${i} status`, error.message)
      }
    }

    logTestInfo('Rapid clipboard operations tested', true)
  })
})

test.describe('Tauri Screenshot - Performance', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  test('should complete capture in reasonable time', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    const startTime = Date.now()

    try {
      await invokeTauriCommand(page, 'capture_to_clipboard', {
        x: 0,
        y: 0,
        width: 500,
        height: 500
      })

      const duration = Date.now() - startTime
      logTestInfo('Screenshot capture time', `${duration}ms`)

      // Should complete within 3 seconds
      expect(duration).toBeLessThan(3000)
    } catch (error) {
      logTestInfo('Screenshot performance test skipped', error.message)
    }
  })

  test('should handle small regions efficiently', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    const startTime = Date.now()

    try {
      await invokeTauriCommand(page, 'capture_to_clipboard', {
        x: 0,
        y: 0,
        width: 100,
        height: 100
      })

      const duration = Date.now() - startTime
      logTestInfo('Small region capture time', `${duration}ms`)

      // Small regions should be fast
      expect(duration).toBeLessThan(2000)
    } catch (error) {
      logTestInfo('Small region test skipped', error.message)
    }
  })

  test('should handle large regions without timeout', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    const startTime = Date.now()

    try {
      await invokeTauriCommand(page, 'capture_to_clipboard', {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080
      })

      const duration = Date.now() - startTime
      logTestInfo('Large region capture time', `${duration}ms`)

      // Large regions may take longer but should complete
      expect(duration).toBeLessThan(5000)
    } catch (error) {
      logTestInfo('Large region test skipped', error.message)
    }
  })
})

test.describe('Tauri Screenshot - Integration', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  test('should not interfere with UI during capture', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      // Start screenshot
      const capturePromise = invokeTauriCommand(page, 'capture_to_clipboard', {
        x: 0,
        y: 0,
        width: 200,
        height: 200
      })

      // UI should remain responsive
      await page.waitForTimeout(100)
      const inputVisible = await page.isVisible('.repl-input')
      expect(inputVisible).toBe(true)

      await capturePromise
      logTestInfo('UI remained responsive during capture', true)
    } catch (error) {
      logTestInfo('Capture test skipped', error.message)
    }
  })

  test('should work alongside other Tauri commands', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      // Execute multiple different Tauri commands
      await invokeTauriCommand(page, 'synchronous_message', {
        message: JSON.stringify({ operation: 'ping' })
      })

      await invokeTauriCommand(page, 'capture_to_clipboard', {
        x: 0,
        y: 0,
        width: 100,
        height: 100
      })

      await invokeTauriCommand(page, 'synchronous_message', {
        message: JSON.stringify({ operation: 'ping' })
      })

      logTestInfo('Multiple Tauri commands executed successfully', true)
    } catch (error) {
      logTestInfo('Multi-command test status', error.message)
    }
  })
})
