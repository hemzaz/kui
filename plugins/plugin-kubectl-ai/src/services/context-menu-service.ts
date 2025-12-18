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

import type { AIProvider, AICompletionRequest, AIConfig } from '../types/ai-types'
import { ProviderFactory } from './provider-factory'
import { getCacheManager, hashQuery } from '../cache/cache-manager'
import { CONTEXT_MENU_INSIGHT_PROMPT, CONTEXT_MENU_ACTION_PROMPT } from '../prompts/system-prompts'
import type { ResourceContext } from '../utils/resource-context-extractor'

/**
 * Quick insight response for tooltips
 */
export interface QuickInsight {
  /** Brief insight text (< 50 words) */
  insight: string
  /** Severity level for styling */
  severity: 'error' | 'warning' | 'info' | 'success'
  /** Response time in milliseconds */
  latency: number
  /** Whether response was served from cache */
  cached: boolean
}

/**
 * Context menu action command
 */
export interface ContextMenuAction {
  /** Display label for the action */
  label: string
  /** kubectl command to execute */
  command: string
  /** Brief description of what this command does */
  description: string
  /** Whether this is a potentially disruptive command */
  disruptive?: boolean
}

/**
 * Context menu actions response
 */
export interface ContextMenuActions {
  /** List of suggested actions */
  actions: ContextMenuAction[]
  /** Response time in milliseconds */
  latency: number
  /** Whether response was served from cache */
  cached: boolean
}

/**
 * ContextMenuService provides ultra-fast insights and actions for context menus
 *
 * Key performance characteristics:
 * - Target response time: < 1s for insights
 * - Aggressive caching with 5-minute TTL
 * - Minimal token usage (< 100 tokens per request)
 * - Low-latency model selection when available
 */
export class ContextMenuService {
  private provider: AIProvider
  private config: AIConfig
  private cache = getCacheManager()

  // Ultra-short TTL for context menu (5 minutes)
  private readonly INSIGHT_CACHE_TTL = 300
  // Slightly longer TTL for actions (they change less frequently)
  private readonly ACTION_CACHE_TTL = 600

  public constructor(config: AIConfig) {
    this.config = config
    this.provider = ProviderFactory.getProvider(config)
  }

  /**
   * Generate quick insight for tooltip (< 1s target)
   *
   * This method is optimized for speed:
   * 1. Check cache first (< 10ms)
   * 2. Use minimal context (< 50 tokens)
   * 3. Request ultra-short response (maxTokens: 50)
   * 4. Use lower temperature for faster generation
   * 5. No streaming (reduces overhead)
   *
   * @param resource - Resource context
   * @returns Quick insight with latency tracking
   */
  public async generateQuickInsight(resource: ResourceContext): Promise<QuickInsight> {
    const startTime = Date.now()

    // Generate cache key from resource identity + status
    const cacheKey = this.generateInsightCacheKey(resource)

    // Check cache first
    const cachedInsight = this.cache.get<QuickInsight>(cacheKey)
    if (cachedInsight) {
      return {
        ...cachedInsight,
        latency: Date.now() - startTime,
        cached: true
      }
    }

    try {
      // Build ultra-minimal prompt for speed
      const prompt = this.buildQuickInsightPrompt(resource)

      // Create completion request optimized for speed
      const request: AICompletionRequest = {
        prompt,
        systemPrompt: CONTEXT_MENU_INSIGHT_PROMPT,
        model: this.config.model,
        maxTokens: 50, // Ultra-short response
        temperature: 0.3, // Lower for faster, more deterministic responses
        stream: false // No streaming for tooltips
      }

      // Get response from provider
      const response = await this.provider.complete(request)

      // Determine severity from response content
      const severity = this.determineSeverity(response.content, resource)

      const insight: QuickInsight = {
        insight: response.content.trim(),
        severity,
        latency: Date.now() - startTime,
        cached: false
      }

      // Cache for future requests
      this.cache.set(cacheKey, insight, this.INSIGHT_CACHE_TTL)

      return insight
    } catch (error) {
      console.error('[ContextMenuService] Failed to generate quick insight:', error)

      // Return fallback insight
      return {
        insight: this.getFallbackInsight(resource),
        severity: 'info',
        latency: Date.now() - startTime,
        cached: false
      }
    }
  }

