# Context Menu Integration - Backend Implementation

## Overview

This document describes the backend implementation for Feature #3: Context Menu Integration in the kubectl-ai plugin. The implementation provides ultra-fast AI-powered insights and actions for Kubernetes resources through context menus.

## Architecture

### Components

1. **ContextMenuService** (`src/services/context-menu-service.ts`)
   - Main service for generating quick insights and contextual actions
   - Optimized for < 1s response time
   - Aggressive caching with 5-minute TTL

2. **ResourceContextExtractor** (`src/utils/resource-context-extractor.ts`)
   - Extracts minimal resource context for quick operations
   - Parallel kubectl execution for speed
   - Target extraction time: < 500ms

3. **System Prompts** (`src/prompts/system-prompts.ts`)
   - `CONTEXT_MENU_INSIGHT_PROMPT`: Ultra-concise insights (< 50 words)
   - `CONTEXT_MENU_ACTION_PROMPT`: Context-specific kubectl commands

4. **Commands** (`src/commands/ai-context-menu.ts`)
   - CLI commands for insight generation, action generation, and cache management

### Performance Characteristics

| Operation | Target Time | Cache TTL | Token Usage |
|-----------|-------------|-----------|-------------|
| Quick Insight | < 1s | 5 minutes | < 100 tokens |
| Action Generation | < 2s | 10 minutes | < 500 tokens |
| Context Extraction | < 500ms | N/A | N/A |

## API Reference

### ContextMenuService

#### `generateQuickInsight(resource: ResourceContext): Promise<QuickInsight>`

Generates a brief, actionable insight for tooltip display.

**Parameters:**
- `resource`: Minimal resource context with status, events, and metrics

**Returns:**
```typescript
{
  insight: string          // Brief text (< 50 words)
  severity: 'error' | 'warning' | 'info' | 'success'
  latency: number          // Response time in ms
  cached: boolean          // Whether served from cache
}
```

**Example:**
```typescript
const service = getContextMenuService(config)
const insight = await service.generateQuickInsight({
  kind: 'Pod',
  name: 'nginx-7d8b49557c-abc123',
  namespace: 'default',
  status: { phase: 'CrashLoopBackOff' },
  events: [...]
})

console.log(insight.insight)
// Output: "✗ CrashLoopBackOff: Check logs for startup errors"
```

#### `generateActions(resource: ResourceContext): Promise<ContextMenuActions>`

Generates contextual kubectl commands based on resource state.

**Parameters:**
- `resource`: Resource context with status, events, and related resources

**Returns:**
```typescript
{
  actions: [
    {
      label: string           // Display label
      command: string         // kubectl command
      description: string     // Brief description
      disruptive?: boolean    // Safety flag
    }
  ],
  latency: number,
  cached: boolean
}
```

**Example:**
```typescript
const actions = await service.generateActions(context)

actions.actions.forEach(action => {
  console.log(`${action.label}: ${action.command}`)
})
// Output:
// View recent logs: kubectl logs nginx-7d8b49557c-abc123 -n default --tail=50
// Describe resource: kubectl describe pod nginx-7d8b49557c-abc123 -n default
```

### ResourceContextExtractor

#### `extractContext(kind, name, namespace, includeMetrics): Promise<ResourceContext>`

Extracts minimal resource context optimized for quick insights.

**Parameters:**
- `kind`: Resource kind (Pod, Deployment, Service, etc.)
- `name`: Resource name
- `namespace`: Kubernetes namespace
- `includeMetrics`: Whether to fetch metrics (adds ~200ms)

**Returns:**
```typescript
{
  kind: string
  name: string
  namespace: string
  status?: object              // Essential status fields only
  events?: KubernetesEvent[]   // Last 5 events, warnings first
  metrics?: ResourceMetrics    // CPU/memory if requested
  relatedResources?: RelatedResource[]
  containerName?: string       // For pods
  labels?: Record<string, string>
  annotations?: Record<string, string>
}
```

## CLI Commands

### Generate Quick Insight

