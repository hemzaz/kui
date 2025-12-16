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

import type { AICompletionRequest, AIResponse, AIChunk, AIConfig } from '../types/ai-types'
import { AIProviderError, AIProviderErrorCode } from '../types/ai-types'
import type { ClusterSnapshot } from '../types/cluster-types'
import { BaseAIProvider } from './ai-provider'

/**
 * Ollama response type for streaming
 */
interface OllamaStreamChunk {
  model: string
  created_at: string
  message?: {
    role: string
    content: string
  }
  done: boolean
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

/**
 * Ollama response type for non-streaming
 */
interface OllamaResponse {
  model: string
  created_at: string
  message: {
    role: string
    content: string
  }
  done: boolean
  total_duration: number
  load_duration: number
  prompt_eval_count: number
  prompt_eval_duration: number
  eval_count: number
  eval_duration: number
}

/**
 * Ollama local AI provider implementation
 * Ollama runs models locally without API costs
 */
export class OllamaProvider extends BaseAIProvider {
  public name = 'ollama'
  public models = [
    'llama3.3:70b',
    'llama3.2:3b',
    'llama3.1:8b',
    'llama2:13b',
    'mistral:7b',
    'mixtral:8x7b',
    'codellama:13b',
    'qwen2.5:14b',
    'phi4:14b',
    'gemma2:9b'
  ]

  private config: AIConfig
  private baseUrl: string

  public constructor(config: AIConfig) {
    super()
    this.config = config
    this.baseUrl = config.baseUrl || process.env.OLLAMA_HOST || 'http://localhost:11434'
  }

