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

import React, { useCallback, useMemo, useState, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeTypes,
  BackgroundVariant
} from 'reactflow'
import 'reactflow/dist/style.css'

import type {
  TopologyGraph,
  TopologyNode,
  TopologyEdge,
  LayoutType
} from '@kui-shell/core/src/topology'
import { applyLayout } from '@kui-shell/core/src/topology'

import { PodNode, ServiceNode, DeploymentNode, GenericNode } from './nodes'
import { TopologyToolbar } from './TopologyToolbar'

interface TopologyViewProps {
  graph: TopologyGraph
  onNodeClick?: (node: TopologyNode) => void
  onEdgeClick?: (edge: TopologyEdge) => void
}

// Define custom node types for React Flow
const nodeTypes: NodeTypes = {
  pod: PodNode,
  service: ServiceNode,
  deployment: DeploymentNode,
  statefulset: GenericNode,
  daemonset: GenericNode,
  replicaset: GenericNode,
  configmap: GenericNode,
  secret: GenericNode,
  pvc: GenericNode,
  ingress: GenericNode,
  networkpolicy: GenericNode
}

export function TopologyView({ graph, onNodeClick, onEdgeClick }: TopologyViewProps) {
  const [layoutType, setLayoutType] = useState<LayoutType>('hierarchical')
  const [searchTerm, setSearchTerm] = useState('')

  // Convert topology nodes to React Flow nodes
  const initialNodes = useMemo(() => {
    const layoutedNodes = applyLayout(graph.nodes, graph.edges, layoutType)

    return layoutedNodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data
    }))
  }, [graph, layoutType])

  // Convert topology edges to React Flow edges
  const initialEdges = useMemo(() => {
    return graph.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      label: edge.label,
      animated: edge.animated || false,
      style: {
        stroke: getEdgeColor(edge.type)
      },
      markerEnd: {
        type: 'arrowclosed' as const
      }
    }))
  }, [graph])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes when layout changes
  useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  // Update edges when graph changes
  useEffect(() => {
    setEdges(initialEdges)
  }, [initialEdges, setEdges])

  // Handle node click
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const topologyNode = graph.nodes.find(n => n.id === node.id)
      if (topologyNode && onNodeClick) {
        onNodeClick(topologyNode)
      }
    },
    [graph.nodes, onNodeClick]
  )

  // Handle edge click
  const handleEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      const topologyEdge = graph.edges.find(e => e.id === edge.id)
      if (topologyEdge && onEdgeClick) {
        onEdgeClick(topologyEdge)
      }
    },
    [graph.edges, onEdgeClick]
  )

  // Handle layout change
  const handleLayoutChange = useCallback((newLayout: LayoutType) => {
    setLayoutType(newLayout)
  }, [])

  // Handle search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)

    // Highlight matching nodes
    setNodes(nodes =>
      nodes.map(node => {
        const matches = term === '' ||
          node.data.label.toLowerCase().includes(term.toLowerCase())

        return {
          ...node,
          style: {
            ...node.style,
            opacity: matches ? 1 : 0.3
          }
        }
      })
    )
  }, [setNodes])

  return (
    <div className="kui-topology-view">
      <TopologyToolbar
        layoutType={layoutType}
        onLayoutChange={handleLayoutChange}
        onSearch={handleSearch}
        searchTerm={searchTerm}
      />

      <div className="topology-canvas">
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
              const status = node.data.status
              switch (status) {
                case 'healthy': return '#28a745'
                case 'warning': return '#ffc107'
                case 'error': return '#dc3545'
                default: return '#6c757d'
              }
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>
    </div>
  )
}

/**
 * Get edge color based on edge type
 */
function getEdgeColor(type: string): string {
  switch (type) {
    case 'owns':
      return '#0066cc'
    case 'manages':
      return '#0066cc'
    case 'exposes':
      return '#28a745'
    case 'mounts':
      return '#6f42c1'
    case 'routes':
      return '#fd7e14'
    case 'allows':
      return '#28a745'
    case 'denies':
      return '#dc3545'
    default:
      return '#6c757d'
  }
}
