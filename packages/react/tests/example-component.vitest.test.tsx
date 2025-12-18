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
 * Example React component test with Vitest
 *
 * This demonstrates how to test React components using Vitest
 * with @testing-library/react and custom render helpers.
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWithProviders, screen, userEvent } from '../../../test-utils'

// Example component for testing
const ExampleButton: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => {
  return (
    <button onClick={onClick} data-testid="example-button">
      {label}
    </button>
  )
}

// Example component with state
const Counter: React.FC = () => {
  const [count, setCount] = React.useState(0)

  return (
    <div>
      <p data-testid="count-display">Count: {count}</p>
      <button onClick={() => setCount(count + 1)} data-testid="increment-button">
        Increment
      </button>
      <button onClick={() => setCount(count - 1)} data-testid="decrement-button">
        Decrement
      </button>
    </div>
  )
}

describe('ExampleButton Component', () => {
  it('should render button with label', () => {
    const mockOnClick = vi.fn()
    renderWithProviders(<ExampleButton onClick={mockOnClick} label="Click Me" />)

    const button = screen.getByTestId('example-button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Click Me')
  })

  it('should call onClick when clicked', async () => {
    const mockOnClick = vi.fn()
    const user = userEvent.setup()

    renderWithProviders(<ExampleButton onClick={mockOnClick} label="Click Me" />)

    const button = screen.getByTestId('example-button')
    await user.click(button)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('should support multiple clicks', async () => {
    const mockOnClick = vi.fn()
    const user = userEvent.setup()

    renderWithProviders(<ExampleButton onClick={mockOnClick} label="Click Me" />)

    const button = screen.getByTestId('example-button')
    await user.click(button)
    await user.click(button)
    await user.click(button)

    expect(mockOnClick).toHaveBeenCalledTimes(3)
  })
})

describe('Counter Component', () => {
  it('should render initial count of 0', () => {
    renderWithProviders(<Counter />)

    const display = screen.getByTestId('count-display')
    expect(display).toHaveTextContent('Count: 0')
  })

  it('should increment count when increment button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Counter />)

    const incrementButton = screen.getByTestId('increment-button')
    await user.click(incrementButton)

    const display = screen.getByTestId('count-display')
    expect(display).toHaveTextContent('Count: 1')
  })

  it('should decrement count when decrement button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Counter />)

    const decrementButton = screen.getByTestId('decrement-button')
    await user.click(decrementButton)

    const display = screen.getByTestId('count-display')
    expect(display).toHaveTextContent('Count: -1')
  })

  it('should handle multiple increments and decrements', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Counter />)

    const incrementButton = screen.getByTestId('increment-button')
    const decrementButton = screen.getByTestId('decrement-button')

    // Increment 3 times
    await user.click(incrementButton)
    await user.click(incrementButton)
    await user.click(incrementButton)

    // Decrement 1 time
    await user.click(decrementButton)

    const display = screen.getByTestId('count-display')
    expect(display).toHaveTextContent('Count: 2')
  })
})

describe('Component Testing Patterns', () => {
  it('should demonstrate snapshot testing', () => {
    const { container } = renderWithProviders(<ExampleButton onClick={vi.fn()} label="Test" />)

    // Snapshot testing (optional - Vitest supports inline snapshots)
    expect(container.firstChild).toBeDefined()
  })

  it('should demonstrate query methods', () => {
    renderWithProviders(<Counter />)

    // Various query methods from testing-library
    expect(screen.getByTestId('count-display')).toBeInTheDocument()
    expect(screen.getByText('Count: 0')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Increment' })).toBeInTheDocument()
  })

  it('should demonstrate async testing', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Counter />)

    // Wait for button to be clickable
    const button = screen.getByTestId('increment-button')
    expect(button).toBeEnabled()

    await user.click(button)

    // Assert after async action
    expect(screen.getByText('Count: 1')).toBeInTheDocument()
  })
})

// Note: This is an example test file demonstrating Vitest patterns.
// Real component tests should be placed next to the component files.
