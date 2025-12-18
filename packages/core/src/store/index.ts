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
 * Zustand Store - Modern State Management for Kui
 *
 * This is the main store that combines all slices and provides
 * centralized state management across the application.
 *
 * Features:
 * - Type-safe state management
 * - Persistence with localStorage
 * - DevTools integration
 * - Modular slices architecture
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { createTabsSlice, TabsSlice } from './slices/tabs'
import { createHistorySlice, HistorySlice } from './slices/history'
import { createSettingsSlice, SettingsSlice } from './slices/settings'
import { createAISlice, AISlice } from './slices/ai'
import { createMutabilitySlice, MutabilitySlice } from './slices/mutability'
import { createKuiConfigSlice, KuiConfigSlice } from './slices/kui-config'
import { createSplitInjectorSlice, SplitInjectorSlice } from './slices/split-injector'
import { createMarkdownTabsSlice, MarkdownTabsSlice } from './slices/markdown-tabs'

/**
 * Combined store state type
 */
export type StoreState = TabsSlice &
  HistorySlice &
  SettingsSlice &
  AISlice &
  MutabilitySlice &
  KuiConfigSlice &
  SplitInjectorSlice &
  MarkdownTabsSlice

/**
 * Main application store
 *
 * Usage:
 *   import { useStore } from '@kui-shell/core/store'
 *
 *   // In a component:
 *   const tabs = useStore(state => state.tabs)
 *   const addTab = useStore(state => state.addTab)
 */
export const useStore = create<StoreState>()(
  devtools(
    persist(
      (...a) => ({
        ...createTabsSlice(...a),
        ...createHistorySlice(...a),
        ...createSettingsSlice(...a),
        ...createAISlice(...a),
        ...createMutabilitySlice(...a),
        ...createKuiConfigSlice(...a),
        ...createSplitInjectorSlice(...a),
        ...createMarkdownTabsSlice(...a)
      }),
      {
        name: 'kui-store', // localStorage key
        partialize: (state) => ({
          // Only persist certain parts of the state
          history: state.history,
          settings: state.settings,
          kuiConfig: state.kuiConfig,
          // Don't persist tabs as they should start fresh
          // Don't persist AI state as it's runtime-only
          // Don't persist mutability (tab-specific)
          // Don't persist splits (runtime-only)
          // Don't persist markdown tabs (document-specific)
        })
      }
    ),
    {
      name: 'Kui Store', // DevTools name
      enabled: process.env.NODE_ENV !== 'production'
    }
  )
)

// Export individual selectors for better performance
export const useTabsStore = () => useStore((state) => ({
  tabs: state.tabs,
  activeTabId: state.activeTabId,
  addTab: state.addTab,
  removeTab: state.removeTab,
  setActiveTab: state.setActiveTab,
  updateTab: state.updateTab
}))

export const useHistoryStore = () => useStore((state) => ({
  history: state.history,
  addToHistory: state.addToHistory,
  clearHistory: state.clearHistory,
  getHistory: state.getHistory
}))

export const useSettingsStore = () => useStore((state) => ({
  settings: state.settings,
  updateSettings: state.updateSettings,
  resetSettings: state.resetSettings
}))

export const useAIStore = () => useStore((state) => ({
  aiEnabled: state.aiEnabled,
  aiProvider: state.aiProvider,
  aiSettings: state.aiSettings,
  setAIEnabled: state.setAIEnabled,
  setAIProvider: state.setAIProvider,
  updateAISettings: state.updateAISettings
}))

export const useMutabilityStore = () => useStore((state) => ({
  mutability: state.mutability,
  setMutability: state.setMutability,
  toggleEditable: state.toggleEditable,
  setEditable: state.setEditable,
  setExecutable: state.setExecutable,
  resetMutability: state.resetMutability
}))

export const useKuiConfigStore = () => useStore((state) => ({
  kuiConfig: state.kuiConfig,
  setKuiConfig: state.setKuiConfig,
  updateKuiConfig: state.updateKuiConfig,
  resetKuiConfig: state.resetKuiConfig
}))

export const useSplitInjectorStore = () => useStore((state) => ({
  splits: state.splits,
  injectSplits: state.injectSplits,
  modifySplit: state.modifySplit,
  removeSplit: state.removeSplit,
  clearSplits: state.clearSplits
}))

export const useMarkdownTabsStore = () => useStore((state) => ({
  markdownTabs: state.markdownTabs,
  setMarkdownTab: state.setMarkdownTab,
  getMarkdownTab: state.getMarkdownTab,
  removeMarkdownTab: state.removeMarkdownTab,
  clearMarkdownTabs: state.clearMarkdownTabs
}))
