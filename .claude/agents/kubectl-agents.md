# Kubernetes Integration Agents

Agents responsible for kubectl integration and Kubernetes resource management.

## Agent A21: kubectl Core Agent

**Scope**: kubectl command execution and response transformation

**Location**: `plugins/plugin-kubectl/src/controller/kubectl/`

**Key Responsibilities**:
- kubectl command execution
- Output parsing (table, JSON, YAML)
- Resource drilldown navigation
- Watch mode for resource updates
- Multi-cluster support

**Key Files**:
- `exec.ts` - Command execution
- `get.ts` - Resource fetching
- `drilldown.ts` - Resource navigation
- `watch.ts` - Watch mode implementation

**Communication**:
- Registered with **A02 Command Router**
- Returns Table/MultiModalResponse to **A05 Response Type Handler**
- Uses **A12 Table Renderer** for tabular output
- Coordinates with **A22 Resource View Agent** for detailed views

**Quality Standards**:
- 2-3x faster than native kubectl for many operations
- Support for all kubectl commands
- Graceful handling of cluster disconnections
- Performance: < 100ms overhead vs kubectl

---

## Agent A22: Resource View Agent

**Scope**: Kubernetes resource detail views and modes

**Location**: `plugins/plugin-kubectl/src/view/modes/`

**Key Responsibilities**:
- Resource-specific view modes (pods, services, deployments, etc.)
- Summary view with key metadata
- Events view for resource events
- YAML/JSON raw view
- Custom resource views

**Key Modes**:
- `Summary` - Resource overview with key fields
- `Events` - Kubernetes events for the resource
- `YAML` - Raw YAML definition
- `Logs` - Pod logs (for pods)
- `Describe` - kubectl describe output

**Communication**:
- Called by **A21 kubectl Core** for resource views
- Uses **A14 Card Renderer** for summary views
- Uses **A15 Monaco Editor** for YAML views
- Uses **A24 Pod Logs Agent** for log views

**Quality Standards**:
- Fast mode switching (< 50ms)
- Syntax highlighting for YAML
- Real-time updates for watch mode
- Responsive design for all resource types

---

## Agent A23: YAML Editor Agent

**Scope**: Kubernetes YAML editing and validation

**Location**: `plugins/plugin-kubectl/src/view/modes/edit-mode.ts`

**Key Responsibilities**:
- YAML editing with validation
- Schema validation for Kubernetes resources
- Apply changes to cluster
- Diff view before applying
- Rollback support

**Key Features**:
- Monaco editor integration
- Kubernetes schema validation
- Autocompletion for resource types
- Error highlighting
- kubectl apply on save

**Communication**:
- Uses **A15 Monaco Editor Agent** for editing UI
- Validates with Kubernetes schemas
- Applies changes via **A21 kubectl Core**
- Shows diff via **A15 Monaco Editor** diff mode

**Quality Standards**:
- Real-time validation errors
- Syntax highlighting
- Undo/redo support
- Safe apply (confirm changes)
- Rollback on apply failure

---

## Agent A24: Pod Logs Agent

**Scope**: Pod log streaming and viewing

**Location**: `plugins/plugin-kubectl/src/controller/kubectl/logs.ts`

**Key Responsibilities**:
- Log streaming from pods
- Multi-container support
- Follow mode (tail -f)
- Log filtering and search
- Export logs

**Key Features**:
- Streaming logs with xterm.js
- ANSI color support
- Container selection for multi-container pods
- Timestamp display
- Search within logs

**Communication**:
- Called by **A22 Resource View Agent** for pod logs
- Uses **A13 Terminal Renderer** for log display
- Streams data from kubectl logs command

**Quality Standards**:
- Low latency streaming (< 100ms)
- Support for high-volume logs
- Graceful handling of connection drops
- Memory efficient (bounded buffer)

---

## Agent A25: Helm Integration Agent

**Scope**: Helm command integration

**Location**: `plugins/plugin-kubectl/src/controller/helm/`

**Key Responsibilities**:
- Helm chart management
- Release listing and status
- Chart installation and upgrades
- Values editing
- Rollback support

