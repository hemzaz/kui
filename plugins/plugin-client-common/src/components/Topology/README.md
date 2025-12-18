# Topology Visualization

React Flow-based visualization for Kubernetes resource relationships and network topology.

## Overview

The Topology feature provides interactive graph visualizations of Kubernetes resource relationships, allowing users to understand cluster topology visually through nodes (resources) and edges (relationships).

## Implementation Status

### ✅ Completed

#### Core Infrastructure
- `packages/core/src/topology/types.ts` - Type definitions
- `packages/core/src/topology/graph-builder.ts` - Graph construction from K8s resources
- `packages/core/src/topology/layout.ts` - Layout algorithms (hierarchical, force-directed, circular, grid)
- `packages/core/src/topology/index.ts` - Public API

#### React Components
- `TopologyView.tsx` - Main visualization component with React Flow
- `TopologyToolbar.tsx` - Controls for layout, search, filters
- Node Components:
  - `PodNode.tsx` - Pod visualization
  - `ServiceNode.tsx` - Service visualization
  - `DeploymentNode.tsx` - Deployment visualization
  - `GenericNode.tsx` - Fallback for other resource types

#### Styling
- `topology.scss` - Complete styles for all components
- Dark/light theme support
- Status indicators (healthy, warning, error, unknown)
- Type-specific node colors

#### Features
- **Multiple Layouts**: Hierarchical (dagre), force-directed, circular, grid
- **Interactive**: Click nodes/edges, zoom, pan
- **Search**: Filter nodes by name
- **Status Indicators**: Visual health status
- **MiniMap**: Overview navigation
- **Resource Types**: Pod, Service, Deployment, and generic fallback
- **Relationship Types**: Owns, Manages, Exposes, Mounts, Routes

### ✅ Network Topology (Task 3.3.3 - Completed)

#### Core Infrastructure
- `packages/core/src/topology/network-topology-builder.ts` - Network topology construction
- Network connection calculation based on policies
- Policy matching and rule evaluation
- Ingress/egress flow analysis

#### React Components
- `NetworkTopologyView.tsx` - Network topology visualization
- Connection filtering (allowed/denied)
- Policy-based filtering
- Statistics dashboard

#### Styling
- `network-topology.scss` - Network-specific styles
- Animated connection flows
- Policy node styling
- Legend and toolbar

#### Features
- **Network Policies**: Visualize NetworkPolicy resources
- **Connection Analysis**: Calculate allowed/denied connections
- **Traffic Flow**: Animated allowed connections, dashed denied connections
- **Policy Filtering**: Filter by specific policies
- **Statistics**: Node, connection, and policy counts
- **Interactive**: Click nodes/connections for details
- **Legend**: Visual guide for connection types

## Usage

### Basic Resource Topology

```typescript
import { TopologyView } from '@kui-shell/plugin-client-common/src/components/Topology'
import { topologyGraphBuilder } from '@kui-shell/core/src/topology'

// Fetch Kubernetes resources
const resources = await fetchKubernetesResources(namespace)

// Build graph
const graph = await topologyGraphBuilder.buildGraph(resources, namespace)

// Render
<TopologyView
  graph={graph}
  onNodeClick={(node) => console.log('Clicked node:', node)}
  onEdgeClick={(edge) => console.log('Clicked edge:', edge)}
/>
```

### Network Topology with Policies

```typescript
import { NetworkTopologyView } from '@kui-shell/plugin-client-common/src/components/Topology'
import { networkTopologyBuilder } from '@kui-shell/core/src/topology'

// Fetch resources
const pods = await fetchPods(namespace)
const services = await fetchServices(namespace)
const policies = await fetchNetworkPolicies(namespace)

// Build network topology
const topology = await networkTopologyBuilder.buildNetworkTopology(
  pods,
  services,
  policies,
  namespace
)

// Render
<NetworkTopologyView
  topology={topology}
  onNodeClick={(node) => console.log('Clicked node:', node)}
  onConnectionClick={(conn) => console.log('Clicked connection:', conn)}
/>
```

### With Custom Layout

```typescript
import { applyLayout } from '@kui-shell/core/src/topology'

// Apply custom layout
const layoutedNodes = applyLayout(
  graph.nodes,
  graph.edges,
  'hierarchical',
  {
    nodeWidth: 200,
    nodeHeight: 120,
    nodesep: 150,
    ranksep: 200,
    rankdir: 'TB' // Top to Bottom
  }
)
```

### Programmatic Graph Building

```typescript
import { TopologyGraphBuilder } from '@kui-shell/core/src/topology'

const builder = new TopologyGraphBuilder()
const graph = await builder.buildGraph(resources, 'production')

console.log(`Generated graph with ${graph.nodes.length} nodes and ${graph.edges.length} edges`)
```

## Architecture

### Data Flow

1. **Fetch Resources**: Get Kubernetes resources via kubectl or API
2. **Build Graph**: `TopologyGraphBuilder` extracts relationships
3. **Apply Layout**: Position nodes using layout algorithms
4. **Render**: React Flow displays interactive graph

### Node Types

- `pod` - Kubernetes Pods
- `service` - Services (ClusterIP, LoadBalancer, NodePort)
- `deployment` - Deployments
- `statefulset` - StatefulSets
- `daemonset` - DaemonSets
- `replicaset` - ReplicaSets
- `configmap` - ConfigMaps
- `secret` - Secrets
- `pvc` - PersistentVolumeClaims
- `ingress` - Ingress resources
- `networkpolicy` - Network Policies

### Edge Types

