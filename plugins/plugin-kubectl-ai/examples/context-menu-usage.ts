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
 * Context Menu Integration Usage Examples
 *
 * This file demonstrates how to use the context menu backend services
 * in frontend components for tooltips and context menus.
 */

import type REPL from '@kui-shell/core/mdist/models/repl'
import { getContextMenuService } from '../src/services/context-menu-service'
import { extractResourceContextFast } from '../src/utils/resource-context-extractor'
import { DEFAULT_AI_CONFIG } from '../src/types/ai-types'

/**
 * Example 1: Generate quick insight for tooltip on hover
 *
 * Use case: User hovers over a pod row in a table
 */
async function generateTooltipInsight(repl: REPL, kind: string, name: string, namespace: string) {
  try {
    // Step 1: Extract minimal resource context (fast, ~400ms)
    const context = await extractResourceContextFast(repl, kind, name, namespace)

    // Step 2: Get context menu service instance
    const service = getContextMenuService(DEFAULT_AI_CONFIG)

    // Step 3: Generate quick insight (< 1s target)
    const insight = await service.generateQuickInsight(context)

    // Step 4: Display insight in tooltip
    console.log(`Tooltip for ${kind}/${name}:`)
    console.log(`  Insight: ${insight.insight}`)
    console.log(`  Severity: ${insight.severity}`)
    console.log(`  Latency: ${insight.latency}ms`)
    console.log(`  Cached: ${insight.cached}`)

    return insight
  } catch (error) {
    console.error('Failed to generate tooltip insight:', error)
    return null
  }
}

/**
 * Example 2: Generate context menu actions on right-click
 *
 * Use case: User right-clicks on a deployment row
 */
async function generateContextMenuActions(repl: REPL, kind: string, name: string, namespace: string) {
  try {
    // Step 1: Extract resource context
    const context = await extractResourceContextFast(repl, kind, name, namespace)

    // Step 2: Get context menu service instance
    const service = getContextMenuService(DEFAULT_AI_CONFIG)

    // Step 3: Generate contextual actions
    const result = await service.generateActions(context)

    // Step 4: Display actions in context menu
    console.log(`Context menu for ${kind}/${name}:`)
    result.actions.forEach((action, index) => {
      console.log(`  ${index + 1}. ${action.label}`)
      console.log(`     Command: ${action.command}`)
      console.log(`     Description: ${action.description}`)
      console.log(`     Disruptive: ${action.disruptive || false}`)
    })
    console.log(`  Latency: ${result.latency}ms`)
    console.log(`  Cached: ${result.cached}`)

    return result
  } catch (error) {
    console.error('Failed to generate context menu actions:', error)
    return null
  }
}

/**
 * Example 3: React component integration with hover debouncing
 *
 * This shows how to integrate with a React table component
 */
interface TooltipState {
  insight: string | null
  severity: 'error' | 'warning' | 'info' | 'success'
  loading: boolean
}

class ResourceTableRow {
  private hoverTimeout: NodeJS.Timeout | null = null
  private tooltipState: TooltipState = {
    insight: null,
    severity: 'info',
    loading: false
  }

  /**
   * Handle mouse enter with debouncing
   */
  async handleMouseEnter(repl: REPL, kind: string, name: string, namespace: string) {
    // Debounce hover event (wait 300ms before requesting insight)
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout)
    }

    this.hoverTimeout = setTimeout(async () => {
      // Show loading state
      this.tooltipState = { ...this.tooltipState, loading: true }

      // Generate insight
      const result = await generateTooltipInsight(repl, kind, name, namespace)

      if (result) {
        this.tooltipState = {
          insight: result.insight,
          severity: result.severity,
          loading: false
        }

        // Show tooltip (implementation depends on UI framework)
        this.showTooltip(result.insight, result.severity)
      }
    }, 300) // 300ms debounce
  }

  /**
   * Handle mouse leave
   */
  handleMouseLeave() {
    // Cancel pending insight request
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout)
      this.hoverTimeout = null
    }

    // Hide tooltip
    this.hideTooltip()
  }

  /**
   * Handle right-click for context menu
   */
  async handleRightClick(
    event: MouseEvent,
    repl: REPL,
    kind: string,
    name: string,
    namespace: string
  ) {
    event.preventDefault()

    // Generate context menu actions
    const result = await generateContextMenuActions(repl, kind, name, namespace)

    if (result) {
      // Show context menu at mouse position
      this.showContextMenu(event.clientX, event.clientY, result.actions)
    }
  }

  private showTooltip(insight: string, severity: string) {
    // Implementation depends on UI framework
    console.log(`Show tooltip: ${insight} (${severity})`)
  }

  private hideTooltip() {
    // Implementation depends on UI framework
    console.log('Hide tooltip')
  }

  private showContextMenu(x: number, y: number, actions: any[]) {
    // Implementation depends on UI framework
    console.log(`Show context menu at (${x}, ${y}) with ${actions.length} actions`)
  }
}

