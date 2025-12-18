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
 * Visual Topology Types
 *
 * Type definitions for Kubernetes resource topology visualization
 */

export interface TopologyGraph {
  nodes: TopologyNode[]
  edges: TopologyEdge[]
  metadata: GraphMetadata
}

export interface TopologyNode {
  id: string
  type: NodeType
  data: NodeData
  position: { x: number; y: number }
}

export enum NodeType {
  Pod = 'pod',
  Service = 'service',
  Deployment = 'deployment',
  StatefulSet = 'statefulset',
  DaemonSet = 'daemonset',
  ReplicaSet = 'replicaset',
  ConfigMap = 'configmap',
  Secret = 'secret',
  PVC = 'pvc',
  Ingress = 'ingress',
  NetworkPolicy = 'networkpolicy',
  Node = 'node',
  Namespace = 'namespace'
}

export interface NodeData {
  resource: any // Kubernetes resource
  label: string
  namespace: string
  status: ResourceStatus
  metadata: {
    created: number
    labels: Record<string, string>
    annotations: Record<string, string>
  }
}

export interface TopologyEdge {
  id: string
  source: string
  target: string
  type: EdgeType
  label?: string
  animated?: boolean
}

export enum EdgeType {
  Owns = 'owns',           // Deployment owns ReplicaSet
  Manages = 'manages',     // ReplicaSet manages Pod
  Exposes = 'exposes',     // Service exposes Pods
  Mounts = 'mounts',       // Pod mounts ConfigMap/Secret/PVC
  Routes = 'routes',       // Ingress routes to Service
  Allows = 'allows',       // NetworkPolicy allows traffic
  Denies = 'denies'        // NetworkPolicy denies traffic
}

export enum ResourceStatus {
  Healthy = 'healthy',
  Warning = 'warning',
  Error = 'error',
  Unknown = 'unknown'
}

export interface GraphMetadata {
  clusterName: string
  namespace?: string
  generatedAt: number
  resourceCount: number
}

export interface TopologyFilters {
  nodeTypes: NodeType[]
  namespaces: string[]
  statuses: ResourceStatus[]
  search: string
}

export enum LayoutType {
  Hierarchical = 'hierarchical',
  ForceDirected = 'force-directed',
  Circular = 'circular',
  Grid = 'grid'
}

export interface NetworkTopology {
  nodes: NetworkNode[]
  connections: NetworkConnection[]
  policies: any[]
}

export interface NetworkNode {
  id: string
  type: 'pod' | 'service' | 'external'
  labels: Record<string, string>
  namespace: string
}

export interface NetworkConnection {
  from: string
  to: string
  allowed: boolean
  ports: number[]
  protocol: string
}
