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
 * Topology Graph Builder
 *
 * Builds topology graphs from Kubernetes resources
 */

import type {
  TopologyGraph,
  TopologyNode,
  TopologyEdge,
  NodeType,
  EdgeType,
  ResourceStatus
} from './types'

export class TopologyGraphBuilder {
  /**
   * Build topology graph from Kubernetes resources
   */
  async buildGraph(resources: any[], namespace?: string): Promise<TopologyGraph> {
    // Convert resources to nodes
    const nodes = this.resourcesToNodes(resources)

    // Extract relationships (edges)
    const edges = this.extractRelationships(resources, nodes)

    return {
      nodes,
      edges,
      metadata: {
        clusterName: 'default', // TODO: Get from context
        namespace,
        generatedAt: Date.now(),
        resourceCount: resources.length
      }
    }
  }

  /**
   * Convert Kubernetes resources to topology nodes
   */
  private resourcesToNodes(resources: any[]): TopologyNode[] {
    return resources.map(resource => {
      const metadata = resource.metadata || {}
      const status = this.determineResourceStatus(resource)

      return {
        id: metadata.uid || `${metadata.namespace}-${metadata.name}`,
        type: resource.kind?.toLowerCase() as NodeType,
        data: {
          resource,
          label: metadata.name || 'Unnamed',
          namespace: metadata.namespace || 'default',
          status,
          metadata: {
            created: metadata.creationTimestamp
              ? new Date(metadata.creationTimestamp).getTime()
              : Date.now(),
            labels: metadata.labels || {},
            annotations: metadata.annotations || {}
          }
        },
        position: { x: 0, y: 0 } // Position will be calculated by layout algorithm
      }
    })
  }

  /**
   * Extract relationships between resources
   */
  private extractRelationships(resources: any[], nodes: TopologyNode[]): TopologyEdge[] {
    const edges: TopologyEdge[] = []
    const nodeMap = new Map(nodes.map(n => [n.id, n]))

    for (const resource of resources) {
      const metadata = resource.metadata || {}
      const nodeId = metadata.uid || `${metadata.namespace}-${metadata.name}`

      // Owner references (Deployment -> ReplicaSet -> Pod)
      if (metadata.ownerReferences) {
        for (const owner of metadata.ownerReferences) {
          const ownerId = owner.uid
          if (nodeMap.has(ownerId)) {
            edges.push({
              id: `${ownerId}-${nodeId}`,
              source: ownerId,
              target: nodeId,
              type: 'owns' as EdgeType
            })
          }
        }
      }

      // Service -> Pod (via selectors)
      if (resource.kind === 'Service' && resource.spec?.selector) {
        const matchingPods = this.findPodsBySelector(resources, resource.spec.selector)
        for (const pod of matchingPods) {
          const podId = pod.metadata.uid || `${pod.metadata.namespace}-${pod.metadata.name}`
          if (nodeMap.has(podId)) {
            edges.push({
              id: `${nodeId}-${podId}`,
              source: nodeId,
              target: podId,
              type: 'exposes' as EdgeType
            })
          }
        }
      }

      // Ingress -> Service
      if (resource.kind === 'Ingress' && resource.spec?.rules) {
        for (const rule of resource.spec.rules) {
          for (const path of rule.http?.paths || []) {
            const serviceName = path.backend?.service?.name
            if (serviceName) {
              const service = this.findServiceByName(resources, serviceName, metadata.namespace)
              if (service) {
                const serviceId = service.metadata.uid ||
                  `${service.metadata.namespace}-${service.metadata.name}`
                if (nodeMap.has(serviceId)) {
                  edges.push({
                    id: `${nodeId}-${serviceId}`,
                    source: nodeId,
                    target: serviceId,
                    type: 'routes' as EdgeType,
                    label: path.path
                  })
                }
              }
            }
          }
        }
      }

      // Pod mounts (ConfigMap, Secret, PVC)
      if (resource.kind === 'Pod' && resource.spec?.volumes) {
        for (const volume of resource.spec.volumes) {
          let mountResourceId: string | null = null

          if (volume.configMap) {
            const cm = this.findResourceByName(
              resources,
              'ConfigMap',
              volume.configMap.name,
              metadata.namespace
            )
            if (cm) {
              mountResourceId = cm.metadata.uid ||
                `${cm.metadata.namespace}-${cm.metadata.name}`
            }
          } else if (volume.secret) {
            const secret = this.findResourceByName(
              resources,
              'Secret',
              volume.secret.secretName,
              metadata.namespace
            )
            if (secret) {
              mountResourceId = secret.metadata.uid ||
                `${secret.metadata.namespace}-${secret.metadata.name}`
            }
          } else if (volume.persistentVolumeClaim) {
            const pvc = this.findResourceByName(
              resources,
              'PersistentVolumeClaim',
              volume.persistentVolumeClaim.claimName,
              metadata.namespace
            )
            if (pvc) {
              mountResourceId = pvc.metadata.uid ||
                `${pvc.metadata.namespace}-${pvc.metadata.name}`
            }
          }

          if (mountResourceId && nodeMap.has(mountResourceId)) {
            edges.push({
              id: `${nodeId}-${mountResourceId}`,
              source: nodeId,
              target: mountResourceId,
              type: 'mounts' as EdgeType,
              label: volume.name
            })
          }
        }
      }
    }

    return edges
  }

  /**
   * Find pods matching a label selector
   */
  private findPodsBySelector(resources: any[], selector: Record<string, string>): any[] {
    return resources.filter(resource => {
      if (resource.kind !== 'Pod') return false

      const labels = resource.metadata?.labels || {}
      return Object.entries(selector).every(([key, value]) => labels[key] === value)
    })
  }

  /**
   * Find service by name and namespace
   */
  private findServiceByName(resources: any[], name: string, namespace: string): any | null {
    return resources.find(resource =>
      resource.kind === 'Service' &&
      resource.metadata?.name === name &&
      resource.metadata?.namespace === namespace
    ) || null
  }

  /**
   * Find resource by kind, name, and namespace
   */
  private findResourceByName(
    resources: any[],
    kind: string,
    name: string,
    namespace: string
  ): any | null {
    return resources.find(resource =>
      resource.kind === kind &&
      resource.metadata?.name === name &&
      resource.metadata?.namespace === namespace
    ) || null
  }

  /**
   * Determine resource health status
   */
  private determineResourceStatus(resource: any): ResourceStatus {
    if (!resource.status) return 'unknown' as ResourceStatus

    // Pod status
    if (resource.kind === 'Pod') {
      const phase = resource.status.phase
      if (phase === 'Running' || phase === 'Succeeded') {
        return 'healthy' as ResourceStatus
      }
      if (phase === 'Pending') {
        return 'warning' as ResourceStatus
      }
      if (phase === 'Failed' || phase === 'Unknown') {
        return 'error' as ResourceStatus
      }
    }

    // Deployment status
    if (resource.kind === 'Deployment') {
      const replicas = resource.spec?.replicas || 0
      const available = resource.status?.availableReplicas || 0
      if (available >= replicas) {
        return 'healthy' as ResourceStatus
      }
      if (available > 0) {
        return 'warning' as ResourceStatus
      }
      return 'error' as ResourceStatus
    }

    // Service status
    if (resource.kind === 'Service') {
      // Services are generally healthy if they exist
      return 'healthy' as ResourceStatus
    }

    return 'unknown' as ResourceStatus
  }
}

// Singleton instance
export const topologyGraphBuilder = new TopologyGraphBuilder()
