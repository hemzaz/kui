# Quick Start Guide - AI Provider System

Get up and running with the Kui AI Provider system in 5 minutes.

## Installation

The AI provider system is part of the `plugin-kubectl-ai` plugin. No separate installation needed.

### Install Dependencies

```bash
# From the kui root directory
npm install

# Install Anthropic SDK (if not already installed)
npm install @anthropic-ai/sdk
```

## Setup

### 1. Get an API Key

Sign up at [Anthropic Console](https://console.anthropic.com/) and create an API key.

### 2. Set Environment Variable

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

Or add to your shell profile:

```bash
# ~/.bashrc or ~/.zshrc
export ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"
```

## Basic Usage

### Simple Question

```typescript
import { createProvider } from './plugins/plugin-kubectl-ai/src/services'

// Create provider
const provider = createProvider('anthropic')

// Ask a question
const response = await provider.complete({
  prompt: 'What is a Kubernetes Pod?'
})

console.log(response.content)
// Output: A Kubernetes Pod is the smallest deployable unit...

console.log(`Cost: $${response.cost?.toFixed(4)}`)
// Output: Cost: $0.0012
```

### Streaming Response

```typescript
import { createProvider } from './plugins/plugin-kubectl-ai/src/services'

const provider = createProvider('anthropic')

console.log('Question: How do I scale a deployment?')
console.log('Answer: ')

for await (const chunk of provider.streamCompletion({
  prompt: 'How do I scale a deployment in Kubernetes?'
})) {
  if (!chunk.done) {
    process.stdout.write(chunk.delta)
  }
}

console.log('\n')
```

### With Cluster Context

```typescript
import { createProvider } from './plugins/plugin-kubectl-ai/src/services'
import type { ClusterSnapshot } from './plugins/plugin-kubectl-ai/src/types'

const provider = createProvider('anthropic')

const clusterData: ClusterSnapshot = {
  cluster: {
    name: 'my-cluster',
    version: '1.28.0',
    provider: 'eks',
    nodeCount: 3
  },
  namespace: {
    name: 'default',
    resourceCounts: {
      pods: 10,
      services: 5,
      deployments: 3,
      configmaps: 2,
      secrets: 1
    }
  },
  tokenEstimate: 100,
  priority: 'medium'
}

const response = await provider.complete({
  prompt: 'What resources are in my cluster?',
  clusterData
})

console.log(response.content)
```

## Configuration

### Custom Configuration

```typescript
import { ProviderFactory } from './plugins/plugin-kubectl-ai/src/services'
import { DEFAULT_AI_CONFIG } from './plugins/plugin-kubectl-ai/src/types'

const config = {
  ...DEFAULT_AI_CONFIG,
  provider: 'anthropic' as const,
  model: 'claude-3-5-haiku-20241022', // Faster, cheaper model
  maxTokens: 2048,
  temperature: 0.5, // More focused responses
  timeout: 20, // 20 second timeout
  privacy: {
    sendClusterMetadata: true,
    sendResourceNames: true,
    sendLogs: false, // Don't send logs for privacy
    sendPodNames: false // Anonymize pod names
  }
}

const provider = ProviderFactory.getProvider(config)
```

### Privacy Settings

```typescript
const privacyConfig = {
  ...DEFAULT_AI_CONFIG,
  provider: 'anthropic' as const,
  privacy: {
    sendClusterMetadata: false, // No cluster names
    sendResourceNames: false, // No resource names
    sendLogs: false, // No logs
    sendPodNames: false // No pod names
  }
}

const provider = ProviderFactory.getProvider(privacyConfig)
```

## Error Handling

```typescript
import { AIProviderError, AIProviderErrorCode } from './plugins/plugin-kubectl-ai/src/types'

try {
  const response = await provider.complete({
    prompt: 'Help me debug my pod'
  })
  console.log(response.content)
} catch (error) {
  if (error instanceof AIProviderError) {
    switch (error.code) {
      case AIProviderErrorCode.INVALID_API_KEY:
        console.error('Invalid API key. Please check ANTHROPIC_API_KEY.')
        break
      case AIProviderErrorCode.RATE_LIMIT:
        console.error('Rate limit hit. Please wait and retry.')
        break
      case AIProviderErrorCode.TIMEOUT:
        console.error('Request timed out.')
        break
      default:
        console.error('AI error:', error.message)
    }
  }
}
```

## Test Connection

```typescript
import { ProviderFactory } from './plugins/plugin-kubectl-ai/src/services'
import { DEFAULT_AI_CONFIG } from './plugins/plugin-kubectl-ai/src/types'

const result = await ProviderFactory.testProvider({
  ...DEFAULT_AI_CONFIG,
  provider: 'anthropic'
})

if (result.success) {
  console.log('✓ Connection successful!')
} else {
  console.error('✗ Connection failed:', result.error)
}
```

## Common Tasks

### Estimate Cost Before Sending

```typescript
const estimatedCost = provider.estimateCost({
  prompt: 'Explain Kubernetes networking in detail',
  maxTokens: 3000
})

console.log(`This will cost approximately: $${estimatedCost.toFixed(4)}`)

if (estimatedCost > 0.01) {
  console.log('Cost is high, proceeding anyway...')
}

const response = await provider.complete({
  prompt: 'Explain Kubernetes networking in detail',
  maxTokens: 3000
})
```

### Generate Manifest

```typescript
const response = await provider.complete({
  prompt: 'Generate a deployment for nginx with 3 replicas',
  systemPrompt: `You are a Kubernetes expert. Generate production-ready YAML with:
- Resource limits
- Health probes
- Security contexts
- Best practices`,
  maxTokens: 2000
})

console.log(response.content)
// Save to file
const fs = require('fs')
fs.writeFileSync('nginx-deployment.yaml', response.content)
```

### Debug a Problem

```typescript
const response = await provider.complete({
  prompt: 'My pod is in CrashLoopBackOff. Here are the logs: [error logs]',
  clusterData: {
    // ... cluster context
    currentResource: {
      kind: 'Pod',
      name: 'api-server',
      namespace: 'default',
      logs: ['Connection refused', 'Exiting...']
    }
  }
})

console.log('Diagnosis:', response.content)
```

## Available Models

### Anthropic

```typescript
// Most capable (recommended)
model: 'claude-3-5-sonnet-20241022'

// Fastest and cheapest
model: 'claude-3-5-haiku-20241022'

// Previous generation
model: 'claude-3-opus-20240229'
```

## Environment Variables Reference

```bash
# Anthropic (required for Anthropic provider)
export ANTHROPIC_API_KEY="sk-ant-..."
# or
export CLAUDE_API_KEY="sk-ant-..."

# Optional: Custom API endpoint
export ANTHROPIC_BASE_URL="https://api.anthropic.com"
```

## Troubleshooting

### Error: API key not configured

```bash
# Make sure you've set the environment variable
echo $ANTHROPIC_API_KEY

# If empty, set it
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

### Error: Module not found

```bash
# Install dependencies
npm install @anthropic-ai/sdk
```

### Error: Rate limit exceeded

Wait 60 seconds and retry, or use a higher tier API key.

### Error: Timeout

Increase timeout in config:

```typescript
const config = {
  ...DEFAULT_AI_CONFIG,
  timeout: 60 // 60 seconds
}
```

## Next Steps

- Read [EXAMPLES.md](./EXAMPLES.md) for more detailed examples
- Read [README.md](./README.md) for full documentation
- Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for technical details

## Tips

1. **Use streaming** for better UX on long responses
2. **Estimate costs** before expensive operations
3. **Set timeouts** appropriate for your use case
4. **Handle errors** gracefully with typed error codes
5. **Configure privacy** settings based on your requirements
6. **Use Haiku** for quick questions, Sonnet for complex tasks
7. **Test connection** before critical operations
8. **Cache responses** where appropriate (coming soon)

## Support

For issues or questions:

- Check [README.md](./README.md)
- Review [EXAMPLES.md](./EXAMPLES.md)
- Open an issue on GitHub
