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

import type REPL from '@kui-shell/core/mdist/models/repl'
import type { RawContent } from '@kui-shell/core/mdist/models/entity'
import type { ClusterSnapshot, KubernetesEvent } from '../types/cluster-types'

/**
 * Options for capturing cluster snapshot
 */
interface CaptureOptions {
  namespace?: string
  resource?: {
    kind: string
    name: string
    namespace: string
  }
  includeLogs?: boolean
  includeEvents?: boolean
  includeManifest?: boolean
}

/**
 * Raw response with stdout content
 */
interface StdoutResponse extends RawContent {
  stdout: string
}

/**
 * ClusterDataCollector gathers Kubernetes cluster information for AI context
 */
export class ClusterDataCollector {
  private repl: REPL

  public constructor(repl: REPL) {
    this.repl = repl
  }

  /**
   * Capture current cluster state for AI prompt
   * (Renamed from collectContext to avoid confusion with kubectl context)
   */
  public async captureClusterSnapshot(options: CaptureOptions = {}): Promise<ClusterSnapshot> {
    const namespace = options.namespace || 'default'

    // Gather cluster and namespace info in parallel
    const [clusterInfo, namespaceInfo] = await Promise.all([this.getClusterInfo(), this.getNamespaceInfo(namespace)])

    // Gather resource-specific context if requested
    let currentResource
    if (options.resource) {
      currentResource = await this.getResourceContext(
        options.resource,
        options.includeLogs ?? false,
        options.includeEvents ?? false,
        options.includeManifest ?? false
      )
    }

    const snapshot: ClusterSnapshot = {
      cluster: clusterInfo,
      namespace: namespaceInfo,
      currentResource,
      tokenEstimate: this.estimateTokens(clusterInfo, namespaceInfo, currentResource),
      priority: this.determinePriority(currentResource)
    }

    return snapshot
  }

  /**
   * Get cluster information (version, provider, node count)
   */
  private async getClusterInfo() {
    try {
      // Get Kubernetes version
      const versionOutput = await this.execKubectl('kubectl version --short 2>/dev/null || kubectl version 2>/dev/null')

      // Get node count
      const nodesOutput = await this.execKubectl('kubectl get nodes --no-headers 2>/dev/null')

      // Get current context name
      const contextName = await this.execKubectl('kubectl config current-context 2>/dev/null')

      const version = this.parseKubeVersion(versionOutput)
      const nodeCount = this.countLines(nodesOutput)
      const provider = this.detectProvider(contextName.trim())

      return {
        name: contextName.trim() || 'unknown',
        version,
        provider,
        nodeCount
      }
    } catch (_error) {
      console.warn('Failed to get cluster info:', _error)
      return {
        name: 'unknown',
        version: 'unknown',
        provider: 'unknown' as const,
        nodeCount: 0
      }
    }
  }

  /**
   * Get namespace information (resource counts)
   */
  private async getNamespaceInfo(namespace: string) {
    try {
      // Fetch resource counts in parallel
      const [podsOutput, servicesOutput, deploymentsOutput, configmapsOutput, secretsOutput] = await Promise.all([
        this.safeExecKubectl(`kubectl get pods -n ${namespace} --no-headers 2>/dev/null`),
        this.safeExecKubectl(`kubectl get services -n ${namespace} --no-headers 2>/dev/null`),
        this.safeExecKubectl(`kubectl get deployments -n ${namespace} --no-headers 2>/dev/null`),
        this.safeExecKubectl(`kubectl get configmaps -n ${namespace} --no-headers 2>/dev/null`),
        this.safeExecKubectl(`kubectl get secrets -n ${namespace} --no-headers 2>/dev/null`)
      ])

      return {
        name: namespace,
        resourceCounts: {
          pods: this.countLines(podsOutput),
          services: this.countLines(servicesOutput),
          deployments: this.countLines(deploymentsOutput),
          configmaps: this.countLines(configmapsOutput),
          secrets: this.countLines(secretsOutput)
        }
      }
    } catch (error) {
      console.warn('Failed to get namespace info:', error)
      return {
        name: namespace,
        resourceCounts: {
          pods: 0,
          services: 0,
          deployments: 0,
          configmaps: 0,
          secrets: 0
        }
      }
    }
  }

  /**
   * Get resource-specific context (status, events, logs, manifest)
   */
  private async getResourceContext(
    resource: { kind: string; name: string; namespace: string },
    includeLogs: boolean,
    includeEvents: boolean,
    includeManifest: boolean
  ) {
    try {
      const tasks: Array<Promise<unknown>> = []

      // Get resource status (always included)
      tasks.push(this.getResourceStatus(resource))

      // Get events if requested
      if (includeEvents) {
        tasks.push(this.getResourceEvents(resource))
      } else {
        tasks.push(Promise.resolve(undefined))
      }

      // Get logs if requested and resource is a pod
      if (includeLogs && resource.kind.toLowerCase() === 'pod') {
        tasks.push(this.getResourceLogs(resource))
      } else {
        tasks.push(Promise.resolve(undefined))
      }

      // Get manifest if requested
      if (includeManifest) {
        tasks.push(this.getResourceManifest(resource))
      } else {
        tasks.push(Promise.resolve(undefined))
      }

      const [status, events, logs, manifest] = await Promise.all(tasks)

      return {
        kind: resource.kind,
        name: resource.name,
        namespace: resource.namespace,
        status,
        events,
        logs,
        manifest
      }
    } catch (error) {
      console.warn('Failed to get resource context:', error)
      return {
        kind: resource.kind,
        name: resource.name,
        namespace: resource.namespace
      }
    }
  }

