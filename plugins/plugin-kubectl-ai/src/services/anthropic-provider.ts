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

import Anthropic from '@anthropic-ai/sdk'
import type { AICompletionRequest, AIResponse, AIChunk, AIConfig } from '../types/ai-types'
import { AIProviderError, AIProviderErrorCode } from '../types/ai-types'
import type { ClusterSnapshot } from '../types/cluster-types'
import { BaseAIProvider } from './ai-provider'

/**
 * Anthropic Claude AI provider implementation
 */
export class AnthropicProvider extends BaseAIProvider {
  public name = 'anthropic'
  public models = ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229']

  private client: Anthropic
  private config: AIConfig

  public constructor(config: AIConfig) {
    super()
    this.config = config

    const apiKey = config.apiKey || process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new AIProviderError(
        'Anthropic API key not configured. Set ANTHROPIC_API_KEY or CLAUDE_API_KEY environment variable.',
        AIProviderErrorCode.INVALID_API_KEY
      )
    }

    this.client = new Anthropic({
      apiKey,
      baseURL: config.baseUrl,
      timeout: config.timeout * 1000,
      maxRetries: 2
    })
  }

  /**
   * Stream completion with real-time chunks
   */
  public async *streamCompletion(request: AICompletionRequest): AsyncIterator<AIChunk> {
    const startTime = Date.now()

    try {
      const stream = await this.client.messages.stream({
        model: request.model || this.config.model,
        max_tokens: request.maxTokens || this.config.maxTokens,
        temperature: request.temperature ?? this.config.temperature,
        system: request.systemPrompt || this.buildSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: this.buildPrompt(request)
          }
        ]
      })

      // Yield chunks as they arrive
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield {
            delta: chunk.delta.text,
            done: false
          }
        }
      }

      // Get final message for usage stats
      const finalMessage = await stream.finalMessage()
      const latency = Date.now() - startTime

      // Log usage for cost tracking
      this.logUsage({
        inputTokens: finalMessage.usage.input_tokens,
        outputTokens: finalMessage.usage.output_tokens,
        latency,
        cost: this.calculateCost(finalMessage.usage)
      })

      // Final chunk with usage
      yield {
        delta: '',
        done: true,
        usage: {
          inputTokens: finalMessage.usage.input_tokens,
          outputTokens: finalMessage.usage.output_tokens
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
        name: tool.name,
        description: tool.description,
        input_schema: {
          type: 'object' as const,
          ...(tool.parameters as Record<string, unknown>)
        }
      }))

      const response = await this.client.messages.create({
        model: request.model || this.config.model,
        max_tokens: request.maxTokens || this.config.maxTokens,
        temperature: request.temperature ?? this.config.temperature,
        system: request.systemPrompt || this.buildSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: this.buildPrompt(request)
          }
        ],
        tools
      })

      const latency = Date.now() - startTime
      const content =
        response.content[0].type === 'text' ? response.content[0].text : JSON.stringify(response.content[0])

      const aiResponse: AIResponse = {
        content,
        model: response.model,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens
        },
        cost: this.calculateCost(response.usage),
        latency
      }

      // Log usage
      this.logUsage({
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
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
      await this.client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 10,
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
    const inputTokens = this.estimateTokens(request.prompt + (request.systemPrompt || ''))
    const outputTokens = request.maxTokens || this.config.maxTokens

    return this.calculateCost({
      input_tokens: inputTokens,
      output_tokens: outputTokens
    })
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
   * Calculate cost based on token usage
   * Pricing as of December 2024
   */
  private calculateCost(usage: { input_tokens: number; output_tokens: number }): number {
    // Claude 3.5 Sonnet pricing (as of Dec 2024)
    const INPUT_COST_PER_MILLION = 3.0
    const OUTPUT_COST_PER_MILLION = 15.0

    const inputCost = (usage.input_tokens / 1_000_000) * INPUT_COST_PER_MILLION
    const outputCost = (usage.output_tokens / 1_000_000) * OUTPUT_COST_PER_MILLION

    return inputCost + outputCost
  }

  /**
   * Handle and transform errors
   */
  private handleError(error: unknown): AIProviderError {
    const err = error as Record<string, unknown>

    if (err.status === 401) {
      return new AIProviderError('Invalid API key', AIProviderErrorCode.INVALID_API_KEY, err)
    }

    if (err.status === 429) {
      return new AIProviderError('Rate limit exceeded', AIProviderErrorCode.RATE_LIMIT, err)
    }

    if (err.name === 'AbortError' || err.code === 'ETIMEDOUT') {
      return new AIProviderError('Request timeout', AIProviderErrorCode.TIMEOUT, err)
    }

    if (err.status && (err.status as number) >= 400 && (err.status as number) < 500) {
      return new AIProviderError((err.message as string) || 'Invalid request', AIProviderErrorCode.INVALID_REQUEST, err)
    }

    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      return new AIProviderError('Network error', AIProviderErrorCode.NETWORK_ERROR, err)
    }

    return new AIProviderError((err.message as string) || 'Unknown error', AIProviderErrorCode.UNKNOWN_ERROR, err)
  }
}
