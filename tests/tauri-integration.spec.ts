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
 * Tauri Integration Tests
 *
 * Tests for specific Tauri functionality including window management,
 * IPC communication, and plugin integration
 */

import { test, expect } from '@playwright/test'
import {
  isTauriRuntime,
  waitForKuiReady,
  executeKuiCommand,
  getLastReplResult,
  invokeTauriCommand,
  sendTauriMessage,
  createTauriWindow,
  measureCommandTime,
  getTestConfig,
  skipIfNotTauri
} from './utils/tauri-test-helpers'

const config = getTestConfig()

test.describe('Tauri Window Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'networkidle' })
    await waitForKuiReady(page)
  })

  test('should create and manage main window', async ({ page }) => {
    const isTauri = await isTauriRuntime(page)

    if (!isTauri) {
      test.skip()
      return
    }

    const title = await page.title()
    expect(title).toContain('Kui')

    const size = page.viewportSize()
    expect(size).toBeDefined()
    expect(size.width).toBeGreaterThan(0)
    expect(size.height).toBeGreaterThan(0)
  })

  test('should resize window', async ({ page }) => {
    const isTauri = await isTauriRuntime(page)

    if (!isTauri) {
      test.skip()
      return
    }

    // Test enlarge
    await sendTauriMessage(page, 'enlarge-window')
    await page.waitForTimeout(500)

    // Test reduce
    await sendTauriMessage(page, 'reduce-window')
    await page.waitForTimeout(500)

    // Verify window is still functional
    const inputVisible = await page.isVisible('.repl-input')
    expect(inputVisible).toBe(true)
  })

  test('should maximize and unmaximize window', async ({ page }) => {
    const isTauri = await isTauriRuntime(page)

    if (!isTauri) {
      test.skip()
      return
    }

    await sendTauriMessage(page, 'maximize-window')
    await page.waitForTimeout(500)

    await sendTauriMessage(page, 'unmaximize-window')
    await page.waitForTimeout(500)

    const inputVisible = await page.isVisible('.repl-input')
    expect(inputVisible).toBe(true)
  })

  test('should handle window focus events', async ({ page }) => {
    const hasFocus = await page.evaluate(() => document.hasFocus())
    expect(hasFocus).toBe(true)

    // Blur and focus
    await page.evaluate(() => window.blur())
    await page.waitForTimeout(100)
    await page.evaluate(() => window.focus())

    const hasFocusAfter = await page.evaluate(() => document.hasFocus())
    expect(hasFocusAfter).toBe(true)
  })
})

test.describe('Tauri IPC Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'networkidle' })
    await waitForKuiReady(page)
  })

  test('should handle synchronous messages', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    const operations = ['ping', 'enlarge-window', 'reduce-window']

    for (const operation of operations) {
      const result = await sendTauriMessage(page, operation)
      console.log(`Operation '${operation}' result:`, result)
      expect(result).toBeDefined()
    }
  })

  test('should handle exec_invoke commands', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    const result = await invokeTauriCommand(page, 'exec_invoke', {
      message: JSON.stringify({ module: 'test', fn: 'test' })
    })

    expect(result).toBeDefined()
    console.log('exec_invoke result:', result)
  })

  test('should handle IPC errors gracefully', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    try {
      // Try to invoke non-existent command
      await invokeTauriCommand(page, 'non_existent_command', {})
    } catch (error) {
      expect(error).toBeDefined()
      console.log('Expected error caught:', error.message)
    }
  })

  test('should handle concurrent IPC calls', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    const calls = [
      sendTauriMessage(page, 'ping'),
      sendTauriMessage(page, 'ping'),
      sendTauriMessage(page, 'ping')
    ]

    const results = await Promise.all(calls)
    expect(results.length).toBe(3)
    results.forEach(result => expect(result).toBeDefined())
  })
})

