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
 * Tauri Bridge
 *
 * This module provides the IPC communication layer for Kui's Tauri runtime.
 * Simplified for macOS Apple Silicon (M1+) only.
 */

import Debug from 'debug'
const debug = Debug('main/tauri-bridge')

// Type definitions for IPC messages
type IpcListener = (event: Record<string, unknown>, ...args: unknown[]) => void

// Check if we're running in Tauri
interface WindowWithTauri extends Window {
  __TAURI__?: {
    core: {
      invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>
    }
  }
}
const isTauri = typeof window !== 'undefined' && (window as WindowWithTauri).__TAURI__ !== undefined

debug('Runtime detection:', { isTauri })

/**
 * Tauri invoke function (available in Tauri apps)
 */
declare global {
  interface Window {
    __TAURI__?: {
      core: {
        invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>
      }
    }
  }
}

/**
 * IPC Renderer interface
 * Provides the IPC API for Tauri
 */
export interface IpcRenderer {
  send(channel: string, ...args: unknown[]): void
  invoke(channel: string, ...args: unknown[]): Promise<unknown>
  on(channel: string, listener: IpcListener): void
  once(channel: string, listener: IpcListener): void
  removeListener(channel: string, listener: (...args: unknown[]) => void): void
}

/**
 * Tauri IPC Renderer implementation
 */
class TauriIpcRenderer implements IpcRenderer {
  private listeners: Map<string, Set<IpcListener>> = new Map()

  public async send(channel: string, ...args: unknown[]): Promise<void> {
    debug('Tauri send:', channel, args)
    const message = args[0]

    try {
      const result = await window.__TAURI__!.core.invoke('synchronous_message', {
        message: typeof message === 'string' ? message : JSON.stringify(message)
      })
      debug('Tauri send result:', result)
    } catch (error) {
      console.error('Tauri send error:', error)
    }
  }

  public async invoke(channel: string, ...args: unknown[]): Promise<unknown> {
    debug('Tauri invoke:', channel, args)

    // Map IPC channels to Tauri commands
    switch (channel) {
      case '/exec/invoke':
        return window.__TAURI__!.core.invoke('exec_invoke', {
          message: args[0]
        })

      case 'synchronous-message':
        return window.__TAURI__!.core.invoke('synchronous_message', {
          message: args[0]
        })

      case 'capture-page-to-clipboard': {
        const rect = args[1] as { x: number; y: number; width: number; height: number }
        return window.__TAURI__!.core.invoke('capture_to_clipboard', {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        })
      }

      default:
        console.warn('Unhandled Tauri invoke channel:', channel)
        return null
    }
  }

  public on(channel: string, listener: IpcListener): void {
    debug('Tauri on:', channel)
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set())
    }
    this.listeners.get(channel)!.add(listener)
  }

  public once(channel: string, listener: IpcListener): void {
    debug('Tauri once:', channel)
    const wrappedListener: IpcListener = (event: Record<string, unknown>, ...args: unknown[]) => {
      listener(event, ...args)
      this.removeListener(channel, wrappedListener)
    }
    this.on(channel, wrappedListener)
  }

  public removeListener(channel: string, listener: (...args: unknown[]) => void): void {
    debug('Tauri removeListener:', channel)
    const channelListeners = this.listeners.get(channel)
    if (channelListeners) {
      channelListeners.delete(listener as IpcListener)
    }
  }

  // Helper method to emit events (for internal use)
  public emit(channel: string, ...args: unknown[]): void {
    const channelListeners = this.listeners.get(channel)
    if (channelListeners) {
      channelListeners.forEach(listener => {
        try {
          listener({}, ...args)
        } catch (error) {
          console.error('Error in listener:', error)
        }
      })
    }
  }
}

/**
 * Get the IPC renderer for Tauri
 * This is the main function that should be used throughout the codebase
 */
export function getIpcRenderer(): IpcRenderer {
  if (!isTauri) {
    throw new Error('Tauri runtime not detected. Kui now requires Tauri (Electron support removed).')
  }
  debug('Using Tauri IPC renderer')
  return new TauriIpcRenderer()
}

/**
 * Check if running in Tauri (always true now)
 */
export function isTauriRuntime(): boolean {
  return isTauri
}

/**
 * Check if running in Electron (always false - Electron support removed)
 * @deprecated Electron support has been removed
 */
export function isElectronRuntime(): boolean {
  return false
}

/**
 * Get runtime name
 */
export function getRuntimeName(): string {
  return isTauri ? 'Tauri' : 'Unknown'
}
