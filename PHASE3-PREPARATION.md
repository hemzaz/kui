# Phase 3 Preparation - Advanced Features

**Status**: 🟡 PREPARING
**Target Start**: After Phase 2 completion
**Estimated Duration**: 8 weeks (Weeks 17-24)
**Platform**: macOS Apple Silicon only

---

## Phase 2 Progress Update

### ✅ Completed (Tasks 2.1.1 - 2.1.5)
- **Command Palette Infrastructure** - Full implementation with SQLite persistence
- **Recent Resources Tracking** - Kubernetes resource access tracking
- **Keyboard Shortcuts** - Global Cmd+K integration

### 🚧 Remaining Phase 2 Tasks
- **Task 2.2.1**: Pattern Detection for Smart History
- **Task 2.2.2**: AI-Powered Command Suggestions
- **Task 2.2.3**: Fuzzy History Search
- **Task 2.3.x**: AI-Enhanced Monaco Editor (3 tasks)
- **Task 2.4.x**: Contextual Intelligence (3 tasks)

**Recommendation**: Complete Phase 2 Tasks 2.2.x before starting Phase 3, as they provide foundation for intelligent features.

---

## Phase 3 Overview

**Goal**: Modern CLI experience with notebook mode, scratchpad, and visual topology

### Core Features

#### 3.1 Notebook Mode (Weeks 17-19)
- Jupyter-style notebook interface for Kubernetes operations
- Mix code cells, markdown cells, and output cells
- Save/load notebooks (.kui.json format)
- Sequential execution with cell dependencies
- Export to PDF, HTML, Markdown

#### 3.2 Scratchpad (Weeks 20-21)
- Multi-line command editor with Monaco
- Snippet library for common kubectl commands
- Quick execution with Cmd+Enter
- Persistent across sessions

#### 3.3 Visual Topology (Weeks 22-24)
- Interactive resource graph visualization
- Network topology view
- Service mesh visualization
- Click-to-navigate

---

## Detailed Task Breakdown

### 3.1 Notebook Mode

#### Task 3.1.1: Design Notebook Architecture ⭐ START HERE
**Priority**: 🟢 MEDIUM
**Effort**: 2 days
**Status**: Not Started

**Objectives**:
1. Define notebook data model
2. Design cell types (code, markdown, output)
3. Plan persistence format
4. Design UI mockups

**Data Model Design**:
```typescript
// Notebook structure
interface Notebook {
  version: string              // Format version
  metadata: {
    title: string
    created: string
    modified: string
    author?: string
    tags?: string[]
  }
  cells: Cell[]
}

interface Cell {
  id: string                   // Unique cell ID
  type: 'code' | 'markdown' | 'output'
  content: string              // Cell content
  metadata?: {
    execution_count?: number
    execution_time_ms?: number
    last_executed?: string
  }
  outputs?: CellOutput[]       // For code cells
}

interface CellOutput {
  type: 'text' | 'table' | 'json' | 'error'
  content: string | Table | Record<string, any>
  timestamp: string
}

// File format: .kui.json
{
  "version": "1.0.0",
  "metadata": {
    "title": "Pod Debugging Workflow",
    "created": "2025-12-17T10:00:00Z",
    "modified": "2025-12-17T11:30:00Z"
  },
  "cells": [
    {
      "id": "cell-1",
      "type": "markdown",
      "content": "# Pod Debugging\n\nSteps to debug failing pod"
    },
    {
      "id": "cell-2",
      "type": "code",
      "content": "kubectl get pods -n production",
      "metadata": {
        "execution_count": 1,
        "execution_time_ms": 245
      },
      "outputs": [
        {
          "type": "table",
          "content": { /* Table data */ },
          "timestamp": "2025-12-17T10:05:00Z"
        }
      ]
    }
  ]
}
```

**UI Design Considerations**:
- Toolbar: Add cell, delete cell, run cell, run all
- Cell actions: Move up, move down, duplicate
- Visual indicators: Execution count, timing, status
- Keyboard shortcuts:
  - `Cmd+Enter` - Run current cell
  - `Shift+Enter` - Run and move to next
  - `Cmd+Shift+Enter` - Run all cells
  - `Cmd+N` - New cell below
  - `Cmd+D` - Delete cell

**Files to Create**:
```
packages/notebook/
├── src/
│   ├── models/
│   │   ├── Notebook.ts           # Data models
│   │   ├── Cell.ts                # Cell interfaces
│   │   └── Output.ts              # Output types
│   ├── components/
│   │   ├── NotebookView.tsx       # Main notebook component
│   │   ├── CellContainer.tsx      # Cell wrapper
│   │   ├── CodeCell.tsx           # Code cell
│   │   ├── MarkdownCell.tsx       # Markdown cell
│   │   ├── OutputCell.tsx         # Output cell
│   │   └── CellToolbar.tsx        # Cell actions
│   ├── services/
│   │   ├── NotebookPersistence.ts # Save/load
│   │   └── CellExecution.ts       # Execution engine
│   └── styles/
│       └── notebook.scss          # Notebook styles
```

