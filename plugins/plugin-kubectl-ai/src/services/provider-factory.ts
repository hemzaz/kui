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
import { OpenAIProvider } from './openai-provider'
import { AzureProvider } from './azure-provider'
import { OllamaProvider } from './ollama-provider'
import { AIProviderError, AIProviderErrorCode } from '../types/ai-types'

/**
 * Factory for creating AI provider instances
 */
export class ProviderFactory {
  private static instance: AIProvider | null = null
  private static lastConfig: AIConfig | null = null

  /**
   * Create or get AI provider instance
   * @param config - AI configuration
   * @returns AI provider instance
   */
  public static getProvider(config: AIConfig): AIProvider {
    // Return cached instance if config hasn't changed significantly
    if (
      this.instance &&
      this.lastConfig &&
      this.lastConfig.provider === config.provider &&
      this.lastConfig.apiKey === config.apiKey &&
      this.lastConfig.baseUrl === config.baseUrl &&
      this.lastConfig.model === config.model
    ) {
      return this.instance
    }

    // Create new provider based on config
    this.instance = this.createProvider(config)
    this.lastConfig = config
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
        return new OpenAIProvider(config)

      case 'azure':
        return new AzureProvider(config)

      case 'ollama':
        return new OllamaProvider(config)

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
    this.lastConfig = null
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
    return ['anthropic', 'openai', 'azure', 'ollama']
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
        return ['gpt-4-turbo', 'gpt-4-0125-preview', 'gpt-4', 'gpt-3.5-turbo', 'gpt-3.5-turbo-0125']
      case 'azure':
        return ['gpt-4', 'gpt-4-32k', 'gpt-4-turbo', 'gpt-35-turbo', 'gpt-35-turbo-16k']
      case 'ollama':
        return [
          'llama3.3:70b',
          'llama3.2:3b',
          'llama3.1:8b',
          'mistral:7b',
          'mixtral:8x7b',
          'codellama:13b',
          'qwen2.5:14b',
          'phi4:14b',
          'gemma2:9b'
        ]
      default:
        return []
    }
  }

  /**
   * Get provider description with setup instructions
   * @param providerName - Provider name
   * @returns Provider description
   */
  public static getProviderInfo(providerName: string): {
    name: string
    description: string
    setup: string
    cost: string
  } {
    switch (providerName) {
      case 'anthropic':
        return {
          name: 'Anthropic Claude',
          description: 'Claude AI models with strong reasoning and long context',
          setup: 'Set ANTHROPIC_API_KEY or CLAUDE_API_KEY environment variable',
          cost: 'Paid API - $3-15 per million tokens'
        }
      case 'openai':
        return {
          name: 'OpenAI GPT',
          description: 'GPT-4 and GPT-3.5 models from OpenAI',
          setup: 'Set OPENAI_API_KEY environment variable',
          cost: 'Paid API - $0.50-60 per million tokens'
        }
      case 'azure':
        return {
          name: 'Azure OpenAI',
          description: 'OpenAI models hosted on Azure with enterprise features',
          setup: 'Set AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_DEPLOYMENT_NAME',
          cost: 'Paid API - Similar to OpenAI pricing'
        }
      case 'ollama':
        return {
          name: 'Ollama (Local)',
          description: 'Run models locally with Ollama - no API costs',
          setup: 'Install Ollama and run: ollama serve && ollama pull <model>',
          cost: 'Free - runs locally (requires GPU/CPU resources)'
        }
      default:
        return {
          name: 'Unknown',
          description: 'Unknown provider',
          setup: 'Not available',
          cost: 'Unknown'
        }
    }
  }

  /**
   * Check if provider requires API key
   * @param providerName - Provider name
   * @returns True if API key is required
   */
  public static requiresApiKey(providerName: string): boolean {
    return providerName !== 'ollama'
  }

  /**
   * Check if provider is free (no API costs)
   * @param providerName - Provider name
   * @returns True if provider is free
   */
  public static isFreeProvider(providerName: string): boolean {
    return providerName === 'ollama'
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
