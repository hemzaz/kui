# Visual Topology Architecture

## Overview

Visual Topology provides interactive graph visualizations of Kubernetes resource relationships and network connections. Users can see how resources relate to each other and understand cluster topology visually.

## Goals

- **Resource Relationships**: Visualize relationships between Pods, Services, Deployments, etc.
- **Network Topology**: Show network policies, service connections, ingress routes
- **Interactive Exploration**: Click, zoom, filter, and navigate the graph
- **Real-time Updates**: Reflect cluster changes in real-time
- **Performance**: Handle large clusters (1000+ resources)

## Library Selection: React Flow

**Chosen**: [React Flow](https://reactflow.dev/) v11

### Why React Flow?

- **React-native**: Built for React, excellent TypeScript support
- **Performance**: Virtual rendering, handles 1000+ nodes
- **Features**: Zooming, panning, minimap, node dragging
- **Customization**: Custom nodes, edges, and interactions
- **Layout**: Built-in and custom layout algorithms
- **Active Development**: Well-maintained, good documentation

### Alternatives Considered

- **Cytoscape.js**: More features but heavier, older API
- **D3.js**: Powerful but lower-level, more complex
- **vis.js**: Good but less React-friendly

## Architecture

### Data Model

```typescript
interface TopologyGraph {
  nodes: TopologyNode[]
  edges: TopologyEdge[]
  metadata: GraphMetadata
}

interface TopologyNode {
  id: string
  type: NodeType
  data: NodeData
  position: { x: number; y: number }
}

enum NodeType {
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
  NetworkPolicy = 'networkpolicy'
}

interface NodeData {
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

interface TopologyEdge {
  id: string
  source: string
  target: string
  type: EdgeType
  label?: string
  animated?: boolean
}

enum EdgeType {
  Owns = 'owns',           // Deployment owns ReplicaSet
  Manages = 'manages',     // ReplicaSet manages Pod
  Exposes = 'exposes',     // Service exposes Pods
  Mounts = 'mounts',       // Pod mounts ConfigMap/Secret/PVC
  Routes = 'routes',       // Ingress routes to Service
  Allows = 'allows',       // NetworkPolicy allows traffic
  Denies = 'denies'        // NetworkPolicy denies traffic
}

enum ResourceStatus {
  Healthy = 'healthy',
  Warning = 'warning',
  Error = 'error',
  Unknown = 'unknown'
}

interface GraphMetadata {
  clusterName: string
  namespace?: string
  generatedAt: number
  resourceCount: number
}
```

### Component Hierarchy

```
TopologyView
├── TopologyToolbar
│   ├── LayoutSelector (hierarchical, force-directed, circular)
│   ├── FilterPanel (by type, namespace, status)
│   ├── ZoomControls
│   └── ExportButton
├── ReactFlow
│   ├── CustomNodes
│   │   ├── PodNode
│   │   ├── ServiceNode
│   │   ├── DeploymentNode
│   │   └── ...
│   ├── CustomEdges
│   │   ├── OwnershipEdge
│   │   ├── NetworkEdge
│   │   └── ...
│   └── MiniMap
└── SidePanel
    ├── NodeDetails
    ├── EdgeDetails
    └── Actions
```

### State Management

```typescript
interface TopologyStore {
  // State
  graph: TopologyGraph | null
  selectedNodes: string[]
  selectedEdges: string[]
  filters: TopologyFilters
  layout: LayoutType

  // Computed
  visibleNodes: () => TopologyNode[]
  visibleEdges: () => TopologyEdge[]

  // Actions
  loadGraph: (namespace?: string) => Promise<void>
  selectNode: (id: string) => void
  selectEdge: (id: string) => void
  setFilters: (filters: TopologyFilters) => void
  setLayout: (layout: LayoutType) => void
  refresh: () => Promise<void>
}

interface TopologyFilters {
  nodeTypes: NodeType[]
  namespaces: string[]
  statuses: ResourceStatus[]
  search: string
}

enum LayoutType {
  Hierarchical = 'hierarchical',
  ForceDirected = 'force-directed',
  Circular = 'circular',
  Grid = 'grid'
}
```

## Graph Generation

### Resource Relationship Extraction

```typescript
class TopologyGraphBuilder {
  /**
   * Build topology graph from Kubernetes resources
   */
  async buildGraph(namespace?: string): Promise<TopologyGraph> {
    // Fetch all resources
    const resources = await this.fetchResources(namespace)

    // Convert to nodes
    const nodes = this.resourcesToNodes(resources)

    // Extract relationships (edges)
    const edges = this.extractRelationships(resources)

    // Calculate positions
    const positioned = await this.applyLayout(nodes, edges)

    return {
      nodes: positioned,
      edges,
      metadata: {
        clusterName: await this.getClusterName(),
        namespace,
        generatedAt: Date.now(),
        resourceCount: resources.length
      }
    }
  }

  /**
   * Extract relationships between resources
   */
  private extractRelationships(resources: any[]): TopologyEdge[] {
    const edges: TopologyEdge[] = []

    for (const resource of resources) {
      // Owner references (Deployment -> ReplicaSet -> Pod)
      if (resource.metadata.ownerReferences) {
        for (const owner of resource.metadata.ownerReferences) {
          edges.push({
            id: `${owner.uid}-${resource.metadata.uid}`,
            source: owner.uid,
            target: resource.metadata.uid,
            type: EdgeType.Owns
          })
        }
      }

      // Service -> Pod (via selectors)
      if (resource.kind === 'Service' && resource.spec.selector) {
        const matchingPods = this.findPodsBySelector(resources, resource.spec.selector)
        for (const pod of matchingPods) {
          edges.push({
            id: `${resource.metadata.uid}-${pod.metadata.uid}`,
            source: resource.metadata.uid,
            target: pod.metadata.uid,
            type: EdgeType.Exposes
          })
        }
      }

      // Ingress -> Service
      if (resource.kind === 'Ingress' && resource.spec.rules) {
        for (const rule of resource.spec.rules) {
          for (const path of rule.http?.paths || []) {
            const service = this.findServiceByName(resources, path.backend.service.name)
            if (service) {
              edges.push({
                id: `${resource.metadata.uid}-${service.metadata.uid}`,
                source: resource.metadata.uid,
                target: service.metadata.uid,
                type: EdgeType.Routes
              })
            }
          }
        }
      }

      // Pod mounts (ConfigMap, Secret, PVC)
      if (resource.kind === 'Pod' && resource.spec.volumes) {
        for (const volume of resource.spec.volumes) {
          let mountId: string | null = null

          if (volume.configMap) {
            mountId = this.findResourceUid(resources, 'ConfigMap', volume.configMap.name)
          } else if (volume.secret) {
            mountId = this.findResourceUid(resources, 'Secret', volume.secret.secretName)
          } else if (volume.persistentVolumeClaim) {
            mountId = this.findResourceUid(resources, 'PersistentVolumeClaim', volume.persistentVolumeClaim.claimName)
          }

          if (mountId) {
            edges.push({
              id: `${resource.metadata.uid}-${mountId}`,
              source: resource.metadata.uid,
              target: mountId,
              type: EdgeType.Mounts
            })
          }
        }
      }
    }

    return edges
  }
}
```

## Layouts

### Hierarchical Layout

Best for showing owner hierarchies (Deployment -> ReplicaSet -> Pod)

```typescript
function hierarchicalLayout(nodes: TopologyNode[], edges: TopologyEdge[]): TopologyNode[] {
  // Use dagre for hierarchical layout
  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: 'TB', // Top to bottom
    nodesep: 100,
    ranksep: 100
  })

  // Add nodes
  nodes.forEach(node => {
    g.setNode(node.id, { width: 150, height: 80 })
  })

  // Add edges
  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target)
  })

  // Calculate layout
  dagre.layout(g)

  // Update positions
  return nodes.map(node => {
    const pos = g.node(node.id)
    return {
      ...node,
      position: { x: pos.x, y: pos.y }
    }
  })
}
```

### Force-Directed Layout

Best for showing complex interconnections

```typescript
function forceDirectedLayout(nodes: TopologyNode[], edges: TopologyEdge[]): TopologyNode[] {
  // Use d3-force for physics-based layout
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(edges).id(d => d.id).distance(150))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(0, 0))
    .stop()

  // Run simulation
  for (let i = 0; i < 300; ++i) simulation.tick()

  return nodes
}
```

## Custom Nodes

### Pod Node

```typescript
function PodNode({ data }: { data: NodeData }) {
  const { resource, status } = data

  return (
    <div className={`topology-node pod-node status-${status}`}>
      <div className="node-icon">
        <PodIcon />
      </div>
      <div className="node-content">
        <div className="node-name">{resource.metadata.name}</div>
        <div className="node-status">{status}</div>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
```

### Service Node

```typescript
function ServiceNode({ data }: { data: NodeData }) {
  const { resource, status } = data
  const serviceType = resource.spec.type

  return (
    <div className={`topology-node service-node type-${serviceType}`}>
      <div className="node-icon">
        <ServiceIcon />
      </div>
      <div className="node-content">
        <div className="node-name">{resource.metadata.name}</div>
        <div className="node-type">{serviceType}</div>
        <div className="node-ports">
          {resource.spec.ports?.map(p => `${p.port}:${p.targetPort}`).join(', ')}
        </div>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
```

## Network Topology

### Network Policy Visualization

```typescript
interface NetworkTopology {
  nodes: NetworkNode[]
  connections: NetworkConnection[]
  policies: NetworkPolicy[]
}

interface NetworkNode {
  id: string
  type: 'pod' | 'service' | 'external'
  labels: Record<string, string>
  namespace: string
}

interface NetworkConnection {
  from: string
  to: string
  allowed: boolean
  ports: number[]
  protocol: string
}

class NetworkTopologyBuilder {
  /**
   * Build network topology from network policies
   */
  async buildNetworkTopology(namespace?: string): Promise<NetworkTopology> {
    const pods = await this.fetchPods(namespace)
    const services = await this.fetchServices(namespace)
    const policies = await this.fetchNetworkPolicies(namespace)

    const nodes: NetworkNode[] = [
      ...pods.map(p => this.podToNode(p)),
      ...services.map(s => this.serviceToNode(s))
    ]

    const connections = this.calculateConnections(nodes, policies)

    return { nodes, connections, policies }
  }

  /**
   * Calculate which connections are allowed by policies
   */
  private calculateConnections(
    nodes: NetworkNode[],
    policies: any[]
  ): NetworkConnection[] {
    const connections: NetworkConnection[] = []

    // For each pair of nodes, check if connection is allowed
    for (const from of nodes) {
      for (const to of nodes) {
        if (from.id === to.id) continue

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
}
```

## Interactions

### Click Handlers

```typescript
const onNodeClick = (event: React.MouseEvent, node: Node) => {
  // Show node details in side panel
  setSelectedNode(node)
  showSidePanel()
}

const onEdgeClick = (event: React.MouseEvent, edge: Edge) => {
  // Show edge details
  setSelectedEdge(edge)
  showSidePanel()
}

const onPaneClick = () => {
  // Deselect
  clearSelection()
}
```

### Filters

```typescript
function applyFilters(graph: TopologyGraph, filters: TopologyFilters): TopologyGraph {
  const nodes = graph.nodes.filter(node => {
    // Filter by type
    if (filters.nodeTypes.length && !filters.nodeTypes.includes(node.type)) {
      return false
    }

    // Filter by namespace
    if (filters.namespaces.length && !filters.namespaces.includes(node.data.namespace)) {
      return false
    }

    // Filter by status
    if (filters.statuses.length && !filters.statuses.includes(node.data.status)) {
      return false
    }

    // Filter by search
    if (filters.search && !node.data.label.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }

    return true
  })

  // Filter edges to only include visible nodes
  const visibleNodeIds = new Set(nodes.map(n => n.id))
  const edges = graph.edges.filter(edge =>
    visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
  )

  return { ...graph, nodes, edges }
}
```

## Performance Optimizations

### Virtual Rendering

React Flow handles this automatically - only renders visible nodes

### Clustering

For very large graphs, group related nodes:

```typescript
function clusterNodes(nodes: TopologyNode[]): TopologyNode[] {
  // Group pods by deployment
  const clusters = new Map<string, TopologyNode[]>()

  for (const node of nodes) {
    if (node.type === 'pod') {
      const deployment = node.data.metadata.labels['app'] || 'default'
      if (!clusters.has(deployment)) {
        clusters.set(deployment, [])
      }
      clusters.get(deployment)!.push(node)
    }
  }

  // Create cluster nodes
  const clustered: TopologyNode[] = []
  for (const [deployment, pods] of clusters) {
    if (pods.length > 10) {
      // Create a cluster node
      clustered.push({
        id: `cluster-${deployment}`,
        type: 'cluster',
        data: {
          label: `${deployment} (${pods.length} pods)`,
          children: pods
        },
        position: this.calculateClusterPosition(pods)
      })
    } else {
      clustered.push(...pods)
    }
  }

  return clustered
}
```

## Export

### Export as Image

```typescript
async function exportAsImage(): Promise<void> {
  const reactFlowInstance = useReactFlow()
  const viewport = reactFlowInstance.getViewport()

  // Use html2canvas to capture the graph
  const element = document.querySelector('.react-flow')
  const canvas = await html2canvas(element as HTMLElement)

  // Download
  const link = document.createElement('a')
  link.download = 'topology.png'
  link.href = canvas.toDataURL()
  link.click()
}
```

### Export as SVG

```typescript
async function exportAsSVG(): Promise<void> {
  // Convert React Flow to SVG
  const svg = reactFlowToSVG()
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.download = 'topology.svg'
  link.href = url
  link.click()
}
```

## Implementation Plan

### Phase 1: Resource Graph (Task 3.3.2)

1. Install React Flow
2. Create TopologyView component
3. Implement graph builder
4. Add custom nodes for basic types (Pod, Service, Deployment)
5. Implement hierarchical layout
6. Add basic interactions (click, zoom)

### Phase 2: Network Topology (Task 3.3.3)

1. Fetch network policies
2. Calculate network connections
3. Add network-specific nodes/edges
4. Implement network visualization
5. Add policy filtering

### Phase 3: Polish

1. Add more node types
2. Implement all layouts
3. Add filters and search
4. Export functionality
5. Performance optimization
6. Documentation

## Testing

- Unit tests for graph builder
- Integration tests for layout algorithms
- E2E tests for interactions
- Performance tests with large graphs (1000+ nodes)

## Future Enhancements

- **Live Updates**: WebSocket connection for real-time updates
- **Time Travel**: Show topology at different points in time
- **Diffing**: Compare topologies across environments
- **AI Analysis**: Identify anomalies and suggest fixes
- **3D View**: Optional 3D visualization for complex clusters