  /**
   * Get resource status
   */
  private async getResourceStatus(resource: { kind: string; name: string; namespace: string }) {
    try {
      const output = await this.execKubectl(
        `kubectl get ${resource.kind} ${resource.name} -n ${resource.namespace} -o json 2>/dev/null`
      )
      const parsed = JSON.parse(output)
      return parsed.status
    } catch (error) {
      console.warn('Failed to get resource status:', error)
      return null
    }
  }

  /**
   * Get resource events
   */
  private async getResourceEvents(resource: {
    kind: string
    name: string
    namespace: string
  }): Promise<KubernetesEvent[] | undefined> {
    try {
      const output = await this.execKubectl(
        `kubectl get events -n ${resource.namespace} --field-selector involvedObject.name=${resource.name} -o json 2>/dev/null`
      )
      const parsed = JSON.parse(output)

      if (!parsed.items || !Array.isArray(parsed.items)) {
        return []
      }

      return parsed.items.map((event: unknown) => {
        const e = event as Record<string, unknown>
        return {
          type: e.type as 'Normal' | 'Warning',
          reason: e.reason,
          message: e.message,
          timestamp: new Date((e.lastTimestamp || e.firstTimestamp || e.eventTime) as string),
          involvedObject: {
            kind: (e.involvedObject as Record<string, unknown>).kind,
            name: (e.involvedObject as Record<string, unknown>).name,
            namespace: (e.involvedObject as Record<string, unknown>).namespace
          }
        }
      })
    } catch (error) {
      console.warn('Failed to get resource events:', error)
      return []
    }
  }

  /**
   * Get resource logs (for pods only)
   */
  private async getResourceLogs(resource: { name: string; namespace: string }): Promise<string[] | undefined> {
    try {
      const output = await this.execKubectl(
        `kubectl logs ${resource.name} -n ${resource.namespace} --tail=100 2>/dev/null`
      )
      return output.split('\n').filter(line => line.trim())
    } catch (error) {
      console.warn('Failed to get resource logs:', error)
      return []
    }
  }

  /**
   * Get resource manifest (YAML)
   */
  private async getResourceManifest(resource: { kind: string; name: string; namespace: string }) {
    try {
      const output = await this.execKubectl(
        `kubectl get ${resource.kind} ${resource.name} -n ${resource.namespace} -o yaml 2>/dev/null`
      )
      return output
    } catch (error) {
      console.warn('Failed to get resource manifest:', error)
      return null
    }
  }

  /**
   * Execute kubectl command via REPL and return stdout
   */
  private async execKubectl(command: string): Promise<string> {
    const result = await this.repl.rexec<StdoutResponse>(command)
    return result.content.stdout || ''
  }

  /**
   * Safely execute kubectl command and return stdout (empty string on error)
   */
  private async safeExecKubectl(command: string): Promise<string> {
    try {
      return await this.execKubectl(command)
    } catch {
      return ''
    }
  }

  /**
   * Parse Kubernetes version from kubectl version output
   */
  private parseKubeVersion(output: string): string {
    // Try to match "Server Version: v1.28.0" or "v1.28.0"
    const match = output.match(/Server Version:\s*v?(\d+\.\d+\.\d+)|v(\d+\.\d+\.\d+)/)
    if (match) {
      return match[1] || match[2]
    }
    return 'unknown'
  }

  /**
   * Detect cloud provider from context name
   */
  private detectProvider(context: string): 'eks' | 'gke' | 'aks' | 'kind' | 'minikube' | 'unknown' {
    const lowerContext = context.toLowerCase()

    if (lowerContext.includes('eks') || lowerContext.includes('amazon') || lowerContext.includes('aws')) {
      return 'eks'
    }
    if (lowerContext.includes('gke') || lowerContext.includes('google')) {
      return 'gke'
    }
    if (lowerContext.includes('aks') || lowerContext.includes('azure')) {
      return 'aks'
    }
    if (lowerContext.includes('kind')) {
      return 'kind'
    }
    if (lowerContext.includes('minikube')) {
      return 'minikube'
    }

    return 'unknown'
  }

  /**
   * Count non-empty lines in output
   */
  private countLines(output: string): number {
    return output.split('\n').filter(line => line.trim()).length
  }

  /**
   * Estimate token count for the snapshot
   * (Rough estimation: 1 token ≈ 4 characters)
   */
  private estimateTokens(clusterInfo: unknown, namespaceInfo: unknown, resourceInfo: unknown): number {
    const clusterTokens = JSON.stringify(clusterInfo).length / 4
    const namespaceTokens = JSON.stringify(namespaceInfo).length / 4
    const resourceTokens = resourceInfo ? JSON.stringify(resourceInfo).length / 4 : 0

    return Math.ceil(clusterTokens + namespaceTokens + resourceTokens)
  }

  /**
   * Determine priority based on resource state
   */
  private determinePriority(resourceInfo: unknown): 'high' | 'medium' | 'low' {
    if (!resourceInfo) {
      return 'low'
    }

    const resource = resourceInfo as Record<string, unknown>

    // High priority if there are warning events
    if (resource.events && Array.isArray(resource.events)) {
      const hasWarnings = resource.events.some((e: KubernetesEvent) => e.type === 'Warning')
      if (hasWarnings) {
        return 'high'
      }
    }

    // Medium priority if there are logs or manifest
    if ((resource.logs && Array.isArray(resource.logs) && resource.logs.length > 0) || resource.manifest) {
      return 'medium'
    }

    return 'low'
  }
}
