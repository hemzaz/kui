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
 * Cluster snapshot - point-in-time state sent to AI
 * (Renamed from ClusterContext to avoid confusion with kubectl context)
 */
export interface ClusterSnapshot {
  cluster: {
    name: string
    version: string
    provider: 'eks' | 'gke' | 'aks' | 'kind' | 'minikube' | 'unknown'
    nodeCount: number
  }

  namespace: {
    name: string
    resourceCounts: {
      pods: number
      services: number
      deployments: number
      configmaps: number
      secrets: number
    }
  }

  currentResource?: {
    kind: string
    name: string
    namespace: string
    status?: unknown
    events?: KubernetesEvent[]
    logs?: string[]
    manifest?: unknown
  }

  recentChanges?: {
    timestamp: Date
    resource: string
    action: 'create' | 'update' | 'delete'
  }[]

  /** Metadata for context window optimization */
  tokenEstimate: number
  priority: 'high' | 'medium' | 'low'
}

/**
 * Kubernetes event
 */
export interface KubernetesEvent {
  type: 'Normal' | 'Warning'
  reason: string
  message: string
  timestamp: Date
  involvedObject: {
    kind: string
    name: string
    namespace: string
  }
}
