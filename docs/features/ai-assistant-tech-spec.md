# Technical Specification: AI-Powered Kubernetes Assistant

**Version:** 1.0
**Date:** 2025-12-16
**Status:** Draft

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Design](#component-design)
3. [API Specifications](#api-specifications)
4. [Data Models](#data-models)
5. [Performance Optimization](#performance-optimization)
6. [Security & Privacy](#security--privacy)
7. [Implementation Plan](#implementation-plan)

---

## Architecture Overview

### System Components

```
┌──────────────────────────────────────────────────────────────────┐
│                         Kui Application (Tauri)                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Frontend (React)                         │  │
│  │  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐ │  │
│  │  │ Terminal     │  │ AI Chat        │  │ Settings       │ │  │
│  │  │ Component    │  │ Sidebar        │  │ Panel          │ │  │
│  │  └──────────────┘  └────────────────┘  └────────────────┘ │  │
│  │         │                  │                    │           │  │
│  │         └──────────────────┴────────────────────┘           │  │
│  │                           ↓                                  │  │
│  │               ┌────────────────────────┐                    │  │
│  │               │  AI Service Client     │                    │  │
│  │               │  (IPC Communication)   │                    │  │
│  │               └────────────────────────┘                    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                             ↓                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Backend (Node.js)                        │  │
│  │  ┌───────────────────────────────────────────────────────┐ │  │
│  │  │              Plugin: @kui-shell/plugin-kubectl-ai      │ │  │
│  │  │                                                         │ │  │
│  │  │  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐ │ │  │
│  │  │  │ AI Provider  │  │ Context     │  │ Prompt       │ │ │  │
│  │  │  │ Service      │  │ Collector   │  │ Builder      │ │ │  │
│  │  │  └──────────────┘  └─────────────┘  └──────────────┘ │ │  │
│  │  │         │                  │                 │         │ │  │
│  │  │         └──────────────────┴─────────────────┘         │ │  │
│  │  │                           ↓                             │ │  │
│  │  │              ┌──────────────────────┐                  │ │  │
│  │  │              │  Cache Manager       │                  │ │  │
│  │  │              │  (In-Memory + Redis) │                  │ │  │
│  │  │              └──────────────────────┘                  │ │  │
│  │  └───────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────────────────────────────┐
│                       External Services                           │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐│
│  │ Anthropic API  │  │ OpenAI API     │  │ Kubernetes API      ││
│  │ (Claude)       │  │ (GPT-4)        │  │ (kubectl context)   ││
│  └────────────────┘  └────────────────┘  └─────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**

- React 18+ (already in use)
- TypeScript 5.9+
- PatternFly 4 components (already integrated)
- Monaco Editor (for YAML editing)
- markdown-it (for rendering AI responses)

**Backend:**

- Node.js 24+ (already required)
- TypeScript 5.9+
- Anthropic SDK (`@anthropic-ai/sdk`)
- OpenAI SDK (`openai`)
- Node-cache for in-memory caching
- dotenv for environment variables

**Build & Tooling:**

- Tauri 2.9+ (already in use)
- Webpack 5+ (already configured)
- ESLint + Prettier (already configured)

---

## Component Design

### 1. Plugin Structure

```typescript
// plugins/plugin-kubectl-ai/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    // Plugin entry point
│   ├── preload.ts                  // Register commands
│   ├── services/
│   │   ├── ai-provider.ts          // AI provider abstraction
│   │   ├── anthropic-provider.ts   // Claude implementation
│   │   ├── openai-provider.ts      // GPT-4 implementation
│   │   ├── ollama-provider.ts      // Local LLM implementation
│   │   └── provider-factory.ts     // Provider selection
│   ├── context/
│   │   ├── cluster-context.ts      // Gather cluster info
│   │   ├── resource-context.ts     // Resource-specific context
│   │   └── log-collector.ts        // Log gathering
│   ├── prompts/
│   │   ├── system-prompts.ts       // Base system prompts
│   │   ├── troubleshooting.ts      // Debugging prompts
│   │   ├── manifest-generation.ts  // Manifest creation prompts
│   │   └── optimization.ts         // Optimization prompts
│   ├── cache/
│   │   ├── cache-manager.ts        // Cache abstraction
│   │   ├── memory-cache.ts         // In-memory cache
│   │   └── cache-strategies.ts     // TTL strategies
│   ├── commands/
│   │   ├── ai-ask.ts               // /ai ask command
│   │   ├── ai-debug.ts             // /ai debug command
│   │   ├── ai-create.ts            // /ai create command
│   │   └── ai-config.ts            // /ai config command
│   ├── ui/
│   │   ├── AIChatSidebar.tsx       // Main chat component
│   │   ├── AISettings.tsx          // Settings panel
│   │   ├── ContextPanel.tsx        // Context display
│   │   └── MessageList.tsx         // Chat messages
│   └── types/
│       ├── ai-types.ts             // AI-related types
│       ├── context-types.ts        // Context types
│       └── config-types.ts         // Configuration types
└── tests/
    ├── services/
    ├── context/
    └── prompts/
```

### 2. Core Interfaces

```typescript
// src/types/ai-types.ts

/**
 * AI Provider interface - all providers must implement this
 */
export interface AIProvider {
  name: string
  models: string[]

  /**
   * Send a prompt and get streaming response
   */
  streamCompletion(request: AICompletionRequest): AsyncIterator<AIChunk>

  /**
   * Send a prompt and get full response
   */
  complete(request: AICompletionRequest): Promise<AIResponse>

  /**
   * Test API connection
   */
  testConnection(): Promise<{ success: boolean; error?: string }>

  /**
   * Get estimated cost for a request
   */
  estimateCost(request: AICompletionRequest): number
}

export interface AICompletionRequest {
  prompt: string
  systemPrompt?: string
  model?: string
  maxTokens?: number
  temperature?: number
  stream?: boolean
  tools?: AITool[]
  clusterData?: ClusterSnapshot
}

export interface AIResponse {
  content: string
  model: string
  usage: {
    inputTokens: number
    outputTokens: number
  }
  cost?: number
  latency: number
}

export interface AIChunk {
  delta: string
  done: boolean
}

export interface AITool {
  name: string
  description: string
  parameters: object
  handler: (args: any) => Promise<any>
}

/**
 * AI Configuration stored in settings
 */
export interface AIConfig {
  provider: 'anthropic' | 'openai' | 'azure' | 'ollama' | 'custom'
  apiKey?: string
  baseUrl?: string
  model: string
  maxTokens: number
  temperature: number
  timeout: number

  // Privacy settings
  privacy: {
    sendClusterMetadata: boolean
    sendResourceNames: boolean
    sendLogs: boolean
    sendPodNames: boolean
  }

  // Performance settings
  streaming: boolean
  caching: boolean
  cacheTTL: number

  // Cost tracking
  monthlyLimit?: number
  costAlerts: boolean
}
```

```typescript
// src/types/cluster-types.ts

/**
 * Cluster snapshot - point-in-time state sent to AI
 * (Renamed from ClusterContext to avoid confusion with kubectl context)
 */
export interface ClusterSnapshot {
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
    status?: any
    events?: Event[]
    logs?: string[]
    manifest?: any
  }

  recentChanges?: {
    timestamp: Date
    resource: string
    action: 'create' | 'update' | 'delete'
  }[]

  // Metadata for context window optimization
  tokenEstimate: number
  priority: 'high' | 'medium' | 'low'
}

export interface KubernetesEvent {
  type: 'Normal' | 'Warning'
  reason: string
  message: string
  timestamp: Date
  involvedObject: {
    kind: string
    name: string
    namespace: string
  }
}
```

### 3. AI Provider Service

```typescript
// src/services/anthropic-provider.ts

import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, AICompletionRequest, AIResponse, AIChunk } from '../types/ai-types'

export class AnthropicProvider implements AIProvider {
  name = 'anthropic'
  models = ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229']

  private client: Anthropic
  private config: AIConfig

  constructor(config: AIConfig) {
    this.config = config
    this.client = new Anthropic({
      apiKey: config.apiKey || process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY,
      baseURL: config.baseUrl,
      timeout: config.timeout * 1000
    })
  }

  async *streamCompletion(request: AICompletionRequest): AsyncIterator<AIChunk> {
    const startTime = Date.now()

    const stream = await this.client.messages.stream({
      model: request.model || this.config.model,
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
      system: request.systemPrompt || this.buildSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: this.buildPrompt(request)
        }
      ]
    })

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield {
          delta: chunk.delta.text,
          done: false
        }
      }
    }

    const finalMessage = await stream.finalMessage()
    const latency = Date.now() - startTime

    // Log usage for cost tracking
    this.logUsage({
      inputTokens: finalMessage.usage.input_tokens,
      outputTokens: finalMessage.usage.output_tokens,
      latency,
      cost: this.calculateCost(finalMessage.usage)
    })

    yield { delta: '', done: true }
  }

  async complete(request: AICompletionRequest): Promise<AIResponse> {
    const startTime = Date.now()

    const response = await this.client.messages.create({
      model: request.model || this.config.model,
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
      system: request.systemPrompt || this.buildSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: this.buildPrompt(request)
        }
      ],
      tools: request.tools?.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters
      }))
    })

    const latency = Date.now() - startTime
    const content = response.content[0].type === 'text' ? response.content[0].text : JSON.stringify(response.content[0])

    return {
      content,
      model: response.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      },
      cost: this.calculateCost(response.usage),
      latency
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      })
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Connection failed'
      }
    }
  }

  estimateCost(request: AICompletionRequest): number {
    const inputTokens = this.estimateTokens(request.prompt + (request.systemPrompt || ''))
    const outputTokens = request.maxTokens || this.config.maxTokens

    return this.calculateCost({
      input_tokens: inputTokens,
      output_tokens: outputTokens
    })
  }

  private buildSystemPrompt(): string {
    return `You are an expert Kubernetes assistant integrated into Kui, a graphical kubectl tool.

Your role is to help users:
1. Debug Kubernetes issues by analyzing logs, events, and resource states
2. Generate production-ready Kubernetes manifests with best practices
3. Explain kubectl commands and Kubernetes concepts
4. Optimize cluster resources and costs
5. Suggest improvements and proactive fixes

Guidelines:
- Be concise and actionable
- Provide kubectl commands that can be executed immediately
- Follow Kubernetes best practices (resource limits, health checks, security contexts)
- Explain your reasoning
- When uncertain, ask clarifying questions
- Prioritize security and reliability

Current context: The user is working in the Kui terminal with access to kubectl commands.`
  }

  private buildPrompt(request: AICompletionRequest): string {
    let prompt = request.prompt

    // Add context if available
    if (request.context) {
      prompt = this.enrichPromptWithContext(prompt, request.context)
    }

    return prompt
  }

  private enrichPromptWithContext(prompt: string, context: ClusterContext): string {
    const contextSummary = `
**Current Cluster Context:**
- Cluster: ${context.cluster.name} (${context.cluster.version})
- Namespace: ${context.namespace.name}
- Resources: ${context.namespace.resourceCounts.pods} pods, ${context.namespace.resourceCounts.services} services

${
  context.currentResource
    ? `
**Current Resource:**
- Type: ${context.currentResource.kind}
- Name: ${context.currentResource.name}
${context.currentResource.status ? `- Status: ${JSON.stringify(context.currentResource.status, null, 2)}` : ''}
${
  context.currentResource.events?.length
    ? `
- Recent Events:
${context.currentResource.events.map(e => `  • [${e.type}] ${e.reason}: ${e.message}`).join('\n')}
`
    : ''
}
${
  context.currentResource.logs?.length
    ? `
- Recent Logs (last 20 lines):
\`\`\`
${context.currentResource.logs.slice(-20).join('\n')}
\`\`\`
`
    : ''
}
`
    : ''
}

**User Question:**
${prompt}
`

    return contextSummary
  }

  private calculateCost(usage: { input_tokens: number; output_tokens: number }): number {
    // Claude 3.5 Sonnet pricing (as of Dec 2024)
    const INPUT_COST_PER_MILLION = 3.0
    const OUTPUT_COST_PER_MILLION = 15.0

    const inputCost = (usage.input_tokens / 1_000_000) * INPUT_COST_PER_MILLION
    const outputCost = (usage.output_tokens / 1_000_000) * OUTPUT_COST_PER_MILLION

    return inputCost + outputCost
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }

  private logUsage(usage: any) {
    // TODO: Implement usage tracking for cost monitoring
    console.debug('AI Usage:', usage)
  }
}
```

### 4. Context Collector

```typescript
// src/collectors/cluster-data-collector.ts

