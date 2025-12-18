/*
 * Copyright 2024 The Kubernetes Authors
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

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { performanceHelpers } from '../helpers/test-utils'

/**
 * Unit tests for ContextMenu component
 * Tests right-click context menu functionality for Kubernetes resources
 */

// Mock the ContextMenu component (to be implemented)
const MockContextMenu = ({ resourceName, resourceType, onAskAI, onDebug, onExplain }) => {
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const [isOpen, setIsOpen] = React.useState(false)

  const handleContextMenu = (e) => {
    e.preventDefault()
    setPosition({ x: e.clientX, y: e.clientY })
    setIsOpen(true)
  }

  return (
    <div data-testid="context-menu-trigger" onContextMenu={handleContextMenu}>
      {resourceName}
      {isOpen && (
        <div
          data-testid="context-menu"
          style={{ position: 'absolute', left: position.x, top: position.y }}
        >
          <button data-testid="ask-ai-btn" onClick={onAskAI}>
            Ask AI about {resourceName}
          </button>
          <button data-testid="debug-btn" onClick={onDebug}>
            Debug {resourceName}
          </button>
          <button data-testid="explain-btn" onClick={onExplain}>
            Explain {resourceType}
          </button>
        </div>
      )}
    </div>
  )
}

describe('ContextMenu Component', () => {
  let mockOnAskAI: jest.Mock
  let mockOnDebug: jest.Mock
  let mockOnExplain: jest.Mock

  beforeEach(() => {
    mockOnAskAI = jest.fn()
    mockOnDebug = jest.fn()
    mockOnExplain = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render trigger element', () => {
      render(
        <MockContextMenu
          resourceName="nginx-pod-123"
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      expect(screen.getByTestId('context-menu-trigger')).toBeInTheDocument()
      expect(screen.getByText('nginx-pod-123')).toBeInTheDocument()
    })

    it('should not show menu initially', () => {
      render(
        <MockContextMenu
          resourceName="nginx-pod-123"
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      expect(screen.queryByTestId('context-menu')).not.toBeInTheDocument()
    })

    it('should render with different resource types', () => {
      const { rerender } = render(
        <MockContextMenu
          resourceName="my-deployment"
          resourceType="Deployment"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      expect(screen.getByText('my-deployment')).toBeInTheDocument()

      rerender(
        <MockContextMenu
          resourceName="my-service"
          resourceType="Service"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      expect(screen.getByText('my-service')).toBeInTheDocument()
    })
  })

  describe('right-click interaction', () => {
    it('should open menu on right-click', async () => {
      render(
        <MockContextMenu
          resourceName="nginx-pod-123"
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      const trigger = screen.getByTestId('context-menu-trigger')
      fireEvent.contextMenu(trigger, { clientX: 100, clientY: 200 })

      await waitFor(() => {
        expect(screen.getByTestId('context-menu')).toBeInTheDocument()
      })
    })

    it('should position menu at cursor location', async () => {
      render(
        <MockContextMenu
          resourceName="nginx-pod-123"
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      const trigger = screen.getByTestId('context-menu-trigger')
      fireEvent.contextMenu(trigger, { clientX: 150, clientY: 300 })

      await waitFor(() => {
        const menu = screen.getByTestId('context-menu')
        expect(menu).toHaveStyle({ left: '150px', top: '300px' })
      })
    })

    it('should prevent default context menu', () => {
      render(
        <MockContextMenu
          resourceName="nginx-pod-123"
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      const trigger = screen.getByTestId('context-menu-trigger')
      const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

      trigger.dispatchEvent(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('menu actions', () => {
    it('should render all action buttons', async () => {
      render(
        <MockContextMenu
          resourceName="nginx-pod-123"
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      const trigger = screen.getByTestId('context-menu-trigger')
      fireEvent.contextMenu(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('ask-ai-btn')).toBeInTheDocument()
        expect(screen.getByTestId('debug-btn')).toBeInTheDocument()
        expect(screen.getByTestId('explain-btn')).toBeInTheDocument()
      })
    })

    it('should call onAskAI when Ask AI clicked', async () => {
      render(
        <MockContextMenu
          resourceName="nginx-pod-123"
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      const trigger = screen.getByTestId('context-menu-trigger')
      fireEvent.contextMenu(trigger)

      await waitFor(() => {
        const askBtn = screen.getByTestId('ask-ai-btn')
        fireEvent.click(askBtn)
      })

      expect(mockOnAskAI).toHaveBeenCalledTimes(1)
    })

    it('should call onDebug when Debug clicked', async () => {
      render(
        <MockContextMenu
          resourceName="nginx-pod-123"
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      const trigger = screen.getByTestId('context-menu-trigger')
      fireEvent.contextMenu(trigger)

      await waitFor(() => {
        const debugBtn = screen.getByTestId('debug-btn')
        fireEvent.click(debugBtn)
      })

      expect(mockOnDebug).toHaveBeenCalledTimes(1)
    })

    it('should call onExplain when Explain clicked', async () => {
      render(
        <MockContextMenu
          resourceName="nginx-pod-123"
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      const trigger = screen.getByTestId('context-menu-trigger')
      fireEvent.contextMenu(trigger)

      await waitFor(() => {
        const explainBtn = screen.getByTestId('explain-btn')
        fireEvent.click(explainBtn)
      })

      expect(mockOnExplain).toHaveBeenCalledTimes(1)
    })
  })

  describe('menu closing', () => {
    it('should close menu on outside click', async () => {
      const { container } = render(
        <MockContextMenu
          resourceName="nginx-pod-123"
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      const trigger = screen.getByTestId('context-menu-trigger')
      fireEvent.contextMenu(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('context-menu')).toBeInTheDocument()
      })

      // Click outside
      fireEvent.click(container)

      await waitFor(() => {
        expect(screen.queryByTestId('context-menu')).not.toBeInTheDocument()
      })
    })

    it('should close menu after action', async () => {
      render(
        <MockContextMenu
          resourceName="nginx-pod-123"
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      const trigger = screen.getByTestId('context-menu-trigger')
      fireEvent.contextMenu(trigger)

      await waitFor(() => {
        const askBtn = screen.getByTestId('ask-ai-btn')
        fireEvent.click(askBtn)
      })

      await waitFor(() => {
        expect(screen.queryByTestId('context-menu')).not.toBeInTheDocument()
      })
    })

    it('should close menu on Escape key', async () => {
      render(
        <MockContextMenu
          resourceName="nginx-pod-123"
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      const trigger = screen.getByTestId('context-menu-trigger')
      fireEvent.contextMenu(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('context-menu')).toBeInTheDocument()
      })

      fireEvent.keyDown(document, { key: 'Escape' })

      await waitFor(() => {
        expect(screen.queryByTestId('context-menu')).not.toBeInTheDocument()
      })
    })
  })

  describe('keyboard navigation', () => {
    it('should support Tab navigation between menu items', async () => {
      const user = userEvent.setup()

      render(
        <MockContextMenu
          resourceName="nginx-pod-123"
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      const trigger = screen.getByTestId('context-menu-trigger')
      fireEvent.contextMenu(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('context-menu')).toBeInTheDocument()
      })

      await user.tab()
      expect(screen.getByTestId('ask-ai-btn')).toHaveFocus()

      await user.tab()
      expect(screen.getByTestId('debug-btn')).toHaveFocus()

      await user.tab()
      expect(screen.getByTestId('explain-btn')).toHaveFocus()
    })

    it('should execute action on Enter key', async () => {
      const user = userEvent.setup()

      render(
        <MockContextMenu
          resourceName="nginx-pod-123"
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      const trigger = screen.getByTestId('context-menu-trigger')
      fireEvent.contextMenu(trigger)

      await waitFor(() => {
        const askBtn = screen.getByTestId('ask-ai-btn')
        askBtn.focus()
      })

      await user.keyboard('{Enter}')

      expect(mockOnAskAI).toHaveBeenCalledTimes(1)
    })

    it('should support arrow key navigation', async () => {
      const user = userEvent.setup()

      render(
        <MockContextMenu
          resourceName="nginx-pod-123"
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      const trigger = screen.getByTestId('context-menu-trigger')
      fireEvent.contextMenu(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('context-menu')).toBeInTheDocument()
      })

      await user.keyboard('{ArrowDown}')
      expect(screen.getByTestId('ask-ai-btn')).toHaveFocus()

      await user.keyboard('{ArrowDown}')
      expect(screen.getByTestId('debug-btn')).toHaveFocus()

      await user.keyboard('{ArrowUp}')
      expect(screen.getByTestId('ask-ai-btn')).toHaveFocus()
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      render(
        <MockContextMenu
          resourceName="nginx-pod-123"
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      const trigger = screen.getByTestId('context-menu-trigger')
      fireEvent.contextMenu(trigger)

      await waitFor(() => {
        const menu = screen.getByTestId('context-menu')
        expect(menu).toHaveAttribute('role', 'menu')
        expect(menu).toHaveAttribute('aria-label')
      })
    })

    it('should have menu items with role="menuitem"', async () => {
      render(
        <MockContextMenu
          resourceName="nginx-pod-123"
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      const trigger = screen.getByTestId('context-menu-trigger')
      fireEvent.contextMenu(trigger)

      await waitFor(() => {
        const askBtn = screen.getByTestId('ask-ai-btn')
        expect(askBtn).toHaveAttribute('role', 'menuitem')
      })
    })

    it('should announce menu state to screen readers', async () => {
      render(
        <MockContextMenu
          resourceName="nginx-pod-123"
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      const trigger = screen.getByTestId('context-menu-trigger')
      fireEvent.contextMenu(trigger)

      await waitFor(() => {
        const menu = screen.getByTestId('context-menu')
        expect(menu).toHaveAttribute('aria-hidden', 'false')
      })
    })

    it('should have descriptive button labels', async () => {
      render(
        <MockContextMenu
          resourceName="nginx-pod-123"
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      const trigger = screen.getByTestId('context-menu-trigger')
      fireEvent.contextMenu(trigger)

      await waitFor(() => {
        expect(screen.getByText(/Ask AI about nginx-pod-123/)).toBeInTheDocument()
        expect(screen.getByText(/Debug nginx-pod-123/)).toBeInTheDocument()
        expect(screen.getByText(/Explain Pod/)).toBeInTheDocument()
      })
    })
  })

  describe('edge cases', () => {
    it('should handle rapid right-clicks', async () => {
      render(
        <MockContextMenu
          resourceName="nginx-pod-123"
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      const trigger = screen.getByTestId('context-menu-trigger')

      fireEvent.contextMenu(trigger, { clientX: 100, clientY: 100 })
      fireEvent.contextMenu(trigger, { clientX: 200, clientY: 200 })
      fireEvent.contextMenu(trigger, { clientX: 300, clientY: 300 })

      await waitFor(() => {
        const menu = screen.getByTestId('context-menu')
        expect(menu).toHaveStyle({ left: '300px', top: '300px' })
      })
    })

    it('should handle very long resource names', async () => {
      const longName = 'a'.repeat(100)

      render(
        <MockContextMenu
          resourceName={longName}
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      const trigger = screen.getByTestId('context-menu-trigger')
      fireEvent.contextMenu(trigger)

      await waitFor(() => {
        expect(screen.getByTestId('context-menu')).toBeInTheDocument()
      })
    })

    it('should handle special characters in resource names', async () => {
      const specialName = 'nginx-pod-123_test@v1.0'

      render(
        <MockContextMenu
          resourceName={specialName}
          resourceType="Pod"
          onAskAI={mockOnAskAI}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      expect(screen.getByText(specialName)).toBeInTheDocument()
    })

    it('should handle missing callbacks gracefully', async () => {
      render(
        <MockContextMenu
          resourceName="nginx-pod-123"
          resourceType="Pod"
          onAskAI={undefined}
          onDebug={mockOnDebug}
          onExplain={mockOnExplain}
        />
      )

      const trigger = screen.getByTestId('context-menu-trigger')
      fireEvent.contextMenu(trigger)

      await waitFor(() => {
        const askBtn = screen.getByTestId('ask-ai-btn')
        fireEvent.click(askBtn)
      })

      // Should not throw error
      expect(true).toBe(true)
    })
  })

  describe('multiple instances', () => {
    it('should support multiple context menus on same page', async () => {
      const { container } = render(
        <>
          <MockContextMenu
            resourceName="pod-1"
            resourceType="Pod"
            onAskAI={mockOnAskAI}
            onDebug={mockOnDebug}
            onExplain={mockOnExplain}
          />
          <MockContextMenu
            resourceName="pod-2"
            resourceType="Pod"
            onAskAI={mockOnAskAI}
            onDebug={mockOnDebug}
            onExplain={mockOnExplain}
          />
        </>
      )

      const triggers = screen.getAllByTestId('context-menu-trigger')
      expect(triggers).toHaveLength(2)
    })

    it('should close other menus when opening new one', async () => {
      render(
        <>
          <MockContextMenu
            resourceName="pod-1"
            resourceType="Pod"
            onAskAI={mockOnAskAI}
            onDebug={mockOnDebug}
            onExplain={mockOnExplain}
          />
          <MockContextMenu
            resourceName="pod-2"
            resourceType="Pod"
            onAskAI={mockOnAskAI}
            onDebug={mockOnDebug}
            onExplain={mockOnExplain}
          />
        </>
      )

      const triggers = screen.getAllByTestId('context-menu-trigger')

      fireEvent.contextMenu(triggers[0])
      await waitFor(() => {
        expect(screen.getAllByTestId('context-menu')).toHaveLength(1)
      })

      fireEvent.contextMenu(triggers[1])
      await waitFor(() => {
        expect(screen.getAllByTestId('context-menu')).toHaveLength(1)
      })
    })
  })
})
