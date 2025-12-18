# Kube-Composer Feature Inspiration for Kui Modernization

**Date**: 2025-12-17
**Status**: Feature Analysis Complete
**Source**: `/Users/elad/PROJ/kube-composer`
**Target**: Kui Shell Phases 2, 3, 4, 5

---

## Executive Summary

Kube-Composer is a modern Kubernetes YAML generator with sophisticated UI patterns, real-time validation, and visual resource composition. This document identifies features and patterns from kube-composer that can inspire Kui's modernization across all phases.

**Key Takeaways:**
- Real-time YAML generation with validation
- Multi-resource management with visual feedback
- Tabbed interface with grouped resource types
- Auto-save with debouncing
- Type-safe configuration management
- Visual architecture diagrams
- Project-wide settings with global labels

---

## Phase 2: AI Integration (Weeks 9-16)

### 2.1 Command Palette Enhancements

#### **Feature: Resource Type Categorization**

**Inspired by**: kube-composer's sidebar tabs (`deployments`, `daemonsets`, `namespaces`, `storage`, `security`, `jobs`)

**Implementation for Kui**:
```typescript
// packages/core/src/components/CommandPalette/commands.ts
export enum CommandCategory {
  Navigation = 'navigation',
  Kubectl = 'kubectl',
  AI = 'ai',
  Settings = 'settings',
  Recent = 'recent',
  // NEW: Add Kubernetes resource categories
  Workloads = 'workloads',      // Pods, Deployments, ReplicaSets, StatefulSets, DaemonSets
  Configuration = 'configuration', // ConfigMaps, Secrets
  Networking = 'networking',      // Services, Ingress, NetworkPolicies
  Storage = 'storage',           // PVCs, PVs, StorageClasses
  Security = 'security',         // ServiceAccounts, Roles, RoleBindings
  Batch = 'batch'               // Jobs, CronJobs
}

interface CommandWithCategory extends Command {
  category: CommandCategory
  resourceType?: string  // e.g., 'pod', 'deployment', 'service'
  icon?: string
}

// Group commands by category in picker
export class CommandPaletteDelegate implements PickerDelegate<CommandWithCategory> {
  renderItem(command: CommandWithCategory, index: number): React.ReactElement {
    return (
      <div className="kui-command-palette-item">
        {command.icon && <span className="item-icon">{command.icon}</span>}
        <div className="item-content">
          <div className="item-name">{command.name}</div>
          {command.description && (
            <div className="item-description">{command.description}</div>
          )}
        </div>
        <div className="item-category-badge" style={{
          backgroundColor: getCategoryColor(command.category)
        }}>
          {command.category}
        </div>
      </div>
    )
  }
}
```

**Benefits**:
- Organized navigation by resource type
- Visual grouping in command palette
- Easier discovery of related commands
- Consistent with Kubernetes concepts

---

#### **Feature: Recent Resources with Type Icons**

**Inspired by**: kube-composer's resource summary with icons and counts

**Implementation**:
```typescript
// Track recently accessed resources with metadata
interface RecentResource {
  type: 'pod' | 'deployment' | 'service' | 'configmap' | 'secret' | 'ingress'
  name: string
  namespace: string
  timestamp: number
  icon: string  // Lucide icon name or emoji
}

// Add to command palette
const recentResources: Command[] = getRecentResources().map(resource => ({
  id: `recent-${resource.type}-${resource.name}`,
  name: `${resource.name} (${resource.namespace})`,
  description: `Recently viewed ${resource.type}`,
  category: CommandCategory.Recent,
  icon: resource.icon,
  action: async () => {
    await exec(`kubectl get ${resource.type} ${resource.name} -n ${resource.namespace} -o yaml`, {
      tab: getCurrentTab()
    })
  }
}))
```

**Benefits**:
- Quick access to recently viewed resources
- Visual differentiation by resource type
- MRU (most recently used) ordering
- Integrates with existing command palette

---

### 2.2 Smart Command History

#### **Feature: Pattern-Based Command Suggestions**