import type { KResponse } from '@kui-shell/core'
import type { ClusterSnapshot, KubernetesEvent } from '../types/cluster-types'
import { exec } from '@kui-shell/core'

export class ClusterDataCollector {
  /**
   * Capture current cluster state for AI prompt
   * (Renamed from collectContext to avoid confusion with kubectl context)
   */
  async captureClusterSnapshot(options: {
    namespace?: string
    resource?: { kind: string; name: string; namespace: string }
    includeLogs?: boolean
    includeEvents?: boolean
    includeManifest?: boolean
  }): Promise<ClusterSnapshot> {
    const [clusterInfo, namespaceInfo] = await Promise.all([
      this.getClusterInfo(),
      this.getNamespaceInfo(options.namespace || 'default')
    ])

    let currentResource
    if (options.resource) {
      currentResource = await this.getResourceContext(
        options.resource,
        options.includeLogs,
        options.includeEvents,
        options.includeManifest
      )
    }

    const context: ClusterContext = {
      cluster: clusterInfo,
      namespace: namespaceInfo,
      currentResource,
      tokenEstimate: this.estimateTokens(clusterInfo, namespaceInfo, currentResource),
      priority: this.determinePriority(currentResource)
    }

    return context
  }

  private async getClusterInfo() {
    try {
      const versionOutput = await exec('kubectl version --short')
      const nodesOutput = await exec('kubectl get nodes --no-headers')

      const version = this.parseKubeVersion(versionOutput)
      const nodeCount = nodesOutput.split('\n').filter(line => line.trim()).length
      const provider = this.detectProvider()

      return {
        name: process.env.KUBECONFIG?.split('/').pop() || 'default',
        version,
        provider,
        nodeCount
      }
    } catch (error) {
      return {
        name: 'unknown',
        version: 'unknown',
        provider: 'unknown' as const,
        nodeCount: 0
      }
    }
  }