```bash
kubectl ai insight <kind> <name> -n <namespace>
```

**Example:**
```bash
kubectl ai insight pod nginx-7d8b49557c-abc123 -n production
# Output: ✗ CrashLoopBackOff: Check logs for startup errors
```

### Generate Context Actions

```bash
kubectl ai actions <kind> <name> -n <namespace>
```

**Example:**
```bash
kubectl ai actions deployment nginx -n production
# Output:
# LABEL                    COMMAND                                          DESCRIPTION
# Check rollout status     kubectl rollout status deployment/nginx -n ...   View deployment rollout progress
# View pod logs            kubectl logs -l app=nginx -n production          Check application logs
# Describe deployment      kubectl describe deployment nginx -n production  View detailed resource info
```

### Clear Cache

```bash
kubectl ai cache-clear <kind> <name> -n <namespace>
```

**Example:**
```bash
kubectl ai cache-clear pod nginx-7d8b49557c-abc123 -n production
# Output: Cache cleared for pod/nginx-7d8b49557c-abc123 in namespace production
```

## Caching Strategy

### Cache Keys

**Insights:**
```
insight:<namespace>:<kind>:<name>:<status-hash>
```

**Actions:**
```
action:<namespace>:<kind>:<name>:<phase>
```

### Cache Invalidation

Caches are automatically invalidated:
1. After TTL expires (5 minutes for insights, 10 minutes for actions)
2. When `invalidateCache()` is called explicitly
3. When resource status hash changes (for insights)

### Performance Benefits

| Scenario | No Cache | With Cache | Improvement |
|----------|----------|------------|-------------|
| First request | ~800ms | ~800ms | Baseline |
| Subsequent requests | ~800ms | ~10ms | 80x faster |
| Tooltip hover | ~800ms | ~10ms | 80x faster |

## System Prompts

### Insight Prompt

The `CONTEXT_MENU_INSIGHT_PROMPT` enforces:
- **< 50 words** maximum response length
- **Single most critical issue** focus
- **No explanations** - direct insights only
- **Priority order**: Errors > Warnings > Performance > Normal

**Example Responses:**

```
✓ Running - CPU: 45%, Mem: 230Mi
⚠ Only 1/3 replicas ready - scale up or check pod health
✗ CrashLoopBackOff: Check logs for startup errors
⚠ PVC pending - check StorageClass provisioner
```

### Action Prompt

The `CONTEXT_MENU_ACTION_PROMPT` generates:
- **3-5 commands** most relevant to current issue
- **Context-specific** based on resource kind and state
- **Read-only first** - investigation before remediation
- **JSON format** for structured parsing

**Example Response:**

```json
[
  {
    "label": "View recent logs",
    "command": "kubectl logs {resource} -n {namespace} --tail=50",
    "description": "Check application logs for errors"
  },
  {
    "label": "Describe resource",
    "command": "kubectl describe {kind} {resource} -n {namespace}",
    "description": "View detailed resource status and events"
  }
]
```

## Integration Points

### With Existing Services

**ClusterDataCollector:**
- ResourceContextExtractor is lighter-weight alternative
- Use ClusterDataCollector for full AI chat context
- Use ResourceContextExtractor for context menu operations

**CacheManager:**
- Shared cache instance with configurable TTLs
- Insight/action caches separate from response caches
- Resource-specific cache invalidation support

**AIProvider:**
- Same provider interface for consistency
- Optimized request parameters for speed
- No streaming for context menu operations

### Frontend Integration

The backend exposes two main operations that frontends should call:

**1. On Hover (Tooltip):**
```typescript
// Fast insight generation
const insight = await service.generateQuickInsight(context)
showTooltip(insight.insight, insight.severity)
```

**2. On Right-Click (Context Menu):**
```typescript
// Action generation
const actions = await service.generateActions(context)
showContextMenu(actions.actions)
```

## Error Handling

### Fallback Behavior

When AI requests fail, the service provides sensible defaults:

**Insight Fallbacks:**
- Check status for common patterns (CrashLoopBackOff, Pending, etc.)
- Return generic status message if no pattern matches
- Never return empty/error to user

