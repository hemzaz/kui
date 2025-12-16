# AI Provider Usage Examples

This document provides examples of using the AI provider system in the Kui kubectl-ai plugin.

## Basic Setup

```typescript
import { ProviderFactory, createProvider } from './src/services'
import { DEFAULT_AI_CONFIG } from './src/types'

// Set API key via environment variable
process.env.ANTHROPIC_API_KEY = 'sk-ant-...'

// Create provider with default config
const provider = createProvider('anthropic')

// Or create with custom config
const config = {
  ...DEFAULT_AI_CONFIG,
  provider: 'anthropic' as const,
  model: 'claude-3-5-haiku-20241022',
  maxTokens: 2048,
  temperature: 0.5
}

const customProvider = ProviderFactory.getProvider(config)
```

## Simple Completion

```typescript
async function askQuestion(question: string) {
  const provider = createProvider('anthropic')

  const response = await provider.complete({
    prompt: question
  })

  console.log(response.content)
  console.log(`Tokens: ${response.usage.inputTokens} in, ${response.usage.outputTokens} out`)
  console.log(`Cost: $${response.cost?.toFixed(4)}`)
  console.log(`Latency: ${response.latency}ms`)
}

await askQuestion('What is a Kubernetes Pod?')
```

## Streaming Response

```typescript
async function streamQuestion(question: string) {
  const provider = createProvider('anthropic')

  console.log('Question:', question)
  console.log('Answer: ')

  let fullResponse = ''

  for await (const chunk of provider.streamCompletion({
    prompt: question
  })) {
    if (!chunk.done) {
      process.stdout.write(chunk.delta)
      fullResponse += chunk.delta
    } else if (chunk.usage) {
      console.log('\n\nUsage:', chunk.usage)
    }
  }

  return fullResponse
}

await streamQuestion('How do I scale a deployment in Kubernetes?')
```

## With Cluster Context

```typescript
import type { ClusterSnapshot } from './src/types'

async function debugPod(podName: string, namespace: string) {
  const provider = createProvider('anthropic')

  // Gather cluster context (normally done by context collector)
  const clusterData: ClusterSnapshot = {
    cluster: {
      name: 'production',
      version: '1.28.0',
      provider: 'eks',
      nodeCount: 5
    },
    namespace: {
      name: namespace,
      resourceCounts: {
        pods: 20,
        services: 10,
        deployments: 8,
        configmaps: 5,
        secrets: 3
      }
    },
    currentResource: {
      kind: 'Pod',
      name: podName,
      namespace: namespace,
      status: {
        phase: 'CrashLoopBackOff',
        containerStatuses: [
          {
            name: 'app',
            ready: false,
            restartCount: 5,
            state: {
              waiting: {
                reason: 'CrashLoopBackOff'
              }
            }
          }
        ]
      },
      events: [
        {
          type: 'Warning',
          reason: 'BackOff',
          message: 'Back-off restarting failed container',
          timestamp: new Date(),
          involvedObject: {
            kind: 'Pod',
            name: podName,
            namespace: namespace
          }
        }
      ],
      logs: ['Error: Cannot connect to database', 'Connection refused: localhost:5432', 'Exiting...']
    },
    tokenEstimate: 500,
    priority: 'high'
  }

  const response = await provider.complete({
    prompt: 'Why is this pod crashing and how can I fix it?',
    clusterData
  })

  console.log(response.content)
}

await debugPod('api-server-xyz', 'default')
```

## Error Handling

```typescript
import { AIProviderError, AIProviderErrorCode } from './src/types'

async function robustQuery(question: string) {
  const provider = createProvider('anthropic')

  try {
    const response = await provider.complete({
      prompt: question
    })
    return response.content
  } catch (error) {
    if (error instanceof AIProviderError) {
      switch (error.code) {
        case AIProviderErrorCode.INVALID_API_KEY:
          console.error('Invalid API key. Please set ANTHROPIC_API_KEY.')
          break

        case AIProviderErrorCode.RATE_LIMIT:
          console.error('Rate limit exceeded. Please wait and retry.')
          break

        case AIProviderErrorCode.TIMEOUT:
          console.error('Request timed out. Please try again.')
          break

        case AIProviderErrorCode.NETWORK_ERROR:
          console.error('Network error. Check your connection.')
          break

        default:
          console.error('AI provider error:', error.message)
      }
    } else {
      console.error('Unexpected error:', error)
    }
    throw error
  }
}
```

## Testing Connection

```typescript
async function testProviderConnection() {
  const provider = createProvider('anthropic')

  const result = await provider.testConnection()

  if (result.success) {
    console.log('✓ Connection successful')
  } else {
    console.error('✗ Connection failed:', result.error)
  }

  return result.success
}

await testProviderConnection()
```

## Estimate Costs

```typescript
async function estimateQueryCost(question: string) {
  const provider = createProvider('anthropic')

  const estimatedCost = provider.estimateCost({
    prompt: question,
    maxTokens: 2048
  })

  console.log(`Estimated cost: $${estimatedCost.toFixed(4)}`)

  return estimatedCost
}

await estimateQueryCost('Explain Kubernetes services in detail')
```

## Generate Kubernetes Manifest

```typescript
async function generateManifest(description: string) {
  const provider = createProvider('anthropic')

  const response = await provider.complete({
    prompt: `Generate a production-ready Kubernetes manifest for: ${description}`,
    systemPrompt: `You are a Kubernetes expert. Generate YAML manifests following best practices:
- Include resource limits and requests
- Add liveness and readiness probes
- Use security contexts
- Include labels and annotations
- Follow naming conventions`,
    maxTokens: 3000
  })

  console.log(response.content)
}

await generateManifest('nginx deployment with 3 replicas and horizontal pod autoscaling')
```

## Batch Queries (Sequential)

```typescript
async function batchQueries(questions: string[]) {
  const provider = createProvider('anthropic')
  const results = []

  for (const question of questions) {
    console.log(`\nQuestion: ${question}`)

    const response = await provider.complete({
      prompt: question,
      maxTokens: 500
    })

    console.log(`Answer: ${response.content}\n`)
    results.push({ question, answer: response.content })
  }

  return results
}

await batchQueries([
  'What is a Kubernetes namespace?',
  'What is a Kubernetes service?',
  'What is a Kubernetes deployment?'
])
```

## Using Different Models

```typescript
async function compareModels(question: string) {
  const models = [
    'claude-3-5-sonnet-20241022', // Most capable
    'claude-3-5-haiku-20241022' // Fastest
  ]

  for (const model of models) {
    const config = {
      ...DEFAULT_AI_CONFIG,
      provider: 'anthropic' as const,
      model
    }

    const provider = ProviderFactory.getProvider(config)
    const startTime = Date.now()

    const response = await provider.complete({
      prompt: question,
      model
    })

    console.log(`\n${model}:`)
    console.log(`Answer: ${response.content.substring(0, 100)}...`)
    console.log(`Latency: ${Date.now() - startTime}ms`)
    console.log(`Cost: $${response.cost?.toFixed(4)}`)

    // Clear cache between models
    ProviderFactory.clearCache()
  }
}

await compareModels('Explain Kubernetes pods briefly')
```

## Using Tools/Functions (Advanced)

```typescript
import type { AITool } from './src/types'

async function queryWithTools(question: string) {
  const provider = createProvider('anthropic')

  // Define tools the AI can use
  const tools: AITool[] = [
    {
      name: 'get_pod_logs',
      description: 'Get logs from a specific pod',
      parameters: {
        type: 'object',
        properties: {
          podName: { type: 'string', description: 'Name of the pod' },
          namespace: { type: 'string', description: 'Namespace of the pod' },
          lines: { type: 'number', description: 'Number of log lines to retrieve' }
        },
        required: ['podName', 'namespace']
      },
      handler: async (args: any) => {
        // Execute kubectl logs
        const { podName, namespace, lines = 100 } = args
        console.log(`Getting logs for ${podName} in ${namespace}...`)
        // Simulate log retrieval
        return `[Log line 1]\n[Log line 2]\n...`
      }
    }
  ]

  const response = await provider.complete({
    prompt: question,
    tools
  })

  console.log(response.content)
}

await queryWithTools('Show me the logs for pod api-server in default namespace')
```

## Privacy-Aware Queries

```typescript
async function privacyAwareQuery(question: string) {
  const config = {
    ...DEFAULT_AI_CONFIG,
    provider: 'anthropic' as const,
    privacy: {
      sendClusterMetadata: false, // Don't send cluster name/version
      sendResourceNames: false, // Anonymize resource names
      sendLogs: false, // Don't send logs
      sendPodNames: false // Anonymize pod names
    }
  }

  const provider = ProviderFactory.getProvider(config)

  // Cluster data will be filtered based on privacy settings
  const response = await provider.complete({
    prompt: question
  })

  console.log(response.content)
}

await privacyAwareQuery('How do I troubleshoot pod issues?')
```

## Complete Example: Troubleshooting Assistant

```typescript
import readline from 'readline'

async function troubleshootingAssistant() {
  const provider = createProvider('anthropic')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  console.log('Kubernetes Troubleshooting Assistant')
  console.log('=====================================\n')

  const askQuestion = () => {
    rl.question('You: ', async question => {
      if (question.toLowerCase() === 'exit') {
        rl.close()
        return
      }

      console.log('\nAssistant: ')

      try {
        for await (const chunk of provider.streamCompletion({
          prompt: question
        })) {
          if (!chunk.done) {
            process.stdout.write(chunk.delta)
          }
        }
        console.log('\n')
      } catch (error) {
        console.error('\nError:', error)
      }

      askQuestion()
    })
  }

  askQuestion()
}

await troubleshootingAssistant()
```

## Using with TypeScript Strict Mode

```typescript
import type { AIResponse, AIChunk } from './src/types'

async function strictTypeExample(question: string): Promise<AIResponse> {
  const provider = createProvider('anthropic')

  const response: AIResponse = await provider.complete({
    prompt: question,
    maxTokens: 1000
  })

  // Type-safe access
  const content: string = response.content
  const inputTokens: number = response.usage.inputTokens
  const outputTokens: number = response.usage.outputTokens
  const cost: number | undefined = response.cost
  const latency: number = response.latency

  return response
}

async function strictStreamExample(question: string): Promise<string> {
  const provider = createProvider('anthropic')
  let fullResponse = ''

  const iterator: AsyncIterator<AIChunk> = provider.streamCompletion({
    prompt: question
  })

  for await (const chunk of iterator) {
    const delta: string = chunk.delta
    const done: boolean = chunk.done

    if (!done) {
      fullResponse += delta
    }
  }

  return fullResponse
}
```