/**
 * Example 4: Performance optimization with client-side caching
 *
 * Cache insights on the frontend for 30 seconds to reduce backend calls
 */
class ClientSideCache {
  private cache = new Map<string, { insight: string; severity: string; timestamp: number }>()
  private readonly TTL = 30000 // 30 seconds

  getCachedInsight(kind: string, name: string, namespace: string) {
    const key = `${namespace}:${kind}:${name}`
    const cached = this.cache.get(key)

    if (cached && Date.now() - cached.timestamp < this.TTL) {
      console.log(`Client-side cache hit for ${key}`)
      return { insight: cached.insight, severity: cached.severity, cached: true }
    }

    return null
  }

  setCachedInsight(kind: string, name: string, namespace: string, insight: string, severity: string) {
    const key = `${namespace}:${kind}:${name}`
    this.cache.set(key, {
      insight,
      severity,
      timestamp: Date.now()
    })
  }

  clear() {
    this.cache.clear()
  }
}

/**
 * Example 5: Prefetch insights for visible rows
 *
 * Proactively fetch insights for all visible table rows to improve perceived performance
 */
async function prefetchInsights(
  repl: REPL,
  resources: Array<{ kind: string; name: string; namespace: string }>
) {
  const service = getContextMenuService(DEFAULT_AI_CONFIG)

  // Fetch insights in parallel for all resources
  const promises = resources.map(async ({ kind, name, namespace }) => {
    try {
      const context = await extractResourceContextFast(repl, kind, name, namespace)
      return service.generateQuickInsight(context)
    } catch (error) {
      console.error(`Failed to prefetch insight for ${kind}/${name}:`, error)
      return null
    }
  })

  const results = await Promise.all(promises)

  console.log(`Prefetched ${results.filter(r => r !== null).length} insights`)
  return results
}

/**
 * Example 6: Handle cache invalidation on resource changes
 *
 * When a resource is updated, clear its cache to ensure fresh data
 */
function invalidateResourceCache(kind: string, name: string, namespace: string) {
  const service = getContextMenuService(DEFAULT_AI_CONFIG)
  service.invalidateCache(namespace, kind, name)

  console.log(`Invalidated cache for ${kind}/${name} in namespace ${namespace}`)
}

/**
 * Example 7: Monitor performance and cache statistics
 */
function monitorCachePerformance() {
  const service = getContextMenuService(DEFAULT_AI_CONFIG)
  const stats = service['cache'].getStats()

  console.log('Cache Performance Metrics:')
  console.log(`  Total keys: ${stats.keys}`)
  console.log(`  Cache hits: ${stats.hits}`)
  console.log(`  Cache misses: ${stats.misses}`)
  console.log(`  Hit rate: ${stats.hitRate}%`)
  console.log(`  Memory usage: ${(stats.vsize / 1024 / 1024).toFixed(2)} MB`)
}

/**
 * Example 8: Execute context menu action
 */
async function executeContextMenuAction(repl: REPL, command: string) {
  try {
    // Execute the kubectl command via REPL
    const result = await repl.rexec(command)
    console.log('Command executed successfully:', command)
    return result
  } catch (error) {
    console.error('Failed to execute command:', command, error)
    return null
  }
}

/**
 * Example 9: Complete integration example
 */
async function completeExample(repl: REPL) {
  const kind = 'Pod'
  const name = 'nginx-7d8b49557c-abc123'
  const namespace = 'production'

  console.log('=== Context Menu Integration Example ===\n')

  // 1. Generate tooltip insight
  console.log('1. Generating tooltip insight...')
  const insight = await generateTooltipInsight(repl, kind, name, namespace)
  console.log('')

  // 2. Generate context menu actions
  console.log('2. Generating context menu actions...')
  const actions = await generateContextMenuActions(repl, kind, name, namespace)
  console.log('')

  // 3. Execute first action
  if (actions && actions.actions.length > 0) {
    console.log('3. Executing first action...')
    const firstAction = actions.actions[0]
    await executeContextMenuAction(repl, firstAction.command)
    console.log('')
  }

  // 4. Monitor cache performance
  console.log('4. Cache performance:')
  monitorCachePerformance()
  console.log('')

  // 5. Invalidate cache
  console.log('5. Invalidating cache...')
  invalidateResourceCache(kind, name, namespace)
  console.log('')

  console.log('=== Example Complete ===')
}

// Export all examples
export {
  generateTooltipInsight,
  generateContextMenuActions,
  ResourceTableRow,
  ClientSideCache,
  prefetchInsights,
  invalidateResourceCache,
  monitorCachePerformance,
  executeContextMenuAction,
  completeExample
}