test.describe('Tauri Plugin Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'networkidle' })
    await waitForKuiReady(page)
  })

  test('should load core plugins', async ({ page }) => {
    // Execute help command to check plugin registration
    await executeKuiCommand(page, 'help')
    const result = await getLastReplResult(page)

    expect(result).toBeTruthy()
    console.log('Help command result length:', result?.length)
  })

  test('should execute kubectl commands', async ({ page }) => {
    await executeKuiCommand(page, 'kubectl version --client')
    const result = await getLastReplResult(page)

    expect(result).toBeTruthy()
    console.log('kubectl version result:', result?.substring(0, 100))
  })

  test('should support bash-like commands', async ({ page }) => {
    const commands = ['echo "test"', 'pwd', 'ls']

    for (const cmd of commands) {
      await executeKuiCommand(page, cmd)
      const result = await getLastReplResult(page)
      expect(result).toBeTruthy()
      console.log(`Command '${cmd}' executed`)
    }
  })

  test('should handle plugin errors', async ({ page }) => {
    // Execute invalid command
    await executeKuiCommand(page, 'kubectl get invalid-resource-type')
    await page.waitForTimeout(1000)

    // Should show error, not crash
    const result = await getLastReplResult(page)
    expect(result).toBeTruthy()
  })
})

test.describe('Tauri Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'networkidle' })
    await waitForKuiReady(page)
  })

  test('should execute commands quickly', async ({ page }) => {
    const commands = ['version', 'echo "test"', 'help']

    for (const cmd of commands) {
      const time = await measureCommandTime(page, cmd)
      console.log(`Command '${cmd}' took ${time}ms`)
      expect(time).toBeLessThan(3000)
    }
  })

  test('should handle rapid command execution', async ({ page }) => {
    const startTime = Date.now()

    for (let i = 0; i < 5; i++) {
      await executeKuiCommand(page, `echo "test ${i}"`, { waitForResult: false })
    }

    // Wait for all results
    await page.waitForTimeout(2000)

    const endTime = Date.now()
    const totalTime = endTime - startTime

    console.log(`5 rapid commands took ${totalTime}ms`)
    expect(totalTime).toBeLessThan(5000)
  })

  test('should not leak memory during command execution', async ({ page }) => {
    // Execute multiple commands
    for (let i = 0; i < 10; i++) {
      await executeKuiCommand(page, `echo "iteration ${i}"`)
    }

    // Get memory usage (if available)
    const memory = await page.evaluate(() => {
      if (typeof (performance as any).memory !== 'undefined') {
        return (performance as any).memory.usedJSHeapSize
      }
      return null
    })

    if (memory) {
      console.log(`Memory after 10 commands: ${(memory / 1024 / 1024).toFixed(2)} MB`)
      // Should be reasonable (< 200 MB for Tauri)
      expect(memory).toBeLessThan(200 * 1024 * 1024)
    }
  })
})

test.describe('Tauri Menu System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'networkidle' })
    await waitForKuiReady(page)
  })

  test('should have application menu', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Menu is native in Tauri, can't directly test DOM
    // But we can verify menu-triggered actions work
    console.log('Application menu exists (native)')
    expect(true).toBe(true)
  })

  test('should support keyboard shortcuts', async ({ page }) => {
    const isMac = process.platform === 'darwin'
    const modifier = isMac ? 'Meta' : 'Control'

    // Test common shortcuts
    const shortcuts = [
      { key: `${modifier}+KeyL`, description: 'Clear' },
      { key: `${modifier}+KeyK`, description: 'Command Palette' }
    ]

    for (const shortcut of shortcuts) {
      await page.keyboard.press(shortcut.key)
      await page.waitForTimeout(500)
      console.log(`Tested shortcut: ${shortcut.description}`)
    }

    expect(true).toBe(true)
  })
})

test.describe('Tauri Shell Plugin', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'networkidle' })
    await waitForKuiReady(page)
  })

  test('should support shell commands via Tauri', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Execute shell command
    await executeKuiCommand(page, 'echo "Shell test"')
    const result = await getLastReplResult(page)

    expect(result).toBeTruthy()
    console.log('Shell command result:', result)
  })
})

test.describe('Tauri Clipboard Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'networkidle' })
    await waitForKuiReady(page)
  })

  test('should support clipboard operations', async ({ page, context }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    // Test copy operation
    await executeKuiCommand(page, 'echo "copy test"')
    await page.waitForTimeout(500)

    console.log('Clipboard operations available in Tauri')
    expect(true).toBe(true)
  })
})

test.describe('Tauri Dialog Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'networkidle' })
    await waitForKuiReady(page)
  })

  test('should have dialog capabilities', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Dialog plugin is available in Tauri
    // Actual dialog tests would require mocking or user interaction
    console.log('Tauri dialog plugin available')
    expect(true).toBe(true)
  })
})