**Inspired by**: kube-composer's validation system that checks related resources

**Implementation**:
```typescript
// Detect common kubectl patterns
const patterns = [
  {
    name: 'Describe → Logs → Edit',
    commands: ['kubectl describe', 'kubectl logs', 'kubectl edit'],
    confidence: 0.85,
    nextSuggestion: (lastCommand: string) => {
      if (lastCommand.includes('describe')) return 'kubectl logs'
      if (lastCommand.includes('logs')) return 'kubectl edit'
      return null
    }
  },
  {
    name: 'Get → Delete → Verify',
    commands: ['kubectl get', 'kubectl delete', 'kubectl get'],
    confidence: 0.75,
    nextSuggestion: (lastCommand: string) => {
      if (lastCommand.includes('get') && !lastCommand.includes('delete')) {
        return 'kubectl delete'
      }
      if (lastCommand.includes('delete')) return 'kubectl get'
      return null
    }
  }
]

// Show suggestions in UI
<div className="command-suggestions">
  <div className="suggestion-header">Suggested next command:</div>
  <div className="suggestion-item" onClick={executeSuggestion}>
    {suggestion.command}
    <span className="confidence">{(suggestion.confidence * 100).toFixed(0)}%</span>
  </div>
</div>
```

**Benefits**:
- Reduces typing for common workflows
- Learns from user patterns
- Confidence scoring for reliability
- Non-intrusive suggestions

---

### 2.3 AI-Enhanced Monaco Editor

#### **Feature: YAML Structure Auto-completion**

**Inspired by**: kube-composer's type-safe YAML generation

**Implementation**:
```typescript
// Register YAML structure completions
monaco.languages.registerCompletionItemProvider('yaml', {
  triggerCharacters: [' ', '.', ':', '-'],

  async provideCompletionItems(model, position, context, token) {
    // Detect current Kubernetes resource type
    const resourceType = detectResourceType(model)

    if (resourceType === 'Deployment') {
      return {
        suggestions: [
          {
            label: 'spec.template.spec.containers',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: [
              'containers:',
              '  - name: ${1:app}',
              '    image: ${2:nginx:latest}',
              '    ports:',
              '      - containerPort: ${3:80}',
              '    resources:',
              '      requests:',
              '        cpu: ${4:100m}',
              '        memory: ${5:128Mi}',
              '      limits:',
              '        cpu: ${6:200m}',
              '        memory: ${7:256Mi}'
            ].join('\n'),
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Add container with resource limits'
          }
        ]
      }
    }
  }
})
```

**Benefits**:
- Context-aware completions based on resource type
- Reduces YAML syntax errors
- Follows Kubernetes best practices
- Includes resource limits by default

---

#### **Feature: Real-time YAML Validation with Inline Errors**

**Inspired by**: kube-composer's validation status with detailed error messages

**Implementation**:
```typescript
// Add Monaco markers for YAML validation errors
async function validateKubernetesYaml(model: monaco.editor.ITextModel) {
  const yaml = model.getValue()
  const errors = await validateYaml(yaml)  // Use kubectl dry-run or schema validation

  const markers = errors.map(error => ({
    severity: monaco.MarkerSeverity.Error,
    startLineNumber: error.line,
    startColumn: error.column,
    endLineNumber: error.line,
    endColumn: error.column + error.length,
    message: error.message,
    source: 'kubectl-validate'
  }))

  monaco.editor.setModelMarkers(model, 'kubectl', markers)

  // Show validation summary in UI
  return {
    isValid: errors.length === 0,
    errorCount: errors.length,
    errors: errors.map(e => `Line ${e.line}: ${e.message}`)
  }
}

// UI component
<div className={`validation-status ${isValid ? 'valid' : 'invalid'}`}>
  <div className="status-icon">
    {isValid ? <CheckCircle /> : <AlertCircle />}
  </div>
  <span>{isValid ? 'Valid YAML' : `${errorCount} errors`}</span>
  {!isValid && (
    <ul className="error-list">
      {errors.map((error, i) => <li key={i}>{error}</li>)}
    </ul>
  )}
</div>
```

