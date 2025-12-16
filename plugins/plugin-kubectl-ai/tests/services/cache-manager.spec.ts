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

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import {
  CacheManager,
  hashQuery,
  generateContextKey,
  getCacheManager,
  resetCacheManager
} from '../../src/cache/cache-manager'
import { mockClusterSnapshot, mockClusterSnapshotWithResource } from '../fixtures/cluster-context.fixtures'
import { mockAIResponse } from '../fixtures/ai-responses.fixtures'

describe('CacheManager', () => {
  let cacheManager: CacheManager

  beforeEach(() => {
    cacheManager = new CacheManager()
  })

  afterEach(() => {
    cacheManager.close()
  })

  describe('context caching', () => {
    it('should cache and retrieve cluster context', () => {
      const key = 'default'
      cacheManager.cacheContext(key, mockClusterSnapshot)

      const retrieved = cacheManager.getContext(key)
      expect(retrieved).toBeDefined()
      expect(retrieved?.cluster.name).toBe('test-cluster')
      expect(retrieved?.namespace.name).toBe('default')
    })

    it('should return undefined for non-existent context', () => {
      const retrieved = cacheManager.getContext('non-existent')
      expect(retrieved).toBeUndefined()
    })

    it('should respect TTL for context caching', async () => {
      const key = 'default'
      const ttl = 1 // 1 second

      cacheManager.cacheContext(key, mockClusterSnapshot, ttl)

      // Should be available immediately
      expect(cacheManager.getContext(key)).toBeDefined()

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Should be expired
      expect(cacheManager.getContext(key)).toBeUndefined()
    })
  })

  describe('response caching', () => {
    it('should cache and retrieve AI responses', () => {
      const queryHash = hashQuery('why is my pod crashing?')
      cacheManager.cacheResponse(queryHash, mockAIResponse)

      const retrieved = cacheManager.getResponse(queryHash)
      expect(retrieved).toBeDefined()
      expect(retrieved?.content).toBe(mockAIResponse.content)
      expect(retrieved?.model).toBe(mockAIResponse.model)
    })

    it('should return undefined for non-existent response', () => {
      const queryHash = 'non-existent-hash'
      const retrieved = cacheManager.getResponse(queryHash)
      expect(retrieved).toBeUndefined()
    })

    it('should respect TTL for response caching', async () => {
      const queryHash = hashQuery('test query')
      const ttl = 1 // 1 second

      cacheManager.cacheResponse(queryHash, mockAIResponse, ttl)

      // Should be available immediately
      expect(cacheManager.getResponse(queryHash)).toBeDefined()

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Should be expired
      expect(cacheManager.getResponse(queryHash)).toBeUndefined()
    })
  })

  describe('cache invalidation', () => {
    beforeEach(() => {
      // Set up some cached data
      cacheManager.cacheContext('default:pod:nginx', mockClusterSnapshot)
      cacheManager.cacheContext('production:pod:app', mockClusterSnapshot)
      cacheManager.cacheResponse(hashQuery('test1'), mockAIResponse)
      cacheManager.cacheResponse(hashQuery('test2'), mockAIResponse)
    })

    it('should invalidate resource cache by namespace', () => {
      cacheManager.invalidateResourceCache('default')

      expect(cacheManager.getContext('default:pod:nginx')).toBeUndefined()
      expect(cacheManager.getContext('production:pod:app')).toBeDefined()
    })

    it('should invalidate resource cache by namespace and resource', () => {
      cacheManager.invalidateResourceCache('default', 'nginx')

      expect(cacheManager.getContext('default:pod:nginx')).toBeUndefined()
      expect(cacheManager.getContext('production:pod:app')).toBeDefined()
    })

    it('should invalidate all response caches', () => {
      cacheManager.invalidateAllResponses()

      expect(cacheManager.getResponse(hashQuery('test1'))).toBeUndefined()
      expect(cacheManager.getResponse(hashQuery('test2'))).toBeUndefined()

      // Context caches should remain
      expect(cacheManager.getContext('default:pod:nginx')).toBeDefined()
    })

    it('should invalidate all context caches', () => {
      cacheManager.invalidateAllContexts()

      expect(cacheManager.getContext('default:pod:nginx')).toBeUndefined()
      expect(cacheManager.getContext('production:pod:app')).toBeUndefined()

      // Response caches should remain
      expect(cacheManager.getResponse(hashQuery('test1'))).toBeDefined()
    })

    it('should clear all caches', () => {
      cacheManager.clear()

      expect(cacheManager.getContext('default:pod:nginx')).toBeUndefined()
      expect(cacheManager.getResponse(hashQuery('test1'))).toBeUndefined()
    })
  })

  describe('cache statistics', () => {
    it('should track cache statistics', () => {
      const stats = cacheManager.getStats()

      expect(stats).toHaveProperty('keys')
      expect(stats).toHaveProperty('hits')
      expect(stats).toHaveProperty('misses')
      expect(stats).toHaveProperty('hitRate')
    })

    it('should calculate hit rate correctly', () => {
      const key = 'test-key'
      cacheManager.cacheContext(key, mockClusterSnapshot)

      // Hit
      cacheManager.getContext(key)
      // Miss
      cacheManager.getContext('non-existent')

      const stats = cacheManager.getStats()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(1)
      expect(stats.hitRate).toBe(50)
    })
  })

  describe('cache utilities', () => {
    it('should check if key exists', () => {
      const key = 'test-key'
      expect(cacheManager.has(`context:${key}`)).toBe(false)

      cacheManager.cacheContext(key, mockClusterSnapshot)
      expect(cacheManager.has(`context:${key}`)).toBe(true)
    })

    it('should get all cache keys', () => {
      cacheManager.cacheContext('key1', mockClusterSnapshot)
      cacheManager.cacheContext('key2', mockClusterSnapshot)
      cacheManager.cacheResponse('hash1', mockAIResponse)

      const allKeys = cacheManager.getKeys()
      expect(allKeys).toHaveLength(3)
      expect(allKeys).toContain('context:key1')
      expect(allKeys).toContain('context:key2')
      expect(allKeys).toContain('response:hash1')
    })

    it('should get keys by prefix', () => {
      cacheManager.cacheContext('key1', mockClusterSnapshot)
      cacheManager.cacheResponse('hash1', mockAIResponse)

      const contextKeys = cacheManager.getKeys('context:')
      expect(contextKeys).toHaveLength(1)
      expect(contextKeys[0]).toBe('context:key1')

      const responseKeys = cacheManager.getKeys('response:')
      expect(responseKeys).toHaveLength(1)
      expect(responseKeys[0]).toBe('response:hash1')
    })

    it('should get memory usage', () => {
      cacheManager.cacheContext('key1', mockClusterSnapshot)
      cacheManager.cacheResponse('hash1', mockAIResponse)

      const memoryUsage = cacheManager.getMemoryUsage()
      expect(typeof memoryUsage).toBe('number')
      expect(memoryUsage).toBeGreaterThanOrEqual(0)
    })
  })
})

