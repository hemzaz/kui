# Context Menu & Tooltip Integration Guide

This guide demonstrates how to integrate AI context menus and tooltips with Kui's resource tables and renderers.

## Overview

The kubectl-ai plugin provides two new React components for Feature #3:

1. **AIContextMenu** - Right-click context menu with AI-specific actions
2. **AITooltip** - Hover tooltip with async-loaded AI insights

## Quick Start

### Context Menu Integration

```tsx
import { AIContextMenu, useAIContextMenu, ContextMenuItem } from './ui'
import type { Row } from '@kui-shell/core'

function ResourceTable({ rows }: { rows: Row[] }) {
  const { menuState, openMenu, closeMenu } = useAIContextMenu()

  const handleContextMenu = (event: React.MouseEvent, row: Row) => {
    event.preventDefault()

    // Extract resource info from row
    const resourceInfo = {
      kind: row.attributes?.find(a => a.key === 'KIND')?.value || 'Resource',
      name: row.name,
      namespace: row.attributes?.find(a => a.key === 'NAMESPACE')?.value
    }

    // Define AI menu items
    const menuItems: ContextMenuItem[] = [
      {
        id: 'analyze',
        label: 'Analyze with AI',
        icon: '🔍',
        action: async () => {
          // Call AI analysis
          await analyzeResource(resourceInfo)
        }
      },
      {
        id: 'troubleshoot',
        label: 'Troubleshoot Issues',
        icon: '🔧',
        action: async () => {
          // Call AI troubleshooting
          await troubleshootResource(resourceInfo)
        }
      },
      {
        id: 'suggest',
        label: 'Get Optimization Suggestions',
        icon: '💡',
        action: async () => {
          // Call AI suggestions
          await getSuggestions(resourceInfo)
        },
        divider: true
      },
      {
        id: 'explain',
        label: 'Explain Configuration',
        icon: '📖',
        action: async () => {
          // Call AI explanation
          await explainConfig(resourceInfo)
        }
      }
    ]

    openMenu(event.clientX, event.clientY, menuItems, resourceInfo)
  }

  return (
    <div>
      {rows.map(row => (
        <div
          key={row.name}
          onContextMenu={(e) => handleContextMenu(e, row)}
        >
          {/* Row content */}
        </div>
      ))}

      {menuState && (
        <AIContextMenu {...menuState} onClose={closeMenu} />
      )}
    </div>
  )
}
```

### Tooltip Integration

```tsx
import { AITooltip, useAITooltip, AIInsight } from './ui'
import type { KubernetesResource } from '@kui-shell/plugin-kubectl'

function ResourceRow({ resource }: { resource: KubernetesResource }) {
  const { tooltipVisible, showTooltip, hideTooltip, targetRef } = useAITooltip()

  // Async function to fetch AI insights
  const fetchInsights = async (): Promise<AIInsight> => {
    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource })
      })

      const data = await response.json()

      return {
        summary: data.summary,
        details: data.details,
        severity: data.severity, // 'info' | 'warning' | 'error' | 'success'
        actions: data.actions?.map(a => ({
          label: a.label,
          action: async () => {
            // Execute suggested action
            await executeSuggestion(a.id)
          }
        }))
      }
    } catch (error) {
      throw new Error('Failed to load insights')
    }
  }

  return (
    <>
      <div
        ref={targetRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className="resource-row"
      >
        {/* Resource content */}
        <span>{resource.metadata.name}</span>
        <span>{resource.status.phase}</span>
      </div>

      <AITooltip
        targetRef={targetRef}
        visible={tooltipVisible}
        fetchInsights={fetchInsights}
        delay={500}
        maxWidth={400}
        position="auto"
        onClose={hideTooltip}
      />
    </>
  )
}
```

## Advanced Usage

### Custom Menu Items with Keyboard Shortcuts

```tsx
const menuItems: ContextMenuItem[] = [
  {
    id: 'analyze',
    label: 'Analyze with AI',
    icon: '🔍',
    shortcut: 'Ctrl+A',
    action: async () => {
      await analyzeResource()
    }
  },
  {
    id: 'disabled-action',
    label: 'Premium Feature',
    icon: '⭐',
    disabled: !isPremiumUser,
    action: async () => {
      // Won't be called if disabled
    }
  }
]
```

### Tooltip with Performance Optimization

```tsx
import { useMemo, useCallback } from 'react'

function OptimizedResourceRow({ resource }: { resource: KubernetesResource }) {
  const { tooltipVisible, showTooltip, hideTooltip, targetRef } = useAITooltip()

  // Memoize fetch function to prevent recreation
  const fetchInsights = useCallback(async (): Promise<AIInsight> => {
    const startTime = Date.now()

    // Use caching to avoid repeated API calls
    const cacheKey = `insights-${resource.metadata.uid}`
    const cached = sessionStorage.getItem(cacheKey)

    if (cached) {
      const data = JSON.parse(cached)
      console.log(`Cache hit! Loaded in ${Date.now() - startTime}ms`)
      return data
    }

    // Fetch from API
    const response = await fetch('/api/ai/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource }),
      signal: AbortSignal.timeout(5000) // 5s timeout
    })

    const data = await response.json()

    // Cache for 5 minutes
    sessionStorage.setItem(cacheKey, JSON.stringify(data))
    setTimeout(() => sessionStorage.removeItem(cacheKey), 5 * 60 * 1000)

    const loadTime = Date.now() - startTime
    console.log(`Insights loaded in ${loadTime}ms`)

    return data
  }, [resource.metadata.uid])

  return (
    <>
      <div
        ref={targetRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        {resource.metadata.name}
      </div>

      <AITooltip
        targetRef={targetRef}
        visible={tooltipVisible}
        fetchInsights={fetchInsights}
        delay={500}
        onClose={hideTooltip}
      />
    </>
  )
}
```

