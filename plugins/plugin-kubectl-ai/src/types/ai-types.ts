/*
 * Copyright 2025 The Kubernetes Authors
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

import type { ClusterSnapshot } from './cluster-types'

/**
 * AI Provider interface - all providers must implement this
 */
export interface AIProvider {
  /** Provider name (e.g., 'anthropic', 'openai') */
  name: string

  /** Available models for this provider */
  models: string[]

  /**
   * Send a prompt and get streaming response
   * @param request - The completion request
   * @returns Async iterator of response chunks
   */
  streamCompletion(request: AICompletionRequest): AsyncIterable<AIChunk>

  /**
   * Send a prompt and get full response
   * @param request - The completion request
   * @returns Complete AI response
   */
  complete(request: AICompletionRequest): Promise<AIResponse>

  /**
   * Test API connection
   * @returns Test result with success status and optional error
   */
  testConnection(): Promise<{ success: boolean; error?: string }>

  /**
   * Get estimated cost for a request
   * @param request - The completion request
   * @returns Estimated cost in USD
   */
  estimateCost(request: AICompletionRequest): number
}

/**
 * Request object for AI completions
 */
export interface AICompletionRequest {
  /** User prompt/question */
  prompt: string

  /** System prompt for instruction */
  systemPrompt?: string

  /** Model to use (if not specified, uses config default) */
  model?: string

  /** Maximum tokens to generate */
  maxTokens?: number

  /** Temperature for sampling (0-1) */
  temperature?: number

  /** Whether to stream the response */
  stream?: boolean

  /** Available tools/functions for the AI */
  tools?: AITool[]

  /** Cluster context data */
  clusterData?: ClusterSnapshot
}

/**
 * Complete AI response
 */
export interface AIResponse {
  /** Response content */
  content: string

  /** Model used for generation */
  model: string

  /** Token usage statistics */
  usage: {
    inputTokens: number
    outputTokens: number
  }

  /** Cost in USD (if available) */
  cost?: number

  /** Response latency in milliseconds */
  latency: number

  /** Whether response was served from cache */
  cached?: boolean
}

/**
 * Streaming response chunk
 */
export interface AIChunk {
  /** Content delta for this chunk */
  delta: string

  /** Whether this is the final chunk */
  done: boolean

  /** Token usage (only present in final chunk) */
  usage?: {
    inputTokens: number
    outputTokens: number
  }
}

/**
 * Tool/function definition for AI
 */
export interface AITool {
  /** Tool name */
  name: string

  /** Tool description */
  description: string

  /** JSON schema for parameters */
  parameters: Record<string, unknown>

  /** Handler function for tool execution */
  handler: (args: unknown) => Promise<unknown>
}

/**
 * AI Configuration stored in settings
 */
export interface AIConfig {
  /** Provider selection */
  provider: 'anthropic' | 'openai' | 'azure' | 'ollama' | 'custom'

  /** API key for the provider */
  apiKey?: string

  /** Custom base URL for API */
  baseUrl?: string

  /** Default model to use */
  model: string

  /** Maximum tokens per request */
  maxTokens: number

  /** Temperature for sampling (0-1) */
  temperature: number

  /** Request timeout in seconds */
  timeout: number

  /** Privacy settings */
  privacy: {
    /** Send cluster metadata (name, version, provider) */
    sendClusterMetadata: boolean

    /** Send resource names */
    sendResourceNames: boolean

    /** Send pod logs */
    sendLogs: boolean

    /** Send pod names */
    sendPodNames: boolean
  }

  /** Enable streaming responses */
  streaming: boolean

  /** Enable response caching */
  caching: boolean

  /** Cache TTL in seconds */
  cacheTTL: number

  /** Monthly cost limit in USD */
  monthlyLimit?: number

  /** Show cost alerts */
  costAlerts: boolean
}

/**
 * Default AI configuration
 */
export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 4096,
  temperature: 0.7,
  timeout: 30,
  privacy: {
    sendClusterMetadata: true,
    sendResourceNames: true,
    sendLogs: false,
    sendPodNames: false
  },
  streaming: true,
  caching: true,
  cacheTTL: 300,
  costAlerts: true
}

/**
 * AI Provider error types
 */
export class AIProviderError extends Error {
  public constructor(
    message: string,
    public code: AIProviderErrorCode,
    public details?: unknown
  ) {
    super(message)
    this.name = 'AIProviderError'
  }
}

export enum AIProviderErrorCode {
  INVALID_API_KEY = 'INVALID_API_KEY',
  RATE_LIMIT = 'RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  INVALID_REQUEST = 'INVALID_REQUEST',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}
