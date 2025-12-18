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

/**
 * DEMO EXAMPLE COMPONENT
 *
 * This file demonstrates how to use AIContextMenu and AITooltip
 * components together in a resource table.
 *
 * This is a complete working example showing:
 * - Context menu integration
 * - Tooltip integration
 * - AI action handlers
 * - Performance optimization with caching
 */

import React, { useState, useCallback } from 'react'
import { AIContextMenu, useAIContextMenu } from './AIContextMenu'
import { AITooltip, useAITooltip } from './AITooltip'
import type { ContextMenuItem, AIInsight } from './index'

// Mock Kubernetes resource type
interface KubernetesResource {
  kind: string
  metadata: {
    name: string
    namespace: string
    uid: string
  }
  status: {
    phase: 'Running' | 'Pending' | 'Failed' | 'CrashLoopBackOff'
  }
}

// Mock AI provider service
class MockAIProvider {
  async analyzeResource(resource: KubernetesResource): Promise<string> {
    await this.delay(800)
    return `Analysis complete for ${resource.metadata.name}. Resource is ${resource.status.phase}.`
  }

  async troubleshootIssues(resource: KubernetesResource): Promise<string> {
    await this.delay(700)
    if (resource.status.phase === 'CrashLoopBackOff') {
      return 'Pod is crash looping. Check logs for errors.'
    }
    return 'No issues detected.'
  }