### Conditional Tooltip Display

```tsx
function SmartResourceRow({ resource }: { resource: KubernetesResource }) {
  const { tooltipVisible, showTooltip, hideTooltip, targetRef } = useAITooltip()

  // Only show tooltip for resources with issues
  const shouldShowTooltip = resource.status.phase !== 'Running'

  const fetchInsights = useCallback(async (): Promise<AIInsight> => {
    if (!shouldShowTooltip) {
      return {
        summary: 'Resource is healthy',
        severity: 'success'
      }
    }

    // Fetch detailed insights for problematic resources
    const response = await fetch('/api/ai/troubleshoot', {
      method: 'POST',
      body: JSON.stringify({ resource })
    })

    return response.json()
  }, [resource, shouldShowTooltip])

  return (
    <>
      <div
        ref={targetRef}
        onMouseEnter={shouldShowTooltip ? showTooltip : undefined}
        onMouseLeave={hideTooltip}
      >
        {resource.metadata.name}
      </div>

      {shouldShowTooltip && (
        <AITooltip
          targetRef={targetRef}
          visible={tooltipVisible}
          fetchInsights={fetchInsights}
          onClose={hideTooltip}
        />
      )}
    </>
  )
}
```

## Integration with Kui Table Renderer

To integrate with Kui's existing table renderer:

```tsx
import { Table } from '@kui-shell/core'
import { AIContextMenu, useAIContextMenu, AITooltip, useAITooltip } from './ui'

function EnhancedTableRenderer({ table }: { table: Table }) {
  const { menuState, openMenu, closeMenu } = useAIContextMenu()
  const tooltipStates = table.body.map(() => useAITooltip())

  return (
    <div className="kui-table">
      {/* Header */}
      <div className="kui-table-header">
        {table.header.attributes.map(attr => (
          <div key={attr.key}>{attr.value}</div>
        ))}
      </div>

      {/* Body with context menu and tooltips */}
      {table.body.map((row, index) => {
        const tooltipState = tooltipStates[index]

        return (
          <div
            key={row.name}
            ref={tooltipState.targetRef}
            onContextMenu={(e) => {
              e.preventDefault()
              openMenu(
                e.clientX,
                e.clientY,
                getMenuItems(row),
                getResourceInfo(row)
              )
            }}
            onMouseEnter={tooltipState.showTooltip}
            onMouseLeave={tooltipState.hideTooltip}
          >
            {/* Row cells */}
            {row.attributes.map(attr => (
              <div key={attr.key}>{attr.value}</div>
            ))}

            {/* Tooltip for this row */}
            <AITooltip
              targetRef={tooltipState.targetRef}
              visible={tooltipState.tooltipVisible}
              fetchInsights={() => fetchRowInsights(row)}
              onClose={tooltipState.hideTooltip}
            />
          </div>
        )
      })}

      {/* Context menu */}
      {menuState && (
        <AIContextMenu {...menuState} onClose={closeMenu} />
      )}
    </div>
  )
}
```

## Performance Considerations

### Tooltip Performance

- **Target**: Load insights in < 1s
- **Debouncing**: 500ms default delay before showing tooltip
- **Caching**: Use `sessionStorage` or `localStorage` for repeated requests
- **Abort**: Requests are automatically aborted if tooltip is hidden
- **Non-blocking**: Tooltip loading never freezes UI

### Context Menu Performance

- **Lazy Loading**: Menu only renders when opened
- **Keyboard Navigation**: Arrow keys, Enter, Esc supported
- **Auto-positioning**: Menu stays within viewport bounds

## Accessibility

Both components follow WCAG 2.1 AA guidelines:

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: ARIA labels and roles
- **Focus Management**: Clear focus indicators
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **High Contrast**: Works in high contrast mode

## Testing

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AIContextMenu, AITooltip } from './ui'

describe('AIContextMenu', () => {
  it('opens on right click', () => {
    const { container } = render(<ResourceTable />)
    const row = screen.getByText('my-pod')

    fireEvent.contextMenu(row)

    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('executes action on click', async () => {
    const mockAction = jest.fn()
    // ... test implementation
  })
})

describe('AITooltip', () => {
  it('loads insights on hover', async () => {
    const { container } = render(<ResourceRow />)
    const row = screen.getByText('my-pod')

    fireEvent.mouseEnter(row)

    await waitFor(() => {
      expect(screen.getByText(/insights/i)).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('respects 1s performance target', async () => {
    const startTime = Date.now()
    // ... test implementation
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(1000)
  })
})
```

## Troubleshooting

### Tooltip Not Showing

1. Ensure `targetRef` is properly assigned
2. Check `visible` prop is being toggled
3. Verify `fetchInsights` returns valid AIInsight object
4. Check browser console for errors

### Context Menu Positioning Issues

1. Menu auto-adjusts to stay within viewport
2. Check `x` and `y` props are from `clientX`/`clientY`
3. Ensure menu has proper z-index (uses CSS variable)

### Performance Issues

1. Add caching to `fetchInsights` function
2. Increase `delay` prop on tooltip (default 500ms)
3. Conditionally render tooltips only for problematic resources
4. Use React.memo() for row components

## API Reference

See TypeScript definitions in:
- `/src/ui/AIContextMenu.tsx` - Context menu types and hooks
- `/src/ui/AITooltip.tsx` - Tooltip types and hooks