- `owns` - Owner reference (Deployment → ReplicaSet)
- `manages` - Management relationship (ReplicaSet → Pod)
- `exposes` - Service exposure (Service → Pod)
- `mounts` - Volume mounts (Pod → ConfigMap/Secret/PVC)
- `routes` - Ingress routing (Ingress → Service)
- `allows` - Network policy allows
- `denies` - Network policy denies

### Layout Algorithms

#### Hierarchical (Default)
- Uses dagre for directed graph layout
- Best for owner hierarchies (Deployment → ReplicaSet → Pod)
- Options: `rankdir` (TB/BT/LR/RL), `nodesep`, `ranksep`

#### Force-Directed
- Physics-based simulation
- Best for complex interconnections
- Iterative layout with charge/link forces

#### Circular
- Nodes arranged in a circle
- Good for small graphs or demos

#### Grid
- Simple grid arrangement
- Fast, predictable layout

## Styling

### Theme Variables

```css
--color-base00: Background
--color-base01: Canvas background
--color-base02: Border color
--color-text-01: Primary text
--color-text-02: Secondary text
--color-brand-01: Brand/accent color
```

### Status Colors

- **Healthy**: `#28a745` (green)
- **Warning**: `#ffc107` (yellow)
- **Error**: `#dc3545` (red)
- **Unknown**: `#6c757d` (gray)

### Node Type Colors

- **Pod**: Blue (`#007bff`)
- **Service**: Green (`#28a745`)
- **Deployment**: Purple (`#6f42c1`)
- **Generic**: Gray (`#6c757d`)

## Integration

### With kubectl Plugin

```typescript
// In kubectl plugin
import { topologyGraphBuilder } from '@kui-shell/core/src/topology'
import { TopologyView } from '@kui-shell/plugin-client-common/src/components/Topology'

commandTree.listen('/kubectl/topology', async ({ parsedOptions }) => {
  const namespace = parsedOptions.n || parsedOptions.namespace || 'default'

  // Fetch resources
  const resources = await fetchAllResources(namespace)

  // Build graph
  const graph = await topologyGraphBuilder.buildGraph(resources, namespace)

  // Return React component
  return {
    react: <TopologyView graph={graph} />
  }
})
```

### As a Tab/Mode

```typescript
import { registerMode } from '@kui-shell/core'

registerMode({
  mode: 'topology',
  label: 'Topology',
  content: async (resource) => {
    const graph = await topologyGraphBuilder.buildGraph([resource])
    return <TopologyView graph={graph} />
  }
})
```

## Testing

### Unit Tests

```typescript
describe('TopologyGraphBuilder', () => {
  it('should build graph from resources', async () => {
    const resources = [mockDeployment, mockReplicaSet, mockPod]
    const graph = await builder.buildGraph(resources)

    expect(graph.nodes).toHaveLength(3)
    expect(graph.edges).toHaveLength(2) // Deployment → ReplicaSet → Pod
  })
})
```

### Integration Tests

```typescript
describe('TopologyView', () => {
  it('should render graph', () => {
    render(<TopologyView graph={mockGraph} />)
    expect(screen.getByText('my-pod')).toBeInTheDocument()
  })

  it('should handle node clicks', () => {
    const onNodeClick = jest.fn()
    render(<TopologyView graph={mockGraph} onNodeClick={onNodeClick} />)

    fireEvent.click(screen.getByText('my-pod'))
    expect(onNodeClick).toHaveBeenCalledWith(expect.objectContaining({
      id: 'pod-123'
    }))
  })
})
```

## Performance

### Optimizations

1. **Virtual Rendering**: React Flow only renders visible nodes
2. **Memoization**: Graph conversion cached with `useMemo`
3. **Layout Caching**: Layout positions cached until topology/layout changes
4. **Debounced Search**: Search input debounced to prevent excessive re-renders

### Scaling

- **Small clusters (< 100 nodes)**: All layouts work well
- **Medium clusters (100-500 nodes)**: Hierarchical or force-directed recommended
- **Large clusters (500-1000 nodes)**: Hierarchical only, consider filtering
- **Very large clusters (> 1000 nodes)**: Use filtering/clustering (future feature)

## Network Topology Features

### Policy Analysis

The network topology builder analyzes NetworkPolicy resources to determine allowed and denied connections between pods:

```typescript
const builder = new NetworkTopologyBuilder()

// Calculate connections
const topology = await builder.buildNetworkTopology(pods, services, policies, namespace)

console.log(`Found ${topology.connections.length} connections`)
console.log(`Allowed: ${topology.connections.filter(c => c.allowed).length}`)
console.log(`Denied: ${topology.connections.filter(c => !c.allowed).length}`)
```

### Policy Matching

The builder implements Kubernetes NetworkPolicy matching rules:
- **Pod Selector**: Matches pods by labels
- **Namespace Selector**: Matches across namespaces
- **Ingress Rules**: Analyzes ingress policies
- **Egress Rules**: Analyzes egress policies
- **Port Restrictions**: Extracts port numbers and protocols

### Visual Indicators

- **Green solid lines**: Allowed connections (animated)
- **Red dashed lines**: Denied connections
- **Edge labels**: Port numbers if specified
- **Node highlighting**: Interactive selection

## Future Enhancements

- Real-time updates via watch API
- Connection matrix view
- Policy conflict detection
- 3D visualization for complex clusters
- Export to Graphviz/DOT format
- Historical topology comparison

## Dependencies

- `reactflow` - Graph visualization library
- `dagre` - Hierarchical layout algorithm
- `@types/dagre` - TypeScript types for dagre

## Resources

- [React Flow Documentation](https://reactflow.dev)
- [Dagre Layout](https://github.com/dagrejs/dagre)
- [Architecture Document](../../../../../docs/features/visual-topology.md)
