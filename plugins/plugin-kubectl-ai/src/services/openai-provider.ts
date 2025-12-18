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

import OpenAI from 'openai'
import type { AICompletionRequest, AIResponse, AIChunk, AIConfig } from '../types/ai-types'
import { AIProviderError, AIProviderErrorCode } from '../types/ai-types'
import type { ClusterSnapshot } from '../types/cluster-types'
import { BaseAIProvider } from './ai-provider'

/**
 * OpenAI GPT provider implementation
 */
export class OpenAIProvider extends BaseAIProvider {
  public name = 'openai'
  public models = [
    'gpt-5.2',
    'o3',
    'o3-mini',
    'o1',
    'o1-mini',
    'gpt-4o',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-3.5-turbo'
  ]

  private client: OpenAI
  private config: AIConfig

  public constructor(config: AIConfig) {
    super()
    this.config = config

    const apiKey = config.apiKey || process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new AIProviderError(
        'OpenAI API key not configured. Set OPENAI_API_KEY environment variable.',
        AIProviderErrorCode.INVALID_API_KEY
      )
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeout * 1000,
      maxRetries: 2
    })
  }

  /**
   * Stream completion with real-time chunks
   */
  public async *streamCompletion(request: AICompletionRequest): AsyncIterable<AIChunk> {
    const startTime = Date.now()
    let inputTokens = 0
    let outputTokens = 0

    try {
      const stream = await this.client.chat.completions.create({
        model: request.model || this.config.model,
        max_tokens: request.maxTokens || this.config.maxTokens,
        temperature: request.temperature ?? this.config.temperature,
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
        stream_options: { include_usage: true }
      })

      // Yield chunks as they arrive
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content
        if (delta) {
          outputTokens += this.estimateTokens(delta)
          yield {
            delta,
            done: false
          }
        }

        // OpenAI includes usage in the last chunk when stream_options.include_usage is true
        if (chunk.usage) {
          inputTokens = chunk.usage.prompt_tokens
          outputTokens = chunk.usage.completion_tokens
        }
      }

      const latency = Date.now() - startTime
      const cost = this.calculateCost(request.model || this.config.model, inputTokens, outputTokens)

      // Log usage for cost tracking
      this.logUsage({
        inputTokens,
        outputTokens,
        latency,
        cost
      })

      // Final chunk with usage
      yield {
        delta: '',
        done: true,
        usage: {
          inputTokens,
          outputTokens
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
      const tools = request.tools?.map(tool => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }
      }))

      const response = await this.client.chat.completions.create({
        model: request.model || this.config.model,
        max_tokens: request.maxTokens || this.config.maxTokens,
        temperature: request.temperature ?? this.config.temperature,
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
        tools
      })

      const latency = Date.now() - startTime
      const content = response.choices[0]?.message?.content || ''
      const inputTokens = response.usage?.prompt_tokens || 0
      const outputTokens = response.usage?.completion_tokens || 0

      const aiResponse: AIResponse = {
        content,
        model: response.model,
        usage: {
          inputTokens,
          outputTokens
        },
        cost: this.calculateCost(response.model, inputTokens, outputTokens),
        latency
      }

      // Log usage
      this.logUsage({
        inputTokens,
        outputTokens,
        latency,
        cost: aiResponse.cost
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
      await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'test' }]
      })
      return { success: true }
    } catch (error) {
      const err = error as Error
      return {
        success: false,
        error: err.message || 'Connection failed'
      }
    }
  }

  /**
   * Estimate cost for a request
   */
  public estimateCost(request: AICompletionRequest): number {
    const model = request.model || this.config.model
    const inputTokens = this.estimateTokens(request.prompt + (request.systemPrompt || ''))
    const outputTokens = request.maxTokens || this.config.maxTokens

    return this.calculateCost(model, inputTokens, outputTokens)
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
   * Calculate cost based on token usage and model
   * Pricing as of December 2024
   */
  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    let inputCostPerMillion = 0
    let outputCostPerMillion = 0

    // Pricing based on OpenAI's published rates
    if (model.includes('gpt-4-turbo')) {
      inputCostPerMillion = 10.0
      outputCostPerMillion = 30.0
    } else if (model.includes('gpt-4')) {
      inputCostPerMillion = 30.0
      outputCostPerMillion = 60.0
    } else if (model.includes('gpt-3.5-turbo')) {
      inputCostPerMillion = 0.5
      outputCostPerMillion = 1.5
    } else {
      // Default to gpt-4-turbo pricing
      inputCostPerMillion = 10.0
      outputCostPerMillion = 30.0
    }

    const inputCost = (inputTokens / 1_000_000) * inputCostPerMillion
    const outputCost = (outputTokens / 1_000_000) * outputCostPerMillion

    return inputCost + outputCost
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: unknown): AIProviderError {
    // OpenAI SDK errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return new AIProviderError('Invalid API key', AIProviderErrorCode.INVALID_API_KEY, error)
      }

      if (error.status === 429) {
        return new AIProviderError('Rate limit exceeded', AIProviderErrorCode.RATE_LIMIT, error)
      }

      if (error.status && error.status >= 400 && error.status < 500) {
        return new AIProviderError(error.message || 'Invalid request', AIProviderErrorCode.INVALID_REQUEST, error)
      }

      return new AIProviderError(error.message || 'API error', AIProviderErrorCode.UNKNOWN_ERROR, error)
    }

    const err = error as Record<string, unknown>

    if (err.name === 'AbortError' || err.code === 'ETIMEDOUT') {
      return new AIProviderError('Request timeout', AIProviderErrorCode.TIMEOUT, err)
    }

    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      return new AIProviderError('Network error', AIProviderErrorCode.NETWORK_ERROR, err)
    }

    return new AIProviderError((err.message as string) || 'Unknown error', AIProviderErrorCode.UNKNOWN_ERROR, err)
  }
}
