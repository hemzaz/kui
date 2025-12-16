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

import type { AIProvider, AICompletionRequest, AIResponse, AIChunk } from '../types/ai-types'

/**
 * Base abstract class for AI providers with common utilities
 */
export abstract class BaseAIProvider implements AIProvider {
  public abstract name: string
  public abstract models: string[]

  public abstract streamCompletion(request: AICompletionRequest): AsyncIterator<AIChunk>
  public abstract complete(request: AICompletionRequest): Promise<AIResponse>
  public abstract testConnection(): Promise<{ success: boolean; error?: string }>
  public abstract estimateCost(request: AICompletionRequest): number

  /**
   * Estimate token count for text (rough approximation)
   * @param text - Text to estimate
   * @returns Estimated token count
   */
  protected estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }

  /**
   * Build system prompt for Kubernetes assistant
   * @returns System prompt
   */
  protected buildSystemPrompt(): string {
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

  /**
   * Log usage for metrics and cost tracking
   * @param usage - Usage data
   */
  protected logUsage(usage: { inputTokens: number; outputTokens: number; latency: number; cost?: number }): void {
    // TODO: Implement proper usage tracking
    console.debug('AI Usage:', usage)
  }
}

export type { AIProvider }
