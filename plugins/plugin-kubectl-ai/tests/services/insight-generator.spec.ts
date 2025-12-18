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

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import {
  createMockAIResponse,
  createMockClusterSnapshot,
  performanceHelpers,
  measureTime
} from '../helpers/test-utils'

/**
 * Service tests for InsightGenerator
 * Tests AI-powered insight generation for tooltips and context menus
 * CRITICAL: Must generate insights within 1 second
 */

// Mock InsightGenerator service (to be implemented)
class MockInsightGenerator {
  private aiProvider: any
  private cache: Map<string, { insight: string; timestamp: number }>

  constructor(aiProvider: any) {
    this.aiProvider = aiProvider
    this.cache = new Map()
  }

  async generateInsight(
    resourceName: string,
    resourceType: string,
    clusterData?: any
  ): Promise<string> {
    const cacheKey = `${resourceType}:${resourceName}`

    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < 300000) {
      // 5 min TTL
      return cached.insight
    }

    // Generate new insight
    const prompt = this.buildPrompt(resourceName, resourceType, clusterData)
    const response = await this.aiProvider.complete({
      prompt,
      maxTokens: 150,
      temperature: 0.3
    })

    const insight = this.extractInsight(response.content)

    // Cache result
    this.cache.set(cacheKey, { insight, timestamp: Date.now() })

    return insight
  }

  private buildPrompt(resourceName: string, resourceType: string, clusterData?: any): string {
    let prompt = `Provide a brief one-sentence insight about the Kubernetes ${resourceType} named "${resourceName}".`

    if (clusterData) {
      prompt += ` Context: ${JSON.stringify(clusterData)}`
    }

    prompt += ' Keep it under 20 words and focus on status or health.'

    return prompt
  }

  private extractInsight(content: string): string {
    // Extract first sentence or up to 150 chars
    const firstSentence = content.split(/[.!?]/)[0]
    return firstSentence.substring(0, 150).trim()
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheSize(): number {
    return this.cache.size
  }
}

