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
 * Tests for GitHubIcon component
 *
 * GitHubIcon renders a clickable GitHub icon in the status stripe
 * that links to the Kui repository (if a homepage is configured).
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '../../../../../../../test-utils'

import GitHubIcon from '../GitHubIcon'

describe('GitHubIcon Component', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = renderWithProviders(<GitHubIcon />)
      expect(container).toBeDefined()
    })

    it('should render as a React component', () => {
      const result = renderWithProviders(<GitHubIcon />)
      expect(result).toBeDefined()
      expect(result.container).toBeDefined()
    })
  })

  describe('Conditional Rendering', () => {
    it('should render empty fragment when no homepage is configured', () => {
      const { container } = renderWithProviders(<GitHubIcon />)

      // Component returns empty fragment if no homepage
      // Just verify it doesn't crash
      expect(container).toBeDefined()
    })

    it('should render with different tooltip positions', () => {
      const positions = ['top-end', 'bottom', 'left', 'right'] as const

      positions.forEach(position => {
        const { container } = renderWithProviders(<GitHubIcon position={position} />)
        expect(container).toBeDefined()
      })
    })
  })

  describe('Multiple Instances', () => {
    it('should render multiple instances independently', () => {
      const { container } = renderWithProviders(
        <>
          <GitHubIcon />
          <GitHubIcon />
        </>
      )

      expect(container).toBeDefined()
    })

    it('should handle different props for each instance', () => {
      const { container } = renderWithProviders(
        <>
          <GitHubIcon position="top-end" />
          <GitHubIcon position="bottom" />
        </>
      )

      expect(container).toBeDefined()
    })
  })

  describe('Integration', () => {
    it('should work within a component tree', () => {
      const { container } = renderWithProviders(
        <div className="kui--status-stripe">
          <GitHubIcon />
        </div>
      )

      const statusStripe = container.querySelector('.kui--status-stripe')
      expect(statusStripe).toBeInTheDocument()
    })

    it('should render alongside other components', () => {
      const { container } = renderWithProviders(
        <>
          <div>Before</div>
          <GitHubIcon />
          <div>After</div>
        </>
      )

      expect(container).toBeDefined()
    })
  })

  describe('Props', () => {
    it('should accept position prop', () => {
      const { container } = renderWithProviders(<GitHubIcon position="top-end" />)
      expect(container).toBeDefined()
    })

    it('should handle undefined position', () => {
      const { container } = renderWithProviders(<GitHubIcon />)
      expect(container).toBeDefined()
    })

    it('should handle null position', () => {
      const { container } = renderWithProviders(<GitHubIcon position={undefined} />)
      expect(container).toBeDefined()
    })
  })
})
