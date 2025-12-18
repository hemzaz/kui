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
 * Network Topology Builder
 *
 * Builds network topology from network policies and services
 */

import type {
  NetworkTopology,
  NetworkNode,
  NetworkConnection,
  TopologyGraph,
  TopologyNode,
  TopologyEdge
} from './types'

export class NetworkTopologyBuilder {
  /**
   * Build network topology from Kubernetes resources
   */
  async buildNetworkTopology(
    pods: any[],
    services: any[],
    policies: any[],
    namespace?: string
  ): Promise<NetworkTopology> {
    // Create network nodes
    const nodes: NetworkNode[] = [
      ...this.podsToNetworkNodes(pods),
      ...this.servicesToNetworkNodes(services)
    ]

    // Calculate network connections based on policies
    const connections = this.calculateConnections(nodes, policies)

    return {
      nodes,
      connections,
      policies
    }
  }

  /**
   * Build topology graph with network policy edges
   */
  public buildNetworkGraph(
    resources: any[],
    policies: any[],
    namespace?: string
  ): TopologyGraph {
    const pods = resources.filter(r => r.kind === 'Pod')
    const services = resources.filter(r => r.kind === 'Service')

    // Create nodes for pods and services
    const nodes: TopologyNode[] = [
      ...this.resourcesToNodes(pods),
      ...this.resourcesToNodes(services)
    ]

    // Create edges for network policies
    const edges: TopologyEdge[] = this.createPolicyEdges(pods, services, policies, nodes)

    return {
      nodes,
      edges,
      metadata: {
        clusterName: 'default',
        namespace,
        generatedAt: Date.now(),
        resourceCount: resources.length
      }
    }
  }

  /**
   * Convert pods to network nodes
   */
  private podsToNetworkNodes(pods: any[]): NetworkNode[] {
    return pods.map(pod => ({
      id: pod.metadata.uid || `${pod.metadata.namespace}-${pod.metadata.name}`,
      type: 'pod' as const,
      labels: pod.metadata.labels || {},
      namespace: pod.metadata.namespace || 'default'
    }))
  }

  /**
   * Convert services to network nodes
   */
  private servicesToNetworkNodes(services: any[]): NetworkNode[] {
    return services.map(service => ({
      id: service.metadata.uid || `${service.metadata.namespace}-${service.metadata.name}`,
      type: 'service' as const,
      labels: service.metadata.labels || {},
      namespace: service.metadata.namespace || 'default'
    }))
  }

  /**
   * Calculate which connections are allowed by policies
   */
  private calculateConnections(
    nodes: NetworkNode[],
    policies: any[]
  ): NetworkConnection[] {
    const connections: NetworkConnection[] = []

    // If no network policies, all connections are allowed by default
    if (policies.length === 0) {
      return this.defaultAllowAll(nodes)
    }

    // For each pair of nodes, check if connection is allowed
    for (const from of nodes) {
      for (const to of nodes) {
        if (from.id === to.id) continue
        if (from.type !== 'pod' && to.type !== 'pod') continue

        const allowed = this.isConnectionAllowed(from, to, policies)
        if (allowed) {
          connections.push({
            from: from.id,
            to: to.id,
            allowed: true,
            ports: allowed.ports,
            protocol: allowed.protocol
          })
        }
      }
    }

    return connections
  }

  /**
   * Default allow-all connections when no policies exist
   */
  private defaultAllowAll(nodes: NetworkNode[]): NetworkConnection[] {
    const connections: NetworkConnection[] = []

    for (const from of nodes) {
      for (const to of nodes) {
        if (from.id === to.id) continue
        if (from.type === 'pod' && to.type === 'pod') {
          connections.push({
            from: from.id,
            to: to.id,
            allowed: true,
            ports: [],
            protocol: 'TCP'
          })
        }
      }
    }

    return connections
  }

  /**
   * Check if a connection is allowed by network policies
   */
  private isConnectionAllowed(
    from: NetworkNode,
    to: NetworkNode,
    policies: any[]
  ): { ports: number[]; protocol: string } | null {
    // Find policies that apply to the target pod
    const applicablePolicies = policies.filter(policy => {
      const selector = policy.spec?.podSelector
      if (!selector) return false

      // Empty selector means all pods in namespace
      if (Object.keys(selector.matchLabels || {}).length === 0) {
        return policy.metadata.namespace === to.namespace
      }

      // Check if labels match
      return this.labelsMatch(to.labels, selector.matchLabels || {})
    })

    if (applicablePolicies.length === 0) {
      // No policies apply - default allow
      return { ports: [], protocol: 'TCP' }
    }

    // Check ingress rules
    for (const policy of applicablePolicies) {
      const ingress = policy.spec?.ingress || []

      for (const rule of ingress) {
        // Check if source matches
        const fromMatches = this.checkIngressFrom(from, rule.from || [], policy.metadata.namespace)

        if (fromMatches) {
          const ports = this.extractPorts(rule.ports || [])
          const protocol = rule.ports?.[0]?.protocol || 'TCP'
          return { ports, protocol }
        }
      }
    }

    // Policy exists but no matching rule - deny
    return null
  }

