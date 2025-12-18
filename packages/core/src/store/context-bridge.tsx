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
 * Context Bridge - Backward Compatibility Layer
 *
 * This module provides React Context-like APIs that are backed by Zustand.
 * This allows for gradual migration without breaking existing code.
 *
 * @deprecated Use direct Zustand hooks instead (useStore, useMutabilityStore, etc.)
 */

import React, { useContext } from 'react'
import { useStore } from './index'
import type { MutabilityState } from './slices/mutability'
import type { KuiConfiguration } from './slices/kui-config'

/**
 * Mutability Context Bridge
 * @deprecated Use useMutabilityStore() instead
 */
export const MutabilityContext = React.createContext<MutabilityState>({
  editable: true,
  executable: true
})

/**
 * Hook to use MutabilityContext (backed by Zustand)
 * @deprecated Use useMutabilityStore() instead
 */
export function useMutability(): MutabilityState {
  return useStore((state) => state.mutability)
}

/**
 * KuiConfiguration Context Bridge
 * @deprecated Use useKuiConfigStore() instead
 */
export const KuiConfigContext = React.createContext<KuiConfiguration>({
  productName: 'Kui',
  components: 'patternfly'
})

/**
 * Hook to use KuiConfig (backed by Zustand)
 * @deprecated Use useKuiConfigStore() instead
 */
export function useKuiConfig(): KuiConfiguration {
  return useStore((state) => state.kuiConfig)
}

/**
 * Provider component that syncs Zustand state to React Context
 * This allows components using Context.Consumer to still work
 *
 * @deprecated Remove once all consumers are migrated to Zustand hooks
 */
export const ContextBridgeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const mutability = useStore((state) => state.mutability)
  const kuiConfig = useStore((state) => state.kuiConfig)

  return (
    <MutabilityContext.Provider value={mutability}>
      <KuiConfigContext.Provider value={kuiConfig}>
        {children}
      </KuiConfigContext.Provider>
    </MutabilityContext.Provider>
  )
}
