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

import { StateCreator } from 'zustand'

/**
 * History entry interface
 */
export interface HistoryEntry {
  command: string
  timestamp: number
  tabId?: string
  cwd?: string
}

/**
 * History slice state and actions
 */
export interface HistorySlice {
  history: HistoryEntry[]
  maxHistorySize: number

  // Actions
  addToHistory: (entry: Omit<HistoryEntry, 'timestamp'>) => void
  clearHistory: () => void
  getHistory: (tabId?: string) => HistoryEntry[]
  removeFromHistory: (index: number) => void
}

/**
 * Create history slice
 */
export const createHistorySlice: StateCreator<HistorySlice> = (set, get) => ({
  history: [],
  maxHistorySize: 1000, // Maximum number of history entries

  addToHistory: (entry) => set((state) => {
    const newEntry: HistoryEntry = {
      ...entry,
      timestamp: Date.now()
    }

    const newHistory = [...state.history, newEntry]

    // Trim history if it exceeds max size
    if (newHistory.length > state.maxHistorySize) {
      return {
        history: newHistory.slice(-state.maxHistorySize)
      }
    }

    return { history: newHistory }
  }),

  clearHistory: () => set({ history: [] }),

  getHistory: (tabId) => {
    const state = get()

    if (tabId) {
      return state.history.filter((entry) => entry.tabId === tabId)
    }

    return state.history
  },

  removeFromHistory: (index) => set((state) => ({
    history: state.history.filter((_, i) => i !== index)
  }))
})
