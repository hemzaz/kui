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

/**
 * AI-Powered Command Suggestions
 *
 * Uses AI providers from kubectl-ai plugin to generate intelligent command suggestions
 * based on user context, recent commands, and patterns.
 */

import type { Command } from './commands'
import type { CommandPattern, PatternSuggestion } from '@kui-shell/core/src/main/tauri-command-palette'
import { getPatternSuggestions } from '@kui-shell/core/src/main/tauri-command-palette'

/**
 * AI suggestion result
 */
export interface AISuggestion {
  command: Command
  confidence: number
  reason: string
  source: 'ai' | 'pattern' | 'hybrid'
}

/**
 * Context for AI suggestions
 */
export interface SuggestionContext {
  recentCommands: string[]
  currentInput: string
  allCommands: Command[]
  patterns?: CommandPattern[]
}

/**
 * AI Command Suggestion Service
 */
export class AICommandSuggestionService {
  private aiProvider: any = null
  private enableAI = false

  /**
   * Initialize AI provider from kubectl-ai plugin
   */
  async initialize(): Promise<void> {
    try {
      // Try to load AI provider from kubectl-ai plugin
      // Using dynamic imports with try-catch to handle cases where plugin isn't available
      // @ts-expect-error - Dynamic import may fail if plugin not installed, handled gracefully
      const providerModule = await import('@kui-shell/plugin-kubectl-ai/services/provider-factory').catch(() => null)
      // @ts-expect-error - Dynamic import may fail if plugin not installed, handled gracefully
      const configModule = await import('@kui-shell/plugin-kubectl-ai/utils/config-loader').catch(() => null)

      if (providerModule && configModule) {
        const config = await configModule.getAIConfig()
        if (config && config.apiKey) {
          this.aiProvider = providerModule.ProviderFactory.getProvider(config)
          this.enableAI = true
        }
      }
    } catch (error) {
      console.warn('AI provider not available:', error)
      this.enableAI = false
    }
  }

  /**
   * Get command suggestions using AI and patterns
   */
  async getSuggestions(context: SuggestionContext, limit = 5): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = []

    // 1. Get pattern-based suggestions
    const patternSuggestions = await this.getPatternBasedSuggestions(context, limit)
    suggestions.push(...patternSuggestions)

    // 2. If AI is enabled, enhance with AI suggestions
    if (this.enableAI && this.aiProvider) {
      const aiSuggestions = await this.getAIEnhancedSuggestions(context, patternSuggestions, limit)
      suggestions.push(...aiSuggestions)
    }

    // 3. Deduplicate and sort by confidence
    const uniqueSuggestions = this.deduplicateSuggestions(suggestions)
    const sortedSuggestions = uniqueSuggestions.sort((a, b) => b.confidence - a.confidence)

