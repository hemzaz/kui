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
 * Split Injector state for terminal splits
 * Migrated from React Context to Zustand
 */

export interface InjectorOptions {
  /** Eliminate padding/margins around outer content */
  maximized?: boolean

  /** Use inverse colors in the split? */
  inverseColors?: boolean

  /** Force this new split to have (or not) an active input */
  hasActiveInput?: boolean
}

export enum SplitPosition {
  Left = 'left',
  Right = 'right',
  Top = 'top',
  Bottom = 'bottom'
}

export type SplitSpec = {
  uuid: string
  node: any // React.ReactNode (using any to avoid React dependency in core)
  position: SplitPosition
  count: number
  opts?: InjectorOptions
}

export interface SplitInjectorSlice {
  splits: SplitSpec[]

  /** Inject splits into the terminal */
  injectSplits: (splits: SplitSpec[]) => void

  /** Modify an existing split */
  modifySplit: (uuid: string, node: any, opts: InjectorOptions) => void

  /** Remove a split */
  removeSplit: (uuid: string) => void

  /** Clear all splits */
  clearSplits: () => void
}

export const createSplitInjectorSlice: StateCreator<SplitInjectorSlice> = (set) => ({
  splits: [],

  injectSplits: (newSplits) =>
    set((state) => {
      // Merge new splits with existing ones, avoiding duplicates
      const existingUUIDs = new Set(state.splits.map(s => s.uuid))
      const uniqueNewSplits = newSplits.filter(s => !existingUUIDs.has(s.uuid))

      return {
        splits: [...state.splits, ...uniqueNewSplits]
      }
    }),

  modifySplit: (uuid, node, opts) =>
    set((state) => ({
      splits: state.splits.map(split =>
        split.uuid === uuid
          ? { ...split, node, opts: { ...split.opts, ...opts } }
          : split
      )
    })),

  removeSplit: (uuid) =>
    set((state) => ({
      splits: state.splits.filter(split => split.uuid !== uuid)
    })),

  clearSplits: () =>
    set(() => ({
      splits: []
    }))
})