**Action Fallbacks:**
- Universal actions (describe, get yaml)
- Kind-specific basics (logs for pods, rollout status for deployments)
- Always return 3-5 actions minimum

### Timeout Handling

All requests have built-in timeouts:
- Insight generation: 2s timeout (fallback after)
- Action generation: 5s timeout (fallback after)
- Context extraction: No timeout (fast kubectl operations)

## Monitoring & Metrics

### Performance Tracking

The service tracks:
- Response latency for each operation
- Cache hit rate
- Fallback usage frequency
- Token consumption

**Access metrics:**
```typescript
const service = getContextMenuService(config)
const stats = service.cache.getStats()

console.log(`Cache hit rate: ${stats.hitRate}%`)
console.log(`Total requests: ${stats.hits + stats.misses}`)
```

### Debug Logging

Enable debug logging:
```typescript
// Set environment variable
DEBUG=kubectl-ai:context-menu

// Or check console.debug output
console.debug('[ContextMenuService] ...')
console.debug('[ResourceContextExtractor] ...')
```

## Testing

### Unit Tests

```typescript
import { ContextMenuService } from '../services/context-menu-service'
import { ResourceContextExtractor } from '../utils/resource-context-extractor'

describe('ContextMenuService', () => {
  it('should generate insight in < 1s', async () => {
    const start = Date.now()
    const insight = await service.generateQuickInsight(context)
    expect(Date.now() - start).toBeLessThan(1000)
  })

  it('should use cache on repeated requests', async () => {
    await service.generateQuickInsight(context)
    const insight = await service.generateQuickInsight(context)
    expect(insight.cached).toBe(true)
  })
})
```

### Integration Tests

```bash
# Test insight generation
kubectl ai insight pod test-pod -n default

# Test action generation
kubectl ai actions deployment test-app -n default

# Test cache behavior
kubectl ai insight pod test-pod -n default  # Slow
kubectl ai insight pod test-pod -n default  # Fast (cached)
kubectl ai cache-clear pod test-pod -n default
kubectl ai insight pod test-pod -n default  # Slow again
```

## Performance Optimization Tips

### For Frontend Developers

1. **Debounce hover events**: Wait 300ms before requesting insights
2. **Cache on frontend**: Store insights for 30s to reduce backend calls
3. **Prefetch on expand**: Generate insights for visible rows proactively
4. **Cancel in-flight**: Cancel requests when user moves away

### For Backend Developers

1. **Minimize context**: Only include data needed for insights
2. **Parallel execution**: Fetch resource JSON and events concurrently
3. **Skip metrics**: Only fetch metrics when explicitly needed
4. **Optimize prompts**: Keep prompts under 100 tokens
5. **Use smaller models**: Consider using faster models for tooltips

## Roadmap

### Future Enhancements

1. **Streaming insights**: Real-time insight updates as resource changes
2. **Predictive caching**: Prefetch insights for likely-to-be-viewed resources
3. **Custom actions**: Allow users to define custom context menu commands
4. **Multi-resource insights**: Insights spanning multiple related resources
5. **Historical analysis**: Trends and patterns from past events

## Troubleshooting

### Common Issues

**Slow response times (> 1s):**
- Check network latency to AI provider
- Verify cache is enabled and working
- Consider switching to faster model (e.g., Claude Haiku)
- Reduce maxTokens in request

**Cache not working:**
- Verify cache manager is initialized
- Check cache stats for hit rate
- Ensure cache keys are deterministic
- Check TTL settings

**Fallback insights always shown:**
- Check AI provider configuration
- Verify API key is valid
- Check for network connectivity issues
- Review error logs for provider failures

## Support

For questions or issues:
1. Check debug logs: `DEBUG=kubectl-ai:context-menu`
2. Review cache stats: `service.cache.getStats()`
3. Test provider: `provider.testConnection()`
4. File issue with reproduction steps

## License

Copyright 2025 The Kubernetes Authors. Licensed under the Apache License 2.0.