  /**
   * Generate context menu actions based on resource state
   *
   * @param resource - Resource context
   * @returns List of relevant kubectl commands
   */
  public async generateActions(resource: ResourceContext): Promise<ContextMenuActions> {
    const startTime = Date.now()

    // Generate cache key
    const cacheKey = this.generateActionCacheKey(resource)

    // Check cache first
    const cachedActions = this.cache.get<ContextMenuActions>(cacheKey)
    if (cachedActions) {
      return {
        ...cachedActions,
        latency: Date.now() - startTime,
        cached: true
      }
    }

    try {
      // Build prompt with resource context
      const prompt = this.buildActionPrompt(resource)

      // Create completion request
      const request: AICompletionRequest = {
        prompt,
        systemPrompt: CONTEXT_MENU_ACTION_PROMPT,
        model: this.config.model,
        maxTokens: 500, // Enough for 3-5 commands
        temperature: 0.3, // Lower for consistent command generation
        stream: false
      }

      // Get response from provider
      const response = await this.provider.complete(request)

      // Parse JSON response
      const actions = this.parseActionsResponse(response.content, resource)

      const result: ContextMenuActions = {
        actions,
        latency: Date.now() - startTime,
        cached: false
      }

      // Cache for future requests
      this.cache.set(cacheKey, result, this.ACTION_CACHE_TTL)

      return result
    } catch (error) {
      console.error('[ContextMenuService] Failed to generate actions:', error)

      // Return fallback actions
      return {
        actions: this.getFallbackActions(resource),
        latency: Date.now() - startTime,
        cached: false
      }
    }
  }

  /**
   * Invalidate cache for a specific resource
   *
   * Call this when resource state changes to ensure fresh insights
   *
   * @param namespace - Resource namespace
   * @param kind - Resource kind
   * @param name - Resource name
   */
  public invalidateCache(namespace: string, kind: string, name: string): void {
    const insightPrefix = `insight:${namespace}:${kind}:${name}`
    const actionPrefix = `action:${namespace}:${kind}:${name}`

    const keys = this.cache.getKeys()
    let invalidatedCount = 0

    keys.forEach(key => {
      if (key.startsWith(insightPrefix) || key.startsWith(actionPrefix)) {
        this.cache.del(key)
        invalidatedCount++
      }
    })

    if (invalidatedCount > 0) {
      console.debug(`[ContextMenuService] Invalidated ${invalidatedCount} cache entries`)
    }
  }

  /**
   * Build ultra-minimal prompt for quick insights
   */
  private buildQuickInsightPrompt(resource: ResourceContext): string {
    const parts: string[] = []

    // Resource identity
    parts.push(`Resource: ${resource.kind}/${resource.name}`)
    parts.push(`Namespace: ${resource.namespace}`)

    // Current status (most critical info)
    if (resource.status) {
      parts.push(`Status: ${JSON.stringify(resource.status)}`)
    }

    // Recent events (only if there are warnings/errors)
    if (resource.events && resource.events.length > 0) {
      const criticalEvents = resource.events
        .filter(e => e.type === 'Warning')
        .slice(0, 3) // Only last 3 warnings
      if (criticalEvents.length > 0) {
        parts.push(`Recent Issues: ${JSON.stringify(criticalEvents)}`)
      }
    }

    // Metrics if available
    if (resource.metrics) {
      parts.push(`Metrics: ${JSON.stringify(resource.metrics)}`)
    }

    return parts.join('\n')
  }

  /**
   * Build prompt for action generation
   */
  private buildActionPrompt(resource: ResourceContext): string {
    const parts: string[] = []

    // Resource identity
    parts.push(`Resource: ${resource.kind}/${resource.name}`)
    parts.push(`Namespace: ${resource.namespace}`)

    // Full status
    if (resource.status) {
      parts.push(`Status: ${JSON.stringify(resource.status, null, 2)}`)
    }

    // All events
    if (resource.events && resource.events.length > 0) {
      parts.push(`Events: ${JSON.stringify(resource.events, null, 2)}`)
    }

    // Related resources
    if (resource.relatedResources) {
      parts.push(`Related: ${JSON.stringify(resource.relatedResources, null, 2)}`)
    }

    return parts.join('\n\n')
  }

  /**
   * Generate cache key for insights
   */
  private generateInsightCacheKey(resource: ResourceContext): string {
    // Include status hash to invalidate when status changes
    const statusHash = hashQuery(JSON.stringify(resource.status || {}))
    return `insight:${resource.namespace}:${resource.kind}:${resource.name}:${statusHash.substring(0, 8)}`
  }

  /**
   * Generate cache key for actions
   */
  private generateActionCacheKey(resource: ResourceContext): string {
    // Actions change less frequently, so use simpler key
    const stateIndicator = resource.status?.phase || resource.status?.state || 'unknown'
    return `action:${resource.namespace}:${resource.kind}:${resource.name}:${stateIndicator}`
  }

