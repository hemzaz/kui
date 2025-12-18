# Scratchpad Feature

## Overview

Scratchpad provides a multi-line code editor for quickly composing and executing commands without creating a full notebook. Think of it as a "scratch buffer" for ad-hoc command composition.

## Features

- **Multi-line Editing**: Write complex scripts with proper indentation
- **Syntax Highlighting**: Shell, YAML, JSON support
- **Quick Execution**: Cmd/Ctrl+Enter to run
- **Snippet Library**: Pre-built command snippets
- **History**: Access previously executed scratchpads
- **Persistence**: Auto-save current scratchpad

## Architecture

### Component Structure

```typescript
interface ScratchpadStore {
  content: string
  language: 'shell' | 'yaml' | 'json'
  history: ScratchpadEntry[]
  snippets: Snippet[]

  updateContent: (content: string) => void
  execute: () => Promise<void>
  clear: () => void
  loadSnippet: (id: string) => void
  saveSnippet: (name: string) => void
}

interface ScratchpadEntry {
  id: string
  content: string
  timestamp: number
  result?: any
}

interface Snippet {
  id: string
  name: string
  description: string
  content: string
  category: string
  tags: string[]
}
```

### UI Design

```
┌─────────────────────────────────────────────────────────────┐
│ Scratchpad                              [Shell ▼] [Snippets]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  kubectl get pods -n production \                          │
│    --field-selector=status.phase!=Running \               │
│    -o json | \                                            │
│    jq '.items[] | {name:.metadata.name, status:.status}'  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [▶ Run (Cmd+Enter)] [Clear] [Save as Snippet] [History]   │
└─────────────────────────────────────────────────────────────┘
```

## Pre-built Snippets

### Pod Debugging

```shell
# Get failing pods
kubectl get pods --all-namespaces \
  --field-selector=status.phase!=Running,status.phase!=Succeeded

# Pod logs with timestamps
kubectl logs <POD_NAME> --timestamps --tail=100

# Describe pod with events
kubectl describe pod <POD_NAME> | grep -A 10 Events
```

### Resource Queries

```shell
# List all resources in namespace
kubectl api-resources --verbs=list --namespaced -o name | \
  xargs -n 1 kubectl get --show-kind --ignore-not-found -n <NAMESPACE>

# Find resources using old image
kubectl get deploy --all-namespaces -o json | \
  jq '.items[] | select(.spec.template.spec.containers[].image | contains("old-image"))'
```

### Cluster Info

```shell
# Node resource usage
kubectl top nodes

# Namespace resource quotas
kubectl get resourcequota --all-namespaces

# PVC usage
kubectl get pvc --all-namespaces
```

## Keyboard Shortcuts

- **Cmd/Ctrl+Enter**: Execute scratchpad
- **Cmd/Ctrl+K**: Clear scratchpad
- **Cmd/Ctrl+S**: Save as snippet
- **Cmd/Ctrl+H**: Show history
- **Cmd/Ctrl+L**: Load snippet

## Implementation

### Scratchpad Store (Zustand)

```typescript
// packages/core/src/scratchpad/store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useScratchpadStore = create<ScratchpadStore>()(
  persist(
    (set, get) => ({
      content: '',
      language: 'shell',
      history: [],
      snippets: getDefaultSnippets(),

      updateContent: (content) => set({ content }),

      execute: async () => {
        const { content } = get()
        const result = await exec(content)

        // Add to history
        set(state => ({
          history: [{
            id: Date.now().toString(),
            content,
            timestamp: Date.now(),
            result
          }, ...state.history].slice(0, 50)
        }))
      },

      clear: () => set({ content: '' }),

      loadSnippet: (id) => {
        const snippet = get().snippets.find(s => s.id === id)
        if (snippet) {
          set({ content: snippet.content })
        }
      },

      saveSnippet: (name) => {
        const { content } = get()
        const snippet: Snippet = {
          id: Date.now().toString(),
          name,
          description: '',
          content,
          category: 'custom',
          tags: []
        }
        set(state => ({
          snippets: [...state.snippets, snippet]
        }))
      }
    }),
    { name: 'scratchpad-store' }
  )
)
```

### Scratchpad Component

```typescript
// plugins/plugin-client-common/src/components/Scratchpad/Scratchpad.tsx
import React, { useRef, useEffect } from 'react'
import * as monaco from 'monaco-editor'
import { useScratchpadStore } from '@kui-shell/core/src/scratchpad/store'

export function Scratchpad() {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>()
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    content,
    language,
    updateContent,
    execute,
    clear
  } = useScratchpadStore()

  useEffect(() => {
    if (!containerRef.current) return

    // Create editor
    const editor = monaco.editor.create(containerRef.current, {
      value: content,
      language: language === 'shell' ? 'shell' : language,
      theme: 'vs-dark',
      minimap: { enabled: false },
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true
    })

    editorRef.current = editor

    // Handle content changes
    editor.onDidChangeModelContent(() => {
      updateContent(editor.getValue())
    })

    // Handle keyboard shortcuts
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => execute()
    )

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
      () => clear()
    )

    return () => editor.dispose()
  }, [])

  return (
    <div className="kui-scratchpad">
      <div className="scratchpad-toolbar">
        <button onClick={execute}>▶ Run (Cmd+Enter)</button>
        <button onClick={clear}>Clear</button>
        <SnippetPicker />
      </div>
      <div ref={containerRef} className="scratchpad-editor" />
    </div>
  )
}
```

## Default Snippets

Located in `packages/core/src/scratchpad/default-snippets.ts`:

```typescript
export const defaultSnippets: Snippet[] = [
  {
    id: 'get-failing-pods',
    name: 'Get Failing Pods',
    description: 'List all pods that are not in Running or Succeeded state',
    content: `kubectl get pods --all-namespaces \\
  --field-selector=status.phase!=Running,status.phase!=Succeeded`,
    category: 'debugging',
    tags: ['pods', 'debugging', 'status']
  },
  {
    id: 'pod-logs',
    name: 'Pod Logs with Timestamps',
    description: 'Get recent logs from a pod with timestamps',
    content: `kubectl logs <POD_NAME> --timestamps --tail=100`,
    category: 'debugging',
    tags: ['logs', 'pods']
  },
  {
    id: 'resource-usage',
    name: 'Resource Usage',
    description: 'Show node resource usage',
    content: `kubectl top nodes\nkubectl top pods --all-namespaces`,
    category: 'monitoring',
    tags: ['resources', 'monitoring']
  }
]
```

## Integration Points

### Main Shell

Add scratchpad toggle to command palette:
- Command: "Open Scratchpad"
- Shortcut: Cmd+Shift+K
- Opens scratchpad in side panel or modal

### Context Menu

Add "Copy to Scratchpad" to:
- Command history items
- Table cells (kubectl output)
- Resource YAML editors

## Future Enhancements

- **Collaborative Scratchpads**: Share scratchpads with team
- **Snippet Marketplace**: Download community snippets
- **AI Assist**: AI-powered snippet suggestions
- **Templates**: Parameterized snippets with placeholders
- **Version History**: Track scratchpad changes over time
