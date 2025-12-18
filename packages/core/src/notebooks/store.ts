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
 * Notebook Store - Zustand state management for notebooks
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Notebook, Cell, CellType, CellOutput } from './types'

interface NotebookStore {
  // State
  notebooks: Map<string, Notebook>
  activeNotebookId: string | null
  executingCells: Set<string>

  // Computed
  activeNotebook: () => Notebook | null

  // Actions
  createNotebook: (title: string) => string
  loadNotebook: (notebook: Notebook) => void
  closeNotebook: (id: string) => void
  updateNotebookMetadata: (id: string, metadata: Partial<Notebook['metadata']>) => void

  // Cell actions
  addCell: (notebookId: string, type: CellType, index?: number) => void
  deleteCell: (notebookId: string, cellId: string) => void
  updateCell: (notebookId: string, cellId: string, content: string) => void
  moveCellUp: (notebookId: string, cellId: string) => void
  moveCellDown: (notebookId: string, cellId: string) => void
  toggleCellCollapse: (notebookId: string, cellId: string) => void

  // Execution actions
  startCellExecution: (notebookId: string, cellId: string) => void
  endCellExecution: (notebookId: string, cellId: string, output: CellOutput) => void
  clearCellOutput: (notebookId: string, cellId: string) => void

  // Selection
  setActiveNotebook: (id: string | null) => void
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function createDefaultNotebook(title: string): Notebook {
  const now = Date.now()
  return {
    version: '1.0.0',
    metadata: {
      id: generateId(),
      title,
      created: now,
      modified: now,
      tags: []
    },
    cells: [
      {
        id: generateId(),
        type: 'code' as CellType,
        content: '',
        metadata: {
          collapsed: false,
          scrollable: false,
          language: 'shell',
          tags: []
        }
      }
    ]
  }
}

export const useNotebookStore = create<NotebookStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      notebooks: new Map(),
      activeNotebookId: null,
      executingCells: new Set(),

      // Computed
      activeNotebook: () => {
        const state = get()
        if (!state.activeNotebookId) return null
        return state.notebooks.get(state.activeNotebookId) || null
      },

      // Actions
      createNotebook: (title) => {
        const notebook = createDefaultNotebook(title)
        set(state => {
          const newNotebooks = new Map(state.notebooks)
          newNotebooks.set(notebook.metadata.id, notebook)
          return {
            notebooks: newNotebooks,
            activeNotebookId: notebook.metadata.id
          }
        })
        return notebook.metadata.id
      },

      loadNotebook: (notebook) => {
        set(state => {
          const newNotebooks = new Map(state.notebooks)
          newNotebooks.set(notebook.metadata.id, notebook)
          return {
            notebooks: newNotebooks,
            activeNotebookId: notebook.metadata.id
          }
        })
      },

      closeNotebook: (id) => {
        set(state => {
          const newNotebooks = new Map(state.notebooks)
          newNotebooks.delete(id)

          const newActiveId = state.activeNotebookId === id
            ? (newNotebooks.size > 0 ? Array.from(newNotebooks.keys())[0] : null)
            : state.activeNotebookId

          return {
            notebooks: newNotebooks,
            activeNotebookId: newActiveId
          }
        })
      },

      updateNotebookMetadata: (id, metadata) => {
        set(state => {
          const notebook = state.notebooks.get(id)
          if (!notebook) return state

          const updated: Notebook = {
            ...notebook,
            metadata: {
              ...notebook.metadata,
              ...metadata,
              modified: Date.now()
            }
          }

          const newNotebooks = new Map(state.notebooks)
          newNotebooks.set(id, updated)
          return { notebooks: newNotebooks }
        })
      },

      // Cell actions
      addCell: (notebookId, type, index) => {
        set(state => {
          const notebook = state.notebooks.get(notebookId)
          if (!notebook) return state

          const newCell: Cell = {
            id: generateId(),
            type,
            content: '',
            metadata: {
              collapsed: false,
              scrollable: false,
              language: type === 'code' ? 'shell' : undefined,
              tags: []
            }
          }

          const cells = [...notebook.cells]
          const insertIndex = index !== undefined ? index : cells.length
          cells.splice(insertIndex, 0, newCell)

          const updated: Notebook = {
            ...notebook,
            cells,
            metadata: {
              ...notebook.metadata,
              modified: Date.now()
            }
          }

          const newNotebooks = new Map(state.notebooks)
          newNotebooks.set(notebookId, updated)
          return { notebooks: newNotebooks }
        })
      },

