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
import { AppConfig, ConfigSource } from './types'
import { setNestedValue } from './defaults'
import { inBrowser } from '../core/capabilities'

const debug = Debug('core/config/env-loader')

/**
 * Environment variable to configuration path mapping
 */
const ENV_VAR_MAPPING: Record<string, string> = {
  // AI Configuration
  KUI_AI_ENABLED: 'ai.enabled',
  KUI_AI_DEFAULT_PROVIDER: 'ai.defaultProvider',

  // OpenAI
  OPENAI_API_KEY: 'ai.providers.openai.apiKey',
  OPENAI_BASE_URL: 'ai.providers.openai.baseUrl',
  OPENAI_MODEL: 'ai.providers.openai.model',
  KUI_OPENAI_ENABLED: 'ai.providers.openai.enabled',

  // Anthropic
  ANTHROPIC_API_KEY: 'ai.providers.anthropic.apiKey',
  ANTHROPIC_BASE_URL: 'ai.providers.anthropic.baseUrl',
  ANTHROPIC_MODEL: 'ai.providers.anthropic.model',
  KUI_ANTHROPIC_ENABLED: 'ai.providers.anthropic.enabled',

  // Logging
  KUI_LOG_LEVEL: 'logging.level',
  KUI_LOG_FILE: 'logging.file',
  KUI_LOG_CONSOLE: 'logging.console',

  // Features
  KUI_FEATURE_AI_ASSIST: 'features.aiAssist',
  KUI_FEATURE_ANALYTICS: 'features.analytics',
  KUI_FEATURE_TELEMETRY: 'features.telemetry',
  KUI_FEATURE_EXPERIMENTAL: 'features.experimentalCommands',

  // UI
  KUI_THEME: 'ui.theme',
  KUI_FONT_SIZE: 'ui.fontSize',
  KUI_TAB_SIZE: 'ui.tabSize',

  // Performance
  KUI_CACHE_ENABLED: 'performance.cacheEnabled',
  KUI_CACHE_TTL: 'performance.cacheTTL',
  KUI_MAX_CONCURRENT_REQUESTS: 'performance.maxConcurrentRequests'
}

/**
 * Parse environment variable value to appropriate type
 */
function parseEnvValue(value: string, path: string): unknown {
  // Boolean values
  if (value.toLowerCase() === 'true') return true
  if (value.toLowerCase() === 'false') return false

  // Number values
  if (path.includes('fontSize') || path.includes('tabSize') || path.includes('TTL') || path.includes('Requests')) {
    const num = Number(value)
    if (!isNaN(num)) return num
  }

  // String values
  return value
}

/**
 * Load configuration from .env file
 */
async function loadEnvFile(envPath?: string): Promise<Record<string, string>> {
  if (inBrowser()) {
    debug('Skipping .env file loading in browser environment')
    return {}
  }

  const envVars: Record<string, string> = {}

  try {
    const { readFile } = await import('fs-extra')
    const { existsSync } = await import('fs')

    // Try multiple possible locations
    const possiblePaths = [
      envPath,
      join(process.cwd(), '.env'),
      join(process.cwd(), '.env.local'),
      join(process.env.HOME || '~', '.kui', '.env')
    ].filter((p): p is string => Boolean(p))

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        debug('Loading .env file from:', path)
        const content = await readFile(path, 'utf-8')

        // Parse .env file
        const lines = content.split('\n')
        for (const line of lines) {
          const trimmed = line.trim()

          // Skip empty lines and comments
          if (!trimmed || trimmed.startsWith('#')) {
            continue
          }

          // Parse KEY=VALUE format
          const match = trimmed.match(/^([^=]+)=(.*)$/)
          if (match) {
            const [, key, value] = match
            // Remove quotes if present
            const cleanValue = value.trim().replace(/^["']|["']$/g, '')
            envVars[key.trim()] = cleanValue
          }
        }

        debug(`Loaded ${Object.keys(envVars).length} variables from ${path}`)
        break // Use first found .env file
      }
    }
  } catch (error) {
    debug('Error loading .env file:', error)
  }

  return envVars
}

/**
 * Load configuration from environment variables
 */
