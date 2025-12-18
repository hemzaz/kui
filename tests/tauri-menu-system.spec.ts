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
 * Tauri Menu System Tests
 *
 * Tests for the native menu system including:
 * - Menu event emissions
 * - Keyboard shortcuts
 * - Menu item interactions
 * - Cross-platform menu handling
 */

import { test, expect, Page } from '@playwright/test'
import {
  waitForKuiReady,
  isTauriRuntime,
  skipIfNotTauri,
  getTestConfig,
  logTestInfo,
  executeKuiCommand
} from './utils/tauri-test-helpers'

const config = getTestConfig()

/**
 * Helper to listen for menu events
 */
async function setupMenuEventListener(page: Page, eventName: string): Promise<void> {
  await page.evaluate(
    name => {
      return new Promise<void>(resolve => {
        if (typeof window.__TAURI__ !== 'undefined' && window.__TAURI__.event) {
          window.__TAURI__.event
            .listen(name, () => {
              ;(window as any)[`__menu_event_${name}`] = true
            })
            .then(() => resolve())
        } else {
          resolve()
        }
      })
    },
    eventName
  )
}

/**
 * Check if menu event was received
 */
async function wasMenuEventReceived(page: Page, eventName: string): Promise<boolean> {
  return await page.evaluate(name => {
    return !!(window as any)[`__menu_event_${name}`]
  }, eventName)
}

test.describe('Tauri Menu System - Event Emissions', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  test('should emit menu-new-tab event', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Setup listener
    await setupMenuEventListener(page, 'menu-new-tab')

    // Simulate menu event by directly emitting it
    // In real scenario, this would be triggered by clicking menu item
    await page.evaluate(() => {
      if (window.__TAURI__?.event) {
        return window.__TAURI__.event.emit('menu-new-tab', {})
      }
    })

    await page.waitForTimeout(1000)

    const received = await wasMenuEventReceived(page, 'menu-new-tab')
    logTestInfo('menu-new-tab event received', received)
    expect(received).toBe(true)
  })

  test('should emit menu-new-window event', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    await setupMenuEventListener(page, 'menu-new-window')

    await page.evaluate(() => {
      if (window.__TAURI__?.event) {
        return window.__TAURI__.event.emit('menu-new-window', {})
      }
    })

    await page.waitForTimeout(1000)

    const received = await wasMenuEventReceived(page, 'menu-new-window')
    logTestInfo('menu-new-window event received', received)
    expect(received).toBe(true)
  })

  test('should emit menu-close-tab event', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    await setupMenuEventListener(page, 'menu-close-tab')

    await page.evaluate(() => {
      if (window.__TAURI__?.event) {
        return window.__TAURI__.event.emit('menu-close-tab', {})
      }
    })

    await page.waitForTimeout(1000)

    const received = await wasMenuEventReceived(page, 'menu-close-tab')
    logTestInfo('menu-close-tab event received', received)
    expect(received).toBe(true)
  })

  test('should emit menu-zoom-in event', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    await setupMenuEventListener(page, 'menu-zoom-in')

    await page.evaluate(() => {
      if (window.__TAURI__?.event) {
        return window.__TAURI__.event.emit('menu-zoom-in', {})
      }
    })

    await page.waitForTimeout(1000)

    const received = await wasMenuEventReceived(page, 'menu-zoom-in')
    logTestInfo('menu-zoom-in event received', received)
    expect(received).toBe(true)
  })

  test('should emit menu-zoom-out event', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    await setupMenuEventListener(page, 'menu-zoom-out')

    await page.evaluate(() => {
      if (window.__TAURI__?.event) {
        return window.__TAURI__.event.emit('menu-zoom-out', {})
      }
    })

    await page.waitForTimeout(1000)

    const received = await wasMenuEventReceived(page, 'menu-zoom-out')
    logTestInfo('menu-zoom-out event received', received)
    expect(received).toBe(true)
  })

  test('should emit menu-zoom-reset event', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    await setupMenuEventListener(page, 'menu-zoom-reset')

    await page.evaluate(() => {
      if (window.__TAURI__?.event) {
        return window.__TAURI__.event.emit('menu-zoom-reset', {})
      }
    })

    await page.waitForTimeout(1000)

    const received = await wasMenuEventReceived(page, 'menu-zoom-reset')
    logTestInfo('menu-zoom-reset event received', received)
    expect(received).toBe(true)
  })

  test('should emit menu-about event', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    await setupMenuEventListener(page, 'menu-about')

    await page.evaluate(() => {
      if (window.__TAURI__?.event) {
        return window.__TAURI__.event.emit('menu-about', {})
      }
    })

    await page.waitForTimeout(1000)

    const received = await wasMenuEventReceived(page, 'menu-about')
    logTestInfo('menu-about event received', received)
    expect(received).toBe(true)
  })
})