  private async getNamespaceInfo(namespace: string) {
    try {
      const [pods, services, deployments] = await Promise.all([
        exec(`kubectl get pods -n ${namespace} --no-headers`),
        exec(`kubectl get services -n ${namespace} --no-headers`),
        exec(`kubectl get deployments -n ${namespace} --no-headers`)
      ])

      return {
        name: namespace,
        resourceCounts: {
          pods: this.countLines(pods),
          services: this.countLines(services),
          deployments: this.countLines(deployments),
          configmaps: 0, // TODO: add if needed
          secrets: 0 // TODO: add if needed
        }
      }
    } catch (error) {
      return {
        name: namespace,
        resourceCounts: {
          pods: 0,
          services: 0,
          deployments: 0,
          configmaps: 0,
          secrets: 0
        }
      }
    }
  }

  private async getResourceContext(
    resource: { kind: string; name: string; namespace: string },
    includeLogs: boolean,
    includeEvents: boolean,
    includeManifest: boolean
  ) {
    const tasks: Promise<any>[] = []

    // Get resource status
    tasks.push(this.getResourceStatus(resource))

    // Get events if requested
    if (includeEvents) {
      tasks.push(this.getResourceEvents(resource))
    }

    // Get logs if requested and resource is a pod
    if (includeLogs && resource.kind.toLowerCase() === 'pod') {
      tasks.push(this.getResourceLogs(resource))
    }

    // Get manifest if requested
    if (includeManifest) {
      tasks.push(this.getResourceManifest(resource))
    }

    const [status, events, logs, manifest] = await Promise.all(tasks)

    return {
      kind: resource.kind,
      name: resource.name,
      namespace: resource.namespace,
      status,
      events,
      logs,
      manifest
    }
  }

