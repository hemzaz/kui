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

import React from 'react'

/**
 * Picker delegate interface inspired by Zed editor's picker architecture.
 * Provides a flexible, reusable picker component for command palette, file navigation, etc.
 */
export interface PickerDelegate<T> {
  /**
   * Get the total number of matches
   */
  matchCount(): number

  /**
   * Get the currently selected index
   */
  selectedIndex(): number

  /**
   * Set the selected index
   */
  setSelectedIndex(index: number): void

  /**
   * Get placeholder text for the search input
   */
  placeholderText(): string

  /**
   * Get text to display when no matches are found
   */
  noMatchesText(): string

  /**
   * Update matches based on query
   * Called after fuzzy search completes
   */
  updateMatches(query: string, matches: T[]): Promise<void>

  /**
   * Confirm selection
   * @param item - Selected item
   * @param secondary - Whether secondary action (Shift+Enter, Cmd+Click, etc.)
   */
  confirm(item: T, secondary: boolean): void

  /**
   * Called when picker is dismissed (Escape, click outside, etc.)
   */
  dismissed(): void

  /**
   * Render a single item in the list
   * @param item - Item to render
   * @param index - Index in the list
   * @param isSelected - Whether this item is currently selected
   */
  renderItem(item: T, index: number, isSelected: boolean): React.ReactElement
}
