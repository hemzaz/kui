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
 * Tab state interface
 */
export interface Tab {
  id: string
  uuid: string
  title: string
  state: 'new' | 'processing' | 'complete' | 'error'
  closeable: boolean
  createdAt: number
  updatedAt: number
}

/**
 * Tabs slice state and actions
 */
export interface TabsSlice {
  tabs: Tab[]
  activeTabId: string | null

  // Actions
  addTab: (tab: Omit<Tab, 'createdAt' | 'updatedAt'>) => void
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTab: (id: string, updates: Partial<Tab>) => void
  clearTabs: () => void
}

/**
 * Create tabs slice
 */
export const createTabsSlice: StateCreator<TabsSlice> = (set, get) => ({
  tabs: [],
  activeTabId: null,

  addTab: (tab) => set((state) => {
    const newTab: Tab = {
      ...tab,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    return {
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id
    }
  }),

  removeTab: (id) => set((state) => {
    const filteredTabs = state.tabs.filter((tab) => tab.id !== id)
    let newActiveTabId = state.activeTabId

    // If removing active tab, switch to another tab
    if (state.activeTabId === id && filteredTabs.length > 0) {
      newActiveTabId = filteredTabs[filteredTabs.length - 1].id
    } else if (filteredTabs.length === 0) {
      newActiveTabId = null
    }

    return {
      tabs: filteredTabs,
      activeTabId: newActiveTabId
    }
  }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTab: (id, updates) => set((state) => ({
    tabs: state.tabs.map((tab) =>
      tab.id === id
        ? { ...tab, ...updates, updatedAt: Date.now() }
        : tab
    )
  })),

  clearTabs: () => set({ tabs: [], activeTabId: null })
})