  private async getResourceStatus(resource: { kind: string; name: string; namespace: string }) {
    try {
      const output = await exec(`kubectl get ${resource.kind} ${resource.name} -n ${resource.namespace} -o json`)
      const parsed = JSON.parse(output)
      return parsed.status
    } catch (error) {
      return null
    }
  }

  private async getResourceEvents(resource: {
    kind: string
    name: string
    namespace: string
  }): Promise<KubernetesEvent[]> {
    try {
      const output = await exec(
        `kubectl get events -n ${resource.namespace} --field-selector involvedObject.name=${resource.name} -o json`
      )
      const parsed = JSON.parse(output)

      return parsed.items.map(event => ({
        type: event.type,
        reason: event.reason,
        message: event.message,
        timestamp: new Date(event.lastTimestamp || event.firstTimestamp),
        involvedObject: {
          kind: event.involvedObject.kind,
          name: event.involvedObject.name,
          namespace: event.involvedObject.namespace
        }
      }))
    } catch (error) {
      return []
    }
  }

  private async getResourceLogs(resource: { name: string; namespace: string }): Promise<string[]> {
    try {
      const output = await exec(`kubectl logs ${resource.name} -n ${resource.namespace} --tail=100`)
      return output.split('\n')
    } catch (error) {
      return []
    }
  }

