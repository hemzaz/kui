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

export interface AIInsight {
  /** Summary text */
  summary: string
  /** Detailed explanation */
  details?: string
  /** Severity level */
  severity?: 'info' | 'warning' | 'error' | 'success'
  /** Suggested actions */
  actions?: Array<{
    label: string
    action: () => void | Promise<void>
  }>
  /** Loading state */
  loading?: boolean
  /** Error message if loading failed */
  error?: string
}

interface AITooltipProps {
  /** Target element to attach tooltip to */
  targetRef: React.RefObject<HTMLElement>
  /** Function to fetch AI insights */
  fetchInsights: () => Promise<AIInsight>
  /** Hover delay before showing tooltip (ms) */
  delay?: number
  /** Maximum tooltip width */
  maxWidth?: number
  /** Position preference */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  /** Whether tooltip is visible */
  visible: boolean
  /** Callback when tooltip closes */
  onClose?: () => void
}

/**
 * AI Tooltip Component
 *
 * Displays AI-generated insights for Kubernetes resources on hover.
 * Features:
 * - Async loading with < 1s performance target
 * - Debounced hover to prevent unnecessary API calls
 * - Non-blocking UI (doesn't freeze on hover)
 * - Auto-positioning to stay within viewport
 * - Loading states and error handling
 * - Keyboard accessible (Esc to close)
 */
