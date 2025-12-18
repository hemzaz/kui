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

import React, { useState, useEffect, useRef, useCallback } from 'react'

export interface ContextMenuItem {
  /** Unique identifier for the menu item */
  id: string
  /** Display label */
  label: string
  /** Icon (emoji or string) */
  icon?: string
  /** Menu item action handler */
  action: () => void | Promise<void>
  /** Whether the item is disabled */
  disabled?: boolean
  /** Divider after this item */
  divider?: boolean
  /** Keyboard shortcut hint */
  shortcut?: string
}

interface AIContextMenuProps {
  /** Menu items to display */
  items: ContextMenuItem[]
  /** X position (clientX from mouse event) */
  x: number
  /** Y position (clientY from mouse event) */
  y: number
  /** Callback when menu closes */
  onClose: () => void
  /** Target resource information */
  resourceInfo?: {
    kind: string
    name: string
    namespace?: string
  }
}

/**
 * AI Context Menu Component
 *
 * Provides context menu with AI-specific actions for Kubernetes resources.
 * Features:
 * - Right-click context menu for resources
 * - Keyboard navigation (arrow keys, Enter, Esc)
 * - Auto-positioning to stay within viewport
 * - Click-outside to close
 */
export const AIContextMenu: React.FC<AIContextMenuProps> = ({
  items,
  x,
  y,
  onClose,
  resourceInfo
}) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x, y })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isExecuting, setIsExecuting] = useState(false)

  // Auto-position menu to stay within viewport
  useEffect(() => {
    if (!menuRef.current) return

    const menuRect = menuRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let adjustedX = x
    let adjustedY = y

    // Adjust X if menu would overflow right edge
    if (x + menuRect.width > viewportWidth) {
      adjustedX = viewportWidth - menuRect.width - 10
    }

    // Adjust Y if menu would overflow bottom edge
    if (y + menuRect.height > viewportHeight) {
      adjustedY = viewportHeight - menuRect.height - 10
    }

    // Ensure menu is not off-screen on left or top
    adjustedX = Math.max(10, adjustedX)
    adjustedY = Math.max(10, adjustedY)

    setPosition({ x: adjustedX, y: adjustedY })
  }, [x, y])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const enabledItems = items.filter(item => !item.disabled)

      switch (event.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex(prev => {
            const nextIndex = prev + 1
            return nextIndex >= enabledItems.length ? 0 : nextIndex
          })
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex(prev => {
            const prevIndex = prev - 1
            return prevIndex < 0 ? enabledItems.length - 1 : prevIndex
          })
          break
        case 'Enter':
          event.preventDefault()
          if (enabledItems[selectedIndex]) {
            handleAction(enabledItems[selectedIndex].action)
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [items, selectedIndex, onClose])

  // Handle menu item action
  const handleAction = useCallback(async (action: () => void | Promise<void>) => {
    if (isExecuting) return

    setIsExecuting(true)
    try {
      await action()
    } finally {
      setIsExecuting(false)
      onClose()
    }
  }, [isExecuting, onClose])

  const enabledItems = items.filter(item => !item.disabled)

  return (
    <div
      ref={menuRef}
      className="kui-ai-context-menu"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 'var(--kui-ai-z-index-popover)'
      }}
      role="menu"
      aria-label="AI actions menu"
    >
      {/* Resource info header */}
      {resourceInfo && (
        <div className="kui-ai-context-menu-header">
          <div className="kui-ai-context-menu-resource">
            <span className="kui-ai-context-menu-kind">{resourceInfo.kind}</span>
            <span className="kui-ai-context-menu-name">{resourceInfo.name}</span>
            {resourceInfo.namespace && (
              <span className="kui-ai-context-menu-namespace">
                in {resourceInfo.namespace}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Menu items */}
      <div className="kui-ai-context-menu-items">
        {items.map((item, index) => {
          const isSelected = enabledItems.indexOf(item) === selectedIndex

          return (
            <React.Fragment key={item.id}>
              <button
                className={`kui-ai-context-menu-item ${isSelected ? 'kui-ai-selected' : ''} ${
                  item.disabled ? 'kui-ai-disabled' : ''
                }`}
                onClick={() => !item.disabled && handleAction(item.action)}
                disabled={item.disabled || isExecuting}
                role="menuitem"
                aria-label={item.label}
              >
                {item.icon && (
                  <span className="kui-ai-context-menu-icon">{item.icon}</span>
                )}
                <span className="kui-ai-context-menu-label">{item.label}</span>
                {item.shortcut && (
                  <span className="kui-ai-context-menu-shortcut">{item.shortcut}</span>
                )}
              </button>
              {item.divider && <div className="kui-ai-context-menu-divider" />}
            </React.Fragment>
          )
        })}
      </div>

      {/* Loading indicator */}
      {isExecuting && (
        <div className="kui-ai-context-menu-loading">
          <div className="kui-ai-loading-indicator">
            <span className="kui-ai-loading-dot"></span>
            <span className="kui-ai-loading-dot"></span>
            <span className="kui-ai-loading-dot"></span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Hook for managing context menu state
 *
 * Usage:
 * ```tsx
 * const { menuState, openMenu, closeMenu } = useAIContextMenu()
 *
 * <div onContextMenu={(e) => {
 *   e.preventDefault()
 *   openMenu(e.clientX, e.clientY, items, resourceInfo)
 * }}>
 *   Resource content
 * </div>
 *
 * {menuState && (
 *   <AIContextMenu {...menuState} onClose={closeMenu} />
 * )}
 * ```
 */
export function useAIContextMenu() {
  const [menuState, setMenuState] = useState<{
    items: ContextMenuItem[]
    x: number
    y: number
    resourceInfo?: {
      kind: string
      name: string
      namespace?: string
    }
  } | null>(null)

  const openMenu = useCallback(
    (
      x: number,
      y: number,
      items: ContextMenuItem[],
      resourceInfo?: { kind: string; name: string; namespace?: string }
    ) => {
      setMenuState({ items, x, y, resourceInfo })
    },
    []
  )

  const closeMenu = useCallback(() => {
    setMenuState(null)
  }, [])

  return { menuState, openMenu, closeMenu }
}