  private async getResourceManifest(resource: { kind: string; name: string; namespace: string }) {
    try {
      const output = await exec(`kubectl get ${resource.kind} ${resource.name} -n ${resource.namespace} -o yaml`)
      return output
    } catch (error) {
      return null
    }
  }

  private parseKubeVersion(output: string): string {
    const match = output.match(/Server Version: v(\d+\.\d+\.\d+)/)
    return match ? match[1] : 'unknown'
  }

  private detectProvider(): 'eks' | 'gke' | 'aks' | 'kind' | 'minikube' | 'unknown' {
    const context = process.env.KUBECONFIG || ''

    if (context.includes('eks')) return 'eks'
    if (context.includes('gke')) return 'gke'
    if (context.includes('aks')) return 'aks'
    if (context.includes('kind')) return 'kind'
    if (context.includes('minikube')) return 'minikube'

    return 'unknown'
  }

  private countLines(output: string): number {
    return output.split('\n').filter(line => line.trim()).length
  }

  private estimateTokens(clusterInfo: any, namespaceInfo: any, resourceInfo: any): number {
    const clusterTokens = JSON.stringify(clusterInfo).length / 4
    const namespaceTokens = JSON.stringify(namespaceInfo).length / 4
    const resourceTokens = resourceInfo ? JSON.stringify(resourceInfo).length / 4 : 0

    return Math.ceil(clusterTokens + namespaceTokens + resourceTokens)
  }

  private determinePriority(resourceInfo: any): 'high' | 'medium' | 'low' {
    if (!resourceInfo) return 'low'

    // High priority if there are error events
    if (resourceInfo.events?.some(e => e.type === 'Warning')) {
      return 'high'
    }

    // Medium priority if there are logs or manifest
    if (resourceInfo.logs?.length > 0 || resourceInfo.manifest) {
      return 'medium'
    }

    return 'low'
  }
}
```

### 5. Cache Manager

```typescript
// src/cache/cache-manager.ts

import NodeCache from 'node-cache'
import type { ClusterContext } from '../types/context-types'
import type { AIResponse } from '../types/ai-types'