**Benefits**:
- Catch errors before applying to cluster
- Clear error messages with line numbers
- Visual feedback (red/green status)
- Prevents invalid resource creation

---

### 2.4 AI Navigation & Insights

#### **Feature: Resource Relationship Visualization**

**Inspired by**: kube-composer's architecture preview showing resource relationships

**Implementation**:
```typescript
// Fetch resource relationships
async function getResourceRelationships(resourceType: string, name: string, namespace: string) {
  const relationships = {
    parents: [],
    children: [],
    related: []
  }

  if (resourceType === 'pod') {
    // Get owning ReplicaSet/Deployment
    const pod = await kubectl.get('pod', name, namespace)
    const ownerRefs = pod.metadata.ownerReferences || []

    for (const owner of ownerRefs) {
      if (owner.kind === 'ReplicaSet') {
        relationships.parents.push(owner)

        // Get owning Deployment
        const rs = await kubectl.get('replicaset', owner.name, namespace)
        const rsOwners = rs.metadata.ownerReferences || []
        relationships.parents.push(...rsOwners)
      }
    }

    // Get associated Service
    const services = await kubectl.list('service', namespace)
    const matchingServices = services.items.filter(svc =>
      matchLabels(svc.spec.selector, pod.metadata.labels)
    )
    relationships.related.push(...matchingServices)
  }

  return relationships
}

// Show in UI
<div className="resource-relationships">
  <h4>Related Resources</h4>
  <div className="relationship-group">
    <span className="group-label">Owned by:</span>
    {relationships.parents.map(parent => (
      <ResourceBadge key={parent.uid} resource={parent} onClick={navigateToResource} />
    ))}
  </div>
  <div className="relationship-group">
    <span className="group-label">Related:</span>
    {relationships.related.map(resource => (
      <ResourceBadge key={resource.uid} resource={resource} onClick={navigateToResource} />
    ))}
  </div>
</div>
```

**Benefits**:
- Understand resource hierarchy
- Quick navigation between related resources
- Debugging complex deployments
- Visual representation of ownership

---

## Phase 3: Advanced Features (Weeks 17-24)

### 3.1 Notebook Mode

#### **Feature: YAML Cell Type with Live Preview**

**Inspired by**: kube-composer's real-time YAML generation

**Implementation**:
```typescript
// Notebook cell types
type CellType = 'code' | 'markdown' | 'yaml'

interface YamlCell extends Cell {
  type: 'yaml'
  content: string
  resourceType?: string
  validation: {
    isValid: boolean
    errors: string[]
  }
}

// YAML cell component
function YamlCell({ cell, onUpdate }: CellProps<YamlCell>) {
  const [yaml, setYaml] = useState(cell.content)
  const [validation, setValidation] = useState(cell.validation)

  useEffect(() => {
    const validate = async () => {
      const result = await validateKubernetesYaml(yaml)
      setValidation(result)
      onUpdate({ ...cell, validation: result })
    }

    const debounced = debounce(validate, 500)
    debounced()
  }, [yaml])

  return (
    <div className="yaml-cell">
      <div className="cell-toolbar">
        <button onClick={() => applyYaml(yaml)}>Apply to Cluster</button>
        <button onClick={() => downloadYaml(yaml)}>Download</button>
        <ValidationStatus validation={validation} />
      </div>
      <MonacoEditor
        language="yaml"
        value={yaml}
        onChange={setYaml}
        options={{
          minimap: { enabled: false },
          lineNumbers: 'on',
          scrollBeyondLastLine: false
        }}
      />
      {!validation.isValid && (
        <div className="validation-errors">
          {validation.errors.map((error, i) => (
            <div key={i} className="error-message">{error}</div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Benefits**:
- Interactive YAML editing in notebooks
- Live validation feedback
- One-click apply to cluster
- Export individual cells

---

#### **Feature: Resource Template Library**

**Inspired by**: kube-composer's default configurations and templates

**Implementation**:
```typescript
// Template library
const templates = {
  deployment: {
    name: 'Basic Deployment',
    description: 'Standard deployment with 3 replicas',
    yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: \${1:app-name}
  labels:
    app: \${1:app-name}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: \${1:app-name}
  template:
    metadata:
      labels:
        app: \${1:app-name}
    spec:
      containers:
      - name: \${1:app-name}
        image: \${2:nginx:latest}
        ports:
        - containerPort: \${3:80}`
  },
  'deployment-with-resources': {
    name: 'Deployment with Resource Limits',
    description: 'Production-ready deployment with limits',
    yaml: `apiVersion: apps/v1
kind: Deployment
# ... with resources.requests and resources.limits`
  }
}

