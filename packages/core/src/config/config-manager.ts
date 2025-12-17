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

import Debug from 'debug'
import { join } from 'path'
import { AppConfig, ConfigSource, ConfigLoadResult, ConfigChangeEvent, ConfigWatchCallback } from './types'
import { DEFAULT_CONFIG, deepMerge, getNestedValue, setNestedValue } from './defaults'
import { validateConfig, validatePartialConfig, sanitizeConfig } from './validator'
import { loadFromEnv } from './env-loader'
import { userDataDir } from '../core/userdata'
import { inBrowser } from '../core/capabilities'
import store from '../models/store'

const debug = Debug('core/config/manager')

/**
 * Configuration file name
 */
const CONFIG_FILE_NAME = 'kui-ai-config.json'

/**
 * Configuration Manager
 * Handles loading, saving, validation, and hot-reloading of configuration
 */
export class ConfigManager {
  private config: AppConfig
  private sources: Map<string, ConfigSource>
  private watchers: Set<ConfigWatchCallback>
  private configFilePath: string
  private watchEnabled: boolean
  private fileWatcher?: ReturnType<typeof import('fs').watchFile>

  constructor() {
    this.config = { ...DEFAULT_CONFIG }
    this.sources = new Map()
    this.watchers = new Set()
    this.watchEnabled = false

    // Determine config file path
    if (inBrowser()) {
      this.configFilePath = 'browser-storage'
    } else {
      this.configFilePath = join(userDataDir(), CONFIG_FILE_NAME)
    }

    debug('ConfigManager initialized with path:', this.configFilePath)
  }

  /**
   * Load configuration from all sources
   * Priority: env vars > .env file > user settings > defaults
   */
  async load(envFilePath?: string): Promise<ConfigLoadResult> {
    debug('Loading configuration from all sources')

    const warnings: string[] = []
    const errors: string[] = []

    try {
      // Start with defaults
      this.config = { ...DEFAULT_CONFIG }
      this.sources.clear()

      // Mark all default values
      this.markAllSources(this.config, ConfigSource.DEFAULT)

      // Load user settings file
      const userConfig = await this.loadUserSettings()
      if (userConfig) {
        this.config = deepMerge(this.config, userConfig)
        this.markAllSources(userConfig, ConfigSource.USER_SETTINGS)
        debug('Merged user settings')
      }

      // Load environment variables (highest priority)
      const envResult = await loadFromEnv(this.config, this.sources, envFilePath)
      warnings.push(...envResult.warnings)

      if (envResult.envFileLoaded) {
        debug('.env file loaded successfully')
      }

      // Validate final configuration
      const validation = validateConfig(this.config)
      if (!validation.valid) {
        errors.push(...validation.errors)
      }
      warnings.push(...validation.warnings)

      // Log configuration summary (sanitized)
      debug('Configuration loaded:', sanitizeConfig(this.config))
      debug('Validation warnings:', warnings)
      debug('Validation errors:', errors)

      return {
        config: this.config,
        sources: this.sources,
        warnings,
        errors
      }
    } catch (error) {
      errors.push(`Failed to load configuration: ${error}`)
      return {
        config: this.config,
        sources: this.sources,
        warnings,
        errors
      }
    }
  }

