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

import NodeCache from 'node-cache'
import { createHash } from 'crypto'
import type { AIResponse } from '../types/ai-types'
import type { ClusterSnapshot } from '../types/cluster-types'

/**
 * Cache statistics interface
 */
export interface CacheStats {
  keys: number
  hits: number
  misses: number
  ksize: number
  vsize: number
  hitRate: number
}

/**
 * Cache configuration options
 */
export interface CacheOptions {
  /** Default TTL in seconds */
  stdTTL?: number
  /** Check period for expired keys in seconds */
  checkperiod?: number
  /** Whether to clone objects on get/set */
  useClones?: boolean
  /** Maximum number of keys to store */
  maxKeys?: number
}

/**
 * CacheManager handles caching for AI assistant
 *
 * Features:
 * - Context caching for cluster state
 * - Response caching for identical queries
 * - Resource-based cache invalidation
 * - Query deduplication via hashing
 * - Performance statistics
 */
export class CacheManager {
  private cache: NodeCache
  private readonly defaultContextTTL = 300 // 5 minutes
  private readonly defaultResponseTTL = 3600 // 1 hour

  public constructor(options: CacheOptions = {}) {
    this.cache = new NodeCache({
      stdTTL: options.stdTTL || 300, // 5 minutes default
      checkperiod: options.checkperiod || 60, // Check for expired keys every minute
      useClones: options.useClones !== undefined ? options.useClones : false, // Better performance
      maxKeys: options.maxKeys || -1 // No limit by default
    })

    // Set up event listeners for debugging/monitoring
    this.setupEventListeners()
  }

  /**
   * Cache cluster context snapshot
   *
   * @param key - Cache key (e.g., namespace or resource identifier)
   * @param context - ClusterSnapshot to cache
   * @param ttl - Time-to-live in seconds (default: 5 minutes)
   */
  public cacheContext(key: string, context: ClusterSnapshot, ttl: number = this.defaultContextTTL): void {
    const cacheKey = `context:${key}`
    this.cache.set(cacheKey, context, ttl)
  }

  /**
   * Retrieve cached cluster context
   *
   * @param key - Cache key
   * @returns ClusterSnapshot if found, undefined otherwise
   */
  public getContext(key: string): ClusterSnapshot | undefined {
    const cacheKey = `context:${key}`
    return this.cache.get<ClusterSnapshot>(cacheKey)
  }

  /**
   * Cache AI response for identical queries
   *
   * @param queryHash - Hash of the query (use hashQuery function)
   * @param response - AIResponse to cache
   * @param ttl - Time-to-live in seconds (default: 1 hour)
   */
  public cacheResponse(queryHash: string, response: AIResponse, ttl: number = this.defaultResponseTTL): void {
    const cacheKey = `response:${queryHash}`
    this.cache.set(cacheKey, response, ttl)
  }

  /**
   * Retrieve cached AI response
   *
   * @param queryHash - Hash of the query
   * @returns AIResponse if found, undefined otherwise
   */
  public getResponse(queryHash: string): AIResponse | undefined {
    const cacheKey = `response:${queryHash}`
    return this.cache.get<AIResponse>(cacheKey)
  }

  /**
   * Invalidate cache when resources change
   *
   * This is crucial for maintaining data freshness when Kubernetes
   * resources are created, updated, or deleted.
   *
   * @param namespace - Namespace to invalidate
   * @param resourceName - Optional specific resource name to invalidate
   */
  public invalidateResourceCache(namespace: string, resourceName?: string): void {
    const keys = this.cache.keys()
    let invalidatedCount = 0

    keys.forEach(key => {
      // Only invalidate context keys (not response cache)
      if (key.startsWith('context:') && key.includes(namespace)) {
        if (!resourceName || key.includes(resourceName)) {
          this.cache.del(key)
          invalidatedCount++
        }
      }
    })

    if (invalidatedCount > 0) {
      console.debug(`[CacheManager] Invalidated ${invalidatedCount} cache entries for namespace: ${namespace}`)
    }
  }

  /**
   * Invalidate all response caches (e.g., when cluster state changes significantly)
   */
  public invalidateAllResponses(): void {
    const keys = this.cache.keys()
    let invalidatedCount = 0

    keys.forEach(key => {
      if (key.startsWith('response:')) {
        this.cache.del(key)
        invalidatedCount++
      }
    })

    console.debug(`[CacheManager] Invalidated ${invalidatedCount} response cache entries`)
  }

  /**
   * Invalidate all context caches
   */
  public invalidateAllContexts(): void {
    const keys = this.cache.keys()
    let invalidatedCount = 0

    keys.forEach(key => {
      if (key.startsWith('context:')) {
        this.cache.del(key)
        invalidatedCount++
      }
    })

    console.debug(`[CacheManager] Invalidated ${invalidatedCount} context cache entries`)
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    const keysBeforeClear = this.cache.keys().length
    this.cache.flushAll()
    console.debug(`[CacheManager] Cleared ${keysBeforeClear} cache entries`)
  }