export class CacheManager {
  private cache: NodeCache

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes default
      checkperiod: 60, // Check for expired keys every minute
      useClones: false // Better performance
    })
  }

  /**
   * Cache cluster context
   */
  cacheContext(key: string, context: ClusterContext, ttl: number = 300) {
    this.cache.set(`context:${key}`, context, ttl)
  }

  getContext(key: string): ClusterContext | undefined {
    return this.cache.get(`context:${key}`)
  }

  /**
   * Cache AI responses for identical queries
   */
  cacheResponse(queryHash: string, response: AIResponse, ttl: number = 3600) {
    this.cache.set(`response:${queryHash}`, response, ttl)
  }

  getResponse(queryHash: string): AIResponse | undefined {
    return this.cache.get(`response:${queryHash}`)
  }

  /**
   * Invalidate cache when resources change
   */
  invalidateResourceCache(namespace: string, resourceName?: string) {
    const keys = this.cache.keys()

    keys.forEach(key => {
      if (key.startsWith('context:') && key.includes(namespace)) {
        if (!resourceName || key.includes(resourceName)) {
          this.cache.del(key)
        }
      }
    })
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.flushAll()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      ksize: this.cache.getStats().ksize,
      vsize: this.cache.getStats().vsize
    }
  }
}

/**
 * Generate hash for query deduplication
 */
export function hashQuery(prompt: string, context?: ClusterContext): string {
  const crypto = require('crypto')
  const data = prompt + (context ? JSON.stringify(context) : '')
  return crypto.createHash('sha256').update(data).digest('hex')
}
```

---

## API Specifications

### Command Registration

```typescript
// src/preload.ts

import type { Registrar } from '@kui-shell/core'
import { aiAskCommand } from './commands/ai-ask'
import { aiDebugCommand } from './commands/ai-debug'
import { aiCreateCommand } from './commands/ai-create'
import { aiConfigCommand } from './commands/ai-config'

export default async function (registrar: Registrar) {
  // Register /ai ask command
  registrar.listen('/ai/ask', aiAskCommand, {
    usage: {
      command: 'ask',
      docs: 'Ask the AI assistant a question about Kubernetes',
      example: 'ai ask "why is my pod crashing?"',
      required: [{ name: 'question', docs: 'The question to ask' }],
      optional: [
        { name: '--context', docs: 'Include current resource context' },
        { name: '--streaming', docs: 'Stream response in real-time' }
      ]
    }
  })

  // Register /ai debug command
  registrar.listen('/ai/debug', aiDebugCommand, {
    usage: {
      command: 'debug',
      docs: 'Debug a Kubernetes resource with AI assistance',
      example: 'ai debug pod/api-server-xyz',
      required: [{ name: 'resource', docs: 'Resource to debug (format: kind/name)' }]
    }
  })

  // Register /ai create command
  registrar.listen('/ai/create', aiCreateCommand, {
    usage: {
      command: 'create',
      docs: 'Generate Kubernetes manifest from description',
      example: 'ai create "nginx deployment with 3 replicas"',
      required: [{ name: 'description', docs: 'What to create' }]
    }
  })

  // Register /ai config command
  registrar.listen('/ai/config', aiConfigCommand, {
    usage: {
      command: 'config',
      docs: 'Configure AI assistant settings',
      example: 'ai config'
    }
  })
}
```

---

## Performance Optimization

### 1. Request Batching

```typescript
class RequestBatcher {
  private queue: Array<{
    request: AICompletionRequest
    resolve: (response: AIResponse) => void
    reject: (error: Error) => void
  }> = []

  private timeout: NodeJS.Timeout