      deleteCell: (notebookId, cellId) => {
        set(state => {
          const notebook = state.notebooks.get(notebookId)
          if (!notebook) return state

          const cells = notebook.cells.filter(c => c.id !== cellId)

          const updated: Notebook = {
            ...notebook,
            cells,
            metadata: {
              ...notebook.metadata,
              modified: Date.now()
            }
          }

          const newNotebooks = new Map(state.notebooks)
          newNotebooks.set(notebookId, updated)
          return { notebooks: newNotebooks }
        })
      },

      updateCell: (notebookId, cellId, content) => {
        set(state => {
          const notebook = state.notebooks.get(notebookId)
          if (!notebook) return state

          const cells = notebook.cells.map(cell =>
            cell.id === cellId ? { ...cell, content } : cell
          )

          const updated: Notebook = {
            ...notebook,
            cells,
            metadata: {
              ...notebook.metadata,
              modified: Date.now()
            }
          }

          const newNotebooks = new Map(state.notebooks)
          newNotebooks.set(notebookId, updated)
          return { notebooks: newNotebooks }
        })
      },

      moveCellUp: (notebookId, cellId) => {
        set(state => {
          const notebook = state.notebooks.get(notebookId)
          if (!notebook) return state

          const index = notebook.cells.findIndex(c => c.id === cellId)
          if (index <= 0) return state

          const cells = [...notebook.cells]
          ;[cells[index - 1], cells[index]] = [cells[index], cells[index - 1]]

          const updated: Notebook = {
            ...notebook,
            cells,
            metadata: {
              ...notebook.metadata,
              modified: Date.now()
            }
          }

          const newNotebooks = new Map(state.notebooks)
          newNotebooks.set(notebookId, updated)
          return { notebooks: newNotebooks }
        })
      },

      moveCellDown: (notebookId, cellId) => {
        set(state => {
          const notebook = state.notebooks.get(notebookId)
          if (!notebook) return state

          const index = notebook.cells.findIndex(c => c.id === cellId)
          if (index < 0 || index >= notebook.cells.length - 1) return state

          const cells = [...notebook.cells]
          ;[cells[index], cells[index + 1]] = [cells[index + 1], cells[index]]

          const updated: Notebook = {
            ...notebook,
            cells,
            metadata: {
              ...notebook.metadata,
              modified: Date.now()
            }
          }

          const newNotebooks = new Map(state.notebooks)
          newNotebooks.set(notebookId, updated)
          return { notebooks: newNotebooks }
        })
      },

      toggleCellCollapse: (notebookId, cellId) => {
        set(state => {
          const notebook = state.notebooks.get(notebookId)
          if (!notebook) return state

          const cells = notebook.cells.map(cell =>
            cell.id === cellId
              ? {
                  ...cell,
                  metadata: {
                    ...cell.metadata,
                    collapsed: !cell.metadata.collapsed
                  }
                }
              : cell
          )

          const updated: Notebook = {
            ...notebook,
            cells
          }

          const newNotebooks = new Map(state.notebooks)
          newNotebooks.set(notebookId, updated)
          return { notebooks: newNotebooks }
        })
      },

      // Execution actions
      startCellExecution: (notebookId, cellId) => {
        set(state => {
          const newExecuting = new Set(state.executingCells)
          newExecuting.add(`${notebookId}:${cellId}`)
          return { executingCells: newExecuting }
        })
      },

      endCellExecution: (notebookId, cellId, output) => {
        set(state => {
          const notebook = state.notebooks.get(notebookId)
          if (!notebook) return state

          const cells = notebook.cells.map(cell => {
            if (cell.id !== cellId) return cell

            const executionCount = (cell.executionCount || 0) + 1
            const outputs = [...(cell.outputs || []), output]

            return {
              ...cell,
              outputs,
              executionCount
            }
          })

          const updated: Notebook = {
            ...notebook,
            cells,
            metadata: {
              ...notebook.metadata,
              modified: Date.now()
            }
          }

          const newNotebooks = new Map(state.notebooks)
          newNotebooks.set(notebookId, updated)

          const newExecuting = new Set(state.executingCells)
          newExecuting.delete(`${notebookId}:${cellId}`)

          return {
            notebooks: newNotebooks,
            executingCells: newExecuting
          }
        })
      },

      clearCellOutput: (notebookId, cellId) => {
        set(state => {
          const notebook = state.notebooks.get(notebookId)
          if (!notebook) return state

          const cells = notebook.cells.map(cell =>
            cell.id === cellId
              ? { ...cell, outputs: [], executionCount: 0 }
              : cell
          )

          const updated: Notebook = {
            ...notebook,
            cells
          }

          const newNotebooks = new Map(state.notebooks)
          newNotebooks.set(notebookId, updated)
          return { notebooks: newNotebooks }
        })
      },

      // Selection
      setActiveNotebook: (id) => {
        set({ activeNotebookId: id })
      }
    }),
    { name: 'notebook-store' }
  )
)