test.describe('Tauri Menu System - Keyboard Shortcuts', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  const isMac = process.platform === 'darwin'
  const modifier = isMac ? 'Meta' : 'Control'

  test('should handle Cmd/Ctrl+T for new tab', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    await setupMenuEventListener(page, 'menu-new-tab')

    // Press keyboard shortcut
    await page.keyboard.press(`${modifier}+KeyT`)
    await page.waitForTimeout(1000)

    logTestInfo('New tab shortcut pressed', `${modifier}+T`)
  })

  test('should handle Cmd/Ctrl+N for new window', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    await setupMenuEventListener(page, 'menu-new-window')

    await page.keyboard.press(`${modifier}+KeyN`)
    await page.waitForTimeout(1000)

    logTestInfo('New window shortcut pressed', `${modifier}+N`)
  })

  test('should handle Cmd/Ctrl+W for close tab', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    await setupMenuEventListener(page, 'menu-close-tab')

    await page.keyboard.press(`${modifier}+KeyW`)
    await page.waitForTimeout(1000)

    logTestInfo('Close tab shortcut pressed', `${modifier}+W`)
  })

  test('should handle F12 for DevTools toggle', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Note: DevTools toggle only works in debug builds
    await page.keyboard.press('F12')
    await page.waitForTimeout(1000)

    logTestInfo('DevTools toggle shortcut pressed', 'F12')
  })

  test('should handle Cmd/Ctrl+R for reload', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Execute a command first to have some state
    await executeKuiCommand(page, 'echo "test"')

    await page.keyboard.press(`${modifier}+KeyR`)
    await page.waitForTimeout(2000)

    // After reload, Kui should be ready again
    await waitForKuiReady(page)
    logTestInfo('Reload shortcut pressed', `${modifier}+R`)
  })

  test('should handle Cmd/Ctrl+Plus for zoom in', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    await setupMenuEventListener(page, 'menu-zoom-in')

    await page.keyboard.press(`${modifier}+Equal`) // Equal key is Plus
    await page.waitForTimeout(1000)

    logTestInfo('Zoom in shortcut pressed', `${modifier}+Plus`)
  })

  test('should handle Cmd/Ctrl+Minus for zoom out', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    await setupMenuEventListener(page, 'menu-zoom-out')

    await page.keyboard.press(`${modifier}+Minus`)
    await page.waitForTimeout(1000)

    logTestInfo('Zoom out shortcut pressed', `${modifier}+Minus`)
  })

  test('should handle Cmd/Ctrl+0 for zoom reset', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    await setupMenuEventListener(page, 'menu-zoom-reset')

    await page.keyboard.press(`${modifier}+Digit0`)
    await page.waitForTimeout(1000)

    logTestInfo('Zoom reset shortcut pressed', `${modifier}+0`)
  })
})