**Success Criteria**:
- ✅ Architecture documented
- ✅ Data model defined and validated
- ✅ UI mockups created
- ✅ File structure established

**Dependencies**: None

---

#### Task 3.1.2: Implement Notebook Cells
**Priority**: 🟢 MEDIUM
**Effort**: 4-5 days
**Status**: Not Started

**Implementation Plan**:

1. **Cell Container Component**:
```typescript
// components/CellContainer.tsx
import React, { useState } from 'react'
import { Cell } from '../models/Cell'
import CodeCell from './CodeCell'
import MarkdownCell from './MarkdownCell'
import OutputCell from './OutputCell'
import CellToolbar from './CellToolbar'

interface CellContainerProps {
  cell: Cell
  isSelected: boolean
  isExecuting: boolean
  onExecute: (cellId: string) => Promise<void>
  onDelete: (cellId: string) => void
  onMove: (cellId: string, direction: 'up' | 'down') => void
  onUpdate: (cellId: string, content: string) => void
}

export function CellContainer({
  cell,
  isSelected,
  isExecuting,
  onExecute,
  onDelete,
  onMove,
  onUpdate
}: CellContainerProps) {
  const [isHovered, setIsHovered] = useState(false)

  const renderCell = () => {
    switch (cell.type) {
      case 'code':
        return (
          <CodeCell
            content={cell.content}
            outputs={cell.outputs}
            isExecuting={isExecuting}
            executionCount={cell.metadata?.execution_count}
            onChange={content => onUpdate(cell.id, content)}
          />
        )
      case 'markdown':
        return (
          <MarkdownCell
            content={cell.content}
            onChange={content => onUpdate(cell.id, content)}
          />
        )
      case 'output':
        return <OutputCell outputs={cell.outputs} />
      default:
        return null
    }
  }

  return (
    <div
      className={`notebook-cell ${isSelected ? 'selected' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {(isHovered || isSelected) && (
        <CellToolbar
          cellId={cell.id}
          onExecute={() => onExecute(cell.id)}
          onDelete={() => onDelete(cell.id)}
          onMoveUp={() => onMove(cell.id, 'up')}
          onMoveDown={() => onMove(cell.id, 'down')}
        />
      )}
      {renderCell()}
    </div>
  )
}
```

2. **Code Cell with Monaco**:
```typescript
// components/CodeCell.tsx
import React, { useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { CellOutput } from '../models/Output'
import OutputRenderer from './OutputRenderer'

interface CodeCellProps {
  content: string
  outputs?: CellOutput[]
  isExecuting: boolean
  executionCount?: number
  onChange: (content: string) => void
}

export function CodeCell({
  content,
  outputs,
  isExecuting,
  executionCount,
  onChange
}: CodeCellProps) {
  const editorRef = useRef(null)

  return (
    <div className="code-cell">
      <div className="code-cell-header">
        <span className="execution-count">
          [{executionCount || ' '}]
        </span>
        {isExecuting && <span className="execution-status">⏳</span>}
      </div>
      <div className="code-cell-editor">
        <Editor
          height="auto"
          defaultLanguage="shell"
          value={content}
          onChange={value => onChange(value || '')}
          options={{
            minimap: { enabled: false },
            lineNumbers: 'off',
            scrollBeyondLastLine: false,
            automaticLayout: true
          }}
          onMount={editor => {
            editorRef.current = editor
          }}
        />
      </div>
      {outputs && outputs.length > 0 && (
        <div className="code-cell-output">
          {outputs.map((output, idx) => (
            <OutputRenderer key={idx} output={output} />
          ))}
        </div>
      )}
    </div>
  )
}
```

3. **Markdown Cell with Preview**:
```typescript
// components/MarkdownCell.tsx
import React, { useState } from 'react'
import { marked } from 'marked'
import Editor from '@monaco-editor/react'

interface MarkdownCellProps {
  content: string
  onChange: (content: string) => void
}

export function MarkdownCell({ content, onChange }: MarkdownCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [preview, setPreview] = useState(() => marked(content))

  const handleChange = (value: string) => {
    onChange(value)
    setPreview(marked(value))
  }

  return (
    <div
      className="markdown-cell"
      onDoubleClick={() => setIsEditing(true)}
    >
      {isEditing ? (
        <div className="markdown-editor">
          <Editor
            height="auto"
            defaultLanguage="markdown"
            value={content}
            onChange={value => handleChange(value || '')}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'off',
              wordWrap: 'on'
            }}
          />
          <button onClick={() => setIsEditing(false)}>Done</button>
        </div>
      ) : (
        <div
          className="markdown-preview"
          dangerouslySetInnerHTML={{ __html: preview }}
        />
      )}
    </div>
  )
}
```

**Success Criteria**:
- ✅ All cell types rendering correctly
- ✅ Editing functional in all cells
- ✅ Monaco integration working
- ✅ Cell toolbar working

**Dependencies**: Task 3.1.1, Task 1.4.1 (Monaco upgrade)

---

#### Task 3.1.3: Add Notebook Persistence
**Priority**: 🟢 MEDIUM
**Effort**: 2 days
**Status**: Not Started

**Implementation**:

```typescript
// services/NotebookPersistence.ts
import { Notebook } from '../models/Notebook'
import { getIpcRenderer, isTauriRuntime } from '@kui-shell/core/src/main/tauri-bridge'

