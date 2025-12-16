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
 * Window Management for Tauri
 *
 * This module provides TypeScript wrappers for Tauri window management operations.
 * It interfaces with the Rust backend commands defined in src-tauri/src/main.rs
 */

import Debug from 'debug'
const debug = Debug('main/window')

import { isTauriRuntime } from './tauri-bridge'

/**
 * Window preferences for creating new windows
 */
export interface WindowPreferences {
  title?: string
  width?: number
  height?: number
  argv?: string[]
  initialTabTitle?: string
  quietExecCommand?: boolean
}

/**
 * Check if Tauri window API is available
 */
function isTauriAvailable(): boolean {
  interface WindowWithTauri extends Window {
    __TAURI__?: unknown
  }
  return isTauriRuntime() && typeof window !== 'undefined' && (window as WindowWithTauri).__TAURI__ !== undefined
}

/**
 * Create a new window
 */
export async function createWindow(prefs: WindowPreferences = {}): Promise<void> {
  if (!isTauriAvailable()) {
    debug('Tauri not available, cannot create window')
    return
  }

  try {
    debug('Creating window with preferences:', prefs)

    await window.__TAURI__!.core.invoke('create_new_window', {
      argv: prefs.argv,
      width: prefs.width,
      height: prefs.height,
      title: prefs.title
    })

    debug('Window created successfully')
  } catch (error) {
    console.error('Failed to create window:', error)
    throw error
  }
}

/**
 * Window operation via synchronous_message IPC
 */
async function windowOperation(operation: string, data: Record<string, unknown> = {}): Promise<string> {
  if (!isTauriAvailable()) {
    debug(`Tauri not available, cannot perform operation: ${operation}`)
    return 'error'
  }

  try {
    const message = JSON.stringify({
      operation,
      ...data
    })

    const result = await window.__TAURI__!.core.invoke('synchronous_message', { message })
    debug(`Window operation ${operation} completed:`, result)
    return result
  } catch (error) {
    console.error(`Window operation ${operation} failed:`, error)
    throw error
  }
}

/**
 * Create a new window via synchronous_message (alternative method)
 */
export async function openNewWindow(
  argv?: string[],
  width?: number,
  height?: number,
  title?: string,
  initialTabTitle?: string
): Promise<void> {
  await windowOperation('new-window', {
    argv,
    width,
    height,
    title,
    initialTabTitle
  })
}

/**
 * Enlarge the current window
 */
export async function enlargeWindow(): Promise<void> {
  await windowOperation('enlarge-window')
}

/**
 * Reduce the current window size
 */
export async function reduceWindow(): Promise<void> {
  await windowOperation('reduce-window')
}

/**
 * Maximize the current window
 */
export async function maximizeWindow(): Promise<void> {
  await windowOperation('maximize-window')
}

/**
 * Unmaximize the current window
 */
export async function unmaximizeWindow(): Promise<void> {
  await windowOperation('unmaximize-window')
}

/**
 * Quit the application
 */
export async function quitApplication(): Promise<void> {
  await windowOperation('quit')
}

/**
 * Get the current window (Tauri API)
 * Returns the Tauri Window object for advanced operations
 */
export async function getCurrentWindow(): Promise<unknown> {
  if (!isTauriAvailable()) {
    debug('Tauri not available')
    return null
  }

  try {
    // Import Tauri window API dynamically
    const { getCurrentWindow: getTauriWindow } = await import('@tauri-apps/api/window')
    return getTauriWindow()
  } catch (error) {
    console.error('Failed to get current window:', error)
    return null
  }
}

/**
 * Get all windows (Tauri API)
 */
export async function getAllWindows(): Promise<unknown[]> {
  if (!isTauriAvailable()) {
    debug('Tauri not available')
    return []
  }

  try {
    const { getAllWindows: getTauriWindows } = await import('@tauri-apps/api/window')
    return getTauriWindows()
  } catch (error) {
    console.error('Failed to get all windows:', error)
    return []
  }
}

/**
 * Set window title
 */
export async function setWindowTitle(title: string): Promise<void> {
  const window = await getCurrentWindow()
  if (window) {
    try {
      await window.setTitle(title)
      debug('Window title set to:', title)
    } catch (error) {
      console.error('Failed to set window title:', error)
    }
  }
}

/**
 * Center the window
 */
export async function centerWindow(): Promise<void> {
  const window = await getCurrentWindow()
  if (window) {
    try {
      await window.center()
      debug('Window centered')
    } catch (error) {
      console.error('Failed to center window:', error)
    }
  }
}

/**
 * Set window size
 */
export async function setWindowSize(width: number, height: number): Promise<void> {
  const window = await getCurrentWindow()
  if (window) {
    try {
      await window.setSize({ width, height })
      debug('Window size set to:', width, height)
    } catch (error) {
      console.error('Failed to set window size:', error)
    }
  }
}

/**
 * Focus the window
 */
export async function focusWindow(): Promise<void> {
  const window = await getCurrentWindow()
  if (window) {
    try {
      await window.setFocus()
      debug('Window focused')
    } catch (error) {
      console.error('Failed to focus window:', error)
    }
  }
}
