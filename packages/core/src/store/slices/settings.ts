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
 * Application settings interface
 */
export interface Settings {
  theme: 'light' | 'dark' | 'auto'
  fontSize: number
  fontFamily: string
  tabSize: number
  showLineNumbers: boolean
  wordWrap: boolean
  minimap: boolean
  enableSounds: boolean
  enableNotifications: boolean
  autoSave: boolean
  autoSaveDelay: number // milliseconds
  telemetry: boolean
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  fontSize: 14,
  fontFamily: 'Monaco, Menlo, "Courier New", monospace',
  tabSize: 2,
  showLineNumbers: true,
  wordWrap: true,
  minimap: false,
  enableSounds: true,
  enableNotifications: true,
  autoSave: false,
  autoSaveDelay: 1000,
  telemetry: false
}

/**
 * Settings slice state and actions
 */
export interface SettingsSlice {
  settings: Settings

  // Actions
  updateSettings: (updates: Partial<Settings>) => void
  resetSettings: () => void
  getSetting: <K extends keyof Settings>(key: K) => Settings[K]
}

/**
 * Create settings slice
 */
export const createSettingsSlice: StateCreator<SettingsSlice> = (set, get) => ({
  settings: DEFAULT_SETTINGS,

  updateSettings: (updates) => set((state) => ({
    settings: {
      ...state.settings,
      ...updates
    }
  })),

  resetSettings: () => set({ settings: DEFAULT_SETTINGS }),

  getSetting: (key) => {
    return get().settings[key]
  }
})