// Template picker in notebook
<div className="template-library">
  <h4>Insert Template</h4>
  <div className="template-grid">
    {Object.entries(templates).map(([key, template]) => (
      <div
        key={key}
        className="template-card"
        onClick={() => insertTemplate(template)}
      >
        <div className="template-name">{template.name}</div>
        <div className="template-description">{template.description}</div>
      </div>
    ))}
  </div>
</div>
```

**Benefits**:
- Quick start with best practices
- Reusable configurations
- Learn by example
- Consistent resource structure

---

### 3.2 Scratchpad

#### **Feature: Multi-File Scratchpad with Tabs**

**Inspired by**: kube-composer's multi-deployment management

**Implementation**:
```typescript
// Scratchpad with multiple files
interface ScratchpadFile {
  id: string
  name: string
  language: 'yaml' | 'sh' | 'json'
  content: string
  isDirty: boolean
}

function Scratchpad() {
  const [files, setFiles] = useState<ScratchpadFile[]>([
    { id: '1', name: 'deployment.yaml', language: 'yaml', content: '', isDirty: false }
  ])
  const [activeFileId, setActiveFileId] = useState('1')

  const activeFile = files.find(f => f.id === activeFileId)

  const addFile = (type: 'yaml' | 'sh') => {
    const newFile: ScratchpadFile = {
      id: generateId(),
      name: type === 'yaml' ? 'new.yaml' : 'script.sh',
      language: type,
      content: '',
      isDirty: false
    }
    setFiles([...files, newFile])
    setActiveFileId(newFile.id)
  }

  return (
    <div className="scratchpad">
      <div className="file-tabs">
        {files.map(file => (
          <div
            key={file.id}
            className={`file-tab ${file.id === activeFileId ? 'active' : ''}`}
            onClick={() => setActiveFileId(file.id)}
          >
            {file.name}
            {file.isDirty && <span className="dirty-indicator">●</span>}
            <button onClick={() => closeFile(file.id)}>×</button>
          </div>
        ))}
        <button onClick={() => addFile('yaml')}>+ YAML</button>
        <button onClick={() => addFile('sh')}>+ Script</button>
      </div>
      <MonacoEditor
        language={activeFile?.language || 'yaml'}
        value={activeFile?.content || ''}
        onChange={content => updateFile(activeFileId, content)}
      />
    </div>
  )
}
```

**Benefits**:
- Work with multiple resources simultaneously
- Keep related files organized
- Dirty state tracking
- Easy file switching

---

### 3.3 Visual Topology

#### **Feature: Kubernetes Resource Graph**

**Inspired by**: kube-composer's VisualPreview with flow diagrams

**Implementation**:
```typescript
import ReactFlow, { Node, Edge } from 'reactflow'

// Node types for different resources
const nodeTypes = {
  deployment: DeploymentNode,
  service: ServiceNode,
  pod: PodNode,
  ingress: IngressNode,
  configmap: ConfigMapNode,
  secret: SecretNode
}

