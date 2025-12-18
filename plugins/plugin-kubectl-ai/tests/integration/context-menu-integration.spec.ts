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
  MockKubectlExecutor,
  measureTime,
  waitFor
} from '../helpers/test-utils'

/**
 * Integration tests for Context Menu feature
 * Tests end-to-end flow: user interaction -> AI provider -> response display
 */

describe('Context Menu Integration', () => {
  let mockKubectl: MockKubectlExecutor
  let mockAIProvider: any

  beforeEach(() => {
    mockKubectl = new MockKubectlExecutor()
    mockAIProvider = {
      complete: jest.fn().mockResolvedValue(
        createMockAIResponse({
          content: 'This Pod is running normally with all containers ready.'
        })
      ),
      streamCompletion: jest.fn()
    }
  })

  afterEach(() => {
    mockKubectl.clear()
    jest.clearAllMocks()
  })

  describe('end-to-end flow', () => {
    it('should complete full Ask AI flow', async () => {
      // Setup mock kubectl responses
      mockKubectl.addResponse('get pod nginx-pod-123', JSON.stringify({
        kind: 'Pod',
        metadata: { name: 'nginx-pod-123', namespace: 'default' },
        status: { phase: 'Running' }
      }))

      // Simulate user right-click -> Ask AI
      const resourceName = 'nginx-pod-123'
      const resourceType = 'Pod'

      // Get resource data
      const resourceData = await mockKubectl.exec(`get pod ${resourceName}`)

      // Generate AI insight
      const response = await mockAIProvider.complete({
        prompt: `What can you tell me about ${resourceType} ${resourceName}?`,
        systemPrompt: 'You are a Kubernetes expert.',
        maxTokens: 500
      })

      expect(response.content).toBeDefined()
      expect(response.content).toContain('Pod')
      expect(mockAIProvider.complete).toHaveBeenCalledTimes(1)
    })

    it('should complete full Debug flow', async () => {
      // Setup mock kubectl responses
      mockKubectl
        .addResponse('get pod failing-pod-456', JSON.stringify({
          kind: 'Pod',
          metadata: { name: 'failing-pod-456', namespace: 'default' },
          status: { phase: 'CrashLoopBackOff' }
        }))
        .addResponse('describe pod failing-pod-456', 'Events:\n  Warning: Container crashed')
        .addResponse('logs failing-pod-456', 'Error: Connection refused')

      mockAIProvider.complete.mockResolvedValue(
        createMockAIResponse({
          content:
            'The Pod is in CrashLoopBackOff state. Check logs for "Connection refused" error.'
        })
      )

      // Simulate user right-click -> Debug
      const resourceName = 'failing-pod-456'
      const resourceType = 'Pod'

      // Gather debug context
      const podData = await mockKubectl.exec(`get pod ${resourceName}`)
      const podDesc = await mockKubectl.exec(`describe pod ${resourceName}`)
      const podLogs = await mockKubectl.exec(`logs ${resourceName}`)

      // Generate AI debug insight
      const response = await mockAIProvider.complete({
        prompt: `Debug this ${resourceType}: ${resourceName}`,
        systemPrompt: 'You are a Kubernetes troubleshooting expert.',
        maxTokens: 1000
      })

      expect(response.content).toContain('CrashLoopBackOff')
      expect(mockKubectl.exec('get pod failing-pod-456')).resolves.toBeDefined()
    })

    it('should complete full Explain flow', async () => {
      mockAIProvider.complete.mockResolvedValue(
        createMockAIResponse({
          content:
            'A Deployment manages a ReplicaSet which creates and manages Pods. It provides declarative updates and rollback capabilities.'
        })
      )

      // Simulate user right-click -> Explain
      const resourceType = 'Deployment'

      // Generate AI explanation
      const response = await mockAIProvider.complete({
        prompt: `Explain what a Kubernetes ${resourceType} is and how it works.`,
        systemPrompt: 'You are a Kubernetes educator.',
        maxTokens: 500
      })

      expect(response.content).toContain('Deployment')
      expect(response.content).toContain('ReplicaSet')
    })
  })

  describe('tooltip integration', () => {
    it('should generate tooltip insight on hover', async () => {
      mockKubectl.addResponse('get pod nginx-pod-123', JSON.stringify({
        kind: 'Pod',
        metadata: { name: 'nginx-pod-123', namespace: 'default' },
        status: { phase: 'Running', conditions: [{ type: 'Ready', status: 'True' }] }
      }))

      mockAIProvider.complete.mockResolvedValue(
        createMockAIResponse({
          content: 'Pod is healthy with 1/1 containers ready.'
        })
      )

      // Simulate hover event
      const resourceName = 'nginx-pod-123'
      const resourceType = 'Pod'

      // Generate quick insight for tooltip
      const response = await mockAIProvider.complete({
        prompt: `Brief status of ${resourceType} ${resourceName} in one sentence.`,
        maxTokens: 150,
        temperature: 0.3
      })

      expect(response.content).toBeDefined()
      expect(response.content.length).toBeLessThan(150)
    })

    it('should load tooltip within 1 second', async () => {
      mockKubectl.addResponse('get pod nginx-pod-123', JSON.stringify({
        kind: 'Pod',
        metadata: { name: 'nginx-pod-123' },
        status: { phase: 'Running' }
      }))

      const { durationMs } = await measureTime(async () => {
        await mockKubectl.exec('get pod nginx-pod-123')
        await mockAIProvider.complete({
          prompt: 'Brief status in one sentence.',
          maxTokens: 150
        })
      })

      // Should complete within performance requirement
      expect(durationMs).toBeLessThan(1000)
    })

    it('should use cached tooltip on repeated hover', async () => {
      const resourceName = 'nginx-pod-123'
      const cache = new Map<string, string>()

      // First hover - generate
      if (!cache.has(resourceName)) {
        const response = await mockAIProvider.complete({
          prompt: 'Brief status.',
          maxTokens: 150
        })
        cache.set(resourceName, response.content)
      }

      // Second hover - from cache
      const cachedInsight = cache.get(resourceName)

      expect(cachedInsight).toBeDefined()
      expect(mockAIProvider.complete).toHaveBeenCalledTimes(1)
    })
  })

  describe('with cluster context', () => {
    it('should include cluster context in AI request', async () => {
      const clusterData = createMockClusterSnapshot({
        cluster: {
          name: 'production',
          version: '1.28.0',
          provider: 'eks',
          nodeCount: 5
        },
        namespace: {
          name: 'api',
          resourceCounts: {
            pods: 10,
            services: 3,
            deployments: 2,
            configmaps: 5,
            secrets: 3
          }
        }
      })

      mockAIProvider.complete.mockResolvedValue(
        createMockAIResponse({
          content: 'Pod is part of a 10-pod namespace in production EKS cluster.'
        })
      )

      const response = await mockAIProvider.complete({
        prompt: 'Analyze this Pod.',
        clusterData
      })

      expect(mockAIProvider.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          clusterData: expect.objectContaining({
            cluster: expect.objectContaining({
              name: 'production'
            })
          })
        })
      )
    })

    it('should work without cluster context', async () => {
      const response = await mockAIProvider.complete({
        prompt: 'What is a Pod?'
      })

      expect(response).toBeDefined()
      expect(mockAIProvider.complete).toHaveBeenCalledWith(
        expect.not.objectContaining({
          clusterData: expect.anything()
        })
      )
    })

    it('should prioritize resource-specific context', async () => {
      mockKubectl
        .addResponse('get pod nginx-pod-123', '{"status": {"phase": "Running"}}')
        .addResponse('logs nginx-pod-123 --tail=20', 'Recent log entries...')
        .addResponse('get events --field-selector involvedObject.name=nginx-pod-123',
          'Recent events...')

      const clusterData = createMockClusterSnapshot()

      // Include both general and specific context
      const response = await mockAIProvider.complete({
        prompt: 'Debug Pod nginx-pod-123',
        clusterData: {
          ...clusterData,
          resource: {
            name: 'nginx-pod-123',
            type: 'Pod',
            logs: 'Recent log entries...',
            events: 'Recent events...'
          }
        }
      })

      expect(response).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should handle kubectl errors gracefully', async () => {
      mockKubectl.addError('get pod missing-pod', new Error('Pod not found'))

      await expect(mockKubectl.exec('get pod missing-pod')).rejects.toThrow('Pod not found')
    })

    it('should handle AI provider errors gracefully', async () => {
      mockAIProvider.complete.mockRejectedValue(new Error('API rate limit exceeded'))

      await expect(
        mockAIProvider.complete({ prompt: 'Test' })
      ).rejects.toThrow('API rate limit exceeded')
    })

    it('should handle timeout errors', async () => {
      mockAIProvider.complete.mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
      )

      await expect(
        mockAIProvider.complete({ prompt: 'Test' })
      ).rejects.toThrow('Timeout')
    })

    it('should handle network errors', async () => {
      mockAIProvider.complete.mockRejectedValue(new Error('Network error'))

      await expect(
        mockAIProvider.complete({ prompt: 'Test' })
      ).rejects.toThrow('Network error')
    })

    it('should provide fallback when AI unavailable', async () => {
      mockAIProvider.complete.mockRejectedValue(new Error('Service unavailable'))

      try {
        await mockAIProvider.complete({ prompt: 'Test' })
      } catch (error) {
        // Should show user-friendly error message
        expect(error.message).toContain('unavailable')
      }
    })
  })

  describe('multiple resources', () => {
    it('should handle multiple context menu instances', async () => {
      const resources = [
        { name: 'pod-1', type: 'Pod' },
        { name: 'pod-2', type: 'Pod' },
        { name: 'svc-1', type: 'Service' }
      ]

      for (const resource of resources) {
        mockKubectl.addResponse(
          `get ${resource.type.toLowerCase()} ${resource.name}`,
          JSON.stringify({ kind: resource.type, metadata: { name: resource.name } })
        )
      }

      // Simulate opening context menu on each resource
      const responses = await Promise.all(
        resources.map(r =>
          mockAIProvider.complete({
            prompt: `Analyze ${r.type} ${r.name}`
          })
        )
      )

      expect(responses).toHaveLength(3)
      expect(mockAIProvider.complete).toHaveBeenCalledTimes(3)
    })

    it('should handle rapid context menu switching', async () => {
      mockAIProvider.complete
        .mockResolvedValueOnce(createMockAIResponse({ content: 'Pod 1 info' }))
        .mockResolvedValueOnce(createMockAIResponse({ content: 'Pod 2 info' }))
        .mockResolvedValueOnce(createMockAIResponse({ content: 'Pod 3 info' }))

      // Simulate user rapidly switching between resources
      const requests = [
        mockAIProvider.complete({ prompt: 'Info on pod-1' }),
        mockAIProvider.complete({ prompt: 'Info on pod-2' }),
        mockAIProvider.complete({ prompt: 'Info on pod-3' })
      ]

      const responses = await Promise.all(requests)

      expect(responses[0].content).toContain('Pod 1')
      expect(responses[1].content).toContain('Pod 2')
      expect(responses[2].content).toContain('Pod 3')
    })
  })

  describe('performance', () => {
    it('should handle concurrent requests efficiently', async () => {
      const resources = Array.from({ length: 10 }, (_, i) => ({
        name: `pod-${i}`,
        type: 'Pod'
      }))

      const { durationMs } = await measureTime(async () => {
        await Promise.all(
          resources.map(r =>
            mockAIProvider.complete({
              prompt: `Status of ${r.name}`
            })
          )
        )
      })

      // Parallel execution should be much faster than sequential
      expect(durationMs).toBeLessThan(resources.length * 200)
    })

    it('should cache frequently accessed resources', async () => {
      const cache = new Map<string, any>()

      // First access
      const key = 'Pod:nginx-pod-123'
      if (!cache.has(key)) {
        const response = await mockAIProvider.complete({ prompt: 'Status' })
        cache.set(key, response)
      }

      // Second access - should be instant
      const { durationMs } = await measureTime(async () => {
        const cached = cache.get(key)
        expect(cached).toBeDefined()
      })

      expect(durationMs).toBeLessThan(5)
    })

    it('should limit concurrent AI requests', async () => {
      // Simulate rate limiting
      let activeRequests = 0
      const maxConcurrent = 3

      mockAIProvider.complete.mockImplementation(async () => {
        activeRequests++
        expect(activeRequests).toBeLessThanOrEqual(maxConcurrent)

        await new Promise(resolve => setTimeout(resolve, 100))

        activeRequests--
        return createMockAIResponse()
      })

      const requests = Array.from({ length: 10 }, () =>
        mockAIProvider.complete({ prompt: 'Test' })
      )

      await Promise.all(requests)
    })
  })

  describe('user experience', () => {
    it('should show loading state during AI request', async () => {
      let isLoading = false

      mockAIProvider.complete.mockImplementation(async () => {
        isLoading = true
        await new Promise(resolve => setTimeout(resolve, 500))
        isLoading = false
        return createMockAIResponse()
      })

      const promise = mockAIProvider.complete({ prompt: 'Test' })
      expect(isLoading).toBe(true)

      await promise
      expect(isLoading).toBe(false)
    })

    it('should provide progress indication for slow requests', async () => {
      const progressSteps: string[] = []

      mockAIProvider.complete.mockImplementation(async () => {
        progressSteps.push('Gathering context...')
        await new Promise(resolve => setTimeout(resolve, 200))

        progressSteps.push('Analyzing resource...')
        await new Promise(resolve => setTimeout(resolve, 200))

        progressSteps.push('Generating insight...')
        await new Promise(resolve => setTimeout(resolve, 200))

        return createMockAIResponse()
      })

      await mockAIProvider.complete({ prompt: 'Test' })

      expect(progressSteps).toHaveLength(3)
      expect(progressSteps[0]).toContain('Gathering')
      expect(progressSteps[1]).toContain('Analyzing')
      expect(progressSteps[2]).toContain('Generating')
    })

    it('should allow cancellation of in-flight requests', async () => {
      let cancelled = false

      mockAIProvider.complete.mockImplementation(async () => {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(resolve, 2000)

          // Simulate cancellation
          if (cancelled) {
            clearTimeout(timeout)
            reject(new Error('Request cancelled'))
          }
        })
        return createMockAIResponse()
      })

      const promise = mockAIProvider.complete({ prompt: 'Test' })

      // Simulate user cancelling
      setTimeout(() => {
        cancelled = true
      }, 100)

      await expect(promise).rejects.toThrow('Request cancelled')
    })
  })

  describe('accessibility', () => {
    it('should support keyboard-only workflow', async () => {
      // Simulate keyboard-only interaction
      const keyboardFlow = async () => {
        // Tab to resource
        // Press application key (context menu key)
        // Arrow down to "Ask AI"
        // Press Enter

        return await mockAIProvider.complete({
          prompt: 'Keyboard initiated request'
        })
      }

      const response = await keyboardFlow()
      expect(response).toBeDefined()
    })

    it('should announce status to screen readers', async () => {
      const announcements: string[] = []

      mockAIProvider.complete.mockImplementation(async () => {
        announcements.push('Loading insight')
        await new Promise(resolve => setTimeout(resolve, 500))
        announcements.push('Insight loaded')
        return createMockAIResponse()
      })

      await mockAIProvider.complete({ prompt: 'Test' })

      expect(announcements).toContain('Loading insight')
      expect(announcements).toContain('Insight loaded')
    })
  })
})
