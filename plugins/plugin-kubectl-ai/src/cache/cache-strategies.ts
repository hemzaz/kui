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

import type { AIResponse } from '../types/ai-types'
import type { ClusterSnapshot } from '../types/cluster-types'

/**
 * Cache strategy configuration
 */
export interface CacheStrategy {
  /** Resource type (e.g., 'pod', 'deployment', 'namespace') */
  resourceType: string

  /** Time-to-live in seconds */
  ttl: number

  /** Whether this resource type should be cached */
  cacheable: boolean

  /** Cache invalidation triggers */
  invalidateOn?: ('create' | 'update' | 'delete')[]
}

/**
 * Default cache strategies for different Kubernetes resource types
 *
 * TTL values are chosen based on:
 * - Resource volatility (how often they change)
 * - Impact of stale data
 * - Query frequency
 */
export const DEFAULT_CACHE_STRATEGIES: Record<string, CacheStrategy> = {
  // Highly volatile - short TTL
  pod: {
    resourceType: 'pod',
    ttl: 60, // 1 minute
    cacheable: true,
    invalidateOn: ['create', 'update', 'delete']
  },

  // Pod logs - very short TTL as they constantly update
  podLogs: {
    resourceType: 'podLogs',
    ttl: 30, // 30 seconds
    cacheable: true,
    invalidateOn: ['update']
  },

  // Events - short TTL
  event: {
    resourceType: 'event',
    ttl: 60, // 1 minute
    cacheable: true,
    invalidateOn: ['create']
  },

  // Moderately volatile - medium TTL
  deployment: {
    resourceType: 'deployment',
    ttl: 300, // 5 minutes
    cacheable: true,
    invalidateOn: ['create', 'update', 'delete']
  },

  service: {
    resourceType: 'service',
    ttl: 300, // 5 minutes
    cacheable: true,
    invalidateOn: ['create', 'update', 'delete']
  },

  replicaset: {
    resourceType: 'replicaset',
    ttl: 180, // 3 minutes
    cacheable: true,
    invalidateOn: ['create', 'update', 'delete']
  },

  // Relatively stable - longer TTL
  configmap: {
    resourceType: 'configmap',
    ttl: 600, // 10 minutes
    cacheable: true,
    invalidateOn: ['create', 'update', 'delete']
  },

  secret: {
    resourceType: 'secret',
    ttl: 600, // 10 minutes
    cacheable: true,
    invalidateOn: ['create', 'update', 'delete']
  },

  namespace: {
    resourceType: 'namespace',
    ttl: 600, // 10 minutes
    cacheable: true,
    invalidateOn: ['create', 'delete']
  },

  // Very stable - long TTL
  persistentvolume: {
    resourceType: 'persistentvolume',
    ttl: 900, // 15 minutes
    cacheable: true,
    invalidateOn: ['create', 'delete']
  },

  storageclass: {
    resourceType: 'storageclass',
    ttl: 1800, // 30 minutes
    cacheable: true,
    invalidateOn: ['create', 'delete']
  },

  // Cluster-level resources - very long TTL
  node: {
    resourceType: 'node',
    ttl: 600, // 10 minutes
    cacheable: true,
    invalidateOn: ['create', 'delete']
  },

  clusterInfo: {
    resourceType: 'clusterInfo',
    ttl: 3600, // 1 hour
    cacheable: true,
    invalidateOn: []
  },

  // AI responses - context-dependent TTL
  aiResponse: {
    resourceType: 'aiResponse',
    ttl: 3600, // 1 hour (for general queries)
    cacheable: true,
    invalidateOn: []
  },

  // Troubleshooting queries - shorter TTL as issues may be resolved
  troubleshootingResponse: {
    resourceType: 'troubleshootingResponse',
    ttl: 300, // 5 minutes
    cacheable: true,
    invalidateOn: []
  },

  // Manifest generation - longer TTL as best practices don't change often
  manifestResponse: {
    resourceType: 'manifestResponse',
    ttl: 7200, // 2 hours
    cacheable: true,
    invalidateOn: []
  }
}

/**
 * Get appropriate TTL for a resource type
 *
 * @param resourceType - Kubernetes resource type (lowercase)
 * @returns TTL in seconds
 */
export function getTTLForResourceType(resourceType: string): number {
  const strategy = DEFAULT_CACHE_STRATEGIES[resourceType.toLowerCase()]
  return strategy?.ttl || 300 // Default to 5 minutes if not found
}

/**
 * Check if a resource type should be cached
 *
 * @param resourceType - Kubernetes resource type
 * @returns true if cacheable
 */
export function isCacheable(resourceType: string): boolean {
  const strategy = DEFAULT_CACHE_STRATEGIES[resourceType.toLowerCase()]
  return strategy?.cacheable !== false
}

/**
 * Determine if a response should be cached based on query characteristics
 *
 * @param prompt - User query
 * @param context - Cluster context
 * @param response - AI response
 * @returns true if should cache
 */