    // 4. Return top suggestions
    return sortedSuggestions.slice(0, limit)
  }

  /**
   * Get pattern-based suggestions
   */
  private async getPatternBasedSuggestions(
    context: SuggestionContext,
    limit: number
  ): Promise<AISuggestion[]> {
    try {
      const patternSuggestions = await getPatternSuggestions(context.recentCommands, limit * 2)

      return patternSuggestions.map((ps: PatternSuggestion) => {
        const command = context.allCommands.find(c => c.id === ps.next_command)
        if (!command) return null

        return {
          command,
          confidence: ps.confidence * 0.8, // Slightly lower confidence for pattern-only
          reason: `Often follows: ${this.formatPattern(ps.context)}`,
          source: 'pattern' as const
        }
      }).filter(Boolean) as AISuggestion[]
    } catch (error) {
      console.warn('Failed to get pattern suggestions:', error)
      return []
    }
  }

  /**
   * Get AI-enhanced suggestions
   */
  private async getAIEnhancedSuggestions(
    context: SuggestionContext,
    existingSuggestions: AISuggestion[],
    limit: number
  ): Promise<AISuggestion[]> {
    try {
      const prompt = this.buildAIPrompt(context, existingSuggestions)

      const response = await this.aiProvider.complete({
        prompt,
        systemPrompt: this.getSystemPrompt(),
        temperature: 0.3, // Lower temperature for more deterministic suggestions
        maxTokens: 500
      })

      return this.parseAIResponse(response.content, context.allCommands)
    } catch (error) {
      console.warn('AI suggestions failed:', error)
      return []
    }
  }

  /**
   * Build AI prompt for command suggestions
   */
  private buildAIPrompt(context: SuggestionContext, existingSuggestions: AISuggestion[]): string {
    const recentCommandsStr = context.recentCommands.slice(-5).join(' → ')
    const currentInputStr = context.currentInput || '(empty)'

    let prompt = `Recent command sequence: ${recentCommandsStr}
Current input: ${currentInputStr}

Available commands:
${context.allCommands.slice(0, 20).map(c => `- ${c.id}: ${c.description || c.name}`).join('\n')}
`

    if (existingSuggestions.length > 0) {
      prompt += `\nPattern-based suggestions:
${existingSuggestions.map(s => `- ${s.command.id} (confidence: ${s.confidence.toFixed(2)})`).join('\n')}
`
    }

    prompt += `\nBased on this context, suggest 3-5 commands the user might want to run next. For each suggestion, provide:
1. Command ID (must match one from available commands)
2. Confidence score (0-1)
3. Brief reason why this command makes sense

Format your response as JSON:
[
  {"commandId": "...", "confidence": 0.95, "reason": "..."},
  ...
]`

    return prompt
  }

  /**
   * System prompt for AI suggestions
   */
  private getSystemPrompt(): string {
    return `You are a Kubernetes command suggestion assistant. Your task is to predict which kubectl commands a user might want to run next based on their recent command history and current context.

Consider:
- Command sequences that make sense together (e.g., get pods → describe pod → logs)
- Troubleshooting workflows (e.g., get events after pod failures)
- Resource lifecycle patterns (create → get → describe → edit → delete)
- Common Kubernetes operations and best practices

Provide confident, actionable suggestions with clear reasoning.`
  }

  /**
   * Parse AI response into suggestions
   */
  private parseAIResponse(content: string, allCommands: Command[]): AISuggestion[] {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (!jsonMatch) return []

      const parsed = JSON.parse(jsonMatch[0])
      if (!Array.isArray(parsed)) return []

      return parsed.map(item => {
        const command = allCommands.find(c => c.id === item.commandId)
        if (!command) return null

        return {
          command,
          confidence: Math.min(Math.max(item.confidence || 0, 0), 1),
          reason: item.reason || 'AI suggested',
          source: 'ai' as const
        }
      }).filter(Boolean) as AISuggestion[]
    } catch (error) {
      console.warn('Failed to parse AI response:', error)
      return []
    }
  }

  /**
   * Deduplicate suggestions by command ID
   */
  private deduplicateSuggestions(suggestions: AISuggestion[]): AISuggestion[] {
    const seen = new Map<string, AISuggestion>()

    for (const suggestion of suggestions) {
      const existing = seen.get(suggestion.command.id)
      if (!existing || suggestion.confidence > existing.confidence) {
        // If AI and pattern both suggest the same command, boost confidence
        if (existing && existing.source !== suggestion.source) {
          suggestion.confidence = Math.min((suggestion.confidence + existing.confidence) / 1.5, 1.0)
          suggestion.source = 'hybrid'
          suggestion.reason = `${existing.reason} + ${suggestion.reason}`
        }
        seen.set(suggestion.command.id, suggestion)
      }
    }

    return Array.from(seen.values())
  }

  /**
   * Format pattern for display
   */
  private formatPattern(pattern: string): string {
    // Pattern format: "cmd1 -> cmd2 -> cmd3"
    const commands = pattern.split(' -> ')
    if (commands.length <= 3) return pattern

    // Show last 3 commands
    return '... → ' + commands.slice(-3).join(' → ')
  }

  /**
   * Check if AI is available
   */
  isAIAvailable(): boolean {
    return this.enableAI && this.aiProvider !== null
  }

  /**
   * Get AI provider info
   */
  getAIInfo(): { provider: string; model: string } | null {
    if (!this.aiProvider) return null

    return {
      provider: this.aiProvider.name || 'unknown',
      model: this.aiProvider.config?.model || 'default'
    }
  }
}

/**
 * Global AI suggestion service instance
 */
let aiSuggestionService: AICommandSuggestionService | null = null

/**
 * Get or create AI suggestion service
 */
export async function getAISuggestionService(): Promise<AICommandSuggestionService> {
  if (!aiSuggestionService) {
    aiSuggestionService = new AICommandSuggestionService()
    await aiSuggestionService.initialize()
  }
  return aiSuggestionService
}

/**
 * Get command suggestions (convenience function)
 */
export async function getCommandSuggestions(
  context: SuggestionContext,
  limit = 5
): Promise<AISuggestion[]> {
  const service = await getAISuggestionService()
  return service.getSuggestions(context, limit)
}