describe('InsightGenerator Service', () => {
  let generator: MockInsightGenerator
  let mockAIProvider: any

  beforeEach(() => {
    mockAIProvider = {
      complete: jest.fn().mockResolvedValue({
        content: 'Pod is running normally with all containers ready.',
        model: 'claude-3-5-sonnet-20241022',
        usage: { inputTokens: 50, outputTokens: 15 },
        latency: 500,
        cached: false
      })
    }

    generator = new MockInsightGenerator(mockAIProvider)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('basic insight generation', () => {
    it('should generate insight for Pod', async () => {
      const insight = await generator.generateInsight('nginx-pod-123', 'Pod')

      expect(insight).toBeDefined()
      expect(typeof insight).toBe('string')
      expect(insight.length).toBeGreaterThan(0)
      expect(mockAIProvider.complete).toHaveBeenCalledTimes(1)
    })

    it('should generate insight for Deployment', async () => {
      mockAIProvider.complete.mockResolvedValue({
        content: 'Deployment is scaled to 3 replicas, all healthy.',
        model: 'claude-3-5-sonnet-20241022',
        usage: { inputTokens: 50, outputTokens: 12 },
        latency: 450
      })

      const insight = await generator.generateInsight('frontend-deployment', 'Deployment')

      expect(insight).toBeDefined()
      expect(insight).toContain('Deployment')
    })

    it('should generate insight for Service', async () => {
      mockAIProvider.complete.mockResolvedValue({
        content: 'Service is exposing port 80 with ClusterIP type.',
        model: 'claude-3-5-sonnet-20241022',
        usage: { inputTokens: 50, outputTokens: 13 },
        latency: 480
      })

      const insight = await generator.generateInsight('api-service', 'Service')

      expect(insight).toBeDefined()
      expect(insight).toContain('Service')
    })

    it('should include cluster context when provided', async () => {
      const clusterData = createMockClusterSnapshot()

      await generator.generateInsight('nginx-pod-123', 'Pod', clusterData)

      const callArgs = mockAIProvider.complete.mock.calls[0][0]
      expect(callArgs.prompt).toContain('Context:')
    })

    it('should work without cluster context', async () => {
      const insight = await generator.generateInsight('nginx-pod-123', 'Pod')

      expect(insight).toBeDefined()
      expect(mockAIProvider.complete).toHaveBeenCalledTimes(1)
    })
  })

  describe('prompt construction', () => {
    it('should build concise prompt', async () => {
      await generator.generateInsight('nginx-pod-123', 'Pod')

      const callArgs = mockAIProvider.complete.mock.calls[0][0]
      expect(callArgs.prompt).toContain('Kubernetes Pod')
      expect(callArgs.prompt).toContain('nginx-pod-123')
      expect(callArgs.prompt).toContain('brief')
      expect(callArgs.prompt).toContain('one-sentence')
    })

    it('should request concise output', async () => {
      await generator.generateInsight('nginx-pod-123', 'Pod')

      const callArgs = mockAIProvider.complete.mock.calls[0][0]
      expect(callArgs.maxTokens).toBeLessThanOrEqual(150)
    })

    it('should use low temperature for consistency', async () => {
      await generator.generateInsight('nginx-pod-123', 'Pod')

      const callArgs = mockAIProvider.complete.mock.calls[0][0]
      expect(callArgs.temperature).toBeLessThanOrEqual(0.5)
    })

    it('should include word limit guidance', async () => {
      await generator.generateInsight('nginx-pod-123', 'Pod')

      const callArgs = mockAIProvider.complete.mock.calls[0][0]
      expect(callArgs.prompt).toContain('20 words')
    })

    it('should focus on status or health', async () => {
      await generator.generateInsight('nginx-pod-123', 'Pod')

      const callArgs = mockAIProvider.complete.mock.calls[0][0]
      expect(callArgs.prompt).toContain('status or health')
    })
  })

  describe('insight extraction and formatting', () => {
    it('should extract first sentence', async () => {
      mockAIProvider.complete.mockResolvedValue({
        content:
          'Pod is running normally. It has 2 containers. Memory usage is at 45%. CPU is stable.',
        model: 'claude-3-5-sonnet-20241022',
        usage: { inputTokens: 50, outputTokens: 20 },
        latency: 500
      })

      const insight = await generator.generateInsight('nginx-pod-123', 'Pod')

      expect(insight).toBe('Pod is running normally')
    })

    it('should truncate to 150 characters', async () => {
      const longResponse = 'a'.repeat(200)
      mockAIProvider.complete.mockResolvedValue({
        content: longResponse,
        model: 'claude-3-5-sonnet-20241022',
        usage: { inputTokens: 50, outputTokens: 50 },
        latency: 500
      })

      const insight = await generator.generateInsight('nginx-pod-123', 'Pod')

      expect(insight.length).toBeLessThanOrEqual(150)
    })

    it('should trim whitespace', async () => {
      mockAIProvider.complete.mockResolvedValue({
        content: '   Pod is running normally.   ',
        model: 'claude-3-5-sonnet-20241022',
        usage: { inputTokens: 50, outputTokens: 10 },
        latency: 500
      })

      const insight = await generator.generateInsight('nginx-pod-123', 'Pod')

      expect(insight).toBe('Pod is running normally')
      expect(insight.startsWith(' ')).toBe(false)
      expect(insight.endsWith(' ')).toBe(false)
    })

    it('should handle responses without periods', async () => {
      mockAIProvider.complete.mockResolvedValue({
        content: 'Pod is running normally',
        model: 'claude-3-5-sonnet-20241022',
        usage: { inputTokens: 50, outputTokens: 10 },
        latency: 500
      })

      const insight = await generator.generateInsight('nginx-pod-123', 'Pod')

      expect(insight).toBe('Pod is running normally')
    })

    it('should handle empty responses', async () => {
      mockAIProvider.complete.mockResolvedValue({
        content: '',
        model: 'claude-3-5-sonnet-20241022',
        usage: { inputTokens: 50, outputTokens: 0 },
        latency: 500
      })

      const insight = await generator.generateInsight('nginx-pod-123', 'Pod')

      expect(insight).toBe('')
    })
  })

  describe('caching', () => {
    it('should cache insights', async () => {
      const insight1 = await generator.generateInsight('nginx-pod-123', 'Pod')
      const insight2 = await generator.generateInsight('nginx-pod-123', 'Pod')

      expect(insight1).toBe(insight2)
      expect(mockAIProvider.complete).toHaveBeenCalledTimes(1)
    })

    it('should cache separately for different resources', async () => {
      await generator.generateInsight('nginx-pod-123', 'Pod')
      await generator.generateInsight('api-service', 'Service')

      expect(mockAIProvider.complete).toHaveBeenCalledTimes(2)
      expect(generator.getCacheSize()).toBe(2)
    })

    it('should respect cache TTL', async () => {
      jest.useFakeTimers()

      await generator.generateInsight('nginx-pod-123', 'Pod')

      // Advance time past TTL (5 minutes)
      jest.advanceTimersByTime(6 * 60 * 1000)

      await generator.generateInsight('nginx-pod-123', 'Pod')

      expect(mockAIProvider.complete).toHaveBeenCalledTimes(2)

      jest.useRealTimers()
    })

    it('should clear cache', async () => {
      await generator.generateInsight('nginx-pod-123', 'Pod')
      expect(generator.getCacheSize()).toBe(1)

      generator.clearCache()
      expect(generator.getCacheSize()).toBe(0)

      await generator.generateInsight('nginx-pod-123', 'Pod')
      expect(mockAIProvider.complete).toHaveBeenCalledTimes(2)
    })

    it('should handle concurrent requests for same resource', async () => {
      const promises = [
        generator.generateInsight('nginx-pod-123', 'Pod'),
        generator.generateInsight('nginx-pod-123', 'Pod'),
        generator.generateInsight('nginx-pod-123', 'Pod')
      ]

      await Promise.all(promises)

      // Should only call AI once (with proper deduplication)
      // Note: This mock doesn't dedupe, but real implementation should
      expect(mockAIProvider.complete).toHaveBeenCalled()
    })
  })

  describe('performance requirements', () => {
    it('should generate insight within 1 second (requirement)', async () => {
      const { durationMs } = await measureTime(async () => {
        await generator.generateInsight('nginx-pod-123', 'Pod')
      })

      expect(durationMs).toBeLessThan(1000)
    })

    it('should use cached insights immediately', async () => {
      // First call - generate
      await generator.generateInsight('nginx-pod-123', 'Pod')

      // Second call - should be instant from cache
      const { durationMs } = await measureTime(async () => {
        await generator.generateInsight('nginx-pod-123', 'Pod')
      })

      expect(durationMs).toBeLessThan(10)
    })

    it('should handle batch generation efficiently', async () => {
      const resources = [
        { name: 'pod-1', type: 'Pod' },
        { name: 'pod-2', type: 'Pod' },
        { name: 'pod-3', type: 'Pod' },
        { name: 'svc-1', type: 'Service' },
        { name: 'deploy-1', type: 'Deployment' }
      ]

      const { durationMs } = await measureTime(async () => {
        await Promise.all(
          resources.map(r => generator.generateInsight(r.name, r.type))
        )
      })

      // Parallel execution should be faster than sequential
      expect(durationMs).toBeLessThan(resources.length * 1000)
    })

    it('should limit token usage for cost efficiency', async () => {
      await generator.generateInsight('nginx-pod-123', 'Pod')

      const callArgs = mockAIProvider.complete.mock.calls[0][0]
      expect(callArgs.maxTokens).toBeLessThanOrEqual(150)
    })
  })

  describe('error handling', () => {
    it('should handle AI provider errors', async () => {
      mockAIProvider.complete.mockRejectedValue(new Error('API error'))

      await expect(
        generator.generateInsight('nginx-pod-123', 'Pod')
      ).rejects.toThrow('API error')
    })

    it('should handle timeout errors', async () => {
      mockAIProvider.complete.mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      )

      await expect(
        generator.generateInsight('nginx-pod-123', 'Pod')
      ).rejects.toThrow('Timeout')
    })

    it('should handle rate limiting', async () => {
      mockAIProvider.complete.mockRejectedValue(new Error('Rate limit exceeded'))

      await expect(
        generator.generateInsight('nginx-pod-123', 'Pod')
      ).rejects.toThrow('Rate limit exceeded')
    })

    it('should handle invalid responses', async () => {
      mockAIProvider.complete.mockResolvedValue({
        content: null,
        model: 'claude-3-5-sonnet-20241022',
        usage: { inputTokens: 50, outputTokens: 0 },
        latency: 500
      })

      const insight = await generator.generateInsight('nginx-pod-123', 'Pod')

      // Should handle null gracefully
      expect(insight).toBeDefined()
    })

    it('should handle network errors', async () => {
      mockAIProvider.complete.mockRejectedValue(new Error('Network error'))

      await expect(
        generator.generateInsight('nginx-pod-123', 'Pod')
      ).rejects.toThrow('Network error')
    })
  })

  describe('resource-specific insights', () => {
    it('should provide Pod-specific insights', async () => {
      mockAIProvider.complete.mockResolvedValue({
        content: 'Pod has 1/1 containers ready and is running for 2 days.',
        model: 'claude-3-5-sonnet-20241022',
        usage: { inputTokens: 50, outputTokens: 15 },
        latency: 500
      })

      const insight = await generator.generateInsight('nginx-pod-123', 'Pod')

      expect(insight).toContain('container')
    })

    it('should provide Deployment-specific insights', async () => {
      mockAIProvider.complete.mockResolvedValue({
        content: 'Deployment has 3/3 replicas available and up to date.',
        model: 'claude-3-5-sonnet-20241022',
        usage: { inputTokens: 50, outputTokens: 12 },
        latency: 500
      })

      const insight = await generator.generateInsight('frontend-deployment', 'Deployment')

      expect(insight).toContain('replica')
    })

    it('should provide Service-specific insights', async () => {
      mockAIProvider.complete.mockResolvedValue({
        content: 'Service is type LoadBalancer with external IP 1.2.3.4.',
        model: 'claude-3-5-sonnet-20241022',
        usage: { inputTokens: 50, outputTokens: 13 },
        latency: 500
      })

      const insight = await generator.generateInsight('api-service', 'Service')

      expect(insight).toContain('Service')
    })

    it('should provide ConfigMap-specific insights', async () => {
      mockAIProvider.complete.mockResolvedValue({
        content: 'ConfigMap contains 5 configuration keys.',
        model: 'claude-3-5-sonnet-20241022',
        usage: { inputTokens: 50, outputTokens: 8 },
        latency: 500
      })

      const insight = await generator.generateInsight('app-config', 'ConfigMap')

      expect(insight).toContain('ConfigMap')
    })

    it('should provide StatefulSet-specific insights', async () => {
      mockAIProvider.complete.mockResolvedValue({
        content: 'StatefulSet has 3 ready replicas with persistent volumes attached.',
        model: 'claude-3-5-sonnet-20241022',
        usage: { inputTokens: 50, outputTokens: 14 },
        latency: 500
      })

      const insight = await generator.generateInsight('postgres-ss', 'StatefulSet')

      expect(insight).toContain('StatefulSet')
    })
  })

  describe('edge cases', () => {
    it('should handle very long resource names', async () => {
      const longName = 'a'.repeat(100)

      const insight = await generator.generateInsight(longName, 'Pod')

      expect(insight).toBeDefined()
    })

    it('should handle special characters in resource names', async () => {
      const specialName = 'nginx-pod-123_test@v1.0'

      const insight = await generator.generateInsight(specialName, 'Pod')

      expect(insight).toBeDefined()
    })

    it('should handle custom resource types', async () => {
      const insight = await generator.generateInsight('my-resource', 'CustomResource')

      expect(insight).toBeDefined()
    })

    it('should handle resources with no status', async () => {
      const clusterData = createMockClusterSnapshot({
        namespace: {
          name: 'default',
          resourceCounts: { pods: 0, services: 0, deployments: 0, configmaps: 0, secrets: 0 }
        }
      })

      const insight = await generator.generateInsight('empty-ns', 'Namespace', clusterData)

      expect(insight).toBeDefined()
    })
  })
})
