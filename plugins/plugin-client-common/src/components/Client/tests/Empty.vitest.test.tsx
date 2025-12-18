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
 * Tests for Empty component
 *
 * Empty is a minimal component that renders nothing (null).
 * It's used as a placeholder component in various contexts.
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '../../../../../../test-utils'

import Empty from '../Empty'

describe('Empty Component', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { container } = renderWithProviders(<Empty />)
      expect(container).toBeDefined()
    })

    it('should render null inside wrapper', () => {
      const { container } = renderWithProviders(<Empty />)
      // renderWithProviders adds a theme wrapper, so check inside it
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toBeDefined()
      expect(wrapper.children.length).toBe(0) // Empty renders nothing
    })

    it('should not render any DOM elements inside wrapper', () => {
      const { container } = renderWithProviders(<Empty />)
      // Container has theme wrapper (1 child)
      expect(container.children.length).toBe(1)
      // But wrapper should be empty
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.children.length).toBe(0)
    })

    it('should not have any content', () => {
      const { container } = renderWithProviders(<Empty />)
      expect(container.textContent).toBe('')
    })
  })

  describe('Component Type', () => {
    it('should be a PureComponent', () => {
      const instance = new Empty({})
      expect(instance).toBeInstanceOf(React.PureComponent)
    })
  })

  describe('Multiple Instances', () => {
    it('should handle multiple Empty components', () => {
      const { container } = renderWithProviders(
        <>
          <Empty />
          <Empty />
          <Empty />
        </>
      )

      // Container has theme wrapper (1 child)
      expect(container.children.length).toBe(1)
      // All Empty components render null, so wrapper should be empty
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.children.length).toBe(0)
    })

    it('should not affect sibling components', () => {
      const { container } = renderWithProviders(
        <>
          <div data-testid="before">Before</div>
          <Empty />
          <div data-testid="after">After</div>
        </>
      )

      expect(container.querySelector('[data-testid="before"]')).toBeInTheDocument()
      expect(container.querySelector('[data-testid="after"]')).toBeInTheDocument()
      // Container has wrapper with 2 divs inside
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.children.length).toBe(2) // Only the two divs
    })
  })

  describe('Usage in Conditionals', () => {
    it('should work as a conditional placeholder', () => {
      const showContent = false
      const { container } = renderWithProviders(<>{showContent ? <div>Content</div> : <Empty />}</>)

      expect(container.textContent).toBe('')
      // Container has theme wrapper (1 child), but it's empty inside
      expect(container.children.length).toBe(1)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.children.length).toBe(0)
    })

    it('should not interfere when content is shown', () => {
      const showContent = true
      const { container } = renderWithProviders(<>{showContent ? <div>Content</div> : <Empty />}</>)

      expect(container.textContent).toBe('Content')
      // Container has theme wrapper
      expect(container.children.length).toBe(1)
      // Wrapper contains the content div
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.children.length).toBe(1)
    })
  })

  describe('Performance', () => {
    it('should be lightweight to render', () => {
      const startTime = performance.now()
      renderWithProviders(<Empty />)
      const endTime = performance.now()

      // Rendering should be very fast (< 10ms)
      expect(endTime - startTime).toBeLessThan(10)
    })

    it('should handle rapid re-renders efficiently', () => {
      const { rerender } = renderWithProviders(<Empty />)

      const startTime = performance.now()
      for (let i = 0; i < 100; i++) {
        rerender(<Empty />)
      }
      const endTime = performance.now()

      // 100 re-renders should still be fast (< 100ms)
      expect(endTime - startTime).toBeLessThan(100)
    })
  })

  describe('Integration', () => {
    it('should work in a component tree', () => {
      const { container } = renderWithProviders(
        <div>
          <div>Header</div>
          <Empty />
          <div>Footer</div>
        </div>
      )

      // Container has theme wrapper, inside is the outer div
      const wrapper = container.firstChild as HTMLElement
      const outerDiv = wrapper.firstChild as HTMLElement
      expect(outerDiv.children.length).toBe(2) // Only Header and Footer
    })

    it('should not cause layout shifts', () => {
      const { container } = renderWithProviders(
        <div style={{ display: 'flex' }}>
          <div>Item 1</div>
          <Empty />
          <div>Item 2</div>
        </div>
      )

      // Container has theme wrapper, inside is the flex container
      const wrapper = container.firstChild as HTMLElement
      const flexContainer = wrapper.firstChild as HTMLElement
      // Empty should not affect flex layout
      expect(flexContainer.children.length).toBe(2)
    })
  })
})
