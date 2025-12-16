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

import { AppConfig } from './types'

/**
 * Default configuration values
 * These are used as fallbacks when no other configuration is provided
 */
export const DEFAULT_CONFIG: AppConfig = {
  version: '1.0.0',

  ai: {
    enabled: false,
    providers: {
      openai: {
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
        enabled: false
      },
      anthropic: {
        name: 'Anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        model: 'claude-3-5-sonnet-20241022',
        enabled: false
      }
    },
    defaultProvider: 'anthropic'
  },

  logging: {
    level: 'info',
    console: true
  },

  features: {
    aiAssist: false,
    analytics: false,
    telemetry: false,
    experimentalCommands: false
  },

  ui: {
    theme: 'default',
    fontSize: 14,
    tabSize: 2
  },

  performance: {
    cacheEnabled: true,
    cacheTTL: 3600000, // 1 hour in milliseconds
    maxConcurrentRequests: 5
  }
}

/**
 * Get a nested value from an object using dot notation
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined
  }, obj)
}

/**
 * Set a nested value in an object using dot notation
 */
export function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.')
  const lastKey = keys.pop()

  if (!lastKey) {
    return
  }

  const target = keys.reduce((current: Record<string, unknown>, key: string) => {
    if (!(key in current)) {
      current[key] = {}
    }
    return current[key] as Record<string, unknown>
  }, obj)

  target[lastKey] = value
}

/**
 * Deep merge two objects
 */
export function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target }

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key]
      const targetValue = result[key]

      if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
        if (targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
          result[key] = deepMerge(
            targetValue as Record<string, unknown>,
            sourceValue as Record<string, unknown>
          ) as T[Extract<keyof T, string>]
        } else {
          result[key] = sourceValue as T[Extract<keyof T, string>]
        }
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>]
      }
    }
  }

  return result
}
