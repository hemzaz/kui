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

import type REPL from '@kui-shell/core/mdist/models/repl'
import type { RawContent } from '@kui-shell/core/mdist/models/entity'
import type { KubernetesEvent } from '../types/cluster-types'

/**
 * Resource metrics for quick insights
 */
export interface ResourceMetrics {
  cpu?: string
  memory?: string
  restarts?: number
  age?: string
}

/**
 * Related resource information
 */
export interface RelatedResource {
  kind: string
  name: string
  status?: string
}

/**
 * Minimal resource context for context menu operations
 *
 * This is optimized for speed - only essential data for quick insights
 */
export interface ResourceContext {
  /** Resource kind (Pod, Deployment, Service, etc.) */
  kind: string

  /** Resource name */
  name: string

  /** Resource namespace */
  namespace: string

  /** Current status/phase (minimal) */
  status?: Record<string, unknown>

  /** Recent events (last 5, warnings prioritized) */
  events?: KubernetesEvent[]

  /** Basic metrics if available */
  metrics?: ResourceMetrics

  /** Related resources (e.g., pods for deployment) */
  relatedResources?: RelatedResource[]

  /** Container name for pods */
  containerName?: string

  /** Labels */
  labels?: Record<string, string>

  /** Annotations */
  annotations?: Record<string, string>
}

/**
 * Raw response with stdout content
 */
interface StdoutResponse extends RawContent {
  stdout: string
}

/**
 * ResourceContextExtractor extracts minimal context for context menu operations
 *
 * Performance characteristics:
 * - Target extraction time: < 500ms
 * - Minimal kubectl calls (2-3 max)
 * - Parallel execution where possible
 * - No heavy processing (logs, manifests only on demand)
 */
export class ResourceContextExtractor {
  private repl: REPL

  public constructor(repl: REPL) {
    this.repl = repl
  }

  /**
   * Extract resource context for quick insights
   *
   * @param kind - Resource kind
   * @param name - Resource name
   * @param namespace - Resource namespace
   * @param includeMetrics - Whether to fetch metrics (adds latency)
   * @returns Resource context
   */
  public async extractContext(
    kind: string,
    name: string,
    namespace: string,
    includeMetrics: boolean = false
  ): Promise<ResourceContext> {
    const startTime = Date.now()

    try {
      // Fetch resource JSON and events in parallel
      const [resourceJson, events] = await Promise.all([
        this.getResourceJson(kind, name, namespace),
        this.getRecentEvents(kind, name, namespace)
      ])

      // Extract status
      const status = this.extractStatus(resourceJson)

      // Extract labels and annotations
      const labels = ((resourceJson.metadata as Record<string, unknown> | undefined)?.labels) as Record<string, string> | undefined
      const annotations = ((resourceJson.metadata as Record<string, unknown> | undefined)?.annotations) as Record<string, string> | undefined

      // Get metrics if requested (adds ~100-200ms)
      const metrics = includeMetrics ? await this.getMetrics(kind, name, namespace) : undefined

      // Get related resources based on kind
      const relatedResources = await this.getRelatedResources(kind, name, namespace, resourceJson)

      // Extract container name for pods
      const containerName = kind.toLowerCase() === 'pod' ? this.extractContainerName(resourceJson) : undefined

      const context: ResourceContext = {
        kind,
        name,
        namespace,
        status,
        events,
        metrics,
        relatedResources,
        containerName,
        labels,
        annotations
      }

      const extractionTime = Date.now() - startTime
      console.debug(`[ResourceContextExtractor] Extracted context in ${extractionTime}ms`)

      return context
    } catch (error) {
      console.error('[ResourceContextExtractor] Failed to extract context:', error)

      // Return minimal context on error
      return {
        kind,
        name,
        namespace
      }
    }
  }

  /**
   * Get resource as JSON
   */
  private async getResourceJson(kind: string, name: string, namespace: string): Promise<Record<string, unknown>> {
    try {
      const output = await this.execKubectl(
        `kubectl get ${kind.toLowerCase()} ${name} -n ${namespace} -o json 2>/dev/null`
      )
      return JSON.parse(output) as Record<string, unknown>
    } catch (error) {
      console.warn('[ResourceContextExtractor] Failed to get resource JSON:', error)
      return {}
    }
  }