  async getInsights(resource: KubernetesResource): Promise<AIInsight> {
    await this.delay(600)

    // Simulate different insights based on resource state
    switch (resource.status.phase) {
      case 'CrashLoopBackOff':
        return {
          summary: 'Pod is crash looping',
          details: 'Container exits with code 137 (OOMKilled). Consider increasing memory limits.',
          severity: 'error',
          actions: [
            {
              label: 'View Logs',
              action: async () => {
                console.log('Opening logs...')
              }
            },
            {
              label: 'Increase Memory',
              action: async () => {
                console.log('Increasing memory limits...')
              }
            }
          ]
        }

      case 'Failed':
        return {
          summary: 'Pod has failed',
          details: 'Check events and logs for more information.',
          severity: 'error',
          actions: [
            {
              label: 'View Events',
              action: async () => {
                console.log('Opening events...')
              }
            }
          ]
        }

      case 'Pending':
        return {
          summary: 'Pod is pending',
          details: 'Waiting for node assignment. May need to scale cluster.',
          severity: 'warning',
          actions: [
            {
              label: 'Check Nodes',
              action: async () => {
                console.log('Checking nodes...')
              }
            }
          ]
        }

      case 'Running':
      default:
        return {
          summary: 'Pod is healthy',
          details: 'All containers are running normally.',
          severity: 'success'
        }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Mock resource data
const mockResources: KubernetesResource[] = [
  {
    kind: 'Pod',
    metadata: {
      name: 'nginx-deployment-abc123',
      namespace: 'default',
      uid: '1'
    },
    status: { phase: 'Running' }
  },
  {
    kind: 'Pod',
    metadata: {
      name: 'redis-cache-def456',
      namespace: 'default',
      uid: '2'
    },
    status: { phase: 'CrashLoopBackOff' }
  },
  {
    kind: 'Pod',
    metadata: {
      name: 'api-server-ghi789',
      namespace: 'production',
      uid: '3'
    },
    status: { phase: 'Pending' }
  }
]

/**
 * Demo Resource Table Component
 *
 * Shows complete integration of context menu and tooltip
 */
export const DemoResourceTable: React.FC = () => {
  const [resources] = useState(mockResources)
  const { menuState, openMenu, closeMenu } = useAIContextMenu()
  const aiProvider = new MockAIProvider()

  // Create tooltip states for each resource
  const tooltipStates = resources.map(() => useAITooltip())

  // Handle context menu
  const handleContextMenu = useCallback(
    (event: React.MouseEvent, resource: KubernetesResource) => {
      event.preventDefault()

      const menuItems: ContextMenuItem[] = [
        {
          id: 'analyze',
          label: 'Analyze with AI',
          icon: '🔍',
          action: async () => {
            const result = await aiProvider.analyzeResource(resource)
            alert(result)
          }
        },
        {
          id: 'troubleshoot',
          label: 'Troubleshoot Issues',
          icon: '🔧',
          action: async () => {
            const result = await aiProvider.troubleshootIssues(resource)
            alert(result)
          }
        },
        {
          id: 'optimize',
          label: 'Get Optimization Suggestions',
          icon: '💡',
          action: async () => {
            alert('Getting optimization suggestions...')
          },
          divider: true
        },
        {
          id: 'logs',
          label: 'View Logs',
          icon: '📜',
          shortcut: 'Ctrl+L',
          action: async () => {
            console.log('Opening logs for', resource.metadata.name)
          }
        },
        {
          id: 'events',
          label: 'View Events',
          icon: '📋',
          shortcut: 'Ctrl+E',
          action: async () => {
            console.log('Opening events for', resource.metadata.name)
          }
        }
      ]

      openMenu(event.clientX, event.clientY, menuItems, {
        kind: resource.kind,
        name: resource.metadata.name,
        namespace: resource.metadata.namespace
      })
    },
    [aiProvider, openMenu]
  )

  // Fetch insights with caching
  const createInsightsFetcher = useCallback(
    (resource: KubernetesResource) => {
      return async (): Promise<AIInsight> => {
        // Check cache first
        const cacheKey = `insights-${resource.metadata.uid}`
        const cached = sessionStorage.getItem(cacheKey)

        if (cached) {
          console.log('Cache hit for', resource.metadata.name)
          return JSON.parse(cached)
        }

        // Fetch from AI provider
        console.log('Fetching insights for', resource.metadata.name)
        const insights = await aiProvider.getInsights(resource)

        // Cache for 5 minutes
        sessionStorage.setItem(cacheKey, JSON.stringify(insights))
        setTimeout(() => sessionStorage.removeItem(cacheKey), 5 * 60 * 1000)

        return insights
      }
    },
    [aiProvider]
  )

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Demo: AI Context Menu & Tooltip Integration</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Right-click on a resource for AI actions, or hover for insights
      </p>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Namespace</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {resources.map((resource, index) => {
            const tooltipState = tooltipStates[index]
            const statusColor =
              resource.status.phase === 'Running'
                ? '#28a745'
                : resource.status.phase === 'Pending'
                ? '#ffc107'
                : '#dc3545'

            return (
              <tr
                key={resource.metadata.uid}
                style={{
                  borderBottom: '1px solid #ddd',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#f9f9f9'
                  tooltipState.showTooltip()
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'white'
                  tooltipState.hideTooltip()
                }}
                onContextMenu={e => handleContextMenu(e, resource)}
              >
                <td ref={tooltipState.targetRef as any} style={{ padding: '12px' }}>
                  {resource.metadata.name}
                </td>
                <td style={{ padding: '12px' }}>{resource.metadata.namespace}</td>
                <td style={{ padding: '12px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: `${statusColor}20`,
                      color: statusColor,
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    {resource.status.phase}
                  </span>
                </td>

                {/* Tooltip for this row */}
                <AITooltip
                  targetRef={tooltipState.targetRef}
                  visible={tooltipState.tooltipVisible}
                  fetchInsights={createInsightsFetcher(resource)}
                  delay={500}
                  maxWidth={400}
                  position="auto"
                  onClose={tooltipState.hideTooltip}
                />
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Context Menu */}
      {menuState && <AIContextMenu {...menuState} onClose={closeMenu} />}

      {/* Instructions */}
      <div
        style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          border: '1px solid #90caf9'
        }}
      >
        <h3 style={{ marginTop: 0 }}>Try it out:</h3>
        <ul style={{ marginBottom: 0 }}>
          <li>
            <strong>Right-click</strong> on any resource to open AI context menu
          </li>
          <li>
            <strong>Hover</strong> over a resource to see AI insights
          </li>
          <li>
            <strong>Keyboard:</strong> Use arrow keys in menu, Esc to close
          </li>
          <li>
            <strong>Cache:</strong> Hover multiple times to see caching in action
          </li>
        </ul>
      </div>
    </div>
  )
}

export default DemoResourceTable