  /**
   * Determine severity from AI response content
   */
  private determineSeverity(content: string, resource: ResourceContext): 'error' | 'warning' | 'info' | 'success' {
    const lowerContent = content.toLowerCase()

    // Check for error indicators
    if (
      lowerContent.includes('✗') ||
      lowerContent.includes('error') ||
      lowerContent.includes('failed') ||
      lowerContent.includes('crash') ||
      lowerContent.includes('oom')
    ) {
      return 'error'
    }

    // Check for warning indicators
    if (
      lowerContent.includes('⚠') ||
      lowerContent.includes('warning') ||
      lowerContent.includes('check') ||
      lowerContent.includes('pending') ||
      lowerContent.includes('degraded')
    ) {
      return 'warning'
    }

    // Check for success indicators
    if (
      lowerContent.includes('✓') ||
      lowerContent.includes('healthy') ||
      lowerContent.includes('running') ||
      lowerContent.includes('ready') ||
      lowerContent.includes('normal')
    ) {
      return 'success'
    }

    // Check resource events for severity
    if (resource.events) {
      const hasWarnings = resource.events.some(e => e.type === 'Warning')
      if (hasWarnings) {
        return 'warning'
      }
    }

    return 'info'
  }

  /**
   * Parse actions JSON response
   */
  private parseActionsResponse(content: string, resource: ResourceContext): ContextMenuAction[] {
    try {
      // Try to extract JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('No JSON array found in response')
      }

      const actions = JSON.parse(jsonMatch[0]) as ContextMenuAction[]

      // Substitute placeholders
      return actions.map(action => ({
        ...action,
        command: this.substitutePlaceholders(action.command, resource),
        disruptive: action.label.includes('⚠') || action.label.toLowerCase().includes('delete')
      }))
    } catch (error) {
      console.error('[ContextMenuService] Failed to parse actions:', error)
      return this.getFallbackActions(resource)
    }
  }

  /**
   * Substitute placeholders in command templates
   */
  private substitutePlaceholders(command: string, resource: ResourceContext): string {
    return command
      .replace(/{kind}/g, resource.kind)
      .replace(/{resource}/g, resource.name)
      .replace(/{name}/g, resource.name)
      .replace(/{namespace}/g, resource.namespace)
      .replace(/{container}/g, resource.containerName || 'main')
  }

  /**
   * Get fallback insight when AI fails
   */
  private getFallbackInsight(resource: ResourceContext): string {
    const { kind, name, status } = resource

    // Check for common issues
    if (status) {
      const statusStr = JSON.stringify(status).toLowerCase()

      if (statusStr.includes('crashloopbackoff')) {
        return '✗ Container is crash looping - check logs'
      }
      if (statusStr.includes('imagepullbackoff') || statusStr.includes('errimagepull')) {
        return '✗ Cannot pull image - verify image name and credentials'
      }
      if (statusStr.includes('pending')) {
        return '⚠ Resource is pending - check node resources'
      }
      if (statusStr.includes('error')) {
        return '✗ Error state detected - investigate with kubectl describe'
      }
    }

    // Default fallback
    return `${kind}/${name} - Status unavailable`
  }

  /**
   * Get fallback actions when AI fails
   */
  private getFallbackActions(resource: ResourceContext): ContextMenuAction[] {
    const { kind, name, namespace } = resource
    const actions: ContextMenuAction[] = []

    // Universal actions
    actions.push({
      label: 'Describe resource',
      command: `kubectl describe ${kind.toLowerCase()} ${name} -n ${namespace}`,
      description: 'View detailed resource information and events'
    })

    actions.push({
      label: 'Get YAML',
      command: `kubectl get ${kind.toLowerCase()} ${name} -n ${namespace} -o yaml`,
      description: 'View full resource manifest'
    })

    // Pod-specific actions
    if (kind.toLowerCase() === 'pod') {
      actions.push({
        label: 'View logs',
        command: `kubectl logs ${name} -n ${namespace} --tail=100`,
        description: 'View recent container logs'
      })

      actions.push({
        label: 'View events',
        command: `kubectl get events -n ${namespace} --field-selector involvedObject.name=${name}`,
        description: 'View resource-specific events'
      })
    }

    // Deployment-specific actions
    if (kind.toLowerCase() === 'deployment') {
      actions.push({
        label: 'Check rollout status',
        command: `kubectl rollout status deployment/${name} -n ${namespace}`,
        description: 'View deployment rollout progress'
      })
    }

    // Service-specific actions
    if (kind.toLowerCase() === 'service') {
      actions.push({
        label: 'Check endpoints',
        command: `kubectl get endpoints ${name} -n ${namespace}`,
        description: 'View service endpoints'
      })
    }

    return actions.slice(0, 5) // Limit to 5 actions
  }
}

/**
 * Get or create singleton context menu service instance
 */
let contextMenuServiceInstance: ContextMenuService | null = null

/**
 * Get the context menu service instance
 *
 * @param config - AI configuration
 * @returns ContextMenuService instance
 */
export function getContextMenuService(config: AIConfig): ContextMenuService {
  if (!contextMenuServiceInstance) {
    contextMenuServiceInstance = new ContextMenuService(config)
  }
  return contextMenuServiceInstance
}

/**
 * Reset singleton instance (mainly for testing)
 */
export function resetContextMenuService(): void {
  contextMenuServiceInstance = null
}