export async function loadFromEnv(
  config: AppConfig,
  sources: Map<string, ConfigSource>,
  envFilePath?: string
): Promise<{ warnings: string[]; envFileLoaded: boolean }> {
  const warnings: string[] = []
  let envFileLoaded = false

  // Load .env file first
  const envFileVars = await loadEnvFile(envFilePath)
  if (Object.keys(envFileVars).length > 0) {
    envFileLoaded = true
  }

  // Combine .env file vars with process.env (process.env takes precedence)
  const allEnvVars = { ...envFileVars, ...process.env }

  // Apply environment variables to config
  for (const [envVar, configPath] of Object.entries(ENV_VAR_MAPPING)) {
    const value = allEnvVars[envVar]

    if (value !== undefined) {
      try {
        const parsedValue = parseEnvValue(value, configPath)
        setNestedValue(config as unknown as Record<string, unknown>, configPath, parsedValue)

        // Track source
        const source = envVar in process.env ? ConfigSource.ENV_VAR : ConfigSource.ENV_FILE
        sources.set(configPath, source)

        debug(`Set ${configPath} from ${source}: ${envVar}`)
      } catch (error) {
        warnings.push(`Failed to parse environment variable ${envVar}: ${error}`)
      }
    }
  }

  // Auto-enable providers if API keys are present
  if (config.ai.providers.openai?.apiKey && !config.ai.providers.openai.enabled) {
    if (!allEnvVars.KUI_OPENAI_ENABLED) {
      config.ai.providers.openai.enabled = true
      debug('Auto-enabled OpenAI provider due to API key presence')
    }
  }

  if (config.ai.providers.anthropic?.apiKey && !config.ai.providers.anthropic.enabled) {
    if (!allEnvVars.KUI_ANTHROPIC_ENABLED) {
      config.ai.providers.anthropic.enabled = true
      debug('Auto-enabled Anthropic provider due to API key presence')
    }
  }

  // Auto-enable AI if any provider is enabled
  if (
    !allEnvVars.KUI_AI_ENABLED &&
    Object.values(config.ai.providers).some(p => p && typeof p === 'object' && 'enabled' in p && p.enabled)
  ) {
    config.ai.enabled = true
    debug('Auto-enabled AI due to enabled providers')
  }

  return { warnings, envFileLoaded }
}

/**
 * Export environment variable names for documentation
 */
export function getEnvVarNames(): string[] {
  return Object.keys(ENV_VAR_MAPPING).sort()
}

/**
 * Generate .env template file content
 */
export function generateEnvTemplate(): string {
  const lines = [
    '# Kui AI Configuration',
    '# Copy this file to .env and fill in your values',
    '',
    '# AI Configuration',
    '# KUI_AI_ENABLED=true',
    '# KUI_AI_DEFAULT_PROVIDER=anthropic',
    '',
    '# OpenAI Configuration',
    '# OPENAI_API_KEY=your-openai-api-key',
    '# OPENAI_BASE_URL=https://api.openai.com/v1',
    '# OPENAI_MODEL=gpt-4',
    '# KUI_OPENAI_ENABLED=true',
    '',
    '# Anthropic Configuration',
    '# ANTHROPIC_API_KEY=your-anthropic-api-key',
    '# ANTHROPIC_BASE_URL=https://api.anthropic.com/v1',
    '# ANTHROPIC_MODEL=claude-3-5-sonnet-20241022',
    '# KUI_ANTHROPIC_ENABLED=true',
    '',
    '# Logging',
    '# KUI_LOG_LEVEL=info',
    '# KUI_LOG_FILE=/path/to/log/file.log',
    '# KUI_LOG_CONSOLE=true',
    '',
    '# Feature Flags',
    '# KUI_FEATURE_AI_ASSIST=true',
    '# KUI_FEATURE_ANALYTICS=false',
    '# KUI_FEATURE_TELEMETRY=false',
    '# KUI_FEATURE_EXPERIMENTAL=false',
    '',
    '# UI Preferences',
    '# KUI_THEME=default',
    '# KUI_FONT_SIZE=14',
    '# KUI_TAB_SIZE=2',
    '',
    '# Performance',
    '# KUI_CACHE_ENABLED=true',
    '# KUI_CACHE_TTL=3600000',
    '# KUI_MAX_CONCURRENT_REQUESTS=5',
    ''
  ]

  return lines.join('\n')
}
