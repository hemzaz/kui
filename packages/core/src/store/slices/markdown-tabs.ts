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
 * Markdown Tabs state
 * Migrated from React Context to Zustand
 * Tracks active tabs in markdown documents
 */

export interface MarkdownTabState {
  activeKey: number
  previousActiveKey: number | undefined
}

export interface MarkdownTabsSlice {
  markdownTabs: Record<string, MarkdownTabState>

  /** Set the active tab for a markdown document */
  setMarkdownTab: (documentId: string, activeKey: number) => void

  /** Get the state for a specific markdown document */
  getMarkdownTab: (documentId: string) => MarkdownTabState | undefined

  /** Remove tab state for a document */
  removeMarkdownTab: (documentId: string) => void

  /** Clear all markdown tab states */
  clearMarkdownTabs: () => void
}

const defaultTabState: MarkdownTabState = {
  activeKey: 0,
  previousActiveKey: undefined
}

export const createMarkdownTabsSlice: StateCreator<MarkdownTabsSlice> = (set, get) => ({
  markdownTabs: {},

  setMarkdownTab: (documentId, activeKey) =>
    set((state) => {
      const current = state.markdownTabs[documentId] || defaultTabState

      return {
        markdownTabs: {
          ...state.markdownTabs,
          [documentId]: {
            activeKey,
            previousActiveKey: current.activeKey
          }
        }
      }
    }),

  getMarkdownTab: (documentId) => {
    const state = get()
    return state.markdownTabs[documentId]
  },

  removeMarkdownTab: (documentId) =>
    set((state) => {
      const { [documentId]: _, ...rest } = state.markdownTabs
      return {
        markdownTabs: rest
      }
    }),

  clearMarkdownTabs: () =>
    set(() => ({
      markdownTabs: {}
    }))
})