  async batch(request: AICompletionRequest): Promise<AIResponse> {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject })

      // Clear existing timeout
      if (this.timeout) clearTimeout(this.timeout)

      // Set new timeout to flush queue
      this.timeout = setTimeout(() => this.flush(), 100)
    })
  }

  private async flush() {
    if (this.queue.length === 0) return

    const batch = this.queue.splice(0)

    // Combine prompts
    const combinedPrompt = batch.map((item, idx) => `[Query ${idx + 1}] ${item.request.prompt}`).join('\n\n')

    try {
      const response = await aiProvider.complete({
        prompt: combinedPrompt,
        maxTokens: batch.reduce((sum, item) => sum + (item.request.maxTokens || 1000), 0)
      })

      // Split response and resolve each
      const responses = this.splitResponse(response.content, batch.length)
      batch.forEach((item, idx) => {
        item.resolve({
          ...response,
          content: responses[idx]
        })
      })
    } catch (error) {
      batch.forEach(item => item.reject(error))
    }
  }

  private splitResponse(content: string, count: number): string[] {
    // Split by query markers
    const parts = content.split(/\[Query \d+\]/g).filter(Boolean)
    return parts.slice(0, count)
  }
}
```

### 2. Progressive Loading

```typescript
async function progressiveQuery(
  provider: AIProvider,
  request: AICompletionRequest
): Promise<{ quick: AIResponse; detailed: AIResponse }> {
  // Phase 1: Quick answer (low tokens)
  const quickPromise = provider.complete({
    ...request,
    prompt: `${request.prompt}\n\nProvide a brief, actionable answer in 2-3 sentences.`,
    maxTokens: 150
  })

  // Phase 2: Detailed answer (high tokens) - starts in parallel
  const detailedPromise = provider.complete({
    ...request,
    maxTokens: request.maxTokens || 2000
  })

  const [quick, detailed] = await Promise.all([quickPromise, detailedPromise])

  return { quick, detailed }
}
```

### 3. Prefetching Strategy

```typescript
class Prefetcher {
  private cache: CacheManager

  /**
   * Predict and prefetch likely next queries
   */
  async prefetch(lastQuery: string, context: ClusterContext) {
    const predictions = this.predictNextQueries(lastQuery, context)

    // Prefetch in background
    predictions.forEach(query => {
      setTimeout(() => this.fetchAndCache(query, context), 0)
    })
  }

  private predictNextQueries(lastQuery: string, context: ClusterContext): string[] {
    const queries: string[] = []

    // If asking why pod is failing, likely to ask for logs next
    if (lastQuery.includes('why') && lastQuery.includes('fail')) {
      queries.push('show me the logs')
      queries.push('what are the recent events')
    }

    // If creating a resource, likely to ask about best practices
    if (lastQuery.includes('create') || lastQuery.includes('deploy')) {
      queries.push('what are the best practices')
      queries.push('how do I secure this')
    }

    return queries
  }

  private async fetchAndCache(query: string, context: ClusterContext) {
    const hash = hashQuery(query, context)
    if (this.cache.getResponse(hash)) return // Already cached

    try {
      const response = await aiProvider.complete({
        prompt: query,
        context
      })
      this.cache.cacheResponse(hash, response)
    } catch (error) {
      // Silent fail for prefetch
    }
  }
}
```

---

## Security & Privacy

### 1. Secret Detection

```typescript
class SecretDetector {
  private patterns = [
    // API keys
    /[A-Za-z0-9]{32,}/g,
    // AWS keys
    /AKIA[0-9A-Z]{16}/g,
    // Passwords in URLs
    /:[^:@]+@/g,
    // JWT tokens
    /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g
  ]

  /**
   * Redact secrets from text before sending to AI
   */
  redact(text: string): string {
    let redacted = text

    this.patterns.forEach(pattern => {
      redacted = redacted.replace(pattern, '[REDACTED]')
    })

    return redacted
  }

