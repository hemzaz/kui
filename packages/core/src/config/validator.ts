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

import { AppConfig, AIProviderConfig, ValidationResult } from './types'

/**
 * JSON Schema for AppConfig validation
 */
const CONFIG_SCHEMA = {
  type: 'object',
  properties: {
    version: { type: 'string' },
    ai: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        providers: { type: 'object' },
        defaultProvider: { type: 'string' }
      },
      required: ['enabled', 'providers']
    },
    logging: {
      type: 'object',
      properties: {
        level: { type: 'string', enum: ['debug', 'info', 'warn', 'error'] },
        file: { type: 'string' },
        console: { type: 'boolean' }
      },
      required: ['level', 'console']
    },
    features: { type: 'object' },
    ui: {
      type: 'object',
      properties: {
        theme: { type: 'string' },
        fontSize: { type: 'number', minimum: 8, maximum: 32 },
        tabSize: { type: 'number', minimum: 1, maximum: 8 }
      }
    },
    performance: {
      type: 'object',
      properties: {
        cacheEnabled: { type: 'boolean' },
        cacheTTL: { type: 'number', minimum: 0 },
        maxConcurrentRequests: { type: 'number', minimum: 1, maximum: 50 }
      },
      required: ['cacheEnabled', 'cacheTTL', 'maxConcurrentRequests']
    }
  },
  required: ['version', 'ai', 'logging', 'features', 'ui', 'performance']
}

/**
 * Simple schema validator (without external dependencies)
 */
function validateSchema(data: unknown, schema: Record<string, unknown>, path = ''): string[] {
  const errors: string[] = []

  if (schema.type === 'object') {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      errors.push(`${path || 'root'}: Expected object, got ${typeof data}`)
      return errors
    }

    const dataObj = data as Record<string, unknown>
    const properties = schema.properties as Record<string, Record<string, unknown>> | undefined
    const required = schema.required as string[] | undefined

    if (required) {
      for (const key of required) {
        if (!(key in dataObj)) {
          errors.push(`${path}.${key}: Required property missing`)
        }
      }
    }

    if (properties) {
      for (const [key, propSchema] of Object.entries(properties)) {
        if (key in dataObj) {
          const propPath = path ? `${path}.${key}` : key
          errors.push(...validateSchema(dataObj[key], propSchema, propPath))
        }
      }
    }
  } else if (schema.type === 'string') {
    if (typeof data !== 'string') {
      errors.push(`${path}: Expected string, got ${typeof data}`)
    } else if (schema.enum && Array.isArray(schema.enum)) {
      if (!schema.enum.includes(data)) {
        errors.push(`${path}: Value "${data}" not in allowed values: ${schema.enum.join(', ')}`)
      }
    }
  } else if (schema.type === 'number') {
    if (typeof data !== 'number') {
      errors.push(`${path}: Expected number, got ${typeof data}`)
    } else {
      const min = schema.minimum as number | undefined
      const max = schema.maximum as number | undefined
      if (min !== undefined && data < min) {
        errors.push(`${path}: Value ${data} is less than minimum ${min}`)
      }
      if (max !== undefined && data > max) {
        errors.push(`${path}: Value ${data} is greater than maximum ${max}`)
      }
    }
  } else if (schema.type === 'boolean') {
    if (typeof data !== 'boolean') {
      errors.push(`${path}: Expected boolean, got ${typeof data}`)
    }
  }

  return errors
}

/**
 * Validate API key format
 */
function validateApiKey(key: string, provider: string): string | null {
  if (!key || key.trim().length === 0) {
    return `${provider}: API key is empty`
  }

  // Basic format validation
  if (key.length < 10) {
    return `${provider}: API key is too short (minimum 10 characters)`
  }

  // Check for placeholder values
  const placeholders = ['your-api-key', 'xxx', 'placeholder', 'changeme', 'example']
  if (placeholders.some(p => key.toLowerCase().includes(p))) {
    return `${provider}: API key appears to be a placeholder value`
  }

  return null
}

/**
 * Validate AI provider configuration
 */
