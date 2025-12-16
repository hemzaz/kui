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

import type { AIProvider, AIConfig } from '../types/ai-types'
import { AnthropicProvider } from './anthropic-provider'
import { AIProviderError, AIProviderErrorCode } from '../types/ai-types'

/**
 * Factory for creating AI provider instances
 */
export class ProviderFactory {
  private static instance: AIProvider | null = null

  /**
   * Create or get AI provider instance
   * @param config - AI configuration
   * @returns AI provider instance
   */
  public static getProvider(config: AIConfig): AIProvider {
    // Return cached instance if config hasn't changed
    if (this.instance && this.instance.name === config.provider) {
      return this.instance
    }

    // Create new provider based on config
    this.instance = this.createProvider(config)
    return this.instance
  }

  /**
   * Create a new provider instance
   * @param config - AI configuration
   * @returns AI provider instance
   */
  private static createProvider(config: AIConfig): AIProvider {
    switch (config.provider) {
      case 'anthropic':
        return new AnthropicProvider(config)

      case 'openai':
        throw new AIProviderError('OpenAI provider not yet implemented', AIProviderErrorCode.INVALID_REQUEST)

      case 'azure':
        throw new AIProviderError('Azure OpenAI provider not yet implemented', AIProviderErrorCode.INVALID_REQUEST)

      case 'ollama':
        throw new AIProviderError('Ollama provider not yet implemented', AIProviderErrorCode.INVALID_REQUEST)

      case 'custom':
        throw new AIProviderError('Custom provider not yet implemented', AIProviderErrorCode.INVALID_REQUEST)

      default:
        throw new AIProviderError(`Unknown provider: ${config.provider}`, AIProviderErrorCode.INVALID_REQUEST)
    }
  }

  /**
   * Clear cached provider instance
   */
  public static clearCache(): void {
    this.instance = null
  }

  /**
   * Test provider connection
   * @param config - AI configuration
   * @returns Test result
   */
  public static async testProvider(config: AIConfig): Promise<{ success: boolean; error?: string }> {
    try {
      const provider = this.createProvider(config)
      return await provider.testConnection()
    } catch (error) {
      const err = error as Error
      return {
        success: false,
        error: err.message || 'Failed to create provider'
      }
    }
  }

  /**
   * Get list of supported providers
   * @returns List of provider names
   */
  public static getSupportedProviders(): string[] {
    return ['anthropic'] // Add more as they're implemented
  }

  /**
   * Get default models for a provider
   * @param providerName - Provider name
   * @returns List of model names
   */
  public static getDefaultModels(providerName: string): string[] {
    switch (providerName) {
      case 'anthropic':
        return ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229']
      case 'openai':
        return ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo']
      case 'azure':
        return ['gpt-4', 'gpt-35-turbo']
      case 'ollama':
        return ['llama2', 'mistral', 'codellama']
      default:
        return []
    }
  }
}

/**
 * Helper function to create provider with default config
 * @param providerName - Provider name
 * @param apiKey - API key
 * @returns AI provider instance
 */
export function createProvider(providerName: string, apiKey?: string): AIProvider {
  const config: AIConfig = {
    provider: providerName as 'anthropic' | 'openai' | 'azure' | 'ollama' | 'custom',
    apiKey,
    model: ProviderFactory.getDefaultModels(providerName)[0],
    maxTokens: 4096,
    temperature: 0.7,
    timeout: 30,
    privacy: {
      sendClusterMetadata: true,
      sendResourceNames: true,
      sendLogs: false,
      sendPodNames: false
    },
    streaming: true,
    caching: true,
    cacheTTL: 300,
    costAlerts: true
  }

  return ProviderFactory.getProvider(config)
}
