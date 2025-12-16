# Cluster Data Collector

The `ClusterDataCollector` class gathers Kubernetes cluster information for AI context enrichment.

## Usage

```typescript
import { ClusterDataCollector } from './cluster-data-collector'
import type REPL from '@kui-shell/core/mdist/models/repl'

// Inside a command handler that receives Arguments
async function myCommand(args: Arguments) {
  // Create collector with REPL instance
  const collector = new ClusterDataCollector(args.REPL)

  // Capture basic cluster snapshot
  const snapshot = await collector.captureClusterSnapshot({
    namespace: 'default'
  })

  console.log('Cluster:', snapshot.cluster.name)
  console.log('Version:', snapshot.cluster.version)
  console.log('Provider:', snapshot.cluster.provider)
  console.log('Pods:', snapshot.namespace.resourceCounts.pods)

  // Capture snapshot with specific resource context
  const detailedSnapshot = await collector.captureClusterSnapshot({
    namespace: 'production',
    resource: {
      kind: 'pod',
      name: 'api-server-xyz',
      namespace: 'production'
    },
    includeLogs: true,
    includeEvents: true,
    includeManifest: true
  })

  // Access resource details
  if (detailedSnapshot.currentResource) {
    console.log('Resource status:', detailedSnapshot.currentResource.status)
    console.log('Events:', detailedSnapshot.currentResource.events)
    console.log('Logs:', detailedSnapshot.currentResource.logs)
  }

  // Use token estimate for context window management
  console.log('Estimated tokens:', snapshot.tokenEstimate)
  console.log('Priority:', snapshot.priority)
}
```

## Features

### Cluster Information

- Cluster name (from current context)
- Kubernetes version
- Cloud provider detection (EKS, GKE, AKS, Kind, Minikube)
- Node count

### Namespace Information

- Resource counts (pods, services, deployments, configmaps, secrets)

### Resource Context (Optional)

- Resource status
- Kubernetes events (Normal/Warning)
- Pod logs (last 100 lines)
- Full YAML manifest

### Smart Features

- **Parallel execution**: Multiple kubectl commands run concurrently for speed
- **Graceful error handling**: Returns partial data if some queries fail
- **Token estimation**: Rough estimate of tokens for AI context window management
- **Priority detection**: Automatically determines priority based on warnings/errors
- **Provider detection**: Automatically detects cloud provider from context name

## Priority Levels

The collector automatically assigns priority to help AI systems focus on critical issues:

- **High**: Resource has Warning events (potential issues)
- **Medium**: Resource has logs or manifest data
- **Low**: Basic metadata only

## Token Estimation

Uses a simple heuristic (1 token ≈ 4 characters) to estimate how much of the AI context window the snapshot will consume. This helps with:

- Context window management
- Deciding what data to include
- Truncation strategies

## Error Handling

All methods gracefully handle errors:

- Failed kubectl commands return empty/default values
- Warnings logged to console for debugging
- Never throws exceptions (returns partial data)

## Performance

- Parallel execution of independent kubectl commands
- Efficient use of `--no-headers` and JSON output formats
- Minimal data fetching (only what's requested)
- Safe fallbacks for all operations

## Implementation Details

### kubectl Execution

The collector uses Kui's REPL interface to execute kubectl commands:

```typescript
private async execKubectl(command: string): Promise<string> {
  const result = await this.repl.rexec<StdoutResponse>(command)
  return result.content.stdout || ''
}
```

This ensures:

- Respects current kubectl context
- Works with Kui's execution environment
- Proper error handling through REPL
- Consistent with other Kui kubectl operations

### Provider Detection

Detects cloud provider from context name:

```typescript
private detectProvider(context: string): Provider {
  const lowerContext = context.toLowerCase()

  if (lowerContext.includes('eks')) return 'eks'
  if (lowerContext.includes('gke')) return 'gke'
  if (lowerContext.includes('aks')) return 'aks'
  if (lowerContext.includes('kind')) return 'kind'
  if (lowerContext.includes('minikube')) return 'minikube'

  return 'unknown'
}
```

### Version Parsing

Parses Kubernetes version from various output formats:

```typescript
private parseKubeVersion(output: string): string {
  // Matches "Server Version: v1.28.0" or "v1.28.0"
  const match = output.match(/Server Version:\s*v?(\d+\.\d+\.\d+)|v(\d+\.\d+\.\d+)/)
  return match ? (match[1] || match[2]) : 'unknown'
}
```

## Testing

```typescript
// Mock REPL for testing
const mockREPL: REPL = {
  rexec: async (command: string) => ({
    content: {
      stdout: 'mocked output'
    }
  })
}

const collector = new ClusterDataCollector(mockREPL)
const snapshot = await collector.captureClusterSnapshot()
```

## Integration with AI Providers

The snapshot format is designed to work seamlessly with AI providers:

```typescript
import { ClusterDataCollector } from './context/cluster-data-collector'
import { AnthropicProvider } from './services/anthropic-provider'

const collector = new ClusterDataCollector(args.REPL)
const snapshot = await collector.captureClusterSnapshot({
  resource: { kind: 'pod', name: 'api-xyz', namespace: 'default' },
  includeLogs: true,
  includeEvents: true
})

const aiProvider = new AnthropicProvider(config)
const response = await aiProvider.complete({
  prompt: 'Why is this pod failing?',
  clusterData: snapshot
})
```

## Future Enhancements

Possible improvements:

- Cache cluster/namespace info (changes infrequently)
- Support for multi-container pod logs
- Configurable log line limits
- Support for previous pod logs (--previous flag)
- Resource metrics (CPU, memory usage)
- Network policy information
- RBAC context
