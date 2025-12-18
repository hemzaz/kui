# Notebook Mode Architecture

## Overview

Notebook Mode provides a Jupyter-style interactive development environment for Kubernetes operations. Users can mix code execution, markdown documentation, and output visualization in a single document.

## Goals

- **Interactive Workflows**: Execute kubectl commands and scripts interactively
- **Documentation**: Mix code with markdown documentation
- **Reproducibility**: Save and share runbooks
- **Collaboration**: Share knowledge and workflows with team

## Data Model

### Notebook Structure

```typescript
interface Notebook {
  version: string // Format version (e.g., "1.0.0")
  metadata: NotebookMetadata
  cells: Cell[]
}

interface NotebookMetadata {
  id: string
  title: string
  description?: string
  author?: string
  created: number // Unix timestamp
  modified: number // Unix timestamp
  tags: string[]
  kubernetesContext?: {
    cluster: string
    namespace: string
  }
}

interface Cell {
  id: string
  type: CellType
  content: string
  metadata: CellMetadata
  outputs?: CellOutput[]
  executionCount?: number
}

enum CellType {
  Code = 'code',
  Markdown = 'markdown',
  Raw = 'raw'
}

interface CellMetadata {
  collapsed: boolean
  scrollable: boolean
  language?: string // For code cells: 'shell', 'yaml', 'json'
  tags: string[]
}

interface CellOutput {
  type: OutputType
  data: any
  timestamp: number
  executionTime?: number // milliseconds
}

enum OutputType {
  Text = 'text',
  Table = 'table',
  JSON = 'json',
  YAML = 'yaml',
  Error = 'error',
  HTML = 'html'
}
```

### File Format

Notebooks are saved as `.kui.json` files:

```json
{
  "version": "1.0.0",
  "metadata": {
    "id": "abc-123",
    "title": "Pod Debugging Runbook",
    "description": "Steps to debug failing pods",
    "author": "user@example.com",
    "created": 1703001600000,
    "modified": 1703001600000,
    "tags": ["debugging", "pods"],
    "kubernetesContext": {
      "cluster": "production",
      "namespace": "default"
    }
  },
  "cells": [
    {
      "id": "cell-1",
      "type": "markdown",
      "content": "# Pod Debugging\n\nSteps to diagnose pod issues...",
      "metadata": {
        "collapsed": false,
        "scrollable": false,
        "tags": []
      }
    },
    {
      "id": "cell-2",
      "type": "code",
      "content": "kubectl get pods",
      "metadata": {
        "collapsed": false,
        "scrollable": false,
        "language": "shell",
        "tags": []
      },
      "outputs": [
        {
          "type": "table",
          "data": { /* Table data */ },
          "timestamp": 1703001600000,
          "executionTime": 234
        }
      ],
      "executionCount": 1
    }
  ]
}
```

## Architecture

### Component Hierarchy

```
NotebookView
├── NotebookToolbar
│   ├── RunAllButton
│   ├── SaveButton
│   ├── ExportButton
│   └── SettingsButton
├── NotebookCells
│   ├── Cell (repeated)
│   │   ├── CellToolbar
│   │   │   ├── RunButton
│   │   │   ├── DeleteButton
│   │   │   ├── MoveUpButton
│   │   │   └── MoveDownButton
│   │   ├── CellInput
│   │   │   ├── CodeEditor (Monaco)
│   │   │   └── MarkdownEditor
│   │   └── CellOutput
│   │       ├── TextOutput
│   │       ├── TableOutput
│   │       ├── JSONOutput
│   │       ├── YAMLOutput
│   │       └── ErrorOutput
│   └── AddCellButton
└── NotebookFooter
    └── StatusBar
```

### State Management

Using Zustand for notebook state:

```typescript
interface NotebookStore {
  // State
  notebooks: Map<string, Notebook>
  activeNotebookId: string | null
  executingCells: Set<string>

  // Computed
  activeNotebook: () => Notebook | null

  // Actions
  createNotebook: (title: string) => string
  loadNotebook: (path: string) => Promise<void>
  saveNotebook: (id: string) => Promise<void>
  closeNotebook: (id: string) => void

  // Cell actions
  addCell: (notebookId: string, type: CellType, index?: number) => void
  deleteCell: (notebookId: string, cellId: string) => void
  updateCell: (notebookId: string, cellId: string, content: string) => void
  executeCell: (notebookId: string, cellId: string) => Promise<void>
  moveCellUp: (notebookId: string, cellId: string) => void
  moveCellDown: (notebookId: string, cellId: string) => void

  // Output actions
  setCellOutput: (notebookId: string, cellId: string, output: CellOutput) => void
  clearCellOutput: (notebookId: string, cellId: string) => void
}
```

### Execution Flow

1. **User triggers execution** (click run button or Shift+Enter)
2. **Store updates** `executingCells` set
3. **Execution engine** processes cell:
   - Parse command/script
   - Execute via REPL
   - Capture output
4. **Output processing**:
   - Determine output type (text, table, JSON, etc.)
   - Format for display
   - Store in cell.outputs
5. **Store updates** removes from `executingCells`, updates cell
6. **UI re-renders** with new output

### Keyboard Shortcuts