export const AITooltip: React.FC<AITooltipProps> = ({
  targetRef,
  fetchInsights,
  delay = 500,
  maxWidth = 400,
  position = 'auto',
  visible,
  onClose
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [insight, setInsight] = useState<AIInsight | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Calculate tooltip position based on target element
  const calculatePosition = useCallback(() => {
    if (!targetRef.current || !tooltipRef.current) return { x: 0, y: 0 }

    const targetRect = targetRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let x = 0
    let y = 0

    // Auto position or specific direction
    const finalPosition = position === 'auto' ? calculateBestPosition(targetRect, tooltipRect) : position

    switch (finalPosition) {
      case 'top':
        x = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
        y = targetRect.top - tooltipRect.height - 10
        break
      case 'bottom':
        x = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
        y = targetRect.bottom + 10
        break
      case 'left':
        x = targetRect.left - tooltipRect.width - 10
        y = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
        break
      case 'right':
        x = targetRect.right + 10
        y = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
        break
    }

    // Keep within viewport bounds
    x = Math.max(10, Math.min(x, viewportWidth - tooltipRect.width - 10))
    y = Math.max(10, Math.min(y, viewportHeight - tooltipRect.height - 10))

    return { x, y }
  }, [targetRef, position])

  // Determine best position based on available space
  const calculateBestPosition = (
    targetRect: DOMRect,
    tooltipRect: DOMRect
  ): 'top' | 'bottom' | 'left' | 'right' => {
    const spaceAbove = targetRect.top
    const spaceBelow = window.innerHeight - targetRect.bottom
    const spaceLeft = targetRect.left
    const spaceRight = window.innerWidth - targetRect.right

    // Prefer bottom if enough space, otherwise choose side with most space
    if (spaceBelow >= tooltipRect.height + 20) return 'bottom'
    if (spaceAbove >= tooltipRect.height + 20) return 'top'
    if (spaceRight >= tooltipRect.width + 20) return 'right'
    if (spaceLeft >= tooltipRect.width + 20) return 'left'

    return 'bottom' // Default fallback
  }

  // Load insights with abort capability
  const loadInsights = useCallback(async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsLoading(true)
    setError(null)

    const startTime = Date.now()

    try {
      const result = await fetchInsights()
      const loadTime = Date.now() - startTime

      // Warn if loading took longer than 1s
      if (loadTime > 1000) {
        console.warn(`AITooltip: Insights loaded in ${loadTime}ms (target: <1000ms)`)
      }

      setInsight(result)
      setIsLoading(false)
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // Request was cancelled, ignore
        return
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to load insights'
      setError(errorMessage)
      setIsLoading(false)
    }
  }, [fetchInsights])

  // Load insights when visible changes
  useEffect(() => {
    if (!visible) {
      setInsight(null)
      setError(null)
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      return
    }

    // Debounce loading
    loadingTimeoutRef.current = setTimeout(() => {
      loadInsights()
    }, delay)

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [visible, delay, loadInsights])

  // Update position when tooltip or insight changes
  useEffect(() => {
    if (visible && tooltipRef.current) {
      const newPosition = calculatePosition()
      setTooltipPosition(newPosition)
    }
  }, [visible, insight, calculatePosition])

  // Keyboard handling (Esc to close)
  useEffect(() => {
    if (!visible) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [visible, onClose])

  if (!visible) {
    return null
  }

  return (
    <div
      ref={tooltipRef}
      className="kui-ai-tooltip"
      style={{
        position: 'fixed',
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
        maxWidth: `${maxWidth}px`,
        zIndex: 'var(--kui-ai-z-index-popover)'
      }}
      role="tooltip"
      aria-live="polite"
    >
      {/* Loading state */}
      {isLoading && (
        <div className="kui-ai-tooltip-loading">
          <div className="kui-ai-loading-indicator">
            <span className="kui-ai-loading-dot"></span>
            <span className="kui-ai-loading-dot"></span>
            <span className="kui-ai-loading-dot"></span>
          </div>
          <span className="kui-ai-tooltip-loading-text">Loading insights...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="kui-ai-tooltip-error">
          <span className="kui-ai-tooltip-error-icon">⚠️</span>
          <span className="kui-ai-tooltip-error-text">{error}</span>
          <button
            className="kui-ai-tooltip-retry"
            onClick={loadInsights}
            aria-label="Retry loading insights"
          >
            Retry
          </button>
        </div>
      )}

      {/* Insight content */}
      {insight && !isLoading && !error && (
        <div className={`kui-ai-tooltip-content kui-ai-severity-${insight.severity || 'info'}`}>
          {/* Header with severity indicator */}
          <div className="kui-ai-tooltip-header">
            <span className="kui-ai-tooltip-icon">
              {getSeverityIcon(insight.severity)}
            </span>
            <div className="kui-ai-tooltip-summary">{insight.summary}</div>
          </div>

          {/* Details */}
          {insight.details && (
            <div className="kui-ai-tooltip-details">{insight.details}</div>
          )}

          {/* Actions */}
          {insight.actions && insight.actions.length > 0 && (
            <div className="kui-ai-tooltip-actions">
              {insight.actions.map((action, index) => (
                <button
                  key={index}
                  className="kui-ai-tooltip-action-button"
                  onClick={async () => {
                    await action.action()
                    onClose?.()
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Close button */}
      <button
        className="kui-ai-tooltip-close"
        onClick={onClose}
        aria-label="Close tooltip"
      >
        ✕
      </button>
    </div>
  )
}

/**
 * Get icon for severity level
 */
function getSeverityIcon(severity?: 'info' | 'warning' | 'error' | 'success'): string {
  switch (severity) {
    case 'success':
      return '✅'
    case 'warning':
      return '⚠️'
    case 'error':
      return '❌'
    case 'info':
    default:
      return 'ℹ️'
  }
}

/**
 * Hook for managing tooltip state with hover
 *
 * Usage:
 * ```tsx
 * const { tooltipVisible, showTooltip, hideTooltip, targetRef } = useAITooltip()
 *
 * <div
 *   ref={targetRef}
 *   onMouseEnter={showTooltip}
 *   onMouseLeave={hideTooltip}
 * >
 *   Resource content
 * </div>
 *
 * <AITooltip
 *   targetRef={targetRef}
 *   visible={tooltipVisible}
 *   fetchInsights={async () => ({
 *     summary: 'Resource is healthy',
 *     severity: 'success'
 *   })}
 *   onClose={hideTooltip}
 * />
 * ```
 */
export function useAITooltip() {
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const targetRef = useRef<HTMLElement>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showTooltip = useCallback(() => {
    // Don't show immediately - wait for stable hover
    hoverTimeoutRef.current = setTimeout(() => {
      setTooltipVisible(true)
    }, 300)
  }, [])

  const hideTooltip = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setTooltipVisible(false)
  }, [])

  return {
    tooltipVisible,
    showTooltip,
    hideTooltip,
    targetRef
  }
}
