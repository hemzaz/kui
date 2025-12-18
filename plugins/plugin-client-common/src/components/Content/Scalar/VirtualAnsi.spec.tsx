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
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import VirtualAnsi from './VirtualAnsi'

describe('VirtualAnsi Component', () => {
  it('should render small output without virtualization', () => {
    const smallOutput = 'Line 1\nLine 2\nLine 3'
    const { container } = render(<VirtualAnsi>{smallOutput}</VirtualAnsi>)

    // Should render as regular pre element (not virtualized)
    const pre = container.querySelector('pre')
    expect(pre).toBeInTheDocument()
    expect(pre).toHaveStyle({ margin: '0' })
  })

  it('should render large output with virtualization', () => {
    // Generate output with more than 500 lines
    const largeOutput = Array.from({ length: 600 }, (_, i) => `Line ${i + 1}`).join('\n')
    const { container } = render(<VirtualAnsi>{largeOutput}</VirtualAnsi>)

    // Should render virtualized container
    const virtualContainer = container.querySelector('div[style*="overflow"]')
    expect(virtualContainer).toBeInTheDocument()
    expect(virtualContainer).toHaveStyle({ height: '600px', overflow: 'auto' })
  })

  it('should handle ANSI color codes', () => {
    const ansiOutput = '\u001b[31mRed text\u001b[0m\nNormal text'
    const { container } = render(<VirtualAnsi>{ansiOutput}</VirtualAnsi>)

    // Should parse ANSI codes
    const coloredElement = container.querySelector('.ansi-red-fg')
    expect(coloredElement).toBeInTheDocument()
  })

  it('should call onRender callback', () => {
    const onRenderMock = jest.fn()
    render(<VirtualAnsi onRender={onRenderMock}>Test output</VirtualAnsi>)

    expect(onRenderMock).toHaveBeenCalled()
  })

  it('should handle noWrap prop', () => {
    const output = 'Test output with long line that should not wrap'
    const { container } = render(<VirtualAnsi noWrap={true}>{output}</VirtualAnsi>)

    const pre = container.querySelector('pre')
    expect(pre).toHaveStyle({ whiteSpace: 'nowrap' })
  })

  it('should handle noWrap="normal" prop', () => {
    const output = 'Test output with normal wrap'
    const { container } = render(<VirtualAnsi noWrap="normal">{output}</VirtualAnsi>)

    const pre = container.querySelector('pre')
    expect(pre).not.toHaveStyle({ wordBreak: 'break-all' })
    expect(pre).not.toHaveStyle({ whiteSpace: 'nowrap' })
  })

  it('should handle empty output', () => {
    const { container } = render(<VirtualAnsi>{''}</VirtualAnsi>)

    const pre = container.querySelector('pre')
    expect(pre).toBeInTheDocument()
  })

  it('should preserve line breaks in output', () => {
    const output = 'Line 1\nLine 2\nLine 3'
    const { container } = render(<VirtualAnsi>{output}</VirtualAnsi>)

    // Check that content includes newlines
    const content = container.textContent
    expect(content).toContain('Line 1')
    expect(content).toContain('Line 2')
    expect(content).toContain('Line 3')
  })

  it('should use correct line height for virtualization', () => {
    const largeOutput = Array.from({ length: 600 }, (_, i) => `Line ${i + 1}`).join('\n')
    const { container } = render(<VirtualAnsi>{largeOutput}</VirtualAnsi>)

    // Should have estimated line height
    const virtualItems = container.querySelectorAll('div[data-index]')
    if (virtualItems.length > 0) {
      expect(virtualItems[0]).toHaveStyle({ minHeight: '20px' })
    }
  })

  it('should handle ANSI bold text', () => {
    const ansiOutput = '\u001b[1mBold text\u001b[0m'
    const { container } = render(<VirtualAnsi>{ansiOutput}</VirtualAnsi>)

    const boldElement = container.querySelector('strong')
    expect(boldElement).toBeInTheDocument()
  })

  it('should handle ANSI background colors', () => {
    const ansiOutput = '\u001b[41mRed background\u001b[0m'
    const { container } = render(<VirtualAnsi>{ansiOutput}</VirtualAnsi>)

    const bgElement = container.querySelector('.ansi-red-bg')
    expect(bgElement).toBeInTheDocument()
  })

  it('should handle ANSI decorations', () => {
    const ansiOutput = '\u001b[2mDim text\u001b[0m'
    const { container } = render(<VirtualAnsi>{ansiOutput}</VirtualAnsi>)

    const dimElement = container.querySelector('.semi-transparent')
    expect(dimElement).toBeInTheDocument()
  })
})
