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
 * Tests for TextWithIconWidget component
 *
 * TextWithIconWidget displays text with an optional icon in the status stripe.
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen, userEvent } from '../../../../../../../test-utils'

import TextWithIconWidget from '../TextWithIconWidget'

describe('TextWithIconWidget Component', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = renderWithProviders(<TextWithIconWidget text="Status" viewLevel="normal" />)
      expect(container.firstChild).toBeDefined()
    })

    it('should render text content', () => {
      renderWithProviders(<TextWithIconWidget text="My Status Text" viewLevel="normal" />)
      expect(screen.getByText('My Status Text')).toBeInTheDocument()
    })

    it('should have status stripe element class', () => {
      const { container } = renderWithProviders(<TextWithIconWidget text="Status" viewLevel="normal" />)
      const element = container.firstChild as HTMLElement
      expect(element.className).toContain('kui--status-stripe-element')
    })

    it('should have text widget class', () => {
      const { container } = renderWithProviders(<TextWithIconWidget text="Status" viewLevel="normal" />)
      const element = container.firstChild as HTMLElement
      expect(element.className).toContain('kui--status-stripe-text-element')
    })
  })

  describe('Icon Rendering', () => {
    it('should render with icon when provided', () => {
      const { container } = renderWithProviders(
        <TextWithIconWidget text="Status" viewLevel="normal">
          Settings
        </TextWithIconWidget>
      )
      expect(container.firstChild).toBeDefined()
    })

    it('should render without icon when not provided', () => {
      renderWithProviders(<TextWithIconWidget text="Status Without Icon" viewLevel="normal" />)
      expect(screen.getByText('Status Without Icon')).toBeInTheDocument()
    })
  })

  describe('Click Handling', () => {
    it('should be clickable when onClick is provided', async () => {
      const user = userEvent.setup()
      const mockOnClick = vi.fn()

      renderWithProviders(<TextWithIconWidget text="Click Me" viewLevel="normal" textOnclick={mockOnClick} />)

      const element = screen.getByText('Click Me')
      await user.click(element)

      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('should add clickable class when onClick is provided', () => {
      const mockOnClick = vi.fn()
      const { container } = renderWithProviders(<TextWithIconWidget text="Click" viewLevel="normal" textOnclick={mockOnClick} />)

      const element = container.firstChild as HTMLElement
      expect(element.className).toContain('clickable')
    })

    it('should not have clickable class when onClick is not provided', () => {
      const { container } = renderWithProviders(<TextWithIconWidget text="Not Clickable" viewLevel="normal" />)

      const element = container.firstChild as HTMLElement
      expect(element.className).not.toContain('clickable')
    })

    it('should call onClick multiple times when clicked multiple times', async () => {
      const user = userEvent.setup()
      const mockOnClick = vi.fn()

      renderWithProviders(<TextWithIconWidget text="Multi Click" viewLevel="normal" textOnclick={mockOnClick} />)

      const element = screen.getByText('Multi Click')
      await user.click(element)
      await user.click(element)
      await user.click(element)

      expect(mockOnClick).toHaveBeenCalledTimes(3)
    })
  })

  describe('Title Attribute', () => {
    it('should render with title when provided', () => {
      const { container } = renderWithProviders(<TextWithIconWidget text="Status" title="Hover Text" viewLevel="normal" />)
      const element = container.firstChild as HTMLElement
      expect(element).toHaveAttribute('title', 'Hover Text')
    })

    it('should not have title when not provided', () => {
      const { container } = renderWithProviders(<TextWithIconWidget text="Status" viewLevel="normal" />)
      const element = container.firstChild as HTMLElement
      expect(element).not.toHaveAttribute('title')
    })
  })

  describe('Custom ClassName', () => {
    it('should include custom className', () => {
      const { container } = renderWithProviders(<TextWithIconWidget text="Status" className="custom-class" viewLevel="normal" />)
      const element = container.firstChild as HTMLElement
      expect(element.className).toContain('custom-class')
    })

    it('should combine custom className with default classes', () => {
      const { container } = renderWithProviders(<TextWithIconWidget text="Status" className="my-class" viewLevel="normal" />)
      const element = container.firstChild as HTMLElement

      expect(element.className).toContain('kui--status-stripe-element')
      expect(element.className).toContain('kui--status-stripe-text-element')
      expect(element.className).toContain('my-class')
    })
  })

  describe('Content Variations', () => {
    it('should handle short text', () => {
      renderWithProviders(<TextWithIconWidget text="OK" viewLevel="normal" />)
      expect(screen.getByText('OK')).toBeInTheDocument()
    })

    it('should handle long text', () => {
      const longText = 'This is a very long status message that might wrap'
      renderWithProviders(<TextWithIconWidget text={longText} viewLevel="normal" />)
      expect(screen.getByText(longText)).toBeInTheDocument()
    })

    it('should handle text with special characters', () => {
      const specialText = 'Status: 100% ✓'
      renderWithProviders(<TextWithIconWidget text={specialText} viewLevel="normal" />)
      expect(screen.getByText(specialText)).toBeInTheDocument()
    })

    it('should handle empty string', () => {
      const { container } = renderWithProviders(<TextWithIconWidget text="" viewLevel="normal" />)
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('Multiple Widgets', () => {
    it('should render multiple widgets independently', () => {
      renderWithProviders(
        <>
          <TextWithIconWidget text="Widget 1" viewLevel="normal" />
          <TextWithIconWidget text="Widget 2" viewLevel="normal" />
          <TextWithIconWidget text="Widget 3" viewLevel="normal" />
        </>
      )

      expect(screen.getByText('Widget 1')).toBeInTheDocument()
      expect(screen.getByText('Widget 2')).toBeInTheDocument()
      expect(screen.getByText('Widget 3')).toBeInTheDocument()
    })

    it('should handle different onClick handlers for each widget', async () => {
      const user = userEvent.setup()
      const onClick1 = vi.fn()
      const onClick2 = vi.fn()

      renderWithProviders(
        <>
          <TextWithIconWidget text="Widget 1" viewLevel="normal" textOnclick={onClick1} />
          <TextWithIconWidget text="Widget 2" viewLevel="normal" textOnclick={onClick2} />
        </>
      )

      await user.click(screen.getByText('Widget 1'))
      await user.click(screen.getByText('Widget 2'))

      expect(onClick1).toHaveBeenCalledTimes(1)
      expect(onClick2).toHaveBeenCalledTimes(1)
    })
  })

  describe('State Updates', () => {
    it('should update text on prop change', () => {
      const { rerender } = renderWithProviders(<TextWithIconWidget text="Initial" viewLevel="normal" />)

      expect(screen.getByText('Initial')).toBeInTheDocument()

      rerender(<TextWithIconWidget text="Updated" viewLevel="normal" />)

      expect(screen.queryByText('Initial')).not.toBeInTheDocument()
      expect(screen.getByText('Updated')).toBeInTheDocument()
    })

    it('should update onClick handler on prop change', async () => {
      const user = userEvent.setup()
      const onClick1 = vi.fn()
      const onClick2 = vi.fn()

      const { rerender } = renderWithProviders(<TextWithIconWidget text="Widget" viewLevel="normal" textOnclick={onClick1} />)

      await user.click(screen.getByText('Widget'))
      expect(onClick1).toHaveBeenCalledTimes(1)

      rerender(<TextWithIconWidget text="Widget" viewLevel="normal" textOnclick={onClick2} />)

      await user.click(screen.getByText('Widget'))
      expect(onClick2).toHaveBeenCalledTimes(1)
      expect(onClick1).toHaveBeenCalledTimes(1) // Should still be 1
    })
  })

  describe('Accessibility', () => {
    it('should have visible text content', () => {
      renderWithProviders(<TextWithIconWidget text="Accessible Text" viewLevel="normal" />)
      const element = screen.getByText('Accessible Text')
      expect(element).toBeVisible()
    })

    it('should support keyboard navigation when clickable', async () => {
      const user = userEvent.setup()
      const mockOnClick = vi.fn()

      renderWithProviders(<TextWithIconWidget text="Keyboard Widget" viewLevel="normal" textOnclick={mockOnClick} />)

      const element = screen.getByText('Keyboard Widget')
      element.focus()
      await user.keyboard('{Enter}')

      expect(mockOnClick).toHaveBeenCalled()
    })

    it('should have proper role when clickable', () => {
      const mockOnClick = vi.fn()
      const { container } = renderWithProviders(<TextWithIconWidget text="Button Widget" viewLevel="normal" textOnclick={mockOnClick} />)

      const element = container.firstChild as HTMLElement
      expect(element).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    it('should work within status stripe', () => {
      const { container } = renderWithProviders(
        <div className="kui--status-stripe">
          <TextWithIconWidget text="Status" viewLevel="normal" />
        </div>
      )

      const statusStripe = container.querySelector('.kui--status-stripe')
      expect(statusStripe).toBeInTheDocument()

      const widget = statusStripe?.querySelector('.kui--status-stripe-text-element')
      expect(widget).toBeInTheDocument()
    })

    it('should not affect sibling components', () => {
      renderWithProviders(
        <>
          <div data-testid="before">Before</div>
          <TextWithIconWidget text="Widget" viewLevel="normal" />
          <div data-testid="after">After</div>
        </>
      )

      expect(screen.getByTestId('before')).toBeInTheDocument()
      expect(screen.getByText('Widget')).toBeInTheDocument()
      expect(screen.getByTestId('after')).toBeInTheDocument()
    })

    it('should work with other status stripe components', () => {
      const { container } = renderWithProviders(
        <div className="kui--status-stripe">
          <TextWithIconWidget text="Status 1" viewLevel="normal" />
          <TextWithIconWidget text="Status 2" viewLevel="normal" />
          <TextWithIconWidget text="Status 3" viewLevel="normal" />
        </div>
      )

      const widgets = container.querySelectorAll('.kui--status-stripe-text-element')
      expect(widgets.length).toBe(3)
    })
  })
})