  /**
   * Get cache statistics for monitoring and optimization
   *
   * @returns Cache statistics including hits, misses, and hit rate
   */
  public getStats(): CacheStats {
    const stats = this.cache.getStats()
    const totalRequests = stats.hits + stats.misses
    const hitRate = totalRequests > 0 ? (stats.hits / totalRequests) * 100 : 0

    return {
      keys: this.cache.keys().length,
      hits: stats.hits,
      misses: stats.misses,
      ksize: stats.ksize,
      vsize: stats.vsize,
      hitRate: Math.round(hitRate * 100) / 100 // Round to 2 decimal places
    }
  }

  /**
   * Get all cache keys (for debugging)
   *
   * @param prefix - Optional prefix to filter keys
   * @returns Array of cache keys
   */
  public getKeys(prefix?: string): string[] {
    const keys = this.cache.keys()
    if (prefix) {
      return keys.filter(key => key.startsWith(prefix))
    }
    return keys
  }

  /**
   * Check if a key exists in cache
   *
   * @param key - Cache key to check
   * @returns true if key exists, false otherwise
   */
  public has(key: string): boolean {
    return this.cache.has(key)
  }

  /**
   * Get TTL (time-to-live) for a specific key
   *
   * @param key - Cache key
   * @returns TTL in seconds, or undefined if key doesn't exist
   */
  public getTTL(key: string): number | undefined {
    return this.cache.getTtl(key)
  }

  /**
   * Update TTL for a specific key
   *
   * @param key - Cache key
   * @param ttl - New TTL in seconds
   * @returns true if successful, false if key doesn't exist
   */
  public updateTTL(key: string, ttl: number): boolean {
    return this.cache.ttl(key, ttl)
  }

  /**
   * Get cache memory usage estimation (in bytes)
   *
   * @returns Estimated memory usage
   */
  public getMemoryUsage(): number {
    const stats = this.cache.getStats()
    // vsize is the approximate size of all values in bytes
    return stats.vsize
  }

  /**
   * Set up event listeners for cache monitoring
   */
  private setupEventListeners(): void {
    // Listen for expired keys
    this.cache.on('expired', (_key, _value) => {
      console.debug(`[CacheManager] Cache key expired: ${_key}`)
    })

    // Listen for cache flush events
    this.cache.on('flush', () => {
      console.debug('[CacheManager] Cache flushed')
    })

    // Listen for cache deletion events
    this.cache.on('del', (_key, _value) => {
      console.debug(`[CacheManager] Cache key deleted: ${_key}`)
    })
  }

  /**
   * Close and cleanup cache
   */
  public close(): void {
    this.cache.close()
    console.debug('[CacheManager] Cache closed')
  }
}

/**
 * Generate hash for query deduplication
 *
 * This function creates a deterministic hash from a query prompt
 * and optional context to enable response caching for identical queries.
 *
 * @param prompt - The query prompt
 * @param context - Optional cluster context
 * @returns SHA-256 hash of the query
 */
export function hashQuery(prompt: string, context?: ClusterSnapshot): string {
  // Normalize prompt (trim, lowercase for better cache hits)
  const normalizedPrompt = prompt.trim().toLowerCase()

  // Create a deterministic string representation of context
  let contextString = ''
  if (context) {
    // Only include relevant fields that affect the query result
    contextString = JSON.stringify({
      cluster: context.cluster.name,
      namespace: context.namespace.name,
      resource: context.currentResource
        ? {
            kind: context.currentResource.kind,
            name: context.currentResource.name,
            namespace: context.currentResource.namespace
          }
        : null,
      // Include resource counts for context-aware responses
      resourceCounts: context.namespace.resourceCounts,
      // Include priority as it affects response detail level
      priority: context.priority
    })
  }

  const data = normalizedPrompt + contextString
  return createHash('sha256').update(data).digest('hex')
}

/**
 * Generate context cache key from namespace and optional resource
 *
 * @param namespace - Kubernetes namespace
 * @param resourceKind - Optional resource kind (e.g., 'pod', 'deployment')
 * @param resourceName - Optional resource name
 * @returns Cache key string
 */
export function generateContextKey(namespace: string, resourceKind?: string, resourceName?: string): string {
  if (resourceKind && resourceName) {
    return `${namespace}:${resourceKind}:${resourceName}`
  } else if (resourceKind) {
    return `${namespace}:${resourceKind}`
  }
  return namespace
}

/**
 * Singleton cache manager instance
 */
let cacheManagerInstance: CacheManager | null = null

/**
 * Get or create the singleton cache manager instance
 *
 * @param options - Cache configuration options
 * @returns CacheManager instance
 */
export function getCacheManager(options?: CacheOptions): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager(options)
  }
  return cacheManagerInstance
}

/**
 * Reset the singleton cache manager instance (mainly for testing)
 */
export function resetCacheManager(): void {
  if (cacheManagerInstance) {
    cacheManagerInstance.close()
    cacheManagerInstance = null
  }
}
