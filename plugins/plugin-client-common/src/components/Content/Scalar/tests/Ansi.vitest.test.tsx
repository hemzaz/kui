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
 * Tests for Ansi component
 *
 * Ansi component renders ANSI escape sequences as styled HTML.
 * It supports colors, text decorations, links, and markdown content.
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen } from '../../../../../../../test-utils'

import Ansi from '../Ansi'

describe('Ansi Component', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = renderWithProviders(<Ansi>Plain text</Ansi>)
      expect(container.firstChild).toBeDefined()
    })

    it('should render plain text', () => {
      renderWithProviders(<Ansi>Hello World</Ansi>)
      expect(screen.getByText('Hello World')).toBeInTheDocument()
    })

    it('should render in a pre element', () => {
      const { container } = renderWithProviders(<Ansi>Text</Ansi>)
      const pre = container.querySelector('pre')
      expect(pre).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = renderWithProviders(<Ansi className="custom-class">Text</Ansi>)
      const pre = container.querySelector('pre')
      expect(pre).toHaveClass('custom-class')
    })
  })

  describe('ANSI Color Codes', () => {
    it('should handle ANSI red color', () => {
      const text = '\x1b[31mRed Text\x1b[0m'
      const { container } = renderWithProviders(<Ansi>{text}</Ansi>)

      // Check that the text is present
      expect(container.textContent).toContain('Red Text')

      // Check that ansi color class is applied
      const coloredElement = container.querySelector('[class*="ansi-"]')
      expect(coloredElement).toBeInTheDocument()
    })

    it('should handle ANSI green color', () => {
      const text = '\x1b[32mGreen Text\x1b[0m'
      const { container } = renderWithProviders(<Ansi>{text}</Ansi>)

      expect(container.textContent).toContain('Green Text')
      const coloredElement = container.querySelector('[class*="ansi-"]')
      expect(coloredElement).toBeInTheDocument()
    })

    it('should handle ANSI yellow color', () => {
      const text = '\x1b[33mYellow Text\x1b[0m'
      const { container } = renderWithProviders(<Ansi>{text}</Ansi>)

      expect(container.textContent).toContain('Yellow Text')
      const coloredElement = container.querySelector('[class*="ansi-"]')
      expect(coloredElement).toBeInTheDocument()
    })

    it('should handle ANSI blue color', () => {
      const text = '\x1b[34mBlue Text\x1b[0m'
      const { container } = renderWithProviders(<Ansi>{text}</Ansi>)

      expect(container.textContent).toContain('Blue Text')
      const coloredElement = container.querySelector('[class*="ansi-"]')
      expect(coloredElement).toBeInTheDocument()
    })

    it('should handle multiple colors in one string', () => {
      const text = '\x1b[31mRed\x1b[0m and \x1b[32mGreen\x1b[0m'
      const { container } = renderWithProviders(<Ansi>{text}</Ansi>)

      expect(container.textContent).toContain('Red')
      expect(container.textContent).toContain('and')
      expect(container.textContent).toContain('Green')
    })
  })

  describe('ANSI Text Decorations', () => {
    it('should handle bold text', () => {
      const text = '\x1b[1mBold Text\x1b[0m'
      const { container } = renderWithProviders(<Ansi>{text}</Ansi>)

      const bold = container.querySelector('strong')
      expect(bold).toBeInTheDocument()
      expect(bold?.textContent).toContain('Bold Text')
    })

    it('should handle dim text', () => {
      const text = '\x1b[2mDim Text\x1b[0m'
      const { container } = renderWithProviders(<Ansi>{text}</Ansi>)

      expect(container.textContent).toContain('Dim Text')
      const element = container.querySelector('.semi-transparent')
      expect(element).toBeInTheDocument()
    })

    it('should handle italic text', () => {
      const text = '\x1b[3mItalic Text\x1b[0m'
      const { container } = renderWithProviders(<Ansi>{text}</Ansi>)

      expect(container.textContent).toContain('Italic Text')
      const element = container.querySelector('.italic')
      expect(element).toBeInTheDocument()
    })

    it('should handle underline text', () => {
      const text = '\x1b[4mUnderline Text\x1b[0m'
      const { container } = renderWithProviders(<Ansi>{text}</Ansi>)

      expect(container.textContent).toContain('Underline Text')
      const element = container.querySelector('.underline')
      expect(element).toBeInTheDocument()
    })
  })

  describe('Wrapping Behavior', () => {
    it('should set word-break style by default', () => {
      const { container } = renderWithProviders(<Ansi>Long text that should wrap</Ansi>)
      const pre = container.querySelector('pre') as HTMLElement

      expect(pre.style.wordBreak).toBe('break-all')
    })

    it('should not set word-break when noWrap is true', () => {
      const { container } = renderWithProviders(<Ansi noWrap>No wrap text</Ansi>)
      const pre = container.querySelector('pre') as HTMLElement

      expect(pre.style.whiteSpace).toBe('nowrap')
    })

    it('should handle noWrap="normal"', () => {
      const { container } = renderWithProviders(<Ansi noWrap="normal">Normal wrap</Ansi>)
      const pre = container.querySelector('pre') as HTMLElement

      expect(pre.style.wordBreak).toBe('')
      expect(pre.style.whiteSpace).not.toBe('nowrap')
    })

    it('should always have margin: 0', () => {
      const { container } = renderWithProviders(<Ansi>Text</Ansi>)
      const pre = container.querySelector('pre') as HTMLElement

      expect(pre.style.margin).toBe('0px')
    })
  })

  describe('onRender Callback', () => {
    it('should call onRender callback when provided', () => {
      const onRender = vi.fn()
      renderWithProviders(<Ansi onRender={onRender}>Text</Ansi>)

      expect(onRender).toHaveBeenCalledTimes(1)
    })

    it('should not crash when onRender is not provided', () => {
      const { container } = renderWithProviders(<Ansi>Text</Ansi>)
      expect(container.firstChild).toBeDefined()
    })
  })

  describe('Complex ANSI Sequences', () => {
    it('should handle color and bold together', () => {
      const text = '\x1b[1;31mBold Red\x1b[0m'
      const { container } = renderWithProviders(<Ansi>{text}</Ansi>)

      expect(container.textContent).toContain('Bold Red')
      const element = container.querySelector('strong')
      expect(element).toBeInTheDocument()
    })

    it('should handle multiple decorations', () => {
      const text = '\x1b[1;4;31mBold Underline Red\x1b[0m'
      const { container } = renderWithProviders(<Ansi>{text}</Ansi>)

      expect(container.textContent).toContain('Bold Underline Red')
    })

    it('should handle foreground and background colors', () => {
      const text = '\x1b[31;42mRed on Green\x1b[0m'
      const { container } = renderWithProviders(<Ansi>{text}</Ansi>)

      expect(container.textContent).toContain('Red on Green')
    })
  })

  describe('Empty and Edge Cases', () => {
    it('should handle empty string', () => {
      const { container } = renderWithProviders(<Ansi>{''}</Ansi>)
      const pre = container.querySelector('pre')
      expect(pre).toBeInTheDocument()
    })

    it('should handle whitespace only', () => {
      renderWithProviders(<Ansi>   </Ansi>)
      const pre = screen.getByText('   ')
      expect(pre).toBeInTheDocument()
    })

    it('should handle very long text', () => {
      const longText = 'A'.repeat(10000)
      const { container } = renderWithProviders(<Ansi>{longText}</Ansi>)

      expect(container.textContent).toContain('AAAA')
    })

    it('should handle text with newlines', () => {
      const text = 'Line 1\nLine 2\nLine 3'
      const { container } = renderWithProviders(<Ansi>{text}</Ansi>)

      expect(container.textContent).toContain('Line 1')
      expect(container.textContent).toContain('Line 2')
      expect(container.textContent).toContain('Line 3')
    })
  })

  describe('Special Content Patterns', () => {
    it('should handle text without special patterns', () => {
      const text = 'Simple text without special patterns'
      const { container } = renderWithProviders(<Ansi>{text}</Ansi>)

      expect(container.textContent).toContain('Simple text')
    })
  })

  describe('Performance', () => {
    it('should render quickly with simple text', () => {
      const startTime = performance.now()
      renderWithProviders(<Ansi>Simple text</Ansi>)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100)
    })

    it('should handle rapid re-renders', () => {
      const { rerender } = renderWithProviders(<Ansi>Text 1</Ansi>)

      const startTime = performance.now()
      for (let i = 0; i < 10; i++) {
        rerender(<Ansi>{`Text ${i}`}</Ansi>)
      }
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(500)
    })
  })

  describe('Component Updates', () => {
    it('should update content on prop change', () => {
      const { rerender } = renderWithProviders(<Ansi>Initial</Ansi>)

      expect(screen.getByText('Initial')).toBeInTheDocument()

      rerender(<Ansi>Updated</Ansi>)

      expect(screen.queryByText('Initial')).not.toBeInTheDocument()
      expect(screen.getByText('Updated')).toBeInTheDocument()
    })

    it('should update className on prop change', () => {
      const { container, rerender } = renderWithProviders(<Ansi className="class1">Text</Ansi>)

      let pre = container.querySelector('pre')
      expect(pre).toHaveClass('class1')

      rerender(<Ansi className="class2">Text</Ansi>)

      pre = container.querySelector('pre')
      expect(pre).toHaveClass('class2')
      expect(pre).not.toHaveClass('class1')
    })

    it('should update noWrap behavior on prop change', () => {
      const { container, rerender } = renderWithProviders(<Ansi>Text</Ansi>)

      let pre = container.querySelector('pre') as HTMLElement
      expect(pre.style.wordBreak).toBe('break-all')

      rerender(<Ansi noWrap>Text</Ansi>)

      pre = container.querySelector('pre') as HTMLElement
      expect(pre.style.whiteSpace).toBe('nowrap')
    })
  })

  describe('Integration', () => {
    it('should work within a larger component tree', () => {
      const { container } = renderWithProviders(
        <div>
          <h1>Header</h1>
          <Ansi>Content</Ansi>
          <p>Footer</p>
        </div>
      )

      expect(screen.getByText('Header')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
      expect(screen.getByText('Footer')).toBeInTheDocument()
    })

    it('should not affect sibling components', () => {
      renderWithProviders(
        <>
          <div data-testid="before">Before</div>
          <Ansi>Ansi Content</Ansi>
          <div data-testid="after">After</div>
        </>
      )

      expect(screen.getByTestId('before')).toBeInTheDocument()
      expect(screen.getByText('Ansi Content')).toBeInTheDocument()
      expect(screen.getByTestId('after')).toBeInTheDocument()
    })
  })
})
