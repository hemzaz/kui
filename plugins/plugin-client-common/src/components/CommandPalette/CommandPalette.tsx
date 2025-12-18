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

import React, { useMemo } from 'react'
import { Picker } from '../Picker'
import { CommandPaletteDelegate } from './CommandPaletteDelegate'
import type { Command } from './commands'
import './styles.scss'

export interface CommandPaletteProps {
  /** Available commands */
  commands: Command[]

  /** Called when palette is dismissed */
  onDismiss: () => void

  /** Width of the palette (default: 600px) */
  width?: number

  /** Maximum height of results (default: 400px) */
  maxHeight?: number
}

/**
 * Command Palette Component
 * Provides fuzzy-searchable command list with categorization and hit tracking.
 *
 * Features:
 * - Fuzzy search
 * - Command categorization
 * - Usage tracking (hit counts)
 * - Keyboard shortcuts display
 * - Recent commands prioritization
 */
export function CommandPalette({
  commands,
  onDismiss,
  width = 600,
  maxHeight = 400
}: CommandPaletteProps) {
  // Create delegate
  const delegate = useMemo(
    () => new CommandPaletteDelegate(commands),
    [commands]
  )

  // Fuse options for command search
  const fuseOptions = {
    keys: [
      { name: 'name', weight: 2 },
      { name: 'description', weight: 1 },
      { name: 'category', weight: 0.5 },
      { name: 'resourceType', weight: 0.5 }
    ],
    threshold: 0.4,
    includeMatches: true
  }

  return (
    <div className="kui-command-palette-overlay" onClick={onDismiss}>
      <div
        className="kui-command-palette-container"
        onClick={e => e.stopPropagation()}
      >
        <Picker
          delegate={delegate}
          items={commands}
          fuseOptions={fuseOptions}
          width={width}
          maxHeight={maxHeight}
          onDismiss={onDismiss}
          autoFocus={true}
        />
      </div>
    </div>
  )
}
