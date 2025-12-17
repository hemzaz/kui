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

import { homedir } from 'os'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import type { ModelConfiguration, ModelInfo } from '../types/ai-types'

/**
 * Default model configurations (fallback when no user config exists)
 */
const DEFAULT_MODELS: ModelConfiguration = {
  anthropic: [
    {
      id: 'claude-sonnet-4-5-20250929',
      name: 'Claude Sonnet 4.5',
      description: 'Latest and most capable model, excellent for complex Kubernetes tasks',
      contextWindow: 200000,
      recommended: true
    },
    {
      id: 'claude-opus-4-5-20251101',
      name: 'Claude Opus 4.5',
      description: 'Most powerful reasoning model, best for complex analysis',
      contextWindow: 200000
    },
    {
      id: 'claude-haiku-4-5-20251212',
      name: 'Claude Haiku 4.5',
      description: 'Fast and efficient, great for quick queries',
      contextWindow: 200000
    },
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet (Legacy)',
      description: 'Previous generation, still very capable',
      contextWindow: 200000
    },
    {
      id: 'claude-3-5-haiku-20241022',
      name: 'Claude 3.5 Haiku (Legacy)',
      description: 'Previous generation, fast and efficient',
      contextWindow: 200000
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus (Legacy)',
      description: 'Previous generation, powerful reasoning',
      contextWindow: 200000
    }
  ],
  openai: [
    {
      id: 'gpt-5.2',
      name: 'GPT-5.2',
      description: 'Latest and most advanced model, exceptional reasoning and knowledge',
      contextWindow: 200000,
      recommended: true
    },
    {
      id: 'o3',
      name: 'o3',
      description: 'Advanced reasoning model, excellent for complex problem solving',
      contextWindow: 128000
    },
    {
      id: 'o3-mini',
      name: 'o3 Mini',
      description: 'Fast reasoning model, optimized for speed',
      contextWindow: 128000
    },
    {
      id: 'o1',
      name: 'o1',
      description: 'Previous generation reasoning model',
      contextWindow: 128000
    },
    {
      id: 'o1-mini',
      name: 'o1 Mini',
      description: 'Smaller reasoning model, fast and efficient',
      contextWindow: 128000
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      description: 'Optimized GPT-4, balanced performance',
      contextWindow: 128000
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo (Legacy)',
      description: 'Previous generation GPT-4, optimized for speed',
      contextWindow: 128000
    },
    {
      id: 'gpt-4',
      name: 'GPT-4 (Legacy)',
      description: 'Original GPT-4',
      contextWindow: 8192
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'Fast and cost-effective, good for simple queries',
      contextWindow: 16384
    }
  ],
  azure: [
    {
      id: 'gpt-4',
      name: 'GPT-4 (Azure)',
      description: 'Deployed GPT-4 model',
      recommended: true
    },
    {
      id: 'gpt-35-turbo',
      name: 'GPT-3.5 Turbo (Azure)',
      description: 'Deployed GPT-3.5 model'
    }
  ],
  ollama: [
    {
      id: 'llama2',
      name: 'Llama 2',
      description: 'Open-source Llama 2 model',
      recommended: true
    },
    {
      id: 'codellama',
      name: 'Code Llama',
      description: 'Specialized for code generation'
    },
    {
      id: 'mistral',
      name: 'Mistral',
      description: 'Fast and capable open-source model'
    },
    {
      id: 'mixtral',
      name: 'Mixtral',
      description: 'Mixture-of-experts model'
    },
    {
      id: 'neural-chat',
      name: 'Neural Chat',
      description: 'Conversational AI model'
    }
  ],
  version: '1.0.0',
  lastUpdated: new Date().toISOString()
}

/**
 * Get the path to the model configuration file
 */
export function getModelConfigPath(): string {
  const configDir = join(homedir(), '.kui')
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
  }
  return join(configDir, 'ai-models.json')
}

