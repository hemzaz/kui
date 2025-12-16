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

import { describe, it, expect, jest } from '@jest/globals'
import { BaseAIProvider } from '../../src/services/ai-provider'
import type { AICompletionRequest, AIResponse, AIChunk } from '../../src/types/ai-types'
import { createMockCompletionRequest } from '../helpers/test-utils'

/**
 * Concrete implementation of BaseAIProvider for testing
 */
class TestAIProvider extends BaseAIProvider {
  name = 'test-provider'
  models = ['test-model-1', 'test-model-2']

  async *streamCompletion(request: AICompletionRequest): AsyncIterator<AIChunk> {
    yield { delta: 'Test ', done: false }
    yield { delta: 'streaming ', done: false }
    yield { delta: 'response', done: false }
    yield {
      delta: '',
      done: true,
      usage: {
        inputTokens: this.estimateTokens(request.prompt),
        outputTokens: 20
      }
    }
  }

  async complete(request: AICompletionRequest): Promise<AIResponse> {
    const content = 'Test response for: ' + request.prompt
    return {
      content,
      model: request.model || this.models[0],
      usage: {
        inputTokens: this.estimateTokens(request.prompt),
        outputTokens: this.estimateTokens(content)
      },
      latency: 1000,
      cached: false,
      cost: this.estimateCost(request)
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    return { success: true }
  }

  estimateCost(request: AICompletionRequest): number {
    const inputTokens = this.estimateTokens(request.prompt)
    const outputTokens = request.maxTokens || 1000
    // Mock pricing: $0.001 per 1000 tokens
    return ((inputTokens + outputTokens) / 1000) * 0.001
  }
}

describe('BaseAIProvider', () => {
  let provider: TestAIProvider

  beforeEach(() => {
    provider = new TestAIProvider()
  })

  describe('provider metadata', () => {
    it('should have provider name', () => {
      expect(provider.name).toBe('test-provider')
    })

    it('should have available models', () => {
      expect(provider.models).toHaveLength(2)
      expect(provider.models).toContain('test-model-1')
      expect(provider.models).toContain('test-model-2')
    })
  })

  describe('token estimation', () => {
    it('should estimate tokens for short text', () => {
      const text = 'Hello world'
      const tokens = (provider as any).estimateTokens(text)

      expect(tokens).toBeGreaterThan(0)
      expect(tokens).toBeLessThan(10)
    })

    it('should estimate tokens for long text', () => {
      const text = 'a'.repeat(1000)
      const tokens = (provider as any).estimateTokens(text)

      expect(tokens).toBeGreaterThan(200)
      expect(tokens).toBeLessThan(300)
    })

    it('should return consistent estimates', () => {
      const text = 'Test prompt for estimation'
      const estimate1 = (provider as any).estimateTokens(text)
      const estimate2 = (provider as any).estimateTokens(text)

      expect(estimate1).toBe(estimate2)
    })

    it('should handle empty text', () => {
      const tokens = (provider as any).estimateTokens('')
      expect(tokens).toBe(0)
    })

    it('should handle unicode text', () => {
      const text = '你好世界 Hello World'
      const tokens = (provider as any).estimateTokens(text)
      expect(tokens).toBeGreaterThan(0)
    })
  })

  describe('system prompt generation', () => {
    it('should generate system prompt', () => {
      const systemPrompt = (provider as any).buildSystemPrompt()

      expect(systemPrompt).toBeDefined()
      expect(typeof systemPrompt).toBe('string')
      expect(systemPrompt.length).toBeGreaterThan(0)
    })

    it('should include Kubernetes context', () => {
      const systemPrompt = (provider as any).buildSystemPrompt()

      expect(systemPrompt).toContain('Kubernetes')
      expect(systemPrompt).toContain('kubectl')
      expect(systemPrompt).toContain('Kui')
    })

    it('should include assistant role description', () => {
      const systemPrompt = (provider as any).buildSystemPrompt()

      expect(systemPrompt).toContain('assistant')
      expect(systemPrompt).toContain('help')
    })

    it('should include guidelines', () => {
      const systemPrompt = (provider as any).buildSystemPrompt()

      expect(systemPrompt).toContain('Guidelines')
      expect(systemPrompt).toContain('concise')
      expect(systemPrompt).toContain('best practices')
    })
  })

  describe('streaming completion', () => {
    it('should stream response chunks', async () => {
      const request = createMockCompletionRequest()
      const chunks: AIChunk[] = []

      for await (const chunk of provider.streamCompletion(request)) {
        chunks.push(chunk)
      }

      expect(chunks.length).toBeGreaterThan(0)
    })

    it('should mark final chunk as done', async () => {
      const request = createMockCompletionRequest()
      const chunks: AIChunk[] = []

      for await (const chunk of provider.streamCompletion(request)) {
        chunks.push(chunk)
      }

      const lastChunk = chunks[chunks.length - 1]
      expect(lastChunk.done).toBe(true)
    })

    it('should include usage in final chunk', async () => {
      const request = createMockCompletionRequest()
      const chunks: AIChunk[] = []

      for await (const chunk of provider.streamCompletion(request)) {
        chunks.push(chunk)
      }

      const lastChunk = chunks[chunks.length - 1]
      expect(lastChunk.usage).toBeDefined()
      expect(lastChunk.usage?.inputTokens).toBeGreaterThan(0)
      expect(lastChunk.usage?.outputTokens).toBeGreaterThan(0)
    })

    it('should concatenate chunks to form complete response', async () => {
      const request = createMockCompletionRequest()
      let fullResponse = ''

      for await (const chunk of provider.streamCompletion(request)) {
        fullResponse += chunk.delta
      }

      expect(fullResponse).toContain('Test')
      expect(fullResponse).toContain('streaming')
      expect(fullResponse).toContain('response')
    })
  })

  describe('complete request', () => {
    it('should return complete response', async () => {
      const request = createMockCompletionRequest({
        prompt: 'Test question'
      })

      const response = await provider.complete(request)

      expect(response).toBeDefined()
      expect(response.content).toContain('Test question')
      expect(response.model).toBeDefined()
      expect(response.usage).toBeDefined()
      expect(response.latency).toBeGreaterThan(0)
    })

    it('should include token usage', async () => {
      const request = createMockCompletionRequest()
      const response = await provider.complete(request)

      expect(response.usage.inputTokens).toBeGreaterThan(0)
      expect(response.usage.outputTokens).toBeGreaterThan(0)
    })

    it('should include cost estimate', async () => {
      const request = createMockCompletionRequest()
      const response = await provider.complete(request)

      expect(response.cost).toBeDefined()
      expect(response.cost).toBeGreaterThan(0)
    })

    it('should use requested model', async () => {
      const request = createMockCompletionRequest({
        model: 'test-model-2'
      })

      const response = await provider.complete(request)
      expect(response.model).toBe('test-model-2')
    })

    it('should use default model if not specified', async () => {
      const request = createMockCompletionRequest()
      delete request.model

      const response = await provider.complete(request)
      expect(response.model).toBe('test-model-1')
    })

    it('should handle long prompts', async () => {
      const request = createMockCompletionRequest({
        prompt: 'a'.repeat(10000)
      })

      const response = await provider.complete(request)
      expect(response).toBeDefined()
      expect(response.usage.inputTokens).toBeGreaterThan(1000)
    })
  })

  describe('connection testing', () => {
    it('should test connection successfully', async () => {
      const result = await provider.testConnection()

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  describe('cost estimation', () => {
    it('should estimate cost for request', () => {
      const request = createMockCompletionRequest({
        prompt: 'Test prompt',
        maxTokens: 1000
      })

      const cost = provider.estimateCost(request)

      expect(cost).toBeGreaterThan(0)
      expect(typeof cost).toBe('number')
    })

    it('should estimate higher cost for longer prompts', () => {
      const shortRequest = createMockCompletionRequest({
        prompt: 'Short',
        maxTokens: 100
      })

      const longRequest = createMockCompletionRequest({
        prompt: 'a'.repeat(10000),
        maxTokens: 2000
      })

      const shortCost = provider.estimateCost(shortRequest)
      const longCost = provider.estimateCost(longRequest)

      expect(longCost).toBeGreaterThan(shortCost)
    })

    it('should estimate higher cost for more output tokens', () => {
      const lowTokenRequest = createMockCompletionRequest({
        prompt: 'Test',
        maxTokens: 100
      })

      const highTokenRequest = createMockCompletionRequest({
        prompt: 'Test',
        maxTokens: 4000
      })

      const lowCost = provider.estimateCost(lowTokenRequest)
      const highCost = provider.estimateCost(highTokenRequest)

      expect(highCost).toBeGreaterThan(lowCost)
    })

    it('should return reasonable cost estimate', () => {
      const request = createMockCompletionRequest({
        prompt: 'Test prompt',
        maxTokens: 1000
      })

      const cost = provider.estimateCost(request)

      // Should be less than $1 for a typical request
      expect(cost).toBeLessThan(1)
      // Should be more than $0
      expect(cost).toBeGreaterThan(0)
    })
  })

  describe('usage logging', () => {
    it('should log usage data', () => {
      const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation()

      const usage = {
        inputTokens: 100,
        outputTokens: 50,
        latency: 1000,
        cost: 0.001
      }

      ;(provider as any).logUsage(usage)

      expect(consoleDebugSpy).toHaveBeenCalled()
      consoleDebugSpy.mockRestore()
    })

    it('should handle usage without cost', () => {
      const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation()

      const usage = {
        inputTokens: 100,
        outputTokens: 50,
        latency: 1000
      }

      ;(provider as any).logUsage(usage)

      expect(consoleDebugSpy).toHaveBeenCalled()
      consoleDebugSpy.mockRestore()
    })
  })

  describe('error handling', () => {
    it('should handle invalid request gracefully', async () => {
      const request = createMockCompletionRequest({
        prompt: '',
        maxTokens: 0
      })

      // Provider should handle this gracefully
      const response = await provider.complete(request)
      expect(response).toBeDefined()
    })
  })

  describe('performance', () => {
    it('should complete requests quickly', async () => {
      const request = createMockCompletionRequest()
      const startTime = Date.now()

      await provider.complete(request)

      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(5000) // Should complete in under 5 seconds
    })

    it('should stream without blocking', async () => {
      const request = createMockCompletionRequest()
      const chunks: AIChunk[] = []
      const startTime = Date.now()

      for await (const chunk of provider.streamCompletion(request)) {
        chunks.push(chunk)
        // Ensure we're getting chunks progressively
        if (chunks.length === 1) {
          const firstChunkTime = Date.now() - startTime
          expect(firstChunkTime).toBeLessThan(1000)
        }
      }

      expect(chunks.length).toBeGreaterThan(1)
    })
  })

  describe('edge cases', () => {
    it('should handle very short prompts', async () => {
      const request = createMockCompletionRequest({
        prompt: 'Hi'
      })

      const response = await provider.complete(request)
      expect(response).toBeDefined()
      expect(response.content).toBeTruthy()
    })

    it('should handle prompts with special characters', async () => {
      const request = createMockCompletionRequest({
        prompt: 'Test with "quotes" and \'apostrophes\' and \n newlines'
      })

      const response = await provider.complete(request)
      expect(response).toBeDefined()
    })

    it('should handle prompts with emojis', async () => {
      const request = createMockCompletionRequest({
        prompt: 'Why is my pod 💥 crashing? 🤔'
      })

      const response = await provider.complete(request)
      expect(response).toBeDefined()
    })

    it('should handle requests with system prompt', async () => {
      const request = createMockCompletionRequest({
        prompt: 'Test',
        systemPrompt: 'You are a helpful assistant'
      })

      const response = await provider.complete(request)
      expect(response).toBeDefined()
    })

    it('should handle requests with custom temperature', async () => {
      const request = createMockCompletionRequest({
        prompt: 'Test',
        temperature: 0.5
      })

      const response = await provider.complete(request)
      expect(response).toBeDefined()
    })
  })
})
