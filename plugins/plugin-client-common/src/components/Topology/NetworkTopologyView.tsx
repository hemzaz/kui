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

import React, { useCallback, useMemo, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeTypes,
  BackgroundVariant,
  MarkerType
} from 'reactflow'
import 'reactflow/dist/style.css'

import type { NetworkTopology, NetworkNode, NetworkConnection } from '@kui-shell/core/src/topology'
import { applyLayout } from '@kui-shell/core/src/topology'

import { PodNode, ServiceNode } from './nodes'

interface NetworkTopologyViewProps {
  topology: NetworkTopology
  onNodeClick?: (node: NetworkNode) => void
  onConnectionClick?: (connection: NetworkConnection) => void
}

const nodeTypes: NodeTypes = {
  pod: PodNode,
  service: ServiceNode
}

export function NetworkTopologyView({
  topology,
  onNodeClick,
  onConnectionClick
}: NetworkTopologyViewProps) {
  const [showDenied, setShowDenied] = useState(true)
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null)

  // Convert network nodes to React Flow nodes
  const initialNodes = useMemo(() => {
    const topologyNodes = topology.nodes.map(node => ({
      id: node.id,
      type: node.type,
      data: {
        resource: null,
        label: node.id.split('-').pop() || node.id,
        namespace: node.namespace,
        status: 'healthy' as const,
        metadata: {
          created: Date.now(),
          labels: node.labels,
          annotations: {}
        }
      },
      position: { x: 0, y: 0 }
    }))

    // Apply layout
    return applyLayout(topologyNodes, [], 'force-directed')
  }, [topology.nodes])

  // Convert network connections to React Flow edges
  const initialEdges = useMemo(() => {
    return topology.connections
      .filter(conn => showDenied || conn.allowed)
      .filter(conn => {
        if (!selectedPolicy) return true
        // Filter by selected policy if any
        return true
      })
      .map(conn => ({
        id: `${conn.from}-${conn.to}`,
        source: conn.from,
        target: conn.to,
        type: 'smoothstep',
        label: conn.ports.length > 0 ? conn.ports.join(',') : undefined,
        animated: conn.allowed,
        style: {
          stroke: conn.allowed ? '#28a745' : '#dc3545',
          strokeWidth: 2,
          strokeDasharray: conn.allowed ? 'none' : '5,5'
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: conn.allowed ? '#28a745' : '#dc3545'
        }
      }))
  }, [topology.connections, showDenied, selectedPolicy])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Handle node click
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const networkNode = topology.nodes.find(n => n.id === node.id)
      if (networkNode && onNodeClick) {
        onNodeClick(networkNode)
      }
    },
    [topology.nodes, onNodeClick]
  )

  // Handle edge click
  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      const connection = topology.connections.find(
        c => `${c.from}-${c.to}` === edge.id
      )
      if (connection && onConnectionClick) {
        onConnectionClick(connection)
      }
    },
    [topology.connections, onConnectionClick]
  )

  return (
    <div className="kui-network-topology-view">
      <div className="network-topology-toolbar">
        <div className="toolbar-section">
          <label>
            <input
              type="checkbox"
              checked={showDenied}
              onChange={(e) => setShowDenied(e.target.checked)}
            />
            <span>Show denied connections</span>
          </label>
        </div>

        <div className="toolbar-section">
          <label htmlFor="policy-filter">Filter by policy:</label>
          <select
            id="policy-filter"
            value={selectedPolicy || ''}
            onChange={(e) => setSelectedPolicy(e.target.value || null)}
          >
            <option value="">All policies</option>
            {topology.policies.map(policy => (
              <option
                key={policy.metadata.uid}
                value={policy.metadata.uid}
              >
                {policy.metadata.name}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-section">
          <div className="legend">
            <div className="legend-item">
              <div className="legend-line allowed" />
              <span>Allowed</span>
            </div>
            <div className="legend-item">
              <div className="legend-line denied" />
              <span>Denied</span>
            </div>
          </div>
        </div>
      </div>

      <div className="network-topology-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
        >
          <Background variant={BackgroundVariant.Dots} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              return node.type === 'pod' ? '#007bff' : '#28a745'
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>

      <div className="network-topology-stats">
        <div className="stat">
          <span className="stat-label">Nodes:</span>
          <span className="stat-value">{topology.nodes.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Connections:</span>
          <span className="stat-value">{topology.connections.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Policies:</span>
          <span className="stat-value">{topology.policies.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Allowed:</span>
          <span className="stat-value">
            {topology.connections.filter(c => c.allowed).length}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Denied:</span>
          <span className="stat-value">
            {topology.connections.filter(c => !c.allowed).length}
          </span>
        </div>
      </div>
    </div>
  )
}
