# Cache Management System

This module provides a comprehensive caching system for the AI Assistant plugin, optimizing performance and reducing API costs.

## Features

- **Context Caching**: Cache Kubernetes cluster state snapshots
- **Response Caching**: Cache AI responses for identical queries
- **Smart Invalidation**: Automatically invalidate cache when resources change
- **Query Deduplication**: Hash-based deduplication to avoid redundant AI calls
- **Performance Monitoring**: Detailed statistics for cache hit rates and memory usage
- **TTL Strategies**: Resource-type specific time-to-live configurations

## Usage

### Basic Usage

```typescript
import { CacheManager, hashQuery, generateContextKey } from './cache'
import type { ClusterSnapshot, AIResponse } from '../types/ai-types'

// Create cache manager
const cache = new CacheManager({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every minute
  useClones: false, // Better performance
  maxKeys: 1000 // Optional limit
})

// Cache cluster context
const context: ClusterSnapshot = {
  cluster: { name: 'prod', version: '1.28', provider: 'eks', nodeCount: 10 },
  namespace: {
    name: 'default',
    resourceCounts: { pods: 50, services: 20, deployments: 15, configmaps: 5, secrets: 3 }
  },
  tokenEstimate: 200,
  priority: 'high'
}

const contextKey = generateContextKey('default', 'pod', 'my-app')
cache.cacheContext(contextKey, context, 300) // Cache for 5 minutes

// Retrieve cached context
const cachedContext = cache.getContext(contextKey)

// Cache AI response
const response: AIResponse = {
  content: 'Your pod is crashing due to OOMKilled...',
  model: 'claude-3-5-sonnet',
  usage: { inputTokens: 500, outputTokens: 200 },
  latency: 1500
}

const queryHash = hashQuery('why is my pod crashing?', context)
cache.cacheResponse(queryHash, response, 3600) // Cache for 1 hour

// Retrieve cached response
const cachedResponse = cache.getResponse(queryHash)
if (cachedResponse) {
  console.log('Cache hit! Saved API call')
}
```

### Singleton Pattern

```typescript
import { getCacheManager, resetCacheManager } from './cache'

// Get global instance
const cache = getCacheManager()

// Use throughout your application
cache.cacheContext('my-key', context)

// Reset for testing
resetCacheManager()
```

### Cache Invalidation

```typescript
// Invalidate specific namespace
cache.invalidateResourceCache('default')

// Invalidate specific resource
cache.invalidateResourceCache('default', 'my-pod')

// Invalidate all responses
cache.invalidateAllResponses()

// Invalidate all contexts
cache.invalidateAllContexts()

// Clear everything
cache.clear()
```

### Cache Statistics

```typescript
const stats = cache.getStats()
console.log(`Cache Hit Rate: ${stats.hitRate}%`)
console.log(`Total Keys: ${stats.keys}`)
console.log(`Hits: ${stats.hits}, Misses: ${stats.misses}`)
console.log(`Memory Usage: ${cache.getMemoryUsage()} bytes`)
```

## Cache Strategies

The module includes intelligent TTL strategies based on resource types:

### Resource Type TTLs

- **Pods**: 60 seconds (highly volatile)
- **Pod Logs**: 30 seconds (constantly updating)
- **Events**: 60 seconds (frequent changes)
- **Deployments**: 300 seconds (moderately stable)
- **Services**: 300 seconds (moderately stable)
- **ConfigMaps**: 600 seconds (relatively stable)
- **Secrets**: 600 seconds (relatively stable)
- **Namespaces**: 600 seconds (very stable)
- **Nodes**: 600 seconds (infrastructure-level)
- **Cluster Info**: 3600 seconds (rarely changes)

### Response Type TTLs

