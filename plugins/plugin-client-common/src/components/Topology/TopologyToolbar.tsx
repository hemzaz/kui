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
import type { LayoutType } from '@kui-shell/core/src/topology'

interface TopologyToolbarProps {
  layoutType: LayoutType
  onLayoutChange: (layout: LayoutType) => void
  onSearch: (term: string) => void
  searchTerm: string
}

export function TopologyToolbar({
  layoutType,
  onLayoutChange,
  onSearch,
  searchTerm
}: TopologyToolbarProps) {
  return (
    <div className="kui-topology-toolbar">
      <div className="toolbar-section">
        <label htmlFor="layout-select">Layout:</label>
        <select
          id="layout-select"
          value={layoutType}
          onChange={(e) => onLayoutChange(e.target.value as LayoutType)}
          className="layout-select"
        >
          <option value="hierarchical">Hierarchical</option>
          <option value="force-directed">Force-Directed</option>
          <option value="circular">Circular</option>
          <option value="grid">Grid</option>
        </select>
      </div>

      <div className="toolbar-section">
        <input
          type="search"
          placeholder="Search resources..."
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="topology-search"
        />
      </div>

      <div className="toolbar-section toolbar-actions">
        <button
          className="toolbar-button"
          onClick={() => onSearch('')}
          title="Clear filters"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