  /**
   * Stream completion with real-time chunks
   */
  public async *streamCompletion(request: AICompletionRequest): AsyncIterator<AIChunk> {
    const startTime = Date.now()
    let promptTokens = 0
    let completionTokens = 0

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: request.model || this.config.model,
          messages: [
            {
              role: 'system',
              content: request.systemPrompt || this.buildSystemPrompt()
            },
            {
              role: 'user',
              content: this.buildPrompt(request)
            }
          ],
          stream: true,
          options: {
            temperature: request.temperature ?? this.config.temperature,
            num_predict: request.maxTokens || this.config.maxTokens
          }
        }),
        signal: AbortSignal.timeout(this.config.timeout * 1000)
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body from Ollama')
      }

      // Process streaming response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          try {
            const chunk: OllamaStreamChunk = JSON.parse(line)

            if (chunk.message?.content) {
              yield {
                delta: chunk.message.content,
                done: false
              }
            }

            if (chunk.done) {
              promptTokens = chunk.prompt_eval_count || 0
              completionTokens = chunk.eval_count || 0
            }
          } catch (parseError) {
            console.error('Failed to parse Ollama chunk:', parseError)
          }
        }
      }

      const latency = Date.now() - startTime

      // Log usage for tracking (no cost for local models)
      this.logUsage({
        inputTokens: promptTokens,
        outputTokens: completionTokens,
        latency,
        cost: 0
      })

      // Final chunk with usage
      yield {
        delta: '',
        done: true,
        usage: {
          inputTokens: promptTokens,
          outputTokens: completionTokens
        }
      }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Complete request and return full response
   */
  public async complete(request: AICompletionRequest): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: request.model || this.config.model,
          messages: [
            {
              role: 'system',
              content: request.systemPrompt || this.buildSystemPrompt()
            },
            {
              role: 'user',
              content: this.buildPrompt(request)
            }
          ],
          stream: false,
          options: {
            temperature: request.temperature ?? this.config.temperature,
            num_predict: request.maxTokens || this.config.maxTokens
          }
        }),
        signal: AbortSignal.timeout(this.config.timeout * 1000)
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
      }

      const data: OllamaResponse = await response.json()
      const latency = Date.now() - startTime

      const aiResponse: AIResponse = {
        content: data.message.content,
        model: data.model,
        usage: {
          inputTokens: data.prompt_eval_count || 0,
          outputTokens: data.eval_count || 0
        },
        cost: 0, // Local models have no cost
        latency
      }

      // Log usage
      this.logUsage({
        inputTokens: aiResponse.usage.inputTokens,
        outputTokens: aiResponse.usage.outputTokens,
        latency,
        cost: 0
      })

      return aiResponse
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Test API connection with minimal request
   */
  public async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // First check if Ollama is running
      const versionResponse = await fetch(`${this.baseUrl}/api/version`, {
        signal: AbortSignal.timeout(5000)
      })

      if (!versionResponse.ok) {
        return {
          success: false,
          error: 'Ollama server not responding'
        }
      }

      // Check if the model is available
      const model = this.config.model || this.models[0]
      const listResponse = await fetch(`${this.baseUrl}/api/tags`)

      if (listResponse.ok) {
        const data = await listResponse.json()
        const modelExists = data.models?.some((m: { name: string }) => m.name.startsWith(model.split(':')[0]))

        if (!modelExists) {
          return {
            success: false,
            error: `Model ${model} not found. Run: ollama pull ${model}`
          }
        }
      }

      // Test with a minimal request
      const testResponse = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'test' }],
          stream: false,
          options: {
            num_predict: 5
          }
        }),
        signal: AbortSignal.timeout(10000)
      })

      if (!testResponse.ok) {
        return {
          success: false,
          error: `Model ${model} failed to respond`
        }
      }

      return { success: true }
    } catch (error) {
      const err = error as Error
      return {
        success: false,
        error: err.message || 'Connection failed. Is Ollama running?'
      }
    }
  }

  /**
   * Estimate cost for a request (always 0 for local models)
   */
  public estimateCost(_request: AICompletionRequest): number {
    return 0 // Ollama runs locally with no API costs
  }

  /**
   * Build complete prompt with context
   */
  private buildPrompt(request: AICompletionRequest): string {
    let prompt = request.prompt

    // Add cluster context if available
    if (request.clusterData) {
      prompt = this.enrichPromptWithContext(prompt, request.clusterData)
    }

    return prompt
  }

  /**
   * Enrich prompt with cluster context
   */
  private enrichPromptWithContext(prompt: string, context: ClusterSnapshot): string {
    const parts: string[] = []

    parts.push('**Current Cluster Context:**')
    parts.push(`- Cluster: ${context.cluster.name} (${context.cluster.version})`)
    parts.push(`- Namespace: ${context.namespace.name}`)
    parts.push(
      `- Resources: ${context.namespace.resourceCounts.pods} pods, ${context.namespace.resourceCounts.services} services`
    )

    if (context.currentResource) {
      parts.push('')
      parts.push('**Current Resource:**')
      parts.push(`- Type: ${context.currentResource.kind}`)
      parts.push(`- Name: ${context.currentResource.name}`)

      if (context.currentResource.status) {
        parts.push(`- Status: ${JSON.stringify(context.currentResource.status, null, 2)}`)
      }

      if (context.currentResource.events?.length) {
        parts.push('- Recent Events:')
        context.currentResource.events.forEach(e => {
          parts.push(`  • [${e.type}] ${e.reason}: ${e.message}`)
        })
      }

      if (context.currentResource.logs?.length) {
        parts.push('- Recent Logs (last 20 lines):')
        parts.push('```')
        parts.push(context.currentResource.logs.slice(-20).join('\n'))
        parts.push('```')
      }
    }

    parts.push('')
    parts.push('**User Question:**')
    parts.push(prompt)

    return parts.join('\n')
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: unknown): AIProviderError {
    const err = error as Error & { code?: string; cause?: { code?: string } }

    // Timeout errors
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      return new AIProviderError(
        'Request timeout. The model might be loading or too slow.',
        AIProviderErrorCode.TIMEOUT,
        err
      )
    }

    // Network errors
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED' || err.cause?.code === 'ECONNREFUSED') {
      return new AIProviderError(
        'Cannot connect to Ollama. Ensure Ollama is running: ollama serve',
        AIProviderErrorCode.NETWORK_ERROR,
        err
      )
    }

    // Model not found
    if (err.message.includes('model') && err.message.includes('not found')) {
      return new AIProviderError(
        `Model not found. Download it with: ollama pull ${this.config.model}`,
        AIProviderErrorCode.INVALID_REQUEST,
        err
      )
    }

    return new AIProviderError(err.message || 'Unknown error', AIProviderErrorCode.UNKNOWN_ERROR, err)
  }
}