- **Troubleshooting Queries**: 300 seconds (issues may be resolved quickly)
- **Manifest Generation**: 7200 seconds (best practices don't change often)
- **General Knowledge**: 7200 seconds (static information)
- **General AI Responses**: 3600 seconds (default)

## Query Hashing

The `hashQuery` function creates deterministic hashes for query deduplication:

```typescript
import { hashQuery } from './cache'

// Basic query
const hash1 = hashQuery('why is my pod failing?')

// Query with context (includes cluster state)
const hash2 = hashQuery('why is my pod failing?', clusterContext)

// Case-insensitive (same hash)
hashQuery('Why Is My Pod Failing?') === hashQuery('why is my pod failing?') // true
```

The hash includes:

- Normalized prompt (trimmed, lowercase)
- Cluster name
- Namespace name
- Current resource (if any)
- Resource counts
- Priority level

## Context Key Generation

Generate hierarchical cache keys for different granularity levels:

```typescript
import { generateContextKey } from './cache'

// Namespace-level
generateContextKey('default')
// => 'default'

// Resource kind level
generateContextKey('default', 'pod')
// => 'default:pod'

// Specific resource
generateContextKey('default', 'pod', 'my-app-xyz')
// => 'default:pod:my-app-xyz'
```

## Performance Optimization

### Cache Hit Rate Optimization

1. **Use normalized queries**: The hash function normalizes prompts for better hits
2. **Choose appropriate TTLs**: Balance freshness vs hit rate
3. **Invalidate strategically**: Only invalidate when necessary
4. **Monitor statistics**: Use `getStats()` to track performance

### Memory Management

```typescript
// Check memory usage
const memoryBytes = cache.getMemoryUsage()
console.log(`Cache using ${memoryBytes / 1024 / 1024} MB`)

// Set max keys to limit memory
const cache = new CacheManager({ maxKeys: 500 })

// Calculate optimal size based on available memory
import { calculateOptimalCacheSize } from './cache-strategies'
const availableMemoryMB = 512
const maxKeys = calculateOptimalCacheSize(availableMemoryMB)
```

### Event Listeners

The cache manager emits events for monitoring:

```typescript
// Events are automatically logged in debug mode
// - 'expired': When a key expires
// - 'del': When a key is deleted
// - 'flush': When cache is cleared
```

## Advanced Features

### TTL Management

```typescript
// Check TTL for a key
const ttl = cache.getTTL('context:default')
console.log(`Expires in ${ttl} seconds`)

// Update TTL dynamically
cache.updateTTL('context:default', 600) // Extend to 10 minutes

// Check if key exists
if (cache.has('context:default')) {
  console.log('Key exists')
}
```

### Key Management

```typescript
// Get all keys
const allKeys = cache.getKeys()

// Get keys by prefix
const contextKeys = cache.getKeys('context:')
const responseKeys = cache.getKeys('response:')
```

## Integration with AI Provider

Example of using cache with AI provider:

```typescript
import { getCacheManager, hashQuery } from './cache'
import { aiProvider } from '../services/ai-provider'

async function queryAI(prompt: string, context?: ClusterSnapshot): Promise<AIResponse> {
  const cache = getCacheManager()

  // Check cache first
  const queryHash = hashQuery(prompt, context)
  const cached = cache.getResponse(queryHash)

  if (cached) {
    console.log('Cache hit! Returning cached response')
    return { ...cached, cached: true }
  }

  // Cache miss - call AI provider
  console.log('Cache miss - calling AI provider')
  const response = await aiProvider.complete({ prompt, context })

  // Cache the response
  const ttl = getResponseTTL(prompt, context) // From cache-strategies
  cache.cacheResponse(queryHash, response, ttl)

  return response
}
```

## Testing

The cache module includes comprehensive tests:

```bash
npm test tests/cache/cache-manager.spec.ts
```

Test coverage includes:

- Context caching and retrieval
- Response caching and retrieval
- TTL expiration
- Cache invalidation (namespace and resource-specific)
- Statistics tracking
- Query hashing
- Context key generation
- Singleton pattern

## Best Practices

1. **Always use context in hashes**: Include cluster context for accurate cache hits
2. **Invalidate on resource changes**: Hook into kubectl events to invalidate cache
3. **Monitor hit rates**: Aim for >70% cache hit rate
4. **Choose appropriate TTLs**: Use cache-strategies module for guidance
5. **Test cache behavior**: Write tests for cache-dependent code
6. **Handle cache misses gracefully**: Always have fallback logic
7. **Clean up**: Call `cache.close()` when shutting down

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Cache Manager                       │
│                                                      │
│  ┌────────────────┐        ┌────────────────┐      │
│  │ Context Cache  │        │ Response Cache │      │
│  │                │        │                │      │
│  │ context:ns     │        │ response:hash  │      │
│  │ context:ns:pod │        │ response:...   │      │
│  └────────────────┘        └────────────────┘      │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │         NodeCache (in-memory)               │    │
│  │  - TTL expiration                           │    │
│  │  - Event listeners                          │    │
│  │  - Statistics tracking                      │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

## Future Enhancements

- **Redis Integration**: Distributed caching for multi-instance deployments
- **Persistent Cache**: Save cache to disk for faster startup
- **LRU Eviction**: Implement least-recently-used eviction policy
- **Cache Warming**: Pre-populate cache with common queries
- **Compression**: Compress large responses to save memory
- **Tiered Caching**: L1 (memory) + L2 (Redis) architecture
