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
 * Tauri Menu Integration
 *
 * This module integrates Tauri menu events with Kui's frontend functionality.
 * It listens for menu events emitted by the Tauri backend and triggers the
 * appropriate frontend actions (tab management, zoom, etc.).
 */

import Debug from 'debug'

const debug = Debug('main/tauri-menu-integration')

/**
 * Check if we're running in Tauri
 */
function isTauri(): boolean {
  return typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined
}

/**
 * Initialize Tauri menu event listeners
 * This should be called during application bootstrap
 */
export async function initTauriMenuListeners(): Promise<void> {
  if (!isTauri()) {
    debug('Not running in Tauri, skipping menu listener initialization')
    return
  }

  debug('Initializing Tauri menu event listeners')

  try {
    const { listen } = (window as any).__TAURI__.event

    // Tab Management Events
    await listen('menu-new-tab', () => {
      debug('menu-new-tab event received')
      handleNewTab()
    })

    await listen('menu-close-tab', () => {
      debug('menu-close-tab event received')
      handleCloseTab()
    })

    // Window Management Events
    await listen('menu-new-window', () => {
      debug('menu-new-window event received')
      handleNewWindow()
    })

    // Zoom Events
    await listen('menu-zoom-in', () => {
      debug('menu-zoom-in event received')
      handleZoomIn()
    })

    await listen('menu-zoom-out', () => {
      debug('menu-zoom-out event received')
      handleZoomOut()
    })

    await listen('menu-zoom-reset', () => {
      debug('menu-zoom-reset event received')
      handleZoomReset()
    })

    // About Dialog Event
    await listen('menu-about', () => {
      debug('menu-about event received')
      handleAbout()
    })

    debug('Tauri menu event listeners initialized successfully')
  } catch (err) {
    console.error('Failed to initialize Tauri menu listeners:', err)
  }
}

/**
 * Handle "New Tab" menu action
 * Emits Kui's internal event for creating a new tab
 */
function handleNewTab(): void {
  debug('Creating new tab')
  import('../api/Events')
    .then(({ eventBus }) => {
      eventBus.emit('/tab/new/request', {
        background: false,
        tabs: [{}]
      })
    })
    .catch(err => {
      console.error('Failed to create new tab:', err)
    })
}

/**
 * Handle "Close Tab" menu action
 * Closes the currently active tab
 */
function handleCloseTab(): void {
  debug('Closing current tab')
  import('../api/Tab')
    .then(async ({ getCurrentTab }) => {
      const tab = getCurrentTab()
      if (tab) {
        const { eventBus } = await import('../api/Events')
        eventBus.emitWithTabId('/tab/close/request', tab.uuid, tab)
      }
    })
    .catch(err => {
      console.error('Failed to close tab:', err)
    })
}

/**
 * Handle "New Window" menu action
 * Creates a new Kui window
 */
function handleNewWindow(): void {
  debug('Creating new window')
  import('../repl/exec')
    .then(({ qexec }) => {
      qexec('window new')
    })
    .catch(err => {
      console.error('Failed to create new window:', err)
    })
}

/**
 * Handle "Zoom In" menu action
 * Increases the UI zoom level
 */
function handleZoomIn(): void {
  debug('Zooming in')
  const main = document.querySelector('html')
  if (main) {
    const currentZoom = parseInt(main.getAttribute('data-zoom') || '1', 10)
    const newZoom = Math.min(currentZoom + 1, 12) // MAX_ZOOM_IN = 12
    setZoom(newZoom)
  }
}

/**
 * Handle "Zoom Out" menu action
 * Decreases the UI zoom level
 */
function handleZoomOut(): void {
  debug('Zooming out')
  const main = document.querySelector('html')
  if (main) {
    const currentZoom = parseInt(main.getAttribute('data-zoom') || '1', 10)
    const newZoom = Math.max(currentZoom - 1, -2) // MAX_ZOOM_OUT = -2
    setZoom(newZoom)
  }
}

/**
 * Handle "Zoom Reset" menu action
 * Resets zoom to default level (1)
 */
function handleZoomReset(): void {
  debug('Resetting zoom')
  setZoom(1)
}

/**
 * Set the zoom level
 * This replicates the logic from plugin-core-support/src/lib/cmds/zoom.ts
 */
function setZoom(newZoom: number): void {
  const main = document.querySelector('html')
  if (!main) return

  // Update HTML zoom attribute
  main.setAttribute('data-zoom', newZoom.toString())

  // Update Monaco editors if present
  const editors = document.querySelectorAll('.monaco-editor-wrapper')
  for (let idx = 0; idx < editors.length; idx++) {
    const editorElement = editors[idx] as any
    const editor = editorElement['editor']

    if (editor && editor.updateOptions) {
      const baseFontSize = editorElement['baseFontSize']
      if (baseFontSize) {
        const delta = baseFontSize * 0.0625 * newZoom
        const newFontSize = baseFontSize + delta
        editor.updateOptions({ fontSize: newFontSize })
      }
    }
  }

  // Emit zoom event
  import('../api/Events')
    .then(({ eventChannelUnsafe }) => {
      eventChannelUnsafe.emit('/zoom', newZoom)
    })
    .catch(err => {
      console.error('Failed to emit zoom event:', err)
    })

  debug('Zoom level set to:', newZoom)
}

/**
 * Handle "About" menu action
 * Opens the about dialog or page
 */
function handleAbout(): void {
  debug('Showing about dialog')
  import('../repl/exec')
    .then(({ qexec }) => {
      qexec('about')
    })
    .catch(err => {
      console.error('Failed to show about dialog:', err)
    })
}

/**
 * Export initialization function
 */
export default initTauriMenuListeners
