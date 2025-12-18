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
 * Tauri Plugin Loading System
 *
 * This module provides enhanced plugin loading for Tauri runtime while
 * maintaining backward compatibility with Electron. It integrates with the
 * existing resolver system and uses tauri-bridge to detect the runtime.
 */

import Debug from 'debug'
import { isTauriRuntime, isElectronRuntime } from './tauri-bridge'

const debug = Debug('main/tauri-plugins')

/**
 * Runtime-aware plugin loading configuration
 */
export interface PluginLoadOptions {
  /** Enable aggressive preloading for faster startup */
  preload?: boolean
  /** Maximum number of concurrent plugin loads */
  concurrency?: number
  /** Timeout for plugin loading (ms) */
  timeout?: number
}

/**
 * Default plugin loading options for each runtime
 */
const DEFAULT_OPTIONS: Record<string, PluginLoadOptions> = {
  tauri: {
    preload: true, // Tauri is faster, can handle more preloading
    concurrency: 8, // Higher concurrency for Tauri
    timeout: 5000
  },
  electron: {
    preload: false, // Electron prefers lazy loading
    concurrency: 4, // More conservative concurrency
    timeout: 10000
  },
  browser: {
    preload: false, // Browser has network constraints
    concurrency: 4,
    timeout: 10000
  }
}

/**
 * Get runtime-specific plugin loading options
 *
 * @returns Plugin loading options optimized for the current runtime
 */
export function getPluginLoadOptions(): PluginLoadOptions {
  if (isTauriRuntime()) {
    debug('Using Tauri plugin loading options')
    return DEFAULT_OPTIONS.tauri
  } else if (isElectronRuntime()) {
    debug('Using Electron plugin loading options')
    return DEFAULT_OPTIONS.electron
  } else {
    debug('Using browser plugin loading options')
    return DEFAULT_OPTIONS.browser
  }
}

/**
 * Check if we should use enhanced Tauri plugin loading
 *
 * This determines whether to use Tauri-specific optimizations or
 * fall back to standard Electron-compatible loading.
 *
 * @returns true if Tauri runtime and enhancements are enabled
 */
export function shouldUseTauriEnhancements(): boolean {
  return isTauriRuntime()
}

/**
 * Get plugin import path with runtime-specific optimizations
 *
 * This function returns the same import path for both runtimes since
 * webpack handles the bundling. The difference is in execution strategy.
 *
 * @param pluginPath - Original plugin path from prescan
 * @returns Optimized plugin import path
 */
export function getPluginImportPath(pluginPath: string): string {
  // Both Tauri and Electron use the same webpack-based import paths
  // The runtime detection happens at execution time, not import time
  return pluginPath
}

/**
 * Apply runtime-specific plugin loading strategy
 *
 * This wraps the plugin loading promise with runtime-specific behavior
 * like timeout handling, error recovery, and performance monitoring.
 *
 * @param loadPromise - Promise that loads the plugin
 * @param pluginRoute - Plugin route for debugging
 * @returns Wrapped promise with runtime-specific handling
 */
export async function applyRuntimeStrategy<T>(
  loadPromise: Promise<T>,
  pluginRoute: string
): Promise<T> {
  const options = getPluginLoadOptions()
  const startTime = Date.now()

  try {
    // Apply timeout if configured
    if (options.timeout) {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Plugin loading timeout after ${options.timeout}ms: ${pluginRoute}`))
        }, options.timeout)
      })

      const result = await Promise.race([loadPromise, timeoutPromise])

      const loadTime = Date.now() - startTime
      debug(`Plugin ${pluginRoute} loaded in ${loadTime}ms`)

      return result
    }

    const result = await loadPromise
    const loadTime = Date.now() - startTime
    debug(`Plugin ${pluginRoute} loaded in ${loadTime}ms`)

    return result
  } catch (error) {
    const loadTime = Date.now() - startTime
    debug(`Plugin ${pluginRoute} failed after ${loadTime}ms:`, error)
    throw error
  }
}

/**
 * Check if a plugin should be preloaded based on runtime
 *
 * @param pluginRoute - Plugin route to check
 * @returns true if plugin should be preloaded
 */
export function shouldPreloadPlugin(pluginRoute: string): boolean {
  const options = getPluginLoadOptions()

  if (!options.preload) {
    return false
  }

  // Critical plugins that should always preload in Tauri
  const criticalPlugins = [
    'bash-like',
    'core-support',
    'client-common'
  ]

  return criticalPlugins.some(critical => pluginRoute.includes(critical))
}

/**
 * Get concurrency limit for parallel plugin loading
 *
 * @returns Maximum number of plugins to load in parallel
 */
export function getPluginConcurrency(): number {
  const options = getPluginLoadOptions()
  return options.concurrency || 4
}

/**
 * Runtime information for debugging and optimization
 *
 * @returns Object containing runtime details and plugin loading configuration
 */
export function getPluginRuntimeInfo(): {
  runtime: string
  options: PluginLoadOptions
  features: {
    preloading: boolean
    asyncImports: boolean
    webpackBundling: boolean
    tauriEnhancements: boolean
  }
} {
  const runtime = isTauriRuntime() ? 'Tauri' : isElectronRuntime() ? 'Electron' : 'Browser'
  const options = getPluginLoadOptions()

  return {
    runtime,
    options,
    features: {
      preloading: options.preload || false,
      asyncImports: true,
      webpackBundling: true,
      tauriEnhancements: shouldUseTauriEnhancements()
    }
  }
}

/**
 * Log plugin loading diagnostics
 *
 * Useful for debugging plugin loading issues in different runtimes
 */
export function logPluginDiagnostics(): void {
  const info = getPluginRuntimeInfo()
  debug('Plugin Runtime Diagnostics:')
  debug('  Runtime:', info.runtime)
  debug('  Options:', info.options)
  debug('  Features:', info.features)
}

// Initialize diagnostics logging when module loads
if (debug.enabled) {
  logPluginDiagnostics()
}

debug('Tauri plugin loading system initialized')