function validateAIProvider(provider: AIProviderConfig, name: string): string[] {
  const errors: string[] = []

  if (!provider.name) {
    errors.push(`${name}: Provider name is required`)
  }

  if (provider.enabled && !provider.apiKey) {
    errors.push(`${name}: API key is required when provider is enabled`)
  }

  if (provider.apiKey) {
    const keyError = validateApiKey(provider.apiKey, name)
    if (keyError) {
      errors.push(keyError)
    }
  }

  if (provider.baseUrl) {
    try {
      new URL(provider.baseUrl)
    } catch {
      errors.push(`${name}: Invalid base URL format`)
    }
  }

  return errors
}

/**
 * Validate complete application configuration
 */
export function validateConfig(config: AppConfig): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Schema validation
  errors.push(...validateSchema(config, CONFIG_SCHEMA))

  // AI providers validation
  if (config.ai.enabled) {
    let hasEnabledProvider = false

    for (const [providerName, provider] of Object.entries(config.ai.providers)) {
      if (provider && typeof provider === 'object' && 'enabled' in provider) {
        const providerConfig = provider as AIProviderConfig
        errors.push(...validateAIProvider(providerConfig, providerName))

        if (providerConfig.enabled) {
          hasEnabledProvider = true
        }
      }
    }

    if (!hasEnabledProvider) {
      warnings.push('AI is enabled but no providers are enabled')
    }

    // Validate default provider
    if (config.ai.defaultProvider) {
      const defaultProvider = config.ai.providers[config.ai.defaultProvider] as AIProviderConfig | undefined
      if (!defaultProvider) {
        errors.push(`Default AI provider "${config.ai.defaultProvider}" is not configured`)
      } else if (!defaultProvider.enabled) {
        warnings.push(`Default AI provider "${config.ai.defaultProvider}" is not enabled`)
      }
    }
  }

  // Logging validation
  if (config.logging.file) {
    if (config.logging.file.trim().length === 0) {
      errors.push('Logging file path is empty')
    }
  }

  // Performance validation
  if (config.performance.cacheTTL < 0) {
    errors.push('Cache TTL cannot be negative')
  }

  if (config.performance.maxConcurrentRequests < 1) {
    errors.push('Max concurrent requests must be at least 1')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate partial configuration (for updates)
 */
export function validatePartialConfig(config: Partial<AppConfig>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate only provided fields
  if (config.logging) {
    if (config.logging.level && !['debug', 'info', 'warn', 'error'].includes(config.logging.level)) {
      errors.push(`Invalid logging level: ${config.logging.level}`)
    }
  }

  if (config.ui) {
    if (config.ui.fontSize !== undefined && (config.ui.fontSize < 8 || config.ui.fontSize > 32)) {
      errors.push('Font size must be between 8 and 32')
    }

    if (config.ui.tabSize !== undefined && (config.ui.tabSize < 1 || config.ui.tabSize > 8)) {
      errors.push('Tab size must be between 1 and 8')
    }
  }

  if (config.performance) {
    if (config.performance.cacheTTL !== undefined && config.performance.cacheTTL < 0) {
      errors.push('Cache TTL cannot be negative')
    }

    if (
      config.performance.maxConcurrentRequests !== undefined &&
      (config.performance.maxConcurrentRequests < 1 || config.performance.maxConcurrentRequests > 50)
    ) {
      errors.push('Max concurrent requests must be between 1 and 50')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Sanitize sensitive configuration data for logging
 */
export function sanitizeConfig(config: AppConfig): AppConfig {
  const sanitized = JSON.parse(JSON.stringify(config)) as AppConfig

  // Mask API keys
  for (const [, provider] of Object.entries(sanitized.ai.providers)) {
    if (provider && typeof provider === 'object' && 'apiKey' in provider && provider.apiKey) {
      const key = provider.apiKey as string
      provider.apiKey = key.length > 8 ? `${key.substring(0, 4)}...${key.substring(key.length - 4)}` : '***'
    }
  }

  return sanitized
}