  /**
   * Mark all nested keys in an object with a source
   */
  private markAllSources(obj: Record<string, unknown>, source: ConfigSource, prefix = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        this.markAllSources(value as Record<string, unknown>, source, path)
      } else {
        this.sources.set(path, source)
      }
    }
  }

  /**
   * Load user settings from file or browser storage
   */
  private async loadUserSettings(): Promise<Partial<AppConfig> | null> {
    if (inBrowser()) {
      return this.loadFromBrowserStorage()
    } else {
      return this.loadFromFile()
    }
  }

  /**
   * Load configuration from browser localStorage
   */
  private loadFromBrowserStorage(): Partial<AppConfig> | null {
    try {
      const data = store().getItem('kui.ai.config')
      if (data) {
        return JSON.parse(data) as Partial<AppConfig>
      }
    } catch (error) {
      debug('Error loading from browser storage:', error)
    }
    return null
  }

  /**
   * Load configuration from file
   */
  private async loadFromFile(): Promise<Partial<AppConfig> | null> {
    try {
      const { readFile, existsSync } = await import('fs-extra')

      if (!existsSync(this.configFilePath)) {
        debug('Config file does not exist:', this.configFilePath)
        return null
      }

      const content = await readFile(this.configFilePath, 'utf-8')
      return JSON.parse(content) as Partial<AppConfig>
    } catch (error) {
      debug('Error loading config file:', error)
      return null
    }
  }

  /**
   * Save configuration to persistent storage
   */
  async save(): Promise<void> {
    debug('Saving configuration')

    if (inBrowser()) {
      await this.saveToBrowserStorage()
    } else {
      await this.saveToFile()
    }
  }

  /**
   * Save configuration to browser localStorage
   */
  private async saveToBrowserStorage(): Promise<void> {
    try {
      store().setItem('kui.ai.config', JSON.stringify(this.config, null, 2))
      debug('Configuration saved to browser storage')
    } catch (error) {
      debug('Error saving to browser storage:', error)
      throw new Error(`Failed to save configuration: ${error}`)
    }
  }

  /**
   * Save configuration to file
   */
  private async saveToFile(): Promise<void> {
    try {
      const { writeFile, mkdirp } = await import('fs-extra')

      // Ensure directory exists
      await mkdirp(userDataDir())

      // Write configuration
      await writeFile(this.configFilePath, JSON.stringify(this.config, null, 2), 'utf-8')

      debug('Configuration saved to:', this.configFilePath)
    } catch (error) {
      debug('Error saving config file:', error)
      throw new Error(`Failed to save configuration: ${error}`)
    }
  }

  /**
   * Get the complete configuration
   */
  getConfig(): AppConfig {
    return { ...this.config }
  }

  /**
   * Get a configuration value by path
   */
  get<T = unknown>(path: string): T | undefined {
    return getNestedValue(this.config as unknown as Record<string, unknown>, path) as T | undefined
  }

  /**
   * Set a configuration value by path
   */
  async set(path: string, value: unknown, save = true): Promise<void> {
    const oldValue = this.get(path)

    // Update configuration
    setNestedValue(this.config as unknown as Record<string, unknown>, path, value)

    // Validate the change
    const validation = validatePartialConfig({ [path.split('.')[0]]: this.config[path.split('.')[0]] })
    if (!validation.valid) {
      // Rollback on validation failure
      setNestedValue(this.config as unknown as Record<string, unknown>, path, oldValue)
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`)
    }

    // Update source tracking
    this.sources.set(path, ConfigSource.USER_SETTINGS)

    // Save if requested
    if (save) {
      await this.save()
    }

    // Notify watchers
    this.notifyWatchers({
      key: path,
      oldValue,
      newValue: value,
      source: ConfigSource.USER_SETTINGS,
      timestamp: new Date()
    })

    debug(`Configuration updated: ${path}`)
  }

  /**
   * Update multiple configuration values
   */
  async update(updates: Partial<AppConfig>, save = true): Promise<void> {
    const changes: ConfigChangeEvent[] = []

    // Apply all updates
    for (const [key, value] of Object.entries(updates)) {
      const oldValue = this.config[key]
      this.config[key] = value as never
      this.sources.set(key, ConfigSource.USER_SETTINGS)

      changes.push({
        key,
        oldValue,
        newValue: value,
        source: ConfigSource.USER_SETTINGS,
        timestamp: new Date()
      })
    }

    // Validate
    const validation = validateConfig(this.config)
    if (!validation.valid) {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`)
    }

    // Save if requested
    if (save) {
      await this.save()
    }

    // Notify watchers
    for (const change of changes) {
      this.notifyWatchers(change)
    }

    debug('Configuration updated with multiple changes')
  }

  /**
   * Reset configuration to defaults
   */
  async reset(save = true): Promise<void> {
    debug('Resetting configuration to defaults')

    this.config = { ...DEFAULT_CONFIG }
    this.sources.clear()
    this.markAllSources(this.config, ConfigSource.DEFAULT)

    if (save) {
      await this.save()
    }
  }

  /**
   * Get configuration source for a given path
   */
  getSource(path: string): ConfigSource | undefined {
    return this.sources.get(path)
  }

  /**
   * Watch for configuration changes
   */
  watch(callback: ConfigWatchCallback): () => void {
    this.watchers.add(callback)
    debug('Added configuration watcher')

    // Enable file watching if not already enabled
    if (!this.watchEnabled && !inBrowser()) {
      this.enableFileWatch()
    }

    // Return unwatch function
    return () => {
      this.watchers.delete(callback)
      debug('Removed configuration watcher')
    }
  }

  /**
   * Enable file system watching for hot reload
   */
  private async enableFileWatch(): Promise<void> {
    if (inBrowser() || this.watchEnabled) {
      return
    }

    try {
      const { watchFile } = await import('fs')

      watchFile(this.configFilePath, { interval: 1000 }, async () => {
        debug('Configuration file changed, reloading')
        try {
          const newConfig = await this.loadFromFile()
          if (newConfig) {
            await this.update(newConfig, false)
          }
        } catch (error) {
          debug('Error reloading configuration:', error)
        }
      })

      this.watchEnabled = true
      debug('File watching enabled for:', this.configFilePath)
    } catch (error) {
      debug('Failed to enable file watching:', error)
    }
  }

  /**
   * Disable file system watching
   */
  async disableFileWatch(): Promise<void> {
    if (!this.watchEnabled) {
      return
    }

    try {
      const { unwatchFile } = await import('fs')
      unwatchFile(this.configFilePath)
      this.watchEnabled = false
      debug('File watching disabled')
    } catch (error) {
      debug('Error disabling file watch:', error)
    }
  }

  /**
   * Notify all watchers of a configuration change
   */
  private notifyWatchers(event: ConfigChangeEvent): void {
    for (const callback of this.watchers) {
      try {
        callback(event)
      } catch (error) {
        debug('Error in configuration watcher callback:', error)
      }
    }
  }

  /**
   * Get sanitized configuration for logging
   */
  getSanitized(): AppConfig {
    return sanitizeConfig(this.config)
  }

  /**
   * Export configuration as JSON
   */
  export(): string {
    return JSON.stringify(this.config, null, 2)
  }

  /**
   * Import configuration from JSON
   */
  async import(json: string, save = true): Promise<void> {
    try {
      const imported = JSON.parse(json) as AppConfig

      // Validate imported configuration
      const validation = validateConfig(imported)
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`)
      }

      this.config = imported
      this.markAllSources(this.config, ConfigSource.USER_SETTINGS)

      if (save) {
        await this.save()
      }

      debug('Configuration imported successfully')
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error}`)
    }
  }
}

// Singleton instance
let instance: ConfigManager | null = null

/**
 * Get the global configuration manager instance
 */
export function getConfigManager(): ConfigManager {
  if (!instance) {
    instance = new ConfigManager()
  }
  return instance
}

/**
 * Initialize and load configuration
 */
export async function initializeConfig(envFilePath?: string): Promise<ConfigLoadResult> {
  const manager = getConfigManager()
  return manager.load(envFilePath)
}
