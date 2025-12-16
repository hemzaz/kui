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
 * AI Provider Configuration
 */
export interface AIProviderConfig {
  name: string
  apiKey?: string
  baseUrl?: string
  model?: string
  enabled: boolean
}

/**
 * Logging Configuration
 */
export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
  file?: string
  console: boolean
}

/**
 * Feature Flags Configuration
 */
export interface FeatureFlags {
  aiAssist?: boolean
  analytics?: boolean
  telemetry?: boolean
  experimentalCommands?: boolean
  [key: string]: boolean | undefined
}

/**
 * Application Configuration
 */
export interface AppConfig {
  version: string

  // AI Configuration
  ai: {
    enabled: boolean
    providers: {
      openai?: AIProviderConfig
      anthropic?: AIProviderConfig
      [key: string]: AIProviderConfig | undefined
    }
    defaultProvider?: string
  }

  // Logging
  logging: LoggingConfig

  // Feature Flags
  features: FeatureFlags

  // UI Preferences
  ui: {
    theme?: string
    fontSize?: number
    tabSize?: number
  }

  // Performance
  performance: {
    cacheEnabled: boolean
    cacheTTL: number
    maxConcurrentRequests: number
  }

  // Custom user settings
  [key: string]: unknown
}

/**
 * Configuration Source Priority
 */
export enum ConfigSource {
  ENV_VAR = 'environment_variable',
  ENV_FILE = 'env_file',
  USER_SETTINGS = 'user_settings',
  DEFAULT = 'default'
}

/**
 * Configuration Load Result
 */
export interface ConfigLoadResult {
  config: AppConfig
  sources: Map<string, ConfigSource>
  warnings: string[]
  errors: string[]
}

/**
 * Configuration Validation Result
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Configuration Change Event
 */
export interface ConfigChangeEvent {
  key: string
  oldValue: unknown
  newValue: unknown
  source: ConfigSource
  timestamp: Date
}

/**
 * Configuration Watch Callback
 */
export type ConfigWatchCallback = (event: ConfigChangeEvent) => void