export function shouldCacheResponse(
  prompt: string,
  context: ClusterSnapshot | undefined,
  response: AIResponse
): boolean {
  // Don't cache if explicitly disabled
  if (response.cached === false) {
    return false
  }

  // Don't cache error responses
  if (response.content.toLowerCase().includes('error') || response.content.toLowerCase().includes('failed')) {
    return false
  }

  // Don't cache time-sensitive queries
  const timeSensitiveKeywords = ['now', 'current', 'latest', 'recent', 'today', 'live']
  const promptLower = prompt.toLowerCase()
  if (timeSensitiveKeywords.some(keyword => promptLower.includes(keyword))) {
    return false
  }

  // Don't cache troubleshooting queries if there are active warnings
  if (context?.currentResource?.events?.some(e => e.type === 'Warning')) {
    if (promptLower.includes('why') || promptLower.includes('debug') || promptLower.includes('fix')) {
      return false
    }
  }

  // Cache general knowledge and manifest generation queries
  const cacheableKeywords = [
    'what is',
    'how to',
    'create',
    'generate',
    'example',
    'best practice',
    'explain',
    'difference between'
  ]
  if (cacheableKeywords.some(keyword => promptLower.includes(keyword))) {
    return true
  }

  // Default to caching
  return true
}

/**
 * Get response TTL based on query type
 *
 * @param prompt - User query
 * @param context - Cluster context
 * @returns TTL in seconds
 */
export function getResponseTTL(prompt: string, context?: ClusterSnapshot): number {
  const promptLower = prompt.toLowerCase()

  // Troubleshooting queries - short TTL
  if (
    promptLower.includes('why') ||
    promptLower.includes('debug') ||
    promptLower.includes('error') ||
    promptLower.includes('fail')
  ) {
    return DEFAULT_CACHE_STRATEGIES.troubleshootingResponse.ttl
  }

  // Manifest generation - long TTL
  if (
    promptLower.includes('create') ||
    promptLower.includes('generate') ||
    promptLower.includes('manifest') ||
    promptLower.includes('yaml')
  ) {
    return DEFAULT_CACHE_STRATEGIES.manifestResponse.ttl
  }

  // General knowledge - very long TTL
  if (promptLower.includes('what is') || promptLower.includes('explain') || promptLower.includes('difference')) {
    return 7200 // 2 hours
  }

  // If context has warnings/errors, shorter TTL
  if (context?.currentResource?.events?.some(e => e.type === 'Warning')) {
    return 300 // 5 minutes
  }

  // Default
  return DEFAULT_CACHE_STRATEGIES.aiResponse.ttl
}

/**
 * Calculate cache priority for eviction policies
 *
 * Higher priority = less likely to be evicted
 *
 * @param resourceType - Resource type
 * @param accessCount - Number of times accessed
 * @param ageSeconds - Age of cache entry in seconds
 * @returns Priority score (0-1, higher is more important)
 */
export function calculateCachePriority(resourceType: string, accessCount: number, ageSeconds: number): number {
  const strategy = DEFAULT_CACHE_STRATEGIES[resourceType.toLowerCase()]
  if (!strategy) return 0.5

  // Base priority on resource stability (inverse of TTL)
  const stabilityScore = Math.min(strategy.ttl / 7200, 1) // Normalize to 0-1

  // Access frequency score
  const accessScore = Math.min(accessCount / 10, 1)

  // Freshness score (newer is better)
  const freshnessScore = Math.max(0, 1 - ageSeconds / strategy.ttl)

  // Weighted average
  return stabilityScore * 0.3 + accessScore * 0.4 + freshnessScore * 0.3
}

/**
 * Determine which resource changes should invalidate cache
 *
 * @param resourceType - Resource type that changed
 * @param action - Action performed
 * @returns Array of cache key patterns to invalidate
 */
export function getInvalidationPatterns(resourceType: string, action: 'create' | 'update' | 'delete'): string[] {
  const strategy = DEFAULT_CACHE_STRATEGIES[resourceType.toLowerCase()]
  if (!strategy || !strategy.invalidateOn?.includes(action)) {
    return []
  }

  const patterns: string[] = []

  // Invalidate context cache for this resource type
  patterns.push(`context:*:${resourceType}:*`)

  // For pod changes, also invalidate deployment/replicaset contexts
  if (resourceType === 'pod') {
    patterns.push('context:*:deployment:*')
    patterns.push('context:*:replicaset:*')
  }

  // For deployment changes, invalidate pod contexts
  if (resourceType === 'deployment') {
    patterns.push('context:*:pod:*')
  }

  // For namespace changes, invalidate all in that namespace
  if (resourceType === 'namespace' && action === 'delete') {
    patterns.push('context:*')
  }

  return patterns
}

/**
 * Calculate optimal cache size based on available memory
 *
 * @param availableMemoryMB - Available memory in MB
 * @returns Recommended max cache entries
 */
export function calculateOptimalCacheSize(availableMemoryMB: number): number {
  // Assume average cache entry is ~10KB
  const averageEntrySizeKB = 10
  const maxMemoryForCacheMB = availableMemoryMB * 0.1 // Use 10% of available memory

  return Math.floor((maxMemoryForCacheMB * 1024) / averageEntrySizeKB)
}