// Generate graph from cluster resources
async function generateTopology(namespace: string): Promise<{ nodes: Node[], edges: Edge[] }> {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Fetch all resources
  const deployments = await kubectl.list('deployment', namespace)
  const services = await kubectl.list('service', namespace)
  const ingresses = await kubectl.list('ingress', namespace)
  const pods = await kubectl.list('pod', namespace)

  // Create deployment nodes
  deployments.items.forEach((deploy, index) => {
    nodes.push({
      id: `deployment-${deploy.metadata.name}`,
      type: 'deployment',
      position: { x: 100, y: 100 + (index * 150) },
      data: {
        name: deploy.metadata.name,
        replicas: deploy.spec.replicas,
        image: deploy.spec.template.spec.containers[0]?.image,
        status: deploy.status.conditions?.[0]?.type
      }
    })

    // Connect to pods
    const deploymentPods = pods.items.filter(pod =>
      pod.metadata.ownerReferences?.some(ref =>
        ref.kind === 'ReplicaSet' && ref.name.startsWith(deploy.metadata.name)
      )
    )

    deploymentPods.forEach(pod => {
      nodes.push({
        id: `pod-${pod.metadata.name}`,
        type: 'pod',
        position: { x: 400, y: nodes.length * 80 },
        data: {
          name: pod.metadata.name,
          status: pod.status.phase
        }
      })

      edges.push({
        id: `${deploy.metadata.name}-${pod.metadata.name}`,
        source: `deployment-${deploy.metadata.name}`,
        target: `pod-${pod.metadata.name}`,
        type: 'smoothstep'
      })
    })
  })

  // Create service nodes and edges
  services.items.forEach((svc, index) => {
    nodes.push({
      id: `service-${svc.metadata.name}`,
      type: 'service',
      position: { x: 700, y: 100 + (index * 150) },
      data: {
        name: svc.metadata.name,
        type: svc.spec.type,
        ports: svc.spec.ports
      }
    })

    // Connect services to deployments via label selectors
    const matchingDeployments = deployments.items.filter(deploy =>
      matchLabels(svc.spec.selector, deploy.spec.template.metadata.labels)
    )

    matchingDeployments.forEach(deploy => {
      edges.push({
        id: `${svc.metadata.name}-${deploy.metadata.name}`,
        source: `deployment-${deploy.metadata.name}`,
        target: `service-${svc.metadata.name}`,
        type: 'smoothstep',
        label: 'exposes'
      })
    })
  })

  // Create ingress nodes
  ingresses.items.forEach((ing, index) => {
    nodes.push({
      id: `ingress-${ing.metadata.name}`,
      type: 'ingress',
      position: { x: 1000, y: 100 + (index * 150) },
      data: {
        name: ing.metadata.name,
        hosts: ing.spec.rules?.map(r => r.host) || []
      }
    })

    // Connect ingress to services
    ing.spec.rules?.forEach(rule => {
      rule.http?.paths?.forEach(path => {
        edges.push({
          id: `${ing.metadata.name}-${path.backend.service.name}`,
          source: `ingress-${ing.metadata.name}`,
          target: `service-${path.backend.service.name}`,
          type: 'smoothstep',
          label: path.path
        })
      })
    })
  })

  return { nodes, edges }
}

