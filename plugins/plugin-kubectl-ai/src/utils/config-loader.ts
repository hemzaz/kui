/*
 * Copyright 2024 The Kubernetes Authors
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

import type { AIConfig } from '../types/ai-types'
import { DEFAULT_AI_CONFIG } from '../types/ai-types'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

/**
 * Get configuration file path
 */
function getConfigPath(): string {
  const configDir = path.join(os.homedir(), '.kui')
  const configFile = path.join(configDir, 'ai-config.json')
  return configFile
}

/**
 * Ensure config directory exists
 */
function ensureConfigDir(): void {
  const configDir = path.dirname(getConfigPath())
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): AIConfig {
  return { ...DEFAULT_AI_CONFIG }
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): AIConfig {
  return getDefaultConfig()
}

/**
 * Load configuration from file and environment
 */
export async function loadConfig(): Promise<AIConfig> {
  let config = getDefaultConfig()

  // Try to load from file
  const configPath = getConfigPath()
  if (fs.existsSync(configPath)) {
    try {
      const fileContent = fs.readFileSync(configPath, 'utf8')
      const fileConfig = JSON.parse(fileContent) as Partial<AIConfig>

      // Merge file config with defaults
      config = {
        ...config,
        ...fileConfig,
        privacy: {
          ...config.privacy,
          ...(fileConfig.privacy || {})
        }
      }
    } catch (error) {
      console.warn('Failed to load AI config from file:', error)
      // Continue with defaults
    }
  }

  // Override with environment variables
  if (process.env.AI_PROVIDER) {
    config.provider = process.env.AI_PROVIDER as AIConfig['provider']
  }

  if (process.env.AI_MODEL) {
    config.model = process.env.AI_MODEL
  }

  if (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || process.env.OPENAI_API_KEY) {
    config.apiKey =
      process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || process.env.OPENAI_API_KEY || config.apiKey
  }

  if (process.env.AI_BASE_URL) {
    config.baseUrl = process.env.AI_BASE_URL
  }

  if (process.env.AI_MAX_TOKENS) {
    const maxTokens = parseInt(process.env.AI_MAX_TOKENS, 10)
    if (!isNaN(maxTokens)) {
      config.maxTokens = maxTokens
    }
  }

  if (process.env.AI_TEMPERATURE) {
    const temperature = parseFloat(process.env.AI_TEMPERATURE)
    if (!isNaN(temperature)) {
      config.temperature = temperature
    }
  }

  if (process.env.AI_STREAMING) {
    config.streaming = process.env.AI_STREAMING === 'true'
  }

  if (process.env.AI_CACHING) {
    config.caching = process.env.AI_CACHING === 'true'
  }

  return config
}

/**
 * Save configuration to file
 */
export async function saveConfig(config: AIConfig): Promise<void> {
  ensureConfigDir()
  const configPath = getConfigPath()

  try {
    const configJson = JSON.stringify(config, null, 2)
    fs.writeFileSync(configPath, configJson, 'utf8')
  } catch (error) {
    console.error('Failed to save AI config:', error)
    throw new Error(`Failed to save configuration: ${(error as Error).message}`)
  }
}

/**
 * Delete configuration file
 */
export async function deleteConfig(): Promise<void> {
  const configPath = getConfigPath()
  if (fs.existsSync(configPath)) {
    try {
      fs.unlinkSync(configPath)
    } catch (error) {
      console.error('Failed to delete AI config:', error)
      throw new Error(`Failed to delete configuration: ${(error as Error).message}`)
    }
  }
}
