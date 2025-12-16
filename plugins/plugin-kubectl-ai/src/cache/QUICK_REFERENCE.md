# Cache Manager Quick Reference

## Installation

```bash
npm install node-cache
```

## Basic Usage

```typescript
import { getCacheManager, hashQuery, generateContextKey } from '@kui-shell/plugin-kubectl-ai/cache'

// Get singleton instance
const cache = getCacheManager()
```

## API Methods

### Context Caching

```typescript
// Cache cluster context
cache.cacheContext(key: string, context: ClusterSnapshot, ttl?: number): void

// Retrieve context
cache.getContext(key: string): ClusterSnapshot | undefined

// Generate hierarchical key
const key = generateContextKey('default', 'pod', 'my-app')
// => 'default:pod:my-app'
```

### Response Caching

```typescript
// Cache AI response
cache.cacheResponse(queryHash: string, response: AIResponse, ttl?: number): void

// Retrieve response
cache.getResponse(queryHash: string): AIResponse | undefined

// Generate query hash
const hash = hashQuery(prompt, context)
// => 'a1b2c3d4...' (SHA-256 hex)
```

### Cache Invalidation

```typescript
// Invalidate namespace
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

### Statistics & Monitoring

```typescript
// Get statistics
const stats = cache.getStats()
// => { keys: 150, hits: 450, misses: 50, hitRate: 90.0, ksize: ..., vsize: ... }

// Check if key exists
cache.has('context:default'): boolean

// Get all keys
cache.getKeys(): string[]

// Get keys by prefix
cache.getKeys('context:'): string[]

// Get memory usage
cache.getMemoryUsage(): number // bytes

// Get/Update TTL
cache.getTTL('context:default'): number | undefined
cache.updateTTL('context:default', 600): boolean
```

## TTL Helper Functions

```typescript
import { getTTLForResourceType, getResponseTTL, shouldCacheResponse } from '@kui-shell/plugin-kubectl-ai/cache'

// Get TTL for resource type
const ttl = getTTLForResourceType('pod') // => 60 seconds
const ttl = getTTLForResourceType('configmap') // => 600 seconds

// Get TTL for query type
const ttl = getResponseTTL('why is my pod failing?', context) // => 300 (troubleshooting)
const ttl = getResponseTTL('create nginx deployment', context) // => 7200 (manifest)