  /**
   * Check if labels match selector
   */
  private labelsMatch(labels: Record<string, string>, selector: Record<string, string>): boolean {
    return Object.entries(selector).every(([key, value]) => labels[key] === value)
  }

  /**
   * Check if ingress from matches the source node
   */
  private checkIngressFrom(
    from: NetworkNode,
    fromRules: any[],
    policyNamespace: string
  ): boolean {
    if (fromRules.length === 0) {
      // Empty from means allow from anywhere
      return true
    }

    for (const rule of fromRules) {
      // Pod selector
      if (rule.podSelector) {
        const selector = rule.podSelector.matchLabels || {}
        if (this.labelsMatch(from.labels, selector)) {
          return true
        }
      }

      // Namespace selector
      if (rule.namespaceSelector) {
        const selector = rule.namespaceSelector.matchLabels || {}
        // For simplicity, we'll just check namespace name
        if (from.namespace === policyNamespace) {
          return true
        }
      }

      // IP block (not implemented for now)
      if (rule.ipBlock) {
        // Would need to check if from IP is in CIDR range
        continue
      }
    }

    return false
  }

  /**
   * Extract port numbers from policy ports
   */
  private extractPorts(ports: any[]): number[] {
    return ports
      .map(p => p.port)
      .filter(p => typeof p === 'number')
  }

  /**
   * Convert resources to topology nodes
   */
  private resourcesToNodes(resources: any[]): TopologyNode[] {
    return resources.map(resource => {
      const metadata = resource.metadata || {}

      return {
        id: metadata.uid || `${metadata.namespace}-${metadata.name}`,
        type: resource.kind?.toLowerCase() as any,
        data: {
          resource,
          label: metadata.name || 'Unnamed',
          namespace: metadata.namespace || 'default',
          status: 'healthy' as any,
          metadata: {
            created: metadata.creationTimestamp
              ? new Date(metadata.creationTimestamp).getTime()
              : Date.now(),
            labels: metadata.labels || {},
            annotations: metadata.annotations || {}
          }
        },
        position: { x: 0, y: 0 }
      }
    })
  }

  /**
   * Create edges for network policy relationships
   */
  private createPolicyEdges(
    pods: any[],
    services: any[],
    policies: any[],
    nodes: TopologyNode[]
  ): TopologyEdge[] {
    const edges: TopologyEdge[] = []
    const nodeMap = new Map(nodes.map(n => [n.id, n]))

    // Create edges for each policy
    for (const policy of policies) {
      const policyId = policy.metadata.uid ||
        `${policy.metadata.namespace}-${policy.metadata.name}`

      // Find pods that this policy applies to
      const selector = policy.spec?.podSelector?.matchLabels || {}
      const targetPods = pods.filter(pod => {
        const labels = pod.metadata?.labels || {}
        return Object.entries(selector).every(([key, value]) => labels[key] === value)
      })

      // Create edges from policy to target pods
      for (const pod of targetPods) {
        const podId = pod.metadata.uid || `${pod.metadata.namespace}-${pod.metadata.name}`

        if (nodeMap.has(podId)) {
          // Determine if policy allows or denies
          const policyType = policy.spec?.policyTypes || []
          const hasIngress = policyType.includes('Ingress')
          const hasEgress = policyType.includes('Egress')

          if (hasIngress) {
            edges.push({
              id: `policy-${policyId}-pod-${podId}-ingress`,
              source: policyId,
              target: podId,
              type: 'allows' as any,
              label: 'Ingress',
              animated: false
            })
          }

          if (hasEgress) {
            edges.push({
              id: `policy-${policyId}-pod-${podId}-egress`,
              source: podId,
              target: policyId,
              type: 'allows' as any,
              label: 'Egress',
              animated: false
            })
          }
        }
      }
    }

    return edges
  }
}

// Singleton instance
export const networkTopologyBuilder = new NetworkTopologyBuilder()
