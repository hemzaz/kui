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
 * Kui Configuration state
 * Migrated from React Context to Zustand
 *
 * Note: This should match the type from plugin-client-common/src/components/Client/KuiConfiguration.tsx
 * We use 'any' here to avoid circular dependencies. The actual type checking happens at the plugin level.
 */

export type KuiConfiguration = Record<string, any>

export interface KuiConfigSlice {
  kuiConfig: KuiConfiguration
  setKuiConfig: (config: Partial<KuiConfiguration>) => void
  updateKuiConfig: (updates: Partial<KuiConfiguration>) => void
  resetKuiConfig: () => void
}

const defaultKuiConfig: KuiConfiguration = {
  productName: 'Kui',
  components: 'patternfly',
  prompt: '/',
  noPromptContext: false
}

export const createKuiConfigSlice: StateCreator<KuiConfigSlice> = (set) => ({
  kuiConfig: defaultKuiConfig,

  setKuiConfig: (config) =>
    set(() => ({
      kuiConfig: { ...defaultKuiConfig, ...config }
    })),

  updateKuiConfig: (updates) =>
    set((state) => ({
      kuiConfig: { ...state.kuiConfig, ...updates }
    })),

  resetKuiConfig: () =>
    set(() => ({
      kuiConfig: defaultKuiConfig
    }))
})