- **Shift+Enter**: Execute cell and move to next
- **Ctrl+Enter**: Execute cell and stay
- **Alt+Enter**: Execute cell and insert new below
- **Cmd+S**: Save notebook
- **Cmd+Shift+S**: Save as...
- **A**: Insert cell above (command mode)
- **B**: Insert cell below (command mode)
- **D,D**: Delete cell (command mode)
- **M**: Change to markdown (command mode)
- **Y**: Change to code (command mode)
- **Esc**: Enter command mode
- **Enter**: Enter edit mode

## Persistence

### Auto-save

- **Interval**: Every 30 seconds if changes detected
- **Strategy**: Incremental updates to avoid file corruption
- **Conflict resolution**: Last write wins (for now)

### File Management

```typescript
interface NotebookFileManager {
  save(notebook: Notebook, path: string): Promise<void>
  load(path: string): Promise<Notebook>
  export(notebook: Notebook, format: ExportFormat, path: string): Promise<void>
  autoSave(notebook: Notebook): Promise<void>
}

enum ExportFormat {
  HTML = 'html',
  Markdown = 'markdown',
  PDF = 'pdf',
  JSON = 'json'
}
```

### Storage

- **Location**: `~/.kui/notebooks/`
- **Format**: JSON with pretty printing
- **Backup**: `.kui.json.backup` created before each save
- **Version history**: Optional via git integration

## Execution Engine

### Command Execution

```typescript
interface NotebookExecutionEngine {
  executeCell(cell: Cell, context: ExecutionContext): Promise<CellOutput[]>
  executeCells(cells: Cell[], context: ExecutionContext): Promise<Map<string, CellOutput[]>>
  interrupt(cellId: string): void
}

interface ExecutionContext {
  notebook: Notebook
  kubernetesContext?: {
    cluster: string
    namespace: string
  }
  environment: Map<string, string> // Environment variables
  workingDirectory: string
}
```

### Output Capture

- **stdout/stderr**: Captured as text output
- **Tables**: Detected and formatted (kubectl output)
- **JSON/YAML**: Parsed and pretty-printed
- **Errors**: Captured with stack traces

### Cell Dependencies

Cells can reference previous cell outputs:

```shell
# Cell 1
kubectl get pods -o json | jq '.items[0].metadata.name'
# Output stored as $cell1

# Cell 2
kubectl logs $cell1  # References cell 1 output
```

## UI Design

### Cell Types

#### Code Cell

```
┌─────────────────────────────────────────────┐
│ [▶ Run] [🗑️] [↑] [↓]                In [1]:│
├─────────────────────────────────────────────┤
│ kubectl get pods                            │
│                                             │
├─────────────────────────────────────────────┤
│ Out[1]:                            (234ms) │
│ ┌───────────────────────────────────────┐ │
│ │ NAME            READY   STATUS        │ │
│ │ nginx-xyz       1/1     Running       │ │
│ │ redis-abc       1/1     Running       │ │
│ └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

#### Markdown Cell

```
┌─────────────────────────────────────────────┐
│ [✎] [🗑️] [↑] [↓]                           │
├─────────────────────────────────────────────┤
│ # Pod Debugging                             │
│                                             │
│ Steps to diagnose failing pods:             │
│ 1. Check pod status                         │
│ 2. Review logs                              │
│ 3. Inspect events                           │
└─────────────────────────────────────────────┘
```

### Toolbar

```
┌─────────────────────────────────────────────────────────────┐
│ 📓 Pod Debugging Runbook                                    │
│ [▶ Run All] [💾 Save] [📤 Export] [⚙️ Settings]            │
│                                                             │
│ Cluster: production | Namespace: default | Modified 2m ago │
└─────────────────────────────────────────────────────────────┘
```

## Export Formats

### HTML Export

Self-contained HTML with:
- Embedded CSS
- Syntax highlighting
- Collapsible outputs
- Print-friendly styles

### Markdown Export

Clean markdown with:
- Code blocks with syntax highlighting
- Tables as markdown tables
- Outputs as code blocks

### PDF Export

Professional PDF with:
- Table of contents
- Page numbers
- Syntax highlighting
- Logo/branding

## Implementation Plan

### Phase 1: Core Infrastructure (Task 3.1.2)

1. Create Cell component hierarchy
2. Implement CodeCell with Monaco
3. Implement MarkdownCell with preview
4. Add CellToolbar
5. Implement keyboard shortcuts

### Phase 2: Persistence (Task 3.1.3)

1. Implement NotebookFileManager
2. Add save/load functionality
3. Implement auto-save
4. Add export formats

### Phase 3: Execution (Task 3.1.4)

1. Create NotebookExecutionEngine
2. Implement command execution
3. Add output capture and formatting
4. Handle cell dependencies
5. Add error handling

## Testing Strategy

### Unit Tests

- Cell rendering
- Keyboard shortcuts
- State management
- File I/O

### Integration Tests

- Cell execution
- Output formatting
- Save/load cycle
- Export formats

### E2E Tests

- Create and run notebook
- Save and reload
- Export to various formats
- Keyboard navigation

## Future Enhancements

- **Collaboration**: Real-time collaborative editing
- **Version Control**: Git integration for notebooks
- **Templates**: Pre-built notebook templates for common tasks
- **Scheduling**: Run notebooks on schedule
- **Variables**: Parameterized notebooks
- **AI Assist**: AI-powered cell suggestions
- **Rich Outputs**: Charts, graphs, interactive visualizations
- **Cell Magic**: Special commands like `%%time`, `%%debug`