/**
 * Load model configuration from file
 * Falls back to defaults if file doesn't exist or is invalid
 */
export function loadModelConfig(): ModelConfiguration {
  try {
    const configPath = getModelConfigPath()
    if (!existsSync(configPath)) {
      // No config file exists, create one with defaults
      saveModelConfig(DEFAULT_MODELS)
      return DEFAULT_MODELS
    }

    const content = readFileSync(configPath, 'utf-8')
    const config = JSON.parse(content) as ModelConfiguration

    // Validate config structure
    if (!config.anthropic || !config.openai || !config.azure || !config.ollama) {
      console.warn('Invalid model config structure, using defaults')
      return DEFAULT_MODELS
    }

    return config
  } catch (error) {
    console.error('Error loading model config:', error)
    return DEFAULT_MODELS
  }
}

/**
 * Save model configuration to file
 */
export function saveModelConfig(config: ModelConfiguration): void {
  try {
    const configPath = getModelConfigPath()
    const updatedConfig = {
      ...config,
      lastUpdated: new Date().toISOString()
    }
    writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving model config:', error)
    throw new Error('Failed to save model configuration')
  }
}

/**
 * Get models for a specific provider
 */
export function getModelsForProvider(provider: 'anthropic' | 'openai' | 'azure' | 'ollama'): ModelInfo[] {
  const config = loadModelConfig()
  return config[provider] || []
}

/**
 * Update models for a specific provider
 */
export function updateProviderModels(provider: 'anthropic' | 'openai' | 'azure' | 'ollama', models: ModelInfo[]): void {
  const config = loadModelConfig()
  config[provider] = models
  saveModelConfig(config)
}

/**
 * Add a model to a provider
 */
export function addModel(provider: 'anthropic' | 'openai' | 'azure' | 'ollama', model: ModelInfo): void {
  const config = loadModelConfig()
  const models = config[provider]

  // Check if model already exists
  const existingIndex = models.findIndex(m => m.id === model.id)
  if (existingIndex !== -1) {
    // Update existing model
    models[existingIndex] = model
  } else {
    // Add new model
    models.push(model)
  }

  config[provider] = models
  saveModelConfig(config)
}

/**
 * Remove a model from a provider
 */
export function removeModel(provider: 'anthropic' | 'openai' | 'azure' | 'ollama', modelId: string): void {
  const config = loadModelConfig()
  config[provider] = config[provider].filter(m => m.id !== modelId)
  saveModelConfig(config)
}

/**
 * Reset to default models for a provider
 */
export function resetProviderToDefaults(provider: 'anthropic' | 'openai' | 'azure' | 'ollama'): void {
  const config = loadModelConfig()
  config[provider] = DEFAULT_MODELS[provider]
  saveModelConfig(config)
}

/**
 * Reset all providers to defaults
 */
export function resetAllToDefaults(): void {
  saveModelConfig(DEFAULT_MODELS)
}

/**
 * Validate model information
 */
export function validateModel(model: ModelInfo): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!model.id || model.id.trim() === '') {
    errors.push('Model ID is required')
  }

  if (!model.name || model.name.trim() === '') {
    errors.push('Model name is required')
  }

  if (model.contextWindow !== undefined && model.contextWindow <= 0) {
    errors.push('Context window must be a positive number')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Export configuration for backup
 */
export function exportConfig(): string {
  const config = loadModelConfig()
  return JSON.stringify(config, null, 2)
}

/**
 * Import configuration from backup
 */
export function importConfig(jsonString: string): void {
  try {
    const config = JSON.parse(jsonString) as ModelConfiguration

    // Validate structure
    if (!config.anthropic || !config.openai || !config.azure || !config.ollama) {
      throw new Error('Invalid configuration structure')
    }

    saveModelConfig(config)
  } catch (error) {
    console.error('Error importing config:', error)
    throw new Error('Failed to import configuration: ' + (error as Error).message)
  }
}