export class NotebookPersistence {
  /**
   * Save notebook to file
   */
  static async save(notebook: Notebook, filepath: string): Promise<void> {
    const content = JSON.stringify(notebook, null, 2)

    if (isTauriRuntime()) {
      const ipc = getIpcRenderer()
      await ipc.invoke('save_notebook', { filepath, content })
    } else {
      // Browser: Use File System Access API or download
      const blob = new Blob([content], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filepath
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  /**
   * Load notebook from file
   */
  static async load(filepath: string): Promise<Notebook> {
    if (isTauriRuntime()) {
      const ipc = getIpcRenderer()
      const content = await ipc.invoke('load_notebook', { filepath })
      return JSON.parse(content)
    } else {
      // Browser: Use File System Access API
      throw new Error('Load not supported in browser mode')
    }
  }

  /**
   * Auto-save notebook
   */
  static async autoSave(notebook: Notebook): Promise<void> {
    const storageKey = `notebook-${notebook.metadata.title}`
    localStorage.setItem(storageKey, JSON.stringify(notebook))
  }

  /**
   * Export notebook to different formats
   */
  static async export(
    notebook: Notebook,
    format: 'pdf' | 'html' | 'markdown'
  ): Promise<string> {
    switch (format) {
      case 'html':
        return this.exportToHTML(notebook)
      case 'markdown':
        return this.exportToMarkdown(notebook)
      case 'pdf':
        return this.exportToPDF(notebook)
    }
  }

  private static exportToHTML(notebook: Notebook): string {
    let html = `<!DOCTYPE html>
<html>
<head>
  <title>${notebook.metadata.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto; }
    .cell { margin: 20px 0; }
    .code-cell { background: #f5f5f5; padding: 10px; border-radius: 4px; }
    pre { margin: 0; }
  </style>
</head>
<body>
  <h1>${notebook.metadata.title}</h1>
`

    for (const cell of notebook.cells) {
      if (cell.type === 'markdown') {
        html += `<div class="cell markdown-cell">${marked(cell.content)}</div>`
      } else if (cell.type === 'code') {
        html += `<div class="cell code-cell">
          <pre><code>${cell.content}</code></pre>
        </div>`
        if (cell.outputs) {
          html += `<div class="cell-output">${JSON.stringify(cell.outputs)}</div>`
        }
      }
    }

    html += `</body></html>`
    return html
  }

  private static exportToMarkdown(notebook: Notebook): string {
    let md = `# ${notebook.metadata.title}\n\n`

    for (const cell of notebook.cells) {
      if (cell.type === 'markdown') {
        md += `${cell.content}\n\n`
      } else if (cell.type === 'code') {
        md += `\`\`\`bash\n${cell.content}\n\`\`\`\n\n`
      }
    }

    return md
  }

  private static async exportToPDF(notebook: Notebook): Promise<string> {
    // Use puppeteer or similar to convert HTML to PDF
    const html = this.exportToHTML(notebook)
    // Implementation depends on PDF generation library
    throw new Error('PDF export not yet implemented')
  }
}
```

**Tauri Backend (Rust)**:

```rust
// src-tauri/src/notebook.rs
use std::fs;
use tauri::AppHandle;

#[tauri::command]
pub async fn save_notebook(
    filepath: String,
    content: String
) -> Result<(), String> {
    fs::write(&filepath, content)
        .map_err(|e| format!("Failed to save notebook: {}", e))
}

#[tauri::command]
pub async fn load_notebook(
    filepath: String
) -> Result<String, String> {
    fs::read_to_string(&filepath)
        .map_err(|e| format!("Failed to load notebook: {}", e))
}
```

**Success Criteria**:
- ✅ Save/load working
- ✅ Auto-save functional
- ✅ Export to HTML/Markdown working
- ✅ No data loss

**Dependencies**: Task 3.1.2

---

#### Task 3.1.4: Notebook Execution Engine
**Priority**: 🟢 MEDIUM
**Effort**: 3 days
**Status**: Not Started

**Implementation**: See detailed execution engine in document

**Dependencies**: Task 3.1.2

---

### 3.2 Scratchpad

#### Task 3.2.1: Create Scratchpad Component
**Priority**: 🟢 MEDIUM
**Effort**: 3 days

**Features**:
- Multi-line Monaco editor
- Persistent storage
- Cmd+Enter execution
- History tracking

#### Task 3.2.2: Add Snippet Library
**Priority**: 🟢 MEDIUM
**Effort**: 2 days

**Features**:
- Common kubectl snippets
- Variable substitution
- Quick insertion (Cmd+/)

---

### 3.3 Visual Topology

#### Task 3.3.1: Design Topology View
**Priority**: 🟢 LOW
**Effort**: 2 days

**Library**: react-flow (recommended)

#### Task 3.3.2: Implement Resource Graph
**Priority**: 🟢 LOW
**Effort**: 5-6 days

**Features**:
- Interactive node graph
- Resource relationships
- Click-to-navigate

#### Task 3.3.3: Add Network Topology
**Priority**: 🟢 LOW
**Effort**: 3-4 days

**Features**:
- Service mesh visualization
- Network policies
- Traffic flow

---

## Technical Prerequisites

### Dependencies to Install

```bash
# Notebook dependencies
npm install @monaco-editor/react marked
npm install --save-dev @types/marked

# Topology dependencies
npm install reactflow
npm install --save-dev @types/reactflow

# PDF export (optional)
npm install puppeteer
```

### Rust Dependencies (Cargo.toml)

```toml
# For notebook file operations
[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

---

## Updated Progress Tracking

```
Phase 1: Foundation        [██████████] 100% ✅ COMPLETE
Phase 2: AI Integration    [█████░░░░░]  56% (5/9 tasks)
Phase 3: Advanced Features [░░░░░░░░░░]   0% (0/11 tasks)
Phase 4: Polish           [░░░░░░░░░░]   0% (0/8 tasks)

TOTAL: [█████░░░░░] 40% (17/42 tasks)
```

---

## Recommended Approach

### Option 1: Complete Phase 2 First (Recommended)
**Timeline**: 2-3 weeks
- Finish Tasks 2.2.1, 2.2.2, 2.2.3 (Smart History)
- Complete Tasks 2.3.x (AI-Enhanced Editor)
- Complete Tasks 2.4.x (Contextual Intelligence)
- Then start Phase 3

**Benefits**:
- Complete AI integration provides better foundation
- Pattern detection useful for notebook suggestions
- AI completion enhances editor experience

### Option 2: Start Phase 3 in Parallel
**Timeline**: Immediate start
- Begin Phase 3 Task 3.1.1 (Notebook Architecture)
- Continue Phase 2 Tasks 2.2.x in parallel
- Merge both phases around Week 20

**Benefits**:
- Earlier delivery of notebook feature
- Parallel work streams possible
- No hard dependencies blocking start

---

## Next Steps

1. **Review and Approve Phase 3 Plan**
   - Confirm architecture decisions
   - Review data models
   - Approve UI designs

2. **Choose Approach** (Option 1 or Option 2)
   - Complete Phase 2 first (recommended)
   - Or start Phase 3 in parallel

3. **Create Phase 3 Development Branch**
   ```bash
   git checkout -b phase3/notebook-mode
   ```

4. **Start with Task 3.1.1**
   - Design notebook architecture
   - Define data models
   - Create UI mockups

---

## Risk Assessment

### High Risk
- **Notebook execution isolation** - Commands could affect system
- **Data persistence** - Notebook corruption/loss
- **Performance** - Large notebooks with many cells

### Medium Risk
- **Monaco integration** - Multiple editors in single view
- **Export quality** - PDF/HTML rendering accuracy
- **Browser compatibility** - File system access limitations

### Mitigation Strategies
- Sandbox execution environment
- Auto-save every 30 seconds
- Virtual scrolling for large notebooks
- Tauri-only features for filesystem access

---

## Success Criteria

### Phase 3 Complete When:
- ✅ Notebook mode fully functional
- ✅ Scratchpad working with snippets
- ✅ Visual topology rendering
- ✅ All features tested on macOS Apple Silicon
- ✅ Documentation complete
- ✅ Performance benchmarks met

---

**Status**: Ready for Phase 3
**Waiting on**: Phase 2 completion (recommended) or immediate start
**Next Task**: 3.1.1 - Design Notebook Architecture
