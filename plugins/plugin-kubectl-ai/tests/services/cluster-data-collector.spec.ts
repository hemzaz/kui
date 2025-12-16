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

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { ClusterDataCollector } from '../../src/context/cluster-data-collector'
import { rexec } from '@kui-shell/core'
import { mockKubectlOutputs } from '../fixtures/cluster-context.fixtures'

// Mock rexec from @kui-shell/core
const mockRexec = rexec as jest.MockedFunction<typeof rexec>

describe('ClusterDataCollector', () => {
  let collector: ClusterDataCollector

  beforeEach(() => {
    collector = new ClusterDataCollector()
    jest.clearAllMocks()
  })

  describe('captureClusterSnapshot', () => {
    it('should capture basic cluster snapshot', async () => {
      // Mock kubectl responses
      mockRexec.mockImplementation((command: string) => {
        if (command.includes('version')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.version } } as any)
        }
        if (command.includes('get nodes')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.nodes } } as any)
        }
        if (command.includes('current-context')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.currentContext } } as any)
        }
        if (command.includes('get pods')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.pods } } as any)
        }
        if (command.includes('get services')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.services } } as any)
        }
        if (command.includes('get deployments')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.deployments } } as any)
        }
        if (command.includes('get configmaps')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.configmaps } } as any)
        }
        if (command.includes('get secrets')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.secrets } } as any)
        }
        return Promise.resolve({ content: { stdout: '' } } as any)
      })

      const snapshot = await collector.captureClusterSnapshot()

      expect(snapshot).toBeDefined()
      expect(snapshot.cluster).toBeDefined()
      expect(snapshot.cluster.name).toBe('test-cluster')
      expect(snapshot.cluster.version).toBe('1.28.0')
      expect(snapshot.cluster.nodeCount).toBe(3)
      expect(snapshot.namespace).toBeDefined()
      expect(snapshot.namespace.name).toBe('default')
      expect(snapshot.namespace.resourceCounts).toBeDefined()
    })

    it('should capture snapshot with custom namespace', async () => {
      mockRexec.mockImplementation((command: string) => {
        if (command.includes('version')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.version } } as any)
        }
        if (command.includes('get nodes')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.nodes } } as any)
        }
        if (command.includes('current-context')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.currentContext } } as any)
        }
        if (command.includes('-n production')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.pods } } as any)
        }
        return Promise.resolve({ content: { stdout: '' } } as any)
      })

      const snapshot = await collector.captureClusterSnapshot({ namespace: 'production' })

      expect(snapshot.namespace.name).toBe('production')
    })

    it('should capture resource context when requested', async () => {
      mockRexec.mockImplementation((command: string) => {
        if (command.includes('version')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.version } } as any)
        }
        if (command.includes('get nodes')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.nodes } } as any)
        }
        if (command.includes('current-context')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.currentContext } } as any)
        }
        if (command.includes('get pod') && command.includes('-o json')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.podStatus } } as any)
        }
        return Promise.resolve({ content: { stdout: '' } } as any)
      })

      const snapshot = await collector.captureClusterSnapshot({
        resource: {
          kind: 'Pod',
          name: 'nginx-123',
          namespace: 'default'
        }
      })

      expect(snapshot.currentResource).toBeDefined()
      expect(snapshot.currentResource?.kind).toBe('Pod')
      expect(snapshot.currentResource?.name).toBe('nginx-123')
      expect(snapshot.currentResource?.status).toBeDefined()
    })

    it('should include events when requested', async () => {
      mockRexec.mockImplementation((command: string) => {
        if (command.includes('version')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.version } } as any)
        }
        if (command.includes('get nodes')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.nodes } } as any)
        }
        if (command.includes('current-context')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.currentContext } } as any)
        }
        if (command.includes('get pod') && command.includes('-o json')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.podStatus } } as any)
        }
        if (command.includes('get events')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.events } } as any)
        }
        return Promise.resolve({ content: { stdout: '' } } as any)
      })

      const snapshot = await collector.captureClusterSnapshot({
        resource: {
          kind: 'Pod',
          name: 'nginx-123',
          namespace: 'default'
        },
        includeEvents: true
      })

      expect(snapshot.currentResource?.events).toBeDefined()
      expect(Array.isArray(snapshot.currentResource?.events)).toBe(true)
    })

    it('should include logs when requested for pods', async () => {
      mockRexec.mockImplementation((command: string) => {
        if (command.includes('version')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.version } } as any)
        }
        if (command.includes('get nodes')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.nodes } } as any)
        }
        if (command.includes('current-context')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.currentContext } } as any)
        }
        if (command.includes('get pod') && command.includes('-o json')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.podStatus } } as any)
        }
        if (command.includes('logs')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.logs } } as any)
        }
        return Promise.resolve({ content: { stdout: '' } } as any)
      })

      const snapshot = await collector.captureClusterSnapshot({
        resource: {
          kind: 'Pod',
          name: 'nginx-123',
          namespace: 'default'
        },
        includeLogs: true
      })

      expect(snapshot.currentResource?.logs).toBeDefined()
      expect(Array.isArray(snapshot.currentResource?.logs)).toBe(true)
      expect(snapshot.currentResource?.logs?.length).toBeGreaterThan(0)
    })

    it('should handle kubectl errors gracefully', async () => {
      mockRexec.mockRejectedValue(new Error('kubectl not found'))

      const snapshot = await collector.captureClusterSnapshot()

      expect(snapshot).toBeDefined()
      expect(snapshot.cluster.name).toBe('unknown')
      expect(snapshot.cluster.version).toBe('unknown')
      expect(snapshot.cluster.nodeCount).toBe(0)
    })

    it('should estimate token count', async () => {
      mockRexec.mockImplementation((command: string) => {
        if (command.includes('version')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.version } } as any)
        }
        if (command.includes('get nodes')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.nodes } } as any)
        }
        if (command.includes('current-context')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.currentContext } } as any)
        }
        return Promise.resolve({ content: { stdout: '' } } as any)
      })

      const snapshot = await collector.captureClusterSnapshot()

      expect(snapshot.tokenEstimate).toBeDefined()
      expect(typeof snapshot.tokenEstimate).toBe('number')
      expect(snapshot.tokenEstimate).toBeGreaterThan(0)
    })

    it('should determine priority correctly', async () => {
      mockRexec.mockImplementation((command: string) => {
        if (command.includes('version')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.version } } as any)
        }
        if (command.includes('get nodes')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.nodes } } as any)
        }
        if (command.includes('current-context')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.currentContext } } as any)
        }
        return Promise.resolve({ content: { stdout: '' } } as any)
      })

      // Without resource
      const snapshotLow = await collector.captureClusterSnapshot()
      expect(snapshotLow.priority).toBe('low')

      // With resource and events
      mockRexec.mockImplementation((command: string) => {
        if (command.includes('version')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.version } } as any)
        }
        if (command.includes('get nodes')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.nodes } } as any)
        }
        if (command.includes('current-context')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.currentContext } } as any)
        }
        if (command.includes('get pod') && command.includes('-o json')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.podStatus } } as any)
        }
        if (command.includes('get events')) {
          return Promise.resolve({
            content: {
              stdout: JSON.stringify({
                items: [
                  {
                    type: 'Warning',
                    reason: 'FailedScheduling',
                    message: 'Insufficient memory',
                    lastTimestamp: '2024-01-01T00:00:00Z',
                    involvedObject: {
                      kind: 'Pod',
                      name: 'test-pod',
                      namespace: 'default'
                    }
                  }
                ]
              })
            }
          } as any)
        }
        return Promise.resolve({ content: { stdout: '' } } as any)
      })

      const snapshotHigh = await collector.captureClusterSnapshot({
        resource: {
          kind: 'Pod',
          name: 'nginx-123',
          namespace: 'default'
        },
        includeEvents: true
      })
      expect(snapshotHigh.priority).toBe('high')
    })
  })

  describe('provider detection', () => {
    it('should detect EKS cluster', async () => {
      mockRexec.mockImplementation((command: string) => {
        if (command.includes('version')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.version } } as any)
        }
        if (command.includes('get nodes')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.nodes } } as any)
        }
        if (command.includes('current-context')) {
          return Promise.resolve({ content: { stdout: 'arn:aws:eks:us-east-1:123456:cluster/prod' } } as any)
        }
        return Promise.resolve({ content: { stdout: '' } } as any)
      })

      const snapshot = await collector.captureClusterSnapshot()
      expect(snapshot.cluster.provider).toBe('eks')
    })

    it('should detect GKE cluster', async () => {
      mockRexec.mockImplementation((command: string) => {
        if (command.includes('version')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.version } } as any)
        }
        if (command.includes('get nodes')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.nodes } } as any)
        }
        if (command.includes('current-context')) {
          return Promise.resolve({ content: { stdout: 'gke_project_us-central1_cluster' } } as any)
        }
        return Promise.resolve({ content: { stdout: '' } } as any)
      })

      const snapshot = await collector.captureClusterSnapshot()
      expect(snapshot.cluster.provider).toBe('gke')
    })

    it('should detect AKS cluster', async () => {
      mockRexec.mockImplementation((command: string) => {
        if (command.includes('version')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.version } } as any)
        }
        if (command.includes('get nodes')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.nodes } } as any)
        }
        if (command.includes('current-context')) {
          return Promise.resolve({ content: { stdout: 'aks-cluster-eastus' } } as any)
        }
        return Promise.resolve({ content: { stdout: '' } } as any)
      })

      const snapshot = await collector.captureClusterSnapshot()
      expect(snapshot.cluster.provider).toBe('aks')
    })

    it('should detect kind cluster', async () => {
      mockRexec.mockImplementation((command: string) => {
        if (command.includes('version')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.version } } as any)
        }
        if (command.includes('get nodes')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.nodes } } as any)
        }
        if (command.includes('current-context')) {
          return Promise.resolve({ content: { stdout: 'kind-dev-cluster' } } as any)
        }
        return Promise.resolve({ content: { stdout: '' } } as any)
      })

      const snapshot = await collector.captureClusterSnapshot()
      expect(snapshot.cluster.provider).toBe('kind')
    })

    it('should detect minikube cluster', async () => {
      mockRexec.mockImplementation((command: string) => {
        if (command.includes('version')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.version } } as any)
        }
        if (command.includes('get nodes')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.nodes } } as any)
        }
        if (command.includes('current-context')) {
          return Promise.resolve({ content: { stdout: 'minikube' } } as any)
        }
        return Promise.resolve({ content: { stdout: '' } } as any)
      })

      const snapshot = await collector.captureClusterSnapshot()
      expect(snapshot.cluster.provider).toBe('minikube')
    })

    it('should default to unknown provider', async () => {
      mockRexec.mockImplementation((command: string) => {
        if (command.includes('version')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.version } } as any)
        }
        if (command.includes('get nodes')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.nodes } } as any)
        }
        if (command.includes('current-context')) {
          return Promise.resolve({ content: { stdout: 'custom-cluster' } } as any)
        }
        return Promise.resolve({ content: { stdout: '' } } as any)
      })

      const snapshot = await collector.captureClusterSnapshot()
      expect(snapshot.cluster.provider).toBe('unknown')
    })
  })

  describe('resource counting', () => {
    it('should count resources correctly', async () => {
      mockRexec.mockImplementation((command: string) => {
        if (command.includes('version')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.version } } as any)
        }
        if (command.includes('get nodes')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.nodes } } as any)
        }
        if (command.includes('current-context')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.currentContext } } as any)
        }
        if (command.includes('get pods')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.pods } } as any)
        }
        if (command.includes('get services')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.services } } as any)
        }
        if (command.includes('get deployments')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.deployments } } as any)
        }
        if (command.includes('get configmaps')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.configmaps } } as any)
        }
        if (command.includes('get secrets')) {
          return Promise.resolve({ content: { stdout: mockKubectlOutputs.secrets } } as any)
        }
        return Promise.resolve({ content: { stdout: '' } } as any)
      })

      const snapshot = await collector.captureClusterSnapshot()

      expect(snapshot.namespace.resourceCounts.pods).toBe(5)
      expect(snapshot.namespace.resourceCounts.services).toBe(3)
      expect(snapshot.namespace.resourceCounts.deployments).toBe(2)
      expect(snapshot.namespace.resourceCounts.configmaps).toBe(4)
      expect(snapshot.namespace.resourceCounts.secrets).toBe(2)
    })
  })
})
