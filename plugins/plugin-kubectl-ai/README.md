# Kui AI Assistant Plugin

AI-powered Kubernetes assistant plugin for Kui, providing intelligent troubleshooting, manifest generation, and cluster insights.

## Overview

This plugin integrates AI capabilities into Kui to help users:

- Debug Kubernetes issues by analyzing logs, events, and resource states
- Generate production-ready Kubernetes manifests
- Explain kubectl commands and Kubernetes concepts
- Optimize cluster resources and costs
- Get proactive suggestions and improvements

## Architecture

### Core Components

```
plugins/plugin-kubectl-ai/src/
├── types/                    # TypeScript type definitions
│   ├── ai-types.ts          # AI provider interfaces
│   ├── cluster-types.ts     # Cluster snapshot types
│   └── index.ts             # Type exports
├── services/                 # AI provider implementations
│   ├── ai-provider.ts       # Base provider interface
│   ├── anthropic-provider.ts # Claude implementation
│   ├── provider-factory.ts  # Provider selection
│   └── index.ts             # Service exports
├── context/                  # Cluster data collection
├── cache/                    # Response caching
├── commands/                 # CLI commands
├── prompts/                  # System prompts
└── ui/                       # React components
```

## AI Provider System

### AIProvider Interface

All AI providers implement the `AIProvider` interface:

```typescript
interface AIProvider {
  name: string
  models: string[]
  streamCompletion(request: AICompletionRequest): AsyncIterator<AIChunk>
  complete(request: AICompletionRequest): Promise<AIResponse>
  testConnection(): Promise<{ success: boolean; error?: string }>
  estimateCost(request: AICompletionRequest): number
}
```

### Supported Providers

- **Anthropic (Claude)** - Fully implemented with streaming support
- **OpenAI (GPT-4)** - Coming soon
- **Azure OpenAI** - Coming soon
- **Ollama** - Coming soon

### Usage

#### Creating a Provider

```typescript
import { ProviderFactory } from './services/provider-factory'
import { DEFAULT_AI_CONFIG } from './types/ai-types'

// Create provider with config
const config = {
  ...DEFAULT_AI_CONFIG,
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY
}

const provider = ProviderFactory.getProvider(config)
```

#### Streaming Completion

```typescript
const request = {
  prompt: 'Why is my pod crashing?',
  clusterData: clusterSnapshot
}

for await (const chunk of provider.streamCompletion(request)) {
  if (!chunk.done) {
    process.stdout.write(chunk.delta)
  }
}
```

#### Complete Response

```typescript
const response = await provider.complete({
  prompt: 'Generate a deployment manifest for nginx',
  maxTokens: 2048
})

console.log(response.content)
console.log(`Cost: $${response.cost?.toFixed(4)}`)
```

## Type Definitions

### AICompletionRequest

```typescript
interface AICompletionRequest {
  prompt: string // User question/prompt
  systemPrompt?: string // System instructions
  model?: string // Model override
  maxTokens?: number // Max response tokens
  temperature?: number // Sampling temperature (0-1)
  stream?: boolean // Enable streaming
  tools?: AITool[] // Available tools/functions
  clusterData?: ClusterSnapshot // Cluster context
}
```

### AIResponse

```typescript
interface AIResponse {
  content: string // Response text
  model: string // Model used
  usage: {
    inputTokens: number
    outputTokens: number
  }
  cost?: number // Cost in USD
  latency: number // Response time (ms)
  cached?: boolean // Cache hit
}
```

### ClusterSnapshot

```typescript
interface ClusterSnapshot {
  cluster: {
    name: string
    version: string
    provider: 'eks' | 'gke' | 'aks' | 'kind' | 'minikube' | 'unknown'
    nodeCount: number
  }
  namespace: {
    name: string
    resourceCounts: {
      pods: number
      services: number
      deployments: number
      configmaps: number
      secrets: number
    }
  }
  currentResource?: {
    kind: string
    name: string
    namespace: string
    status?: unknown
    events?: KubernetesEvent[]
    logs?: string[]
    manifest?: unknown
  }
  tokenEstimate: number
  priority: 'high' | 'medium' | 'low'
}
```

## Configuration

### Environment Variables

```bash
# Anthropic API key
export ANTHROPIC_API_KEY="sk-ant-..."
# or
export CLAUDE_API_KEY="sk-ant-..."

# OpenAI API key (when implemented)
export OPENAI_API_KEY="sk-..."
```

### AIConfig

```typescript
interface AIConfig {
  provider: 'anthropic' | 'openai' | 'azure' | 'ollama' | 'custom'
  apiKey?: string
  baseUrl?: string
  model: string
  maxTokens: number
  temperature: number
  timeout: number

  privacy: {
    sendClusterMetadata: boolean
    sendResourceNames: boolean
    sendLogs: boolean
    sendPodNames: boolean
  }

  streaming: boolean
  caching: boolean
  cacheTTL: number
  monthlyLimit?: number
  costAlerts: boolean
}
```

## Error Handling

The provider system uses typed errors:

```typescript
enum AIProviderErrorCode {
  INVALID_API_KEY = 'INVALID_API_KEY',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  INVALID_REQUEST = 'INVALID_REQUEST',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

class AIProviderError extends Error {
  constructor(
    message: string,
    public code: AIProviderErrorCode,
    public details?: unknown
  )
}
```

## Testing

```bash
# Run tests
npm test -- plugins/plugin-kubectl-ai

# Test provider connection
npm run test:ai-provider
```

## Performance

- **Streaming**: Real-time response chunks for better UX
- **Caching**: Response caching with configurable TTL
- **Cost tracking**: Automatic token usage and cost calculation
- **Error recovery**: Automatic retries with exponential backoff

## Security & Privacy

- API keys stored securely in environment variables
- Configurable privacy settings to control data sent to AI
- Secret detection and redaction
- HTTPS-only communication
- No data persistence without user consent

## Implementation Status

- [x] Type definitions (ai-types.ts, cluster-types.ts)
- [x] Base AI provider interface
- [x] Anthropic Claude provider with streaming
- [x] Provider factory with caching
- [ ] OpenAI provider
- [ ] Azure OpenAI provider
- [ ] Ollama provider
- [ ] Context collector
- [ ] Cache manager
- [ ] CLI commands
- [ ] React UI components

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## License

Apache License 2.0
