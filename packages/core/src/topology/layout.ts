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
 * Topology Layout Algorithms
 *
 * Layout algorithms for positioning nodes in topology graphs
 */

import * as dagre from 'dagre'
import type { TopologyNode, TopologyEdge, LayoutType } from './types'

export interface LayoutOptions {
  nodeWidth?: number
  nodeHeight?: number
  nodesep?: number
  ranksep?: number
  rankdir?: 'TB' | 'BT' | 'LR' | 'RL'
}

const DEFAULT_OPTIONS: LayoutOptions = {
  nodeWidth: 180,
  nodeHeight: 100,
  nodesep: 100,
  ranksep: 150,
  rankdir: 'TB'
}

/**
 * Apply layout algorithm to nodes
 */
export function applyLayout(
  nodes: TopologyNode[],
  edges: TopologyEdge[],
  layoutType: LayoutType,
  options: LayoutOptions = {}
): TopologyNode[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  switch (layoutType) {
    case 'hierarchical':
      return hierarchicalLayout(nodes, edges, opts)
    case 'force-directed':
      return forceDirectedLayout(nodes, edges, opts)
    case 'circular':
      return circularLayout(nodes, opts)
    case 'grid':
      return gridLayout(nodes, opts)
    default:
      return hierarchicalLayout(nodes, edges, opts)
  }
}

/**
 * Hierarchical layout using dagre
 * Best for showing owner hierarchies (Deployment -> ReplicaSet -> Pod)
 */
export function hierarchicalLayout(
  nodes: TopologyNode[],
  edges: TopologyEdge[],
  options: LayoutOptions
): TopologyNode[] {
  const g = new dagre.graphlib.Graph()

  // Set graph options
  g.setGraph({
    rankdir: options.rankdir || 'TB',
    nodesep: options.nodesep || 100,
    ranksep: options.ranksep || 150,
    marginx: 50,
    marginy: 50
  })

  g.setDefaultEdgeLabel(() => ({}))

  // Add nodes
  nodes.forEach(node => {
    g.setNode(node.id, {
      width: options.nodeWidth || 180,
      height: options.nodeHeight || 100
    })
  })

  // Add edges
  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target)
  })

  // Calculate layout
  dagre.layout(g)

  // Update node positions
  return nodes.map(node => {
    const pos = g.node(node.id)
    if (pos) {
      return {
        ...node,
        position: { x: pos.x, y: pos.y }
      }
    }
    return node
  })
}

/**
 * Force-directed layout
 * Best for showing complex interconnections
 * Note: This is a simple implementation. For production, consider using d3-force
 */
export function forceDirectedLayout(
  nodes: TopologyNode[],
  edges: TopologyEdge[],
  options: LayoutOptions
): TopologyNode[] {
  // Simple force-directed simulation
  const nodeMap = new Map(nodes.map(n => [n.id, { ...n }]))
  const iterations = 300
  const linkDistance = 150
  const chargeStrength = -300

  // Initialize random positions
  nodeMap.forEach(node => {
    node.position = {
      x: Math.random() * 1000,
      y: Math.random() * 1000
    }
  })

  // Simple force simulation
  for (let i = 0; i < iterations; i++) {
    // Repulsive forces between all nodes
    const nodeArray = Array.from(nodeMap.values())
    for (let j = 0; j < nodeArray.length; j++) {
      for (let k = j + 1; k < nodeArray.length; k++) {
        const nodeA = nodeArray[j]
        const nodeB = nodeArray[k]

        const dx = nodeB.position.x - nodeA.position.x
        const dy = nodeB.position.y - nodeA.position.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1

        const force = chargeStrength / (distance * distance)
        const fx = (dx / distance) * force
        const fy = (dy / distance) * force

        nodeA.position.x -= fx
        nodeA.position.y -= fy
        nodeB.position.x += fx
        nodeB.position.y += fy
      }
    }

    // Attractive forces for connected nodes
    edges.forEach(edge => {
      const source = nodeMap.get(edge.source)
      const target = nodeMap.get(edge.target)

      if (source && target) {
        const dx = target.position.x - source.position.x
        const dy = target.position.y - source.position.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1

        const force = (distance - linkDistance) * 0.01
        const fx = (dx / distance) * force
        const fy = (dy / distance) * force

        source.position.x += fx
        source.position.y += fy
        target.position.x -= fx
        target.position.y -= fy
      }
    })

    // Center force
    const centerX = 500
    const centerY = 500
    nodeArray.forEach(node => {
      const dx = centerX - node.position.x
      const dy = centerY - node.position.y
      node.position.x += dx * 0.01
      node.position.y += dy * 0.01
    })
  }

  return Array.from(nodeMap.values())
}

/**
 * Circular layout
 * Arrange nodes in a circle
 */
export function circularLayout(
  nodes: TopologyNode[],
  options: LayoutOptions
): TopologyNode[] {
  const radius = Math.max(300, nodes.length * 30)
  const centerX = 500
  const centerY = 500

  return nodes.map((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length
    return {
      ...node,
      position: {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      }
    }
  })
}

/**
 * Grid layout
 * Arrange nodes in a grid
 */
export function gridLayout(
  nodes: TopologyNode[],
  options: LayoutOptions
): TopologyNode[] {
  const cols = Math.ceil(Math.sqrt(nodes.length))
  const spacing = 200

  return nodes.map((node, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols

    return {
      ...node,
      position: {
        x: col * spacing + 100,
        y: row * spacing + 100
      }
    }
  })
}