describe('hashQuery', () => {
  it('should generate consistent hashes for same input', () => {
    const prompt = 'Why is my pod crashing?'
    const hash1 = hashQuery(prompt)
    const hash2 = hashQuery(prompt)

    expect(hash1).toBe(hash2)
  })

  it('should generate different hashes for different inputs', () => {
    const hash1 = hashQuery('Question 1')
    const hash2 = hashQuery('Question 2')

    expect(hash1).not.toBe(hash2)
  })

  it('should normalize prompts (case insensitive)', () => {
    const hash1 = hashQuery('Why is my pod crashing?')
    const hash2 = hashQuery('why is my pod crashing?')

    expect(hash1).toBe(hash2)
  })

  it('should normalize prompts (trim whitespace)', () => {
    const hash1 = hashQuery('  Why is my pod crashing?  ')
    const hash2 = hashQuery('Why is my pod crashing?')

    expect(hash1).toBe(hash2)
  })

  it('should include context in hash', () => {
    const prompt = 'Why is my pod crashing?'
    const hash1 = hashQuery(prompt)
    const hash2 = hashQuery(prompt, mockClusterSnapshot)

    expect(hash1).not.toBe(hash2)
  })

  it('should generate same hash for same context', () => {
    const prompt = 'Why is my pod crashing?'
    const hash1 = hashQuery(prompt, mockClusterSnapshot)
    const hash2 = hashQuery(prompt, mockClusterSnapshot)

    expect(hash1).toBe(hash2)
  })

  it('should generate different hashes for different contexts', () => {
    const prompt = 'Why is my pod crashing?'
    const hash1 = hashQuery(prompt, mockClusterSnapshot)
    const hash2 = hashQuery(prompt, mockClusterSnapshotWithResource)

    expect(hash1).not.toBe(hash2)
  })
})

describe('generateContextKey', () => {
  it('should generate key from namespace only', () => {
    const key = generateContextKey('default')
    expect(key).toBe('default')
  })

  it('should generate key from namespace and kind', () => {
    const key = generateContextKey('default', 'pod')
    expect(key).toBe('default:pod')
  })

  it('should generate key from namespace, kind, and name', () => {
    const key = generateContextKey('default', 'pod', 'nginx-123')
    expect(key).toBe('default:pod:nginx-123')
  })
})

describe('getCacheManager singleton', () => {
  afterEach(() => {
    resetCacheManager()
  })

  it('should return singleton instance', () => {
    const instance1 = getCacheManager()
    const instance2 = getCacheManager()

    expect(instance1).toBe(instance2)
  })

  it('should reset singleton instance', () => {
    const instance1 = getCacheManager()
    resetCacheManager()
    const instance2 = getCacheManager()

    expect(instance1).not.toBe(instance2)
  })

  it('should accept custom options on first call', () => {
    const instance = getCacheManager({ stdTTL: 600, maxKeys: 100 })
    expect(instance).toBeDefined()
  })
})