// Check if should cache
if (shouldCacheResponse(prompt, context, response)) {
  cache.cacheResponse(hash, response, ttl)
}
```

## Common Patterns

### Pattern 1: Query with Cache

```typescript
async function queryAI(prompt: string, context?: ClusterSnapshot): Promise<AIResponse> {
  const cache = getCacheManager()
  const hash = hashQuery(prompt, context)

  // Try cache first
  const cached = cache.getResponse(hash)
  if (cached) return { ...cached, cached: true }

  // Call AI
  const response = await aiProvider.complete({ prompt, context })

  // Cache response
  if (shouldCacheResponse(prompt, context, response)) {
    const ttl = getResponseTTL(prompt, context)
    cache.cacheResponse(hash, response, ttl)
  }

  return response
}
```

### Pattern 2: Context Caching

```typescript
async function getClusterContext(namespace: string): Promise<ClusterSnapshot> {
  const cache = getCacheManager()
  const key = generateContextKey(namespace)

  // Try cache
  let context = cache.getContext(key)
  if (context) return context

  // Collect context
  context = await collectClusterContext(namespace)

  // Cache with appropriate TTL
  const ttl = getTTLForResourceType('namespace')
  cache.cacheContext(key, context, ttl)

  return context
}
```

### Pattern 3: Resource Change Handler

```typescript
function onResourceChange(event: KubeEvent) {
  const cache = getCacheManager()

  // Invalidate affected cache
  cache.invalidateResourceCache(event.namespace, event.resourceName)

  // For major changes, invalidate responses too
  if (event.kind === 'Namespace' && event.action === 'delete') {
    cache.invalidateAllResponses()
  }
}
```

### Pattern 4: Monitoring Dashboard

```typescript
function getCacheMetrics() {
  const cache = getCacheManager()
  const stats = cache.getStats()

  return {
    hitRate: `${stats.hitRate}%`,
    totalKeys: stats.keys,
    totalHits: stats.hits,
    totalMisses: stats.misses,
    memoryUsage: `${(cache.getMemoryUsage() / 1024 / 1024).toFixed(2)} MB`,
    contextKeys: cache.getKeys('context:').length,
    responseKeys: cache.getKeys('response:').length
  }
}
```

## Default TTLs

| Resource Type    | TTL   | Reason               |
| ---------------- | ----- | -------------------- |
| Pod Logs         | 30s   | Constantly updating  |
| Pods             | 60s   | Highly volatile      |
| Events           | 60s   | Frequent changes     |
| Deployments      | 300s  | Moderately stable    |
| Services         | 300s  | Moderately stable    |
| ReplicaSets      | 180s  | Moderately volatile  |
| ConfigMaps       | 600s  | Relatively stable    |
| Secrets          | 600s  | Relatively stable    |
| Namespaces       | 600s  | Very stable          |
| Nodes            | 600s  | Infrastructure level |
| PersistentVolume | 900s  | Very stable          |
| StorageClass     | 1800s | Rarely changes       |
| Cluster Info     | 3600s | Rarely changes       |

## Response Type TTLs

| Query Type        | TTL   | Example                   |
| ----------------- | ----- | ------------------------- |
| Troubleshooting   | 300s  | "why is my pod failing?"  |
| Manifest Gen      | 7200s | "create nginx deployment" |
| General Knowledge | 7200s | "what is a deployment?"   |
| Default           | 3600s | Other queries             |

## Configuration Options

```typescript
const cache = new CacheManager({
  stdTTL: 300, // Default TTL in seconds
  checkperiod: 60, // Check for expired keys every N seconds
  useClones: false, // Don't clone objects (better performance)
  maxKeys: 1000 // Maximum number of keys (optional)
})
```

## Event Listeners

The cache automatically logs these events in debug mode:

- `expired`: When a key expires
- `del`: When a key is deleted
- `flush`: When cache is cleared

## Testing

```typescript
import { resetCacheManager } from '@kui-shell/plugin-kubectl-ai/cache'

// In tests, reset singleton between tests
afterEach(() => {
  resetCacheManager()
})
```

## Best Practices

1. ✅ Always include context in query hashes for accuracy
2. ✅ Invalidate cache on kubectl resource changes
3. ✅ Monitor hit rates (aim for >70%)
4. ✅ Use appropriate TTLs for different resource types
5. ✅ Handle cache misses gracefully
6. ✅ Call `cache.close()` on shutdown
7. ✅ Test cache behavior in unit tests
8. ❌ Don't cache error responses
9. ❌ Don't cache time-sensitive queries
10. ❌ Don't cache queries about resources with active warnings

## Troubleshooting

### Low Hit Rate (<50%)

- Check if queries are properly normalized
- Verify context is included in hashes
- Increase TTLs if data is stable
- Check if invalidation is too aggressive

### High Memory Usage

- Reduce `stdTTL` to expire keys faster
- Set `maxKeys` to limit cache size
- Reduce `checkperiod` to cleanup more frequently
- Use `cache.clear()` periodically

### Stale Data

- Ensure cache invalidation on resource changes
- Reduce TTLs for volatile resources
- Hook into kubectl watch events
- Clear cache on cluster connection change

## Quick Examples

```typescript
// Example 1: Simple caching
const cache = getCacheManager()
cache.cacheContext('default', myContext, 300)
const ctx = cache.getContext('default')

// Example 2: Query with auto-TTL
const hash = hashQuery(prompt, context)
const ttl = getResponseTTL(prompt, context)
cache.cacheResponse(hash, response, ttl)

// Example 3: Invalidate on change
kubectl.watch('pods', event => {
  cache.invalidateResourceCache(event.namespace, event.name)
})

// Example 4: Monitor performance
setInterval(() => {
  const stats = cache.getStats()
  console.log(`Cache hit rate: ${stats.hitRate}%`)
}, 60000)
```

## Links

- [Full Documentation](./README.md)
- [Implementation Details](./cache-manager.ts)
- [Cache Strategies](./cache-strategies.ts)
- [Usage Examples](./example.ts)
- [Tests](../../tests/cache/cache-manager.spec.ts)