  /**
   * Extract minimal status from resource JSON
   */
  private extractStatus(resourceJson: Record<string, unknown>): Record<string, unknown> | undefined {
    const status = resourceJson.status as Record<string, unknown> | undefined
    if (!status) {
      return undefined
    }

    // Extract only essential status fields for quick insights
    const essentialFields: Record<string, unknown> = {}

    // Common status fields
    if (status.phase) essentialFields.phase = status.phase
    if (status.state) essentialFields.state = status.state
    if (status.conditions) {
      // Only include Failed/Warning conditions
      const conditions = status.conditions as Array<Record<string, unknown>>
      const criticalConditions = conditions.filter(
        c => c.status === 'False' || c.type === 'Warning' || c.type === 'Failed'
      )
      if (criticalConditions.length > 0) {
        essentialFields.conditions = criticalConditions
      }
    }

    // Pod-specific
    if (status.containerStatuses) {
      const containers = status.containerStatuses as Array<Record<string, unknown>>
      essentialFields.containerStatuses = containers.map(c => ({
        name: c.name,
        ready: c.ready,
        restartCount: c.restartCount,
        state: c.state,
        lastState: c.lastState
      }))
    }

    // Deployment-specific
    if (status.replicas !== undefined) essentialFields.replicas = status.replicas
    if (status.readyReplicas !== undefined) essentialFields.readyReplicas = status.readyReplicas
    if (status.availableReplicas !== undefined) essentialFields.availableReplicas = status.availableReplicas

    // Service-specific
    if (status.loadBalancer) essentialFields.loadBalancer = status.loadBalancer

    return Object.keys(essentialFields).length > 0 ? essentialFields : undefined
  }

  /**
   * Get recent events (last 5, warnings first)
   */
  private async getRecentEvents(kind: string, name: string, namespace: string): Promise<KubernetesEvent[]> {
    try {
      const output = await this.execKubectl(
        `kubectl get events -n ${namespace} --field-selector involvedObject.name=${name} -o json 2>/dev/null`
      )
      const parsed = JSON.parse(output) as { items: Array<Record<string, unknown>> }

      if (!parsed.items || !Array.isArray(parsed.items)) {
        return []
      }

      // Convert to KubernetesEvent and sort by timestamp (most recent first)
      const events: KubernetesEvent[] = parsed.items
        .map(event => ({
          type: event.type as 'Normal' | 'Warning',
          reason: event.reason as string,
          message: event.message as string,
          timestamp: new Date((event.lastTimestamp || event.firstTimestamp || event.eventTime) as string),
          involvedObject: {
            kind: (event.involvedObject as Record<string, unknown>).kind as string,
            name: (event.involvedObject as Record<string, unknown>).name as string,
            namespace: (event.involvedObject as Record<string, unknown>).namespace as string
          }
        }))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      // Prioritize warnings, then take last 5
      const warnings = events.filter(e => e.type === 'Warning').slice(0, 3)
      const normals = events.filter(e => e.type === 'Normal').slice(0, 2)

      return [...warnings, ...normals].slice(0, 5)
    } catch (error) {
      console.warn('[ResourceContextExtractor] Failed to get events:', error)
      return []
    }
  }

  /**
   * Get resource metrics if metrics-server is available
   */
  private async getMetrics(kind: string, name: string, namespace: string): Promise<ResourceMetrics | undefined> {
    try {
      if (kind.toLowerCase() === 'pod') {
        const output = await this.execKubectl(`kubectl top pod ${name} -n ${namespace} --no-headers 2>/dev/null`)

        // Parse output: NAME CPU(cores) MEMORY(bytes)
        const parts = output.trim().split(/\s+/)
        if (parts.length >= 3) {
          return {
            cpu: parts[1],
            memory: parts[2]
          }
        }
      } else if (kind.toLowerCase() === 'node') {
        const output = await this.execKubectl(`kubectl top node ${name} --no-headers 2>/dev/null`)

        const parts = output.trim().split(/\s+/)
        if (parts.length >= 3) {
          return {
            cpu: parts[1],
            memory: parts[2]
          }
        }
      }
    } catch (error) {
      // Metrics server might not be available, ignore
      console.debug('[ResourceContextExtractor] Metrics not available')
    }

    return undefined
  }