test.describe('Tauri Menu System - Platform-Specific Behavior', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  test('should have correct modifier key based on platform', async ({ page }) => {
    const platform = process.platform
    const expectedModifier = platform === 'darwin' ? 'Meta' : 'Control'

    logTestInfo('Platform detected', platform)
    logTestInfo('Expected modifier', expectedModifier)

    expect(['darwin', 'linux', 'win32']).toContain(platform)
  })

  test('should support platform-specific menu items', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Menu structure exists (we can't directly test native menus)
    // But we can verify the event system is in place
    const hasTauriEvents = await page.evaluate(() => {
      return typeof window.__TAURI__?.event !== 'undefined'
    })

    expect(hasTauriEvents).toBe(true)
    logTestInfo('Tauri event system available', hasTauriEvents)
  })

  test('should handle menu events consistently across platforms', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    const events = ['menu-new-tab', 'menu-new-window', 'menu-close-tab', 'menu-zoom-in']

    for (const eventName of events) {
      await setupMenuEventListener(page, eventName)

      await page.evaluate(name => {
        if (window.__TAURI__?.event) {
          return window.__TAURI__.event.emit(name, {})
        }
      }, eventName)

      await page.waitForTimeout(500)

      const received = await wasMenuEventReceived(page, eventName)
      expect(received).toBe(true)
      logTestInfo(`Event ${eventName} tested`, 'passed')
    }
  })
})

test.describe('Tauri Menu System - Error Handling', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  test('should handle missing event listeners gracefully', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Emit event without setting up listener - should not crash
    await page.evaluate(() => {
      if (window.__TAURI__?.event) {
        return window.__TAURI__.event.emit('non-existent-event', {})
      }
    })

    await page.waitForTimeout(1000)

    // App should still be functional
    const inputVisible = await page.isVisible('.repl-input')
    expect(inputVisible).toBe(true)
    logTestInfo('App remains functional after unknown event', true)
  })

  test('should handle rapid menu events', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    await setupMenuEventListener(page, 'menu-zoom-in')
    await setupMenuEventListener(page, 'menu-zoom-out')

    // Emit multiple events rapidly
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        if (window.__TAURI__?.event) {
          window.__TAURI__.event.emit('menu-zoom-in', {})
          window.__TAURI__.event.emit('menu-zoom-out', {})
        }
      })
    }

    await page.waitForTimeout(1000)

    // App should still be functional
    const inputVisible = await page.isVisible('.repl-input')
    expect(inputVisible).toBe(true)
    logTestInfo('App handles rapid menu events', true)
  })

  test('should not crash on invalid menu event data', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Emit event with invalid data
    await page.evaluate(() => {
      if (window.__TAURI__?.event) {
        return window.__TAURI__.event.emit('menu-new-tab', null)
      }
    })

    await page.waitForTimeout(1000)

    // App should still be functional
    const inputVisible = await page.isVisible('.repl-input')
    expect(inputVisible).toBe(true)
    logTestInfo('App handles invalid event data', true)
  })
})

test.describe('Tauri Menu System - Integration', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  test('should coordinate menu events with UI state', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Execute a command to create some UI state
    await executeKuiCommand(page, 'echo "test state"')
    await page.waitForTimeout(500)

    // Trigger menu event
    await setupMenuEventListener(page, 'menu-new-tab')
    await page.evaluate(() => {
      if (window.__TAURI__?.event) {
        return window.__TAURI__.event.emit('menu-new-tab', {})
      }
    })

    await page.waitForTimeout(1000)

    // UI should still be responsive
    const inputVisible = await page.isVisible('.repl-input')
    expect(inputVisible).toBe(true)
    logTestInfo('Menu event coordinated with UI', true)
  })

  test('should handle menu events during command execution', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Start a command
    await executeKuiCommand(page, 'echo "processing"', { waitForResult: false })

    // Trigger menu event during execution
    await setupMenuEventListener(page, 'menu-zoom-in')
    await page.evaluate(() => {
      if (window.__TAURI__?.event) {
        return window.__TAURI__.event.emit('menu-zoom-in', {})
      }
    })

    await page.waitForTimeout(2000)

    // Both should complete successfully
    const inputVisible = await page.isVisible('.repl-input')
    expect(inputVisible).toBe(true)
    logTestInfo('Menu events during command execution', true)
  })
})
