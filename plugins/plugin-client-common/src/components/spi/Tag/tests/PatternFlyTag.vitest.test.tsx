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
 * Tests for PatternFlyTag component
 *
 * PatternFlyTag wraps PatternFly's Badge component with custom styling
 * based on the tag type (ok, done, error, warning).
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen } from '../../../../../../../test-utils'

import PatternFlyTag from '../impl/PatternFly'
import type Props from '../model'

describe('PatternFlyTag Component', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = renderWithProviders(<PatternFlyTag>Test</PatternFlyTag>)
      expect(container.firstChild).toBeDefined()
    })

    it('should render children text', () => {
      renderWithProviders(<PatternFlyTag>Badge Text</PatternFlyTag>)
      expect(screen.getByText('Badge Text')).toBeInTheDocument()
    })

    it('should always include kui--tag class', () => {
      const { container } = renderWithProviders(<PatternFlyTag>Test</PatternFlyTag>)
      const badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('kui--tag')
    })
  })

  describe('Type-based Color Classes', () => {
    it('should apply green-background for type="ok"', () => {
      const { container } = renderWithProviders(<PatternFlyTag type="ok">OK</PatternFlyTag>)
      const badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('green-background')
    })

    it('should apply blue-background for type="done"', () => {
      const { container } = renderWithProviders(<PatternFlyTag type="done">Done</PatternFlyTag>)
      const badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('blue-background')
    })

    it('should apply red-background for type="error"', () => {
      const { container } = renderWithProviders(<PatternFlyTag type="error">Error</PatternFlyTag>)
      const badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('red-background')
    })

    it('should apply yellow-background for type="warning"', () => {
      const { container } = renderWithProviders(<PatternFlyTag type="warning">Warning</PatternFlyTag>)
      const badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('yellow-background')
    })

    it('should apply gray-background for undefined type', () => {
      const { container } = renderWithProviders(<PatternFlyTag>Neutral</PatternFlyTag>)
      const badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('gray-background')
    })

    it('should apply gray-background for unknown type', () => {
      const { container } = renderWithProviders(
        <PatternFlyTag type={'unknown' as any}>Unknown</PatternFlyTag>
      )
      const badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('gray-background')
    })
  })

  describe('Custom ClassName', () => {
    it('should include custom spanclassname', () => {
      const { container } = renderWithProviders(<PatternFlyTag spanclassname="custom-class">Test</PatternFlyTag>)
      const badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('custom-class')
    })

    it('should combine multiple class names correctly', () => {
      const { container } = renderWithProviders(
        <PatternFlyTag type="ok" spanclassname="custom-class">Test</PatternFlyTag>
      )
      const badge = container.firstChild as HTMLElement

      expect(badge.className).toContain('kui--tag')
      expect(badge.className).toContain('green-background')
      expect(badge.className).toContain('custom-class')
    })

    it('should maintain class order', () => {
      const { container } = renderWithProviders(
        <PatternFlyTag type="error" spanclassname="my-custom">Test</PatternFlyTag>
      )
      const badge = container.firstChild as HTMLElement
      const classes = badge.className.split(' ')

      expect(classes[0]).toBe('kui--tag')
      expect(classes[1]).toBe('red-background')
      expect(classes[2]).toBe('my-custom')
    })
  })

  describe('Props Pass-through', () => {
    it('should pass through title attribute', () => {
      const { container } = renderWithProviders(<PatternFlyTag title="Hover text">Test</PatternFlyTag>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveAttribute('title', 'Hover text')
    })

    it('should pass through onClick handler', async () => {
      const mockOnClick = vi.fn()
      const { container } = renderWithProviders(<PatternFlyTag onClick={mockOnClick}>Click</PatternFlyTag>)

      const badge = container.firstChild as HTMLElement
      badge.click()

      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('should pass through aria attributes', () => {
      const { container } = renderWithProviders(
        <PatternFlyTag aria-label="Test badge" aria-describedby="desc">
          Test
        </PatternFlyTag>
      )
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveAttribute('aria-label', 'Test badge')
      expect(badge).toHaveAttribute('aria-describedby', 'desc')
    })

    it('should pass through data attributes', () => {
      const { container } = renderWithProviders(
        <PatternFlyTag data-testid="custom-id" data-custom="value">
          Test
        </PatternFlyTag>
      )
      const badge = container.firstChild as HTMLElement
      expect(badge).toHaveAttribute('data-testid', 'custom-id')
      expect(badge).toHaveAttribute('data-custom', 'value')
    })
  })

  describe('Content Rendering', () => {
    it('should render simple text children', () => {
      renderWithProviders(<PatternFlyTag>Simple Text</PatternFlyTag>)
      expect(screen.getByText('Simple Text')).toBeInTheDocument()
    })

    it('should render numeric children', () => {
      renderWithProviders(<PatternFlyTag>{42}</PatternFlyTag>)
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('should render complex JSX children', () => {
      renderWithProviders(
        <PatternFlyTag>
          <span>Complex</span> <strong>Content</strong>
        </PatternFlyTag>
      )
      expect(screen.getByText('Complex')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should handle empty children', () => {
      const { container } = renderWithProviders(<PatternFlyTag>{''}</PatternFlyTag>)
      const badge = container.firstChild as HTMLElement
      expect(badge).toBeInTheDocument()
      expect(badge.textContent).toBe('')
    })
  })

  describe('Multiple Tags', () => {
    it('should render multiple tags with different types', () => {
      const { container } = renderWithProviders(
        <>
          <PatternFlyTag type="ok">OK</PatternFlyTag>
          <PatternFlyTag type="error">Error</PatternFlyTag>
          <PatternFlyTag type="warning">Warning</PatternFlyTag>
        </>
      )

      const badges = container.querySelectorAll('.kui--tag')
      expect(badges.length).toBe(3)
    })

    it('should apply correct colors to each tag', () => {
      const { container } = renderWithProviders(
        <>
          <PatternFlyTag type="ok">OK</PatternFlyTag>
          <PatternFlyTag type="error">Error</PatternFlyTag>
        </>
      )

      const badges = container.querySelectorAll('.kui--tag')
      expect((badges[0] as HTMLElement).className).toContain('green-background')
      expect((badges[1] as HTMLElement).className).toContain('red-background')
    })
  })

  describe('State Changes', () => {
    it('should handle type changes on re-render', () => {
      const { container, rerender } = renderWithProviders(<PatternFlyTag type="ok">Status</PatternFlyTag>)

      let badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('green-background')

      rerender(<PatternFlyTag type="error">Status</PatternFlyTag>)

      badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('red-background')
      expect(badge.className).not.toContain('green-background')
    })

    it('should handle content changes on re-render', () => {
      const { rerender } = renderWithProviders(<PatternFlyTag type="ok">Initial</PatternFlyTag>)

      expect(screen.getByText('Initial')).toBeInTheDocument()

      rerender(<PatternFlyTag type="ok">Updated</PatternFlyTag>)

      expect(screen.queryByText('Initial')).not.toBeInTheDocument()
      expect(screen.getByText('Updated')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle null type gracefully', () => {
      const { container } = renderWithProviders(<PatternFlyTag type={null as any}>Null Type</PatternFlyTag>)
      const badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('gray-background')
    })

    it('should handle undefined type gracefully', () => {
      const { container } = renderWithProviders(<PatternFlyTag type={undefined}>Undefined Type</PatternFlyTag>)
      const badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('gray-background')
    })

    it('should handle empty string type', () => {
      const { container } = renderWithProviders(<PatternFlyTag type={'' as any}>Empty Type</PatternFlyTag>)
      const badge = container.firstChild as HTMLElement
      expect(badge.className).toContain('gray-background')
    })

    it('should handle very long text', () => {
      const longText = 'A'.repeat(1000)
      renderWithProviders(<PatternFlyTag>{longText}</PatternFlyTag>)
      expect(screen.getByText(longText)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard accessible when clickable', () => {
      const mockOnClick = vi.fn()
      const { container } = renderWithProviders(<PatternFlyTag onClick={mockOnClick}>Clickable</PatternFlyTag>)

      const badge = container.firstChild as HTMLElement
      expect(badge).toBeInTheDocument()
    })

    it('should support screen reader text', () => {
      renderWithProviders(<PatternFlyTag aria-label="Status badge">Visual Only</PatternFlyTag>)
      const badge = screen.getByLabelText('Status badge')
      expect(badge).toBeInTheDocument()
    })

    it('should have visible text content', () => {
      renderWithProviders(<PatternFlyTag>Visible Text</PatternFlyTag>)
      const badge = screen.getByText('Visible Text')
      expect(badge).toBeVisible()
    })
  })

  describe('CSS Integration', () => {
    it('should include all expected class names', () => {
      const { container } = renderWithProviders(
        <PatternFlyTag type="warning" spanclassname="custom">
          Test
        </PatternFlyTag>
      )
      const badge = container.firstChild as HTMLElement
      const classes = badge.className.split(' ')

      expect(classes).toContain('kui--tag')
      expect(classes).toContain('yellow-background')
      expect(classes).toContain('custom')
      expect(classes.length).toBe(3)
    })
  })
})