  /**
   * Get related resources based on resource kind
   */
  private async getRelatedResources(
    kind: string,
    name: string,
    namespace: string,
    resourceJson: Record<string, unknown>
  ): Promise<RelatedResource[] | undefined> {
    try {
      const lowerKind = kind.toLowerCase()

      // Deployment -> Pods
      if (lowerKind === 'deployment') {
        const labels = (resourceJson.spec as Record<string, unknown>)?.selector as
          | Record<string, unknown>
          | undefined
        const matchLabels = labels?.matchLabels as Record<string, string> | undefined

        if (matchLabels) {
          const labelSelector = Object.entries(matchLabels)
            .map(([key, value]) => `${key}=${value}`)
            .join(',')

          const output = await this.execKubectl(
            `kubectl get pods -n ${namespace} -l ${labelSelector} -o json 2>/dev/null`
          )
          const parsed = JSON.parse(output) as { items: Array<Record<string, unknown>> }

          return parsed.items.slice(0, 5).map(pod => ({
            kind: 'Pod',
            name: (pod.metadata as Record<string, unknown>).name as string,
            status: (pod.status as Record<string, unknown>)?.phase as string | undefined
          }))
        }
      }

      // Service -> Pods (via endpoints)
      if (lowerKind === 'service') {
        const output = await this.execKubectl(`kubectl get endpoints ${name} -n ${namespace} -o json 2>/dev/null`)
        const parsed = JSON.parse(output) as Record<string, unknown>
        const subsets = parsed.subsets as Array<Record<string, unknown>> | undefined

        if (subsets && subsets.length > 0) {
          const addresses = subsets[0].addresses as Array<Record<string, unknown>> | undefined
          if (addresses) {
            return addresses.slice(0, 5).map(addr => {
              const targetRef = addr.targetRef as Record<string, unknown> | undefined
              return {
                kind: (targetRef?.kind as string) || 'Pod',
                name: (targetRef?.name as string) || 'unknown'
              }
            })
          }
        }
      }

      // Pod -> Node
      if (lowerKind === 'pod') {
        const nodeName = (resourceJson.spec as Record<string, unknown>)?.nodeName as string | undefined
        if (nodeName) {
          return [
            {
              kind: 'Node',
              name: nodeName
            }
          ]
        }
      }
    } catch (error) {
      console.debug('[ResourceContextExtractor] Could not get related resources:', error)
    }

    return undefined
  }

  /**
   * Extract primary container name from pod
   */
  private extractContainerName(podJson: Record<string, unknown>): string | undefined {
    const spec = podJson.spec as Record<string, unknown> | undefined
    const containers = spec?.containers as Array<Record<string, unknown>> | undefined

    if (containers && containers.length > 0) {
      // Return first container name
      return containers[0].name as string
    }

    return undefined
  }

  /**
   * Execute kubectl command via REPL
   */
  private async execKubectl(command: string): Promise<string> {
    const result = await this.repl.rexec<StdoutResponse>(command)
    return result.content.stdout || ''
  }
}

/**
 * Helper function to extract context from a table row click
 *
 * @param repl - REPL instance
 * @param kind - Resource kind
 * @param name - Resource name
 * @param namespace - Resource namespace
 * @returns Resource context
 */
export async function extractResourceContext(
  repl: REPL,
  kind: string,
  name: string,
  namespace: string
): Promise<ResourceContext> {
  const extractor = new ResourceContextExtractor(repl)
  return extractor.extractContext(kind, name, namespace, true)
}

/**
 * Helper function to extract context quickly without metrics
 *
 * @param repl - REPL instance
 * @param kind - Resource kind
 * @param name - Resource name
 * @param namespace - Resource namespace
 * @returns Resource context
 */
export async function extractResourceContextFast(
  repl: REPL,
  kind: string,
  name: string,
  namespace: string
): Promise<ResourceContext> {
  const extractor = new ResourceContextExtractor(repl)
  return extractor.extractContext(kind, name, namespace, false)
}
