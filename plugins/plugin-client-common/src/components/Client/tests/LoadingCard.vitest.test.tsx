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
 * Tests for LoadingCard component
 *
 * LoadingCard displays a success message after connecting to a cluster.
 * It uses the Card component with specific i18n strings.
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWithProviders, screen } from '../../../../../../test-utils'

import LoadingCard from '../LoadingCard'

// Mock the i18n module
vi.mock('@kui-shell/core/mdist/api/i18n', () => ({
  i18n: (namespace: string) => (key: string) => {
    const strings: Record<string, string> = {
      'Successfully connected to your cluster': 'Successfully connected to your cluster',
      'loadingDone:content': 'Your cluster is ready to use'
    }
    return strings[key] || key
  }
}))

// Mock the Card component to simplify testing
vi.mock('../spi/Card', () => ({
  default: ({ title, children, titleInHeader, bodyInHeader, icon }: any) => (
    <div data-testid="card" data-title={title} data-title-in-header={titleInHeader} data-body-in-header={bodyInHeader}>
      {icon && <img src={icon} alt="icon" />}
      <div data-testid="card-title">{title}</div>
      <div data-testid="card-content">{children}</div>
    </div>
  )
}))

describe('LoadingCard Component', () => {
  const mockRepl = {
    pexec: vi.fn(),
    qexec: vi.fn(),
    rexec: vi.fn()
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = renderWithProviders(<LoadingCard repl={mockRepl} />)
      expect(container.firstChild).toBeDefined()
    })

    it('should render the Card component', () => {
      renderWithProviders(<LoadingCard repl={mockRepl} />)
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })

    it('should display the success title', () => {
      renderWithProviders(<LoadingCard repl={mockRepl} />)
      expect(screen.getByText('Successfully connected to your cluster')).toBeInTheDocument()
    })

    it('should display the loading done content', () => {
      renderWithProviders(<LoadingCard repl={mockRepl} />)
      expect(screen.getByText('Your cluster is ready to use')).toBeInTheDocument()
    })
  })

  describe('Card Configuration', () => {
    it('should set titleInHeader prop', () => {
      renderWithProviders(<LoadingCard repl={mockRepl} />)
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('data-title-in-header', 'true')
    })

    it('should set bodyInHeader prop', () => {
      renderWithProviders(<LoadingCard repl={mockRepl} />)
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('data-body-in-header', 'true')
    })

    it('should pass the title to Card', () => {
      renderWithProviders(<LoadingCard repl={mockRepl} />)
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('data-title', 'Successfully connected to your cluster')
    })

    it('should include the Kui icon', () => {
      const { container } = renderWithProviders(<LoadingCard repl={mockRepl} />)
      const icon = container.querySelector('img')
      expect(icon).toBeInTheDocument()
      expect(icon?.src).toContain('WelcomeLight.png')
    })
  })

  describe('Component Type', () => {
    it('should be a PureComponent', () => {
      const instance = new LoadingCard({ repl: mockRepl })
      expect(instance).toBeInstanceOf(React.PureComponent)
    })
  })

  describe('Props Handling', () => {
    it('should accept repl prop', () => {
      const customRepl = {
        pexec: vi.fn(),
        qexec: vi.fn(),
        rexec: vi.fn()
      } as any

      const { container } = renderWithProviders(<LoadingCard repl={customRepl} />)
      expect(container.firstChild).toBeDefined()
    })

    it('should work with different REPL instances', () => {
      const repl1 = { pexec: vi.fn() } as any
      const repl2 = { qexec: vi.fn() } as any

      const { rerender } = renderWithProviders(<LoadingCard repl={repl1} />)
      expect(screen.getByTestId('card')).toBeInTheDocument()

      rerender(<LoadingCard repl={repl2} />)
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })
  })

  describe('Content Structure', () => {
    it('should have the correct content structure', () => {
      renderWithProviders(<LoadingCard repl={mockRepl} />)

      const title = screen.getByTestId('card-title')
      const content = screen.getByTestId('card-content')

      expect(title).toBeInTheDocument()
      expect(content).toBeInTheDocument()
    })

    it('should render content as children of Card', () => {
      renderWithProviders(<LoadingCard repl={mockRepl} />)

      const content = screen.getByTestId('card-content')
      expect(content.textContent).toBe('Your cluster is ready to use')
    })
  })

  describe('Visual State', () => {
    it('should render in a success state', () => {
      renderWithProviders(<LoadingCard repl={mockRepl} />)

      // Check that success message is displayed
      const successMessage = screen.getByText('Successfully connected to your cluster')
      expect(successMessage).toBeInTheDocument()
    })

    it('should include visual indicator (icon)', () => {
      const { container } = renderWithProviders(<LoadingCard repl={mockRepl} />)
      const icon = container.querySelector('img[alt="icon"]')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Re-rendering', () => {
    it('should handle re-renders without issues', () => {
      const { rerender } = renderWithProviders(<LoadingCard repl={mockRepl} />)

      expect(screen.getByTestId('card')).toBeInTheDocument()

      rerender(<LoadingCard repl={mockRepl} />)
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })

    it('should maintain content across re-renders', () => {
      const { rerender } = renderWithProviders(<LoadingCard repl={mockRepl} />)

      const initialContent = screen.getByText('Your cluster is ready to use')
      expect(initialContent).toBeInTheDocument()

      rerender(<LoadingCard repl={mockRepl} />)

      const rerenderedContent = screen.getByText('Your cluster is ready to use')
      expect(rerenderedContent).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    it('should work within a larger component tree', () => {
      const { container } = renderWithProviders(
        <div>
          <div data-testid="header">Header</div>
          <LoadingCard repl={mockRepl} />
          <div data-testid="footer">Footer</div>
        </div>
      )

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('card')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('should not affect surrounding components', () => {
      renderWithProviders(
        <>
          <div data-testid="sibling">Sibling Component</div>
          <LoadingCard repl={mockRepl} />
        </>
      )

      expect(screen.getByTestId('sibling')).toBeInTheDocument()
      expect(screen.getByTestId('card')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible content', () => {
      renderWithProviders(<LoadingCard repl={mockRepl} />)

      // Text content should be accessible to screen readers
      const successMessage = screen.getByText('Successfully connected to your cluster')
      expect(successMessage).toBeVisible()

      const content = screen.getByText('Your cluster is ready to use')
      expect(content).toBeVisible()
    })

    it('should have an accessible icon with alt text', () => {
      const { container } = renderWithProviders(<LoadingCard repl={mockRepl} />)
      const icon = container.querySelector('img')

      expect(icon).toBeInTheDocument()
      expect(icon).toHaveAttribute('alt', 'icon')
    })
  })
})
