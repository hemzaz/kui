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

import { Arguments, Registrar, UsageError } from '@kui-shell/core'
import type { AIConfig } from '../types/ai-types'

interface ConfigOptions {
  provider?: 'anthropic' | 'openai' | 'azure' | 'ollama' | 'custom'
  model?: string
  'api-key'?: string
  'base-url'?: string
  'max-tokens'?: number
  temperature?: number
  streaming?: boolean
  caching?: boolean
  reset?: boolean
  show?: boolean
}

/**
 * Get default AI configuration
 */
function getDefaultConfig(): AIConfig {
  return {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 4096,
    temperature: 0.7,
    timeout: 60,
    privacy: {
      sendClusterMetadata: true,
      sendResourceNames: true,
      sendLogs: false,
      sendPodNames: true
    },
    streaming: true,
    caching: true,
    cacheTTL: 300,
    costAlerts: true
  }
}

/**
 * Load configuration from environment or storage
 * TODO: Implement persistent storage
 */
function loadConfig(): AIConfig {
  // For now, return default config with env overrides
  const config = getDefaultConfig()

  if (process.env.AI_PROVIDER) {
    config.provider = process.env.AI_PROVIDER as unknown as 'anthropic' | 'openai' | 'azure' | 'ollama' | 'custom'
  }
  if (process.env.AI_MODEL) {
    config.model = process.env.AI_MODEL
  }
  if (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || process.env.OPENAI_API_KEY) {
    config.apiKey =
      process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || process.env.OPENAI_API_KEY || undefined
  }

  return config
}

/**
 * Save configuration to storage
 * TODO: Implement persistent storage
 */
function saveConfig(config: AIConfig): void {
  // TODO: Implement config persistence
  console.log('Config saved (not yet implemented):', config)
}

/**
 * Format configuration for display
 */
function formatConfig(config: AIConfig): string {
  const apiKeyDisplay = config.apiKey ? `${config.apiKey.substring(0, 8)}...` : 'Not set'

  return [
    'AI Assistant Configuration',
    '=========================',
    '',
    'Provider Settings:',
    `  Provider: ${config.provider}`,
    `  Model: ${config.model}`,
    `  API Key: ${apiKeyDisplay}`,
    config.baseUrl ? `  Base URL: ${config.baseUrl}` : '',
    '',
    'Generation Settings:',
    `  Max Tokens: ${config.maxTokens}`,
    `  Temperature: ${config.temperature}`,
    `  Timeout: ${config.timeout}s`,
    '',
    'Performance:',
    `  Streaming: ${config.streaming ? 'Enabled' : 'Disabled'}`,
    `  Caching: ${config.caching ? 'Enabled' : 'Disabled'}`,
    `  Cache TTL: ${config.cacheTTL}s`,
    '',
    'Privacy Settings:',
    `  Send Cluster Metadata: ${config.privacy.sendClusterMetadata ? 'Yes' : 'No'}`,
    `  Send Resource Names: ${config.privacy.sendResourceNames ? 'Yes' : 'No'}`,
    `  Send Pod Names: ${config.privacy.sendPodNames ? 'Yes' : 'No'}`,
    `  Send Logs: ${config.privacy.sendLogs ? 'Yes' : 'No'}`,
    '',
    'Cost Tracking:',
    config.monthlyLimit ? `  Monthly Limit: $${config.monthlyLimit}` : '  Monthly Limit: Not set',
    `  Cost Alerts: ${config.costAlerts ? 'Enabled' : 'Disabled'}`,
    '',
    'Environment Variables:',
    '  ANTHROPIC_API_KEY or CLAUDE_API_KEY - Anthropic API key',
    '  OPENAI_API_KEY - OpenAI API key',
    '  AI_PROVIDER - Override provider (anthropic, openai, ollama)',
    '  AI_MODEL - Override model name'
  ]
    .filter(Boolean)
    .join('\n')
}

/**
 * Command handler for /ai config
 * Configure AI assistant settings
 */
async function aiConfigHandler(args: Arguments<ConfigOptions>): Promise<string> {
  const { parsedOptions } = args

  // Load current configuration
  let config = loadConfig()

  // Handle reset flag
  if (parsedOptions.reset) {
    config = getDefaultConfig()
    saveConfig(config)
    return 'AI configuration reset to defaults\n\n' + formatConfig(config)
  }

  // Handle show flag (default behavior if no other flags)
  const hasUpdateFlags =
    parsedOptions.provider ||
    parsedOptions.model ||
    parsedOptions['api-key'] ||
    parsedOptions['base-url'] ||
    parsedOptions['max-tokens'] ||
    parsedOptions.temperature !== undefined ||
    parsedOptions.streaming !== undefined ||
    parsedOptions.caching !== undefined

  if (parsedOptions.show || !hasUpdateFlags) {
    return formatConfig(config)
  }

  // Update configuration
  let updated = false

  if (parsedOptions.provider) {
    config.provider = parsedOptions.provider
    updated = true
  }

  if (parsedOptions.model) {
    config.model = parsedOptions.model
    updated = true
  }

  if (parsedOptions['api-key']) {
    config.apiKey = parsedOptions['api-key']
    updated = true
  }

  if (parsedOptions['base-url']) {
    config.baseUrl = parsedOptions['base-url']
    updated = true
  }

  if (parsedOptions['max-tokens']) {
    config.maxTokens = parsedOptions['max-tokens']
    updated = true
  }

  if (parsedOptions.temperature !== undefined) {
    const temp = parsedOptions.temperature
    if (temp < 0 || temp > 2) {
      throw new UsageError({ message: 'Temperature must be between 0 and 2' })
    }
    config.temperature = temp
    updated = true
  }

  if (parsedOptions.streaming !== undefined) {
    config.streaming = parsedOptions.streaming
    updated = true
  }

  if (parsedOptions.caching !== undefined) {
    config.caching = parsedOptions.caching
    updated = true
  }

  if (updated) {
    saveConfig(config)
    return 'AI configuration updated successfully\n\n' + formatConfig(config)
  }

  return formatConfig(config)
}

/**
 * Register the /ai config command
 */
export default async (registrar: Registrar) => {
  registrar.listen('/ai/config', aiConfigHandler, {
    usage: {
      command: 'config',
      docs: 'Configure AI assistant settings',
      example: 'ai config --provider anthropic --model claude-3-5-sonnet-20241022',
      optional: [
        {
          name: '--show',
          docs: 'Display current configuration (default)',
          boolean: true
        },
        {
          name: '--provider',
          docs: 'AI provider to use (anthropic, openai, azure, ollama, custom)'
        },
        {
          name: '--model',
          docs: 'Model name to use (e.g., claude-3-5-sonnet-20241022, gpt-4)'
        },
        {
          name: '--api-key',
          docs: 'API key for the AI provider (also configurable via environment variables)'
        },
        {
          name: '--base-url',
          docs: 'Base URL for the API (for custom endpoints or proxies)'
        },
        {
          name: '--max-tokens',
          docs: 'Maximum tokens for AI responses (default: 4096)'
        },
        {
          name: '--temperature',
          docs: 'Temperature for AI responses, 0-2 (default: 0.7). Lower is more deterministic'
        },
        {
          name: '--streaming',
          docs: 'Enable or disable streaming responses',
          boolean: true
        },
        {
          name: '--caching',
          docs: 'Enable or disable response caching',
          boolean: true
        },
        {
          name: '--reset',
          docs: 'Reset all settings to defaults',
          boolean: true
        }
      ]
    }
  })
}
