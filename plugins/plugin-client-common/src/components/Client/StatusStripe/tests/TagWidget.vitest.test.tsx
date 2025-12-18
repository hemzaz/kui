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
 * Tests for TagWidget component
 *
 * TagWidget wraps the Tag component for use in the status stripe.
 * It adds appropriate CSS classes and handles clickable tags.
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen, userEvent } from '../../../../../../../test-utils'

import TagWidget from '../TagWidget'

describe('TagWidget Component', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = renderWithProviders(<TagWidget>Test Tag</TagWidget>)
      expect(container.firstChild).toBeDefined()
    })

    it('should render children text', () => {
      renderWithProviders(<TagWidget>My Tag Text</TagWidget>)
      expect(screen.getByText('My Tag Text')).toBeInTheDocument()
    })

    it('should have the kui--status-stripe-element class', () => {
      const { container } = renderWithProviders(<TagWidget>Test</TagWidget>)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain('kui--status-stripe-element')
    })

    it('should have the kui--status-stripe-tag-element class', () => {
      const { container } = renderWithProviders(<TagWidget>Test</TagWidget>)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain('kui--status-stripe-tag-element')
    })
  })

  describe('Tag Type Variants', () => {
    it('should render with type="ok"', () => {
      renderWithProviders(<TagWidget type="ok">Success</TagWidget>)
      expect(screen.getByText('Success')).toBeInTheDocument()
    })

    it('should render with type="error"', () => {
      renderWithProviders(<TagWidget type="error">Error</TagWidget>)
      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    it('should render with type="warning"', () => {
      renderWithProviders(<TagWidget type="warning">Warning</TagWidget>)
      expect(screen.getByText('Warning')).toBeInTheDocument()
    })

    it('should render with type="done"', () => {
      renderWithProviders(<TagWidget type="done">Done</TagWidget>)
      expect(screen.getByText('Done')).toBeInTheDocument()
    })
  })

  describe('Click Handling', () => {
    it('should add clickable class when onClick is provided', () => {
      const mockOnClick = vi.fn()
      const { container } = renderWithProviders(<TagWidget onClick={mockOnClick}>Click Me</TagWidget>)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain('kui--status-stripe-element-clickable')
    })

    it('should not add clickable class when onClick is not provided', () => {
      const { container } = renderWithProviders(<TagWidget>Not Clickable</TagWidget>)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).not.toContain('kui--status-stripe-element-clickable')
    })

    it('should call onClick when clicked', async () => {
      const user = userEvent.setup()
      const mockOnClick = vi.fn()

      renderWithProviders(<TagWidget onClick={mockOnClick}>Click Me</TagWidget>)

      const tag = screen.getByText('Click Me')
      await user.click(tag)

      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('should call onClick multiple times when clicked multiple times', async () => {
      const user = userEvent.setup()
      const mockOnClick = vi.fn()

      renderWithProviders(<TagWidget onClick={mockOnClick}>Click Me</TagWidget>)

      const tag = screen.getByText('Click Me')
      await user.click(tag)
      await user.click(tag)
      await user.click(tag)

      expect(mockOnClick).toHaveBeenCalledTimes(3)
    })
  })

  describe('Tag Properties', () => {
    it('should pass through title property', () => {
      const { container } = renderWithProviders(<TagWidget title="Hover text">Test</TagWidget>)
      const badge = container.querySelector('.kui--tag')
      expect(badge).toHaveAttribute('title', 'Hover text')
    })

    it('should pass through custom className', () => {
      const { container } = renderWithProviders(<TagWidget className="custom-class">Test</TagWidget>)
      const badge = container.querySelector('.kui--tag')
      expect(badge?.className).toContain('custom-class')
    })

    it('should always have kui--tag class on inner element', () => {
      const { container } = renderWithProviders(<TagWidget>Test</TagWidget>)
      const badge = container.querySelector('.kui--tag')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Multiple Tags', () => {
    it('should render multiple tags independently', () => {
      renderWithProviders(
        <>
          <TagWidget type="ok">Tag 1</TagWidget>
          <TagWidget type="error">Tag 2</TagWidget>
          <TagWidget type="warning">Tag 3</TagWidget>
        </>
      )

      expect(screen.getByText('Tag 1')).toBeInTheDocument()
      expect(screen.getByText('Tag 2')).toBeInTheDocument()
      expect(screen.getByText('Tag 3')).toBeInTheDocument()
    })

    it('should handle different onClick handlers for each tag', async () => {
      const user = userEvent.setup()
      const onClick1 = vi.fn()
      const onClick2 = vi.fn()

      renderWithProviders(
        <>
          <TagWidget onClick={onClick1}>Tag 1</TagWidget>
          <TagWidget onClick={onClick2}>Tag 2</TagWidget>
        </>
      )

      await user.click(screen.getByText('Tag 1'))
      await user.click(screen.getByText('Tag 2'))

      expect(onClick1).toHaveBeenCalledTimes(1)
      expect(onClick2).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should be accessible when clickable', async () => {
      const mockOnClick = vi.fn()
      const { container } = renderWithProviders(<TagWidget onClick={mockOnClick}>Accessible Tag</TagWidget>)

      // The tag should be in the document
      const tag = screen.getByText('Accessible Tag')
      expect(tag).toBeInTheDocument()

      // The wrapper should indicate it's clickable
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain('clickable')
    })

    it('should support keyboard navigation when clickable', async () => {
      const user = userEvent.setup()
      const mockOnClick = vi.fn()

      renderWithProviders(<TagWidget onClick={mockOnClick}>Keyboard Tag</TagWidget>)

      const tag = screen.getByText('Keyboard Tag')

      // Keyboard activation (Enter key)
      tag.focus()
      await user.keyboard('{Enter}')

      expect(mockOnClick).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      const { container } = renderWithProviders(<TagWidget>{''}</TagWidget>)
      expect(container.firstChild).toBeDefined()
    })

    it('should handle complex children', () => {
      renderWithProviders(
        <TagWidget>
          <span>Complex</span> <strong>Children</strong>
        </TagWidget>
      )

      expect(screen.getByText('Complex')).toBeInTheDocument()
      expect(screen.getByText('Children')).toBeInTheDocument()
    })

    it('should handle numeric children', () => {
      renderWithProviders(<TagWidget>{42}</TagWidget>)
      expect(screen.getByText('42')).toBeInTheDocument()
    })
  })
})