// Topology view component
function TopologyView({ namespace }: { namespace: string }) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])

  useEffect(() => {
    const load = async () => {
      const { nodes, edges } = await generateTopology(namespace)
      setNodes(nodes)
      setEdges(edges)
    }
    load()
  }, [namespace])

  return (
    <div style={{ height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background />
      </ReactFlow>
    </div>
  )
}
```

**Benefits**:
- Visual understanding of resource relationships
- Interactive exploration
- Real-time cluster state
- Debug complex architectures

---

## Phase 4: Polish (Weeks 25-28)

### 4.1 Performance Optimization

#### **Feature: Debounced Auto-save**

**Inspired by**: kube-composer's auto-save with 3-second delay

**Implementation**:
```typescript
// Auto-save hook
function useAutoSave<T>(data: T, saveFunction: (data: T) => void, delay = 3000) {
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = window.setTimeout(() => {
      try {
        saveFunction(data)
        console.log('Auto-saved at', new Date().toISOString())
      } catch (e) {
        console.warn('Auto-save failed:', e)
      }
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, saveFunction, delay])
}

// Usage in component
function CommandHistory() {
  const history = useShellStore(state => state.history)

  useAutoSave(history, (data) => {
    localStorage.setItem('kui-command-history', JSON.stringify(data))
  }, 3000)

  return <div>...</div>
}
```

**Benefits**:
- Prevents data loss
- Reduces localStorage writes
- Better performance
- User-friendly (no explicit save needed)

---

#### **Feature: Lazy Loading for Large Lists**

**Inspired by**: kube-composer's efficient rendering of multiple deployments

**Implementation**:
```typescript
// Virtual list for command history
import { useVirtualizer } from '@tanstack/react-virtual'

function CommandHistoryList({ commands }: { commands: Command[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: commands.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,  // Estimated row height
    overscan: 5  // Render 5 extra items above/below viewport
  })

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => {
          const command = commands[virtualRow.index]
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              <CommandHistoryItem command={command} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

**Benefits**:
- Handle large command histories (10K+ items)
- Smooth scrolling
- Reduced memory usage
- Faster initial render

---

### 4.2 Accessibility

#### **Feature: Keyboard Navigation for Resource Lists**

**Inspired by**: kube-composer's form navigation

**Implementation**:
```typescript
// Keyboard navigation hook
function useKeyboardNavigation<T>(
  items: T[],
  onSelect: (item: T) => void
) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(i => Math.min(i + 1, items.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(i => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (items[selectedIndex]) {
            onSelect(items[selectedIndex])
          }
          break
        case 'Home':
          e.preventDefault()
          setSelectedIndex(0)
          break
        case 'End':
          e.preventDefault()
          setSelectedIndex(items.length - 1)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [items, selectedIndex, onSelect])

  return { selectedIndex, setSelectedIndex }
}

// Usage in resource list
function ResourceList({ resources }: { resources: Resource[] }) {
  const { selectedIndex } = useKeyboardNavigation(resources, (resource) => {
    navigateToResource(resource)
  })

  return (
    <ul role="listbox" aria-label="Resources">
      {resources.map((resource, index) => (
        <li
          key={resource.name}
          role="option"
          aria-selected={index === selectedIndex}
          className={index === selectedIndex ? 'selected' : ''}
          tabIndex={index === selectedIndex ? 0 : -1}
        >
          {resource.name}
        </li>
      ))}
    </ul>
  )
}
```

**Benefits**:
- Keyboard-only navigation
- WCAG 2.1 compliance
- Better for power users
- Screen reader compatible

---

### 4.3 Testing & Documentation

#### **Feature: Validation Test Suite**

**Inspired by**: kube-composer's comprehensive validation logic

**Implementation**:
```typescript
// Validation tests
describe('Kubernetes YAML Validation', () => {
  it('should validate deployment with required fields', async () => {
    const yaml = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: test-app
  template:
    metadata:
      labels:
        app: test-app
    spec:
      containers:
      - name: app
        image: nginx:latest
    `

    const result = await validateKubernetesYaml(yaml)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should detect missing required fields', async () => {
    const yaml = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-app
spec:
  replicas: 3
    `

    const result = await validateKubernetesYaml(yaml)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('spec.selector is required')
    expect(result.errors).toContain('spec.template is required')
  })

  it('should validate resource limits', async () => {
    const yaml = `
# ... deployment with resources.limits
    `

    const result = await validateKubernetesYaml(yaml)
    expect(result.isValid).toBe(true)
    expect(result.warnings).toContain('Consider adding resource requests')
  })
})
```

**Benefits**:
- Catch validation regressions
- Document expected behavior
- Ensure YAML correctness
- Build confidence in changes

---

## Cross-Cutting Patterns

### 1. **State Management Pattern**

**Inspired by**: kube-composer's centralized state with auto-save

**Recommendation for Kui**:
```typescript
// Zustand store with persistence middleware
import create from 'zustand'
import { persist } from 'zustand/middleware'

interface KuiStore {
  // Command history
  history: Command[]
  addCommand: (cmd: Command) => void

  // Recent resources
  recentResources: RecentResource[]
  addRecentResource: (resource: RecentResource) => void

  // Settings
  settings: Settings
  updateSettings: (settings: Partial<Settings>) => void

  // AI provider
  aiProvider: AIProvider | null
  setAIProvider: (provider: AIProvider) => void
}

export const useKuiStore = create<KuiStore>()(
  persist(
    (set, get) => ({
      history: [],
      addCommand: (cmd) => set(state => ({
        history: [...state.history, cmd].slice(-1000)  // Keep last 1000
      })),

      recentResources: [],
      addRecentResource: (resource) => set(state => ({
        recentResources: [
          resource,
          ...state.recentResources.filter(r => r.name !== resource.name)
        ].slice(0, 50)  // Keep last 50
      })),

      settings: loadSettings(),
      updateSettings: (newSettings) => set(state => ({
        settings: { ...state.settings, ...newSettings }
      })),

      aiProvider: null,
      setAIProvider: (provider) => set({ aiProvider: provider })
    }),
    {
      name: 'kui-store',
      version: 1
    }
  )
)
```

---

### 2. **Type-Safe Configuration**

**Inspired by**: kube-composer's TypeScript interfaces for all resource types

**Recommendation for Kui**:
```typescript
// Define types for all Kubernetes resources
export interface KubernetesResource {
  apiVersion: string
  kind: string
  metadata: ResourceMetadata
  spec?: any
  status?: any
}

export interface ResourceMetadata {
  name: string
  namespace?: string
  labels?: Record<string, string>
  annotations?: Record<string, string>
  uid?: string
  createdAt?: string
}

// Specific resource types
export interface Pod extends KubernetesResource {
  kind: 'Pod'
  spec: PodSpec
  status?: PodStatus
}

export interface Deployment extends KubernetesResource {
  kind: 'Deployment'
  spec: DeploymentSpec
  status?: DeploymentStatus
}

// Type guards
export function isPod(resource: KubernetesResource): resource is Pod {
  return resource.kind === 'Pod'
}

export function isDeployment(resource: KubernetesResource): resource is Deployment {
  return resource.kind === 'Deployment'
}
```

---

### 3. **Validation Framework**

**Inspired by**: kube-composer's validation system with detailed error messages

**Recommendation for Kui**:
```typescript
// Validation result type
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

// Validation rules
const validationRules = {
  deployment: [
    {
      field: 'metadata.name',
      validate: (value: any) => typeof value === 'string' && value.length > 0,
      message: 'Deployment name is required'
    },
    {
      field: 'spec.replicas',
      validate: (value: any) => typeof value === 'number' && value > 0,
      message: 'Replicas must be greater than 0'
    },
    {
      field: 'spec.template.spec.containers',
      validate: (value: any) => Array.isArray(value) && value.length > 0,
      message: 'At least one container is required'
    }
  ]
}

// Validator function
export function validateResource(resource: KubernetesResource): ValidationResult {
  const rules = validationRules[resource.kind.toLowerCase()] || []
  const errors: ValidationError[] = []

  for (const rule of rules) {
    const value = getNestedValue(resource, rule.field)
    if (!rule.validate(value)) {
      errors.push({
        field: rule.field,
        message: rule.message,
        severity: 'error'
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  }
}
```

---

## Implementation Priority Matrix

### High Priority (Phase 2)
1. ✅ Command palette with resource categories
2. ✅ Recent resources tracking
3. ✅ YAML structure auto-completion
4. ✅ Real-time validation in Monaco
5. ✅ Pattern-based command suggestions

### Medium Priority (Phase 3)
1. ⚠️ YAML cell type for notebooks
2. ⚠️ Resource template library
3. ⚠️ Multi-file scratchpad
4. ⚠️ Visual topology view
5. ⚠️ Resource relationship visualization

### Low Priority (Phase 4)
1. 🔵 Debounced auto-save
2. 🔵 Virtual scrolling for large lists
3. 🔵 Keyboard navigation
4. 🔵 Validation test suite
5. 🔵 Documentation updates

---

## Technical Debt to Avoid

### 1. **Don't: Store Everything in localStorage**

**Problem**: kube-composer stores all state in localStorage, which has size limits (5-10 MB)

**Solution for Kui**: Use Tauri's SQLite backend for persistence
```rust
// src-tauri/src/persistence.rs
pub struct StateDB {
    conn: Connection,
}

impl StateDB {
    pub fn save_history(&self, history: &[Command]) -> Result<()> {
        // Store in SQLite instead of localStorage
        self.conn.execute(
            "INSERT INTO command_history (command, timestamp) VALUES (?1, ?2)",
            params![command, timestamp]
        )
    }
}
```

---

### 2. **Don't: Manual State Synchronization**

**Problem**: kube-composer manually updates multiple state pieces, risking inconsistency

**Solution for Kui**: Use Zustand with computed values
```typescript
export const useKuiStore = create<KuiStore>((set, get) => ({
  commands: [],

  // Computed value - always up to date
  recentCommands: () => {
    const state = get()
    return state.commands.slice(-50)
  },

  // Computed value - no manual sync needed
  commandsByCategory: () => {
    const state = get()
    return groupBy(state.commands, cmd => cmd.category)
  }
}))
```

---

### 3. **Don't: Inline Validation Logic**

**Problem**: kube-composer has validation scattered across components

**Solution for Kui**: Centralized validation system
```typescript
// packages/core/src/validation/index.ts
export class ValidationEngine {
  private rules: Map<string, ValidationRule[]> = new Map()

  registerRule(resourceType: string, rule: ValidationRule) {
    const existing = this.rules.get(resourceType) || []
    this.rules.set(resourceType, [...existing, rule])
  }

  validate(resource: KubernetesResource): ValidationResult {
    const rules = this.rules.get(resource.kind) || []
    return this.runRules(resource, rules)
  }
}

// Single source of truth for validation
export const validator = new ValidationEngine()
```

---

## Metrics & Success Criteria

### Phase 2 Success Metrics
- ✅ Command palette response time: <100ms
- ✅ YAML validation feedback: <500ms
- ✅ Recent resources: Show last 50 in <50ms
- ✅ Pattern detection accuracy: >80%

### Phase 3 Success Metrics
- ⚠️ Notebook cell execution: <2s
- ⚠️ Topology graph generation: <3s for 100 resources
- ⚠️ Template insertion: <100ms
- ⚠️ Multi-file scratchpad: Handle 10+ files smoothly

### Phase 4 Success Metrics
- 🔵 Auto-save delay: 3s (configurable)
- 🔵 Virtual list: Handle 10K+ items at 60 FPS
- 🔵 Keyboard navigation: All actions accessible
- 🔵 Test coverage: 80%+ for new features

---

## Conclusion

Kube-composer demonstrates excellent patterns for Kubernetes resource management, real-time validation, and visual feedback. By adapting these patterns to Kui's architecture, we can deliver:

1. **Intuitive Resource Navigation**: Category-based organization and recent resources
2. **Real-time Feedback**: Validation, suggestions, and error messages
3. **Visual Understanding**: Topology views and relationship graphs
4. **Production-ready Code**: Type safety, validation, and testing
5. **Great UX**: Auto-save, keyboard navigation, and accessibility

**Next Steps:**
1. ✅ Start with Phase 2: Command palette enhancements
2. ⚠️ Implement YAML validation in Monaco
3. ⚠️ Add recent resources tracking
4. ⚠️ Build resource relationship visualization
5. 🔵 Polish with auto-save and keyboard navigation

---

**Document Status**: ✅ Complete
**Last Updated**: 2025-12-17
**Author**: Claude (AI Assistant)
**Review Status**: Ready for team review
