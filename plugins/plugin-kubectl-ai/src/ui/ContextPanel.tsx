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

import React from 'react'
import type { ClusterSnapshot } from '../types/cluster-types'

interface ContextPanelProps {
  clusterData: ClusterSnapshot
}

function getPriorityClass(priority: string): string {
  switch (priority) {
    case 'high': return 'kui-ai-priority-high'
    case 'medium': return 'kui-ai-priority-medium'
    case 'low': return 'kui-ai-priority-low'
    default: return ''
  }
}

export const ContextPanel: React.FC<ContextPanelProps> = ({ clusterData }) => {
  const { cluster, namespace, currentResource } = clusterData

  return (
    <div className="kui-ai-context-panel">
      {cluster && (
        <div className="kui-ai-context-section">
          <h4 className="kui-ai-context-heading">🏢 Cluster</h4>
          <div className="kui-ai-context-grid">
            <div className="kui-ai-context-item">
              <span className="kui-ai-context-label">Name:</span>
              <span className="kui-ai-context-value">{cluster.name}</span>
            </div>
            <div className="kui-ai-context-item">
              <span className="kui-ai-context-label">Version:</span>
              <span className="kui-ai-context-value">{cluster.version}</span>
            </div>
            {cluster.provider && (
              <div className="kui-ai-context-item">
                <span className="kui-ai-context-label">Provider:</span>
                <span className="kui-ai-context-value">{cluster.provider}</span>
              </div>
            )}
            <div className="kui-ai-context-item">
              <span className="kui-ai-context-label">Nodes:</span>
              <span className="kui-ai-context-value">{cluster.nodeCount}</span>
            </div>
          </div>
        </div>
      )}

      {namespace && (
        <div className="kui-ai-context-section">
          <h4 className="kui-ai-context-heading">📦 Namespace</h4>
          <div className="kui-ai-context-grid">
            <div className="kui-ai-context-item">
              <span className="kui-ai-context-label">Name:</span>
              <span className="kui-ai-context-value">{namespace.name}</span>
            </div>
            {namespace.resourceCounts && (
              <>
                <div className="kui-ai-context-item">
                  <span className="kui-ai-context-label">Pods:</span>
                  <span className="kui-ai-context-value">{namespace.resourceCounts.pods || 0}</span>
                </div>
                <div className="kui-ai-context-item">
                  <span className="kui-ai-context-label">Services:</span>
                  <span className="kui-ai-context-value">{namespace.resourceCounts.services || 0}</span>
                </div>
                <div className="kui-ai-context-item">
                  <span className="kui-ai-context-label">Deployments:</span>
                  <span className="kui-ai-context-value">{namespace.resourceCounts.deployments || 0}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {currentResource && (
        <div className="kui-ai-context-section">
          <h4 className="kui-ai-context-heading">🎯 Selected Resource</h4>
          <div className="kui-ai-context-grid">
            <div className="kui-ai-context-item">
              <span className="kui-ai-context-label">Kind:</span>
              <span className="kui-ai-context-value">{currentResource.kind}</span>
            </div>
            <div className="kui-ai-context-item">
              <span className="kui-ai-context-label">Name:</span>
              <span className="kui-ai-context-value">{currentResource.name}</span>
            </div>
            {currentResource.status && typeof currentResource.status === 'object' && 'phase' in currentResource.status && (
              <div className="kui-ai-context-item">
                <span className="kui-ai-context-label">Status:</span>
                <span className={'kui-ai-context-value kui-ai-status-' + (currentResource.status as any).phase}>
                  {(currentResource.status as any).phase}
                </span>
              </div>
            )}
          </div>

          {currentResource.logs && currentResource.logs.length > 0 && (
            <div className="kui-ai-context-logs">
              <div className="kui-ai-context-logs-header">
                📜 Recent Logs ({currentResource.logs.length} lines)
              </div>
              <pre className="kui-ai-context-logs-content">
                {currentResource.logs.slice(-20).join('\n')}
              </pre>
            </div>
          )}

          {currentResource.events && currentResource.events.length > 0 && (
            <div className="kui-ai-context-events">
              <div className="kui-ai-context-events-header">
                📋 Recent Events ({currentResource.events.length})
              </div>
              <div className="kui-ai-context-events-list">
                {currentResource.events.slice(-5).map((event, idx) => (
                  <div key={idx} className={'kui-ai-context-event kui-ai-event-' + event.type}>
                    <span className="kui-ai-event-type">{event.type}:</span>
                    <span className="kui-ai-event-reason">{event.reason}</span>
                    <span className="kui-ai-event-message">{event.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!cluster && !namespace && !currentResource && (
        <div className="kui-ai-context-empty">
          <p>No context available</p>
          <p className="kui-ai-context-empty-hint">
            Use <code>--context</code> flag to include cluster information
          </p>
        </div>
      )}
    </div>
  )
}