  /**
   * Check if text contains potential secrets
   */
  containsSecrets(text: string): boolean {
    return this.patterns.some(pattern => pattern.test(text))
  }
}
```

### 2. Privacy-Aware Context Building

```typescript
function buildPrivacyAwareContext(context: ClusterContext, privacySettings: AIConfig['privacy']): ClusterContext {
  const filtered = { ...context }

  if (!privacySettings.sendClusterMetadata) {
    filtered.cluster = {
      name: 'redacted',
      version: 'redacted',
      provider: 'unknown',
      nodeCount: 0
    }
  }

  if (!privacySettings.sendResourceNames && filtered.currentResource) {
    filtered.currentResource.name = 'redacted'
  }

  if (!privacySettings.sendPodNames && filtered.namespace) {
    filtered.namespace.name = 'redacted'
  }

  if (!privacySettings.sendLogs && filtered.currentResource) {
    filtered.currentResource.logs = undefined
  }

  return filtered
}
```

---

## Implementation Plan

### Phase 1: Foundation (Week 1-2)

- [ ] Set up plugin structure
- [ ] Implement AI provider interface
- [ ] Create Anthropic provider with streaming
- [ ] Build basic context collector
- [ ] Implement cache manager
- [ ] Add environment variable configuration

### Phase 2: Core Features (Week 2-3)

- [ ] Create chat sidebar UI component
- [ ] Implement streaming message display
- [ ] Add settings panel
- [ ] Build command-line interface (`/ai ask`)
- [ ] Implement basic troubleshooting prompts

### Phase 3: Advanced Features (Week 3-4)

- [ ] Add manifest generation
- [ ] Implement inline suggestions
- [ ] Create hover tooltips
- [ ] Add right-click context menu
- [ ] Build proactive issue detection

### Phase 4: Optimization (Week 4-5)

- [ ] Implement request batching
- [ ] Add progressive loading
- [ ] Create prefetching system
- [ ] Optimize cache strategies
- [ ] Performance testing and tuning

### Phase 5: Polish (Week 5-6)

- [ ] User onboarding wizard
- [ ] Interactive tutorial
- [ ] Cost tracking dashboard
- [ ] Documentation
- [ ] Beta testing with 10 users

---

## Testing Strategy

### Unit Tests

- Provider implementations
- Context collectors
- Cache manager
- Prompt builders

### Integration Tests

- End-to-end query flow
- Streaming responses
- Context gathering with real kubectl
- Cache hit/miss scenarios

### Performance Tests

- Response latency (P50, P95, P99)
- Concurrent request handling
- Memory usage under load
- Cache effectiveness

### User Testing

- Task completion time
- Error recovery
- Satisfaction surveys
- Usage analytics

---

## Metrics & Monitoring

### Key Metrics

```typescript
interface AIMetrics {
  // Usage
  queriesPerDay: number
  uniqueUsers: number
  averageQueriesPerUser: number

  // Performance
  averageLatency: number
  p95Latency: number
  p99Latency: number
  cacheHitRate: number

  // Cost
  totalCost: number
  costPerQuery: number
  tokensUsed: number

  // Quality
  satisfactionScore: number
  errorRate: number
  retryRate: number
}
```

### Telemetry (Opt-in)

```typescript
function trackQuery(query: {
  type: string
  latency: number
  tokensUsed: number
  cost: number
  cacheHit: boolean
  error?: string
}) {
  // Send to analytics service (with user consent)
  analytics.track('ai.query', query)
}
```

---

## Next Steps

1. **Review and Approval** - Get stakeholder sign-off
2. **Prototype** - Build minimal chat sidebar with streaming
3. **Alpha Testing** - Internal team testing (5-10 developers)
4. **Beta Release** - Feature flag for early adopters
5. **GA Release** - Full launch with documentation

---

## Appendix

### Related Documents

- Product Requirements: `ai-assistant-prd.md`
- User Journeys: `ai-assistant-user-journeys.md`
- API Integration Guide: `ai-assistant-api-guide.md`

### Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.0",
    "openai": "^4.52.0",
    "node-cache": "^5.1.2",
    "dotenv": "^16.4.5",
    "markdown-it": "^14.1.0"
  },
  "devDependencies": {
    "@types/node-cache": "^4.2.5",
    "@types/markdown-it": "^14.1.2"
  }
}
```

### Useful Resources

- Anthropic API Docs: https://docs.anthropic.com/
- OpenAI API Docs: https://platform.openai.com/docs
- Kubernetes API Reference: https://kubernetes.io/docs/reference/
- Kui Plugin Development: https://github.com/IBM/kui/blob/master/docs/dev/
