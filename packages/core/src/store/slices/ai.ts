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
 * AI provider type
 */
export type AIProvider = 'anthropic' | 'openai' | 'azure' | 'ollama' | 'custom'

/**
 * AI settings interface
 */
export interface AISettings {
  model?: string
  apiKey?: string
  apiEndpoint?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  context?: string[]
}

/**
 * AI slice state and actions
 */
export interface AISlice {
  aiEnabled: boolean
  aiProvider: AIProvider
  aiSettings: AISettings

  // Actions
  setAIEnabled: (enabled: boolean) => void
  setAIProvider: (provider: AIProvider) => void
  updateAISettings: (updates: Partial<AISettings>) => void
  clearAISettings: () => void
  addContext: (context: string) => void
  clearContext: () => void
}

/**
 * Default AI settings
 */
const DEFAULT_AI_SETTINGS: AISettings = {
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: 'You are a helpful Kubernetes assistant.',
  context: []
}

/**
 * Create AI slice
 */
export const createAISlice: StateCreator<AISlice> = (set, get) => ({
  aiEnabled: false,
  aiProvider: 'anthropic',
  aiSettings: DEFAULT_AI_SETTINGS,

  setAIEnabled: (enabled) => set({ aiEnabled: enabled }),

  setAIProvider: (provider) => set({ aiProvider: provider }),

  updateAISettings: (updates) => set((state) => ({
    aiSettings: {
      ...state.aiSettings,
      ...updates
    }
  })),

  clearAISettings: () => set({ aiSettings: DEFAULT_AI_SETTINGS }),

  addContext: (context) => set((state) => ({
    aiSettings: {
      ...state.aiSettings,
      context: [...(state.aiSettings.context || []), context]
    }
  })),

  clearContext: () => set((state) => ({
    aiSettings: {
      ...state.aiSettings,
      context: []
    }
  }))
})
