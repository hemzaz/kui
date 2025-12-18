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

import React, { useState, useCallback, useRef, useEffect } from 'react'
import Fuse from 'fuse.js'
import type { PickerDelegate } from './PickerDelegate'
import './styles.scss'

export interface PickerProps<T> {
  /** Delegate that handles picker behavior */
  delegate: PickerDelegate<T>

  /** Initial items to display */
  items: T[]

  /** Fuzzy search configuration */
  fuseOptions?: Fuse.IFuseOptions<T>

  /** Width of the picker (default: 544px, inspired by Zed) */
  width?: number

  /** Maximum height of the results list (default: 400px) */
  maxHeight?: number

  /** Called when picker is dismissed */
  onDismiss?: () => void

  /** Auto-focus input on mount (default: true) */
  autoFocus?: boolean
}

/**
 * Generic Picker component for fuzzy-searchable lists.
 * Inspired by Zed editor's picker architecture.
 *
 * Features:
 * - Fuzzy search with fuse.js
 * - Keyboard navigation (↑↓ Enter Esc)
 * - Mouse interaction
 * - Flexible rendering via delegate pattern
 */
export function Picker<T>({
  delegate,
  items,
  fuseOptions,
  width = 544,
  maxHeight = 400,
  onDismiss,
  autoFocus = true
}: PickerProps<T>) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [matches, setMatches] = useState<T[]>(items)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Initialize fuzzy search
  const fuse = useRef<Fuse<T>>(new Fuse(items, {
    threshold: 0.3,
    includeMatches: true,
    ...fuseOptions
  }))

  // Update fuse when items change
  useEffect(() => {
    fuse.current = new Fuse(items, {
      threshold: 0.3,
      includeMatches: true,
      ...fuseOptions
    })
    if (!query) {
      setMatches(items)
    }
  }, [items, fuseOptions, query])

  // Update matches when query changes
  useEffect(() => {
    const updateMatches = async () => {
      if (!query) {
        setMatches(items)
        setSelectedIndex(0)
        delegate.setSelectedIndex(0)
        await delegate.updateMatches('', items)
        return
      }

      const results = fuse.current.search(query)
      const matchedItems = results.map(r => r.item)
      setMatches(matchedItems)
      setSelectedIndex(0)
      delegate.setSelectedIndex(0)

      await delegate.updateMatches(query, matchedItems)
    }

    updateMatches()
  }, [query, items, delegate])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => {
          const newIndex = Math.min(i + 1, matches.length - 1)
          delegate.setSelectedIndex(newIndex)
          return newIndex
        })
        break

      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => {
          const newIndex = Math.max(i - 1, 0)
          delegate.setSelectedIndex(newIndex)
          return newIndex
        })
        break

      case 'Enter':
        e.preventDefault()
        if (matches[selectedIndex]) {
          delegate.confirm(matches[selectedIndex], e.shiftKey || e.metaKey)
        }
        break

      case 'Escape':
        e.preventDefault()
        delegate.dismissed()
        onDismiss?.()
        break

      case 'Home':
        e.preventDefault()
        setSelectedIndex(0)
        delegate.setSelectedIndex(0)
        break

      case 'End':
        e.preventDefault()
        setSelectedIndex(matches.length - 1)
        delegate.setSelectedIndex(matches.length - 1)
        break
    }
  }, [matches, selectedIndex, delegate, onDismiss])

  // Mouse selection
  const handleItemClick = useCallback((item: T, index: number, e: React.MouseEvent) => {
    setSelectedIndex(index)
    delegate.setSelectedIndex(index)
    delegate.confirm(item, e.shiftKey || e.metaKey)
  }, [delegate])

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus()
    }
  }, [autoFocus])

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.children[selectedIndex] as HTMLElement
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex])

  return (
    <div className="kui-picker" style={{ width }}>
      <div className="kui-picker-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={delegate.placeholderText()}
          className="kui-picker-input"
        />
      </div>
      <div
        ref={listRef}
        className="kui-picker-results"
        style={{ maxHeight }}
      >
        {matches.length === 0 ? (
          <div className="kui-picker-no-matches">
            {delegate.noMatchesText()}
          </div>
        ) : (
          <ul className="kui-picker-list">
            {matches.map((item, index) => (
              <li
                key={index}
                className={`kui-picker-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={(e) => handleItemClick(item, index, e)}
                onMouseEnter={() => {
                  setSelectedIndex(index)
                  delegate.setSelectedIndex(index)
                }}
              >
                {delegate.renderItem(item, index, index === selectedIndex)}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="kui-picker-footer">
        <span className="kui-picker-help-text">
          ↑↓ navigate • Enter select • Esc dismiss
        </span>
        <span className="kui-picker-match-count">
          {matches.length} {matches.length === 1 ? 'match' : 'matches'}
        </span>
      </div>
    </div>
  )
}
