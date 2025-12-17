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

import type { AIConfig, ModelInfo } from '../types/ai-types'
import { getModelsForProvider } from './model-config-manager'

// Model lists are now loaded from configuration file (~/.kui/ai-models.json)
// Use model-config-manager.ts to update models at runtime

/**
 * Fetch available models from OpenAI API
 */
async function fetchOpenAIModels(apiKey: string, baseUrl?: string): Promise<ModelInfo[]> {
  try {
    const url = `${baseUrl || 'https://api.openai.com/v1'}/models`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.warn('Failed to fetch OpenAI models:', response.statusText)
      return getModelsForProvider('openai')
    }

    const data = await response.json()
    const gptModels = data.data
      .filter((model: any) => model.id.startsWith('gpt-') || model.id.startsWith('o'))
      .map((model: any) => ({
        id: model.id,
        name: model.id,
        description: `Created: ${new Date(model.created * 1000).toLocaleDateString()}`
      }))

    return gptModels.length > 0 ? gptModels : getModelsForProvider('openai')
  } catch (error) {
    console.warn('Error fetching OpenAI models:', error)
    return getModelsForProvider('openai')
  }
}

/**
 * Fetch available models from Ollama
 */
async function fetchOllamaModels(baseUrl?: string): Promise<ModelInfo[]> {
  try {
    const url = `${baseUrl || 'http://localhost:11434'}/api/tags`
    const response = await fetch(url)

    if (!response.ok) {
      console.warn('Failed to fetch Ollama models:', response.statusText)
      return getModelsForProvider('ollama')
    }

    const data = await response.json()
    const models =
      data.models?.map((model: any) => ({
        id: model.name,
        name: model.name,
        description: `Size: ${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB`
      })) || []

    return models.length > 0 ? models : getModelsForProvider('ollama')
  } catch (error) {
    console.warn('Error fetching Ollama models:', error)
    return getModelsForProvider('ollama')
  }
}

/**
 * Get available models for a provider
 *
 * @param provider - The AI provider
 * @param config - Optional config with API key for dynamic fetching
 * @returns Array of available models
 */
export async function getAvailableModels(
  provider: 'anthropic' | 'openai' | 'azure' | 'ollama',
  config?: AIConfig
): Promise<ModelInfo[]> {
  switch (provider) {
    case 'anthropic':
      // Anthropic doesn't have a public API to list models
      // Load from configuration file
      return getModelsForProvider('anthropic')

    case 'openai':
      // Try to fetch dynamically if API key provided
      if (config?.apiKey) {
        return await fetchOpenAIModels(config.apiKey, config.baseUrl)
      }
      // Fall back to configuration file
      return getModelsForProvider('openai')

    case 'azure':
      // Azure models depend on deployment
      // Load from configuration file
      return getModelsForProvider('azure')

    case 'ollama':
      // Try to fetch from local Ollama instance
      return await fetchOllamaModels(config?.baseUrl)

    default:
      return []
  }
}

/**
 * Get default/recommended model for a provider
 */
export function getDefaultModel(provider: 'anthropic' | 'openai' | 'azure' | 'ollama'): string {
  const models = getModelsForProvider(provider)

  // Find recommended model
  const recommended = models.find(m => m.recommended)
  if (recommended) {
    return recommended.id
  }

  // Fall back to first model if no recommended model
  return models[0]?.id || ''
}

/**
 * Get model display name
 */
export function getModelDisplayName(modelId: string): string {
  // Search through all provider models
  const providers: Array<'anthropic' | 'openai' | 'azure' | 'ollama'> = ['anthropic', 'openai', 'azure', 'ollama']

  for (const provider of providers) {
    const models = getModelsForProvider(provider)
    const model = models.find(m => m.id === modelId)
    if (model) {
      return model.name
    }
  }

  return modelId
}