**Key Commands**:
- `helm list` - List releases
- `helm status` - Release status
- `helm install` - Install chart
- `helm upgrade` - Upgrade release
- `helm rollback` - Rollback release

**Communication**:
- Registered with **A02 Command Router**
- Uses **A12 Table Renderer** for release lists
- Uses **A15 Monaco Editor** for values editing
- Coordinates with **A21 kubectl Core** for deployed resources

**Quality Standards**:
- Support for Helm 3
- Chart repository management
- Values validation
- Safe upgrades with confirmation

---

## Agent A26: odo Integration Agent

**Scope**: Red Hat odo (OpenShift Do) integration

**Location**: `plugins/plugin-kubectl/src/controller/odo/`

**Key Responsibilities**:
- odo component management
- Component creation and deployment
- Watch mode for code changes
- odo service integration

**Key Commands**:
- `odo list` - List components
- `odo create` - Create component
- `odo push` - Deploy changes
- `odo watch` - Auto-deploy on changes

**Communication**:
- Registered with **A02 Command Router**
- Uses **A21 kubectl Core** for cluster interaction
- Uses **A13 Terminal Renderer** for output

**Quality Standards**:
- OpenShift compatibility
- Developer workflow support
- Fast incremental deployments

---

## Agent A27: oc Integration Agent

**Scope**: OpenShift CLI (oc) integration

**Location**: `plugins/plugin-kubectl/src/controller/oc/`

**Key Responsibilities**:
- OpenShift-specific commands
- Project management
- Route management
- Build and deployment configs

**Key Commands**:
- `oc projects` - List projects
- `oc routes` - List routes
- `oc builds` - List builds
- `oc deploy` - Trigger deployment

**Communication**:
- Registered with **A02 Command Router**
- Extends **A21 kubectl Core** with OpenShift features
- Uses standard Kui renderers

**Quality Standards**:
- OpenShift API compatibility
- Project switching support
- Route visualization

---

## Communication Patterns

### Pattern 1: kubectl get Flow
```
User: kubectl get pods
  ↓
A02 Command Router (route to kubectl)
  ↓
A21 kubectl Core (execute kubectl get)
  ↓
A21 (parse output to Table)
  ↓
A12 Table Renderer (render table)
  ↓
User clicks pod → A22 Resource View (show pod details)
```

### Pattern 2: Resource Edit Flow
```
User clicks "Edit" button
  ↓
A22 Resource View (load resource YAML)
  ↓
A23 YAML Editor (display in Monaco)
  ↓
User edits and saves (Cmd+S)
  ↓
A23 (validate YAML)
  ↓
A23 → A21 kubectl Core (kubectl apply)
  ↓
A22 Resource View (refresh view)
```

### Pattern 3: Pod Logs Flow
```
User selects "Logs" tab
  ↓
A22 Resource View (request logs)
  ↓
A24 Pod Logs Agent (kubectl logs --follow)
  ↓
A13 Terminal Renderer (stream output)
  ↓
User scrolls/searches → A13 (handle interaction)
```

### Pattern 4: Helm Install Flow
```
User: helm install my-release stable/redis
  ↓
A02 Command Router (route to helm)
  ↓
A25 Helm Integration (helm install)
  ↓
A25 (show installation progress)
  ↓
A25 → A21 kubectl Core (show deployed resources)
  ↓
A12 Table Renderer (show pods/services)
```

## Testing Strategy

Kubernetes agents must have:
- **Unit tests**: Command parsing and output formatting
- **Integration tests**: Real kubectl commands (requires cluster)
- **Mock tests**: Mocked kubectl output for CI
- **Performance tests**: Large resource lists (1000+ pods)
- **Error tests**: Cluster disconnection, invalid resources

## Development Guidelines

When modifying kubectl agents:
1. Test with multiple Kubernetes versions (1.24+)
2. Test with OpenShift when using oc/odo features
3. Handle cluster disconnections gracefully
4. Support both kubectl and kubeconfig contexts
5. Maintain compatibility with native kubectl output
6. Test with RBAC-restricted clusters
7. Verify watch mode works correctly
8. Test with custom resources (CRDs)
