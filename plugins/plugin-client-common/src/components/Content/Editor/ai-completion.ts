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
 * AI-Powered Code Completion for Monaco Editor
 *
 * Integrates with kubectl-ai plugin to provide intelligent YAML/JSON completions
 * based on Kubernetes schemas and AI understanding of context.
 */

import * as monaco from 'monaco-editor'

/**
 * AI completion suggestion (internal format)
 */
interface AICompletionSuggestion {
  label: string
  text: string
  documentation?: string
  sortText?: string
  detail?: string
  kind?: string
}

/**
 * AI completion request (kubectl-ai format)
 */
interface AICompletionRequest {
  prompt: string
  systemPrompt?: string
  model?: string
  maxTokens?: number
  temperature?: number
}

/**
 * AI response (kubectl-ai format)
 */
interface AIResponse {
  content: string
  model: string
  usage: {
    inputTokens: number
    outputTokens: number
  }
}

/**
 * AI provider interface (from kubectl-ai plugin)
 */
interface AIProvider {
  complete(request: AICompletionRequest): Promise<AIResponse>
  name: string
}

/**
 * Get AI provider from kubectl-ai plugin
 * Uses dynamic import to gracefully handle when plugin is not available
 */
async function getAIProvider(): Promise<AIProvider | null> {
  try {
    // @ts-expect-error - Dynamic import may fail if plugin not installed
    const configModule = await import('@kui-shell/plugin-kubectl-ai/utils/config-loader').catch(() => null)
    // @ts-expect-error - Dynamic import may fail if plugin not installed
    const providerModule = await import('@kui-shell/plugin-kubectl-ai/services/provider-factory').catch(() => null)

    if (!configModule || !providerModule) {
      return null
    }

    const config = await configModule.getAIConfig()
    if (!config || !config.apiKey) {
      return null
    }

    return providerModule.ProviderFactory.getProvider(config)
  } catch (error) {
    console.warn('AI completion provider not available:', error)
    return null
  }
}

/**
 * Build AI completion prompt from editor context
 */
function buildCompletionPrompt(
  model: monaco.editor.ITextModel,
  position: monaco.Position
): { context: string; line: string } {
  const currentLine = model.getLineContent(position.lineNumber)

  // Get context: up to 20 lines before cursor
  const contextLines = Math.min(position.lineNumber - 1, 20)
  const contextStartLine = Math.max(1, position.lineNumber - contextLines)

  const contextRange = new monaco.Range(
    contextStartLine,
    1,
    position.lineNumber - 1,
    model.getLineMaxColumn(position.lineNumber - 1)
  )

  const context = model.getValueInRange(contextRange)

  return { context, line: currentLine }
}

/**
 * Get completions from AI provider
 */
async function getAICompletions(
  language: string,
  context: string,
  line: string,
  position: { line: number; column: number }
): Promise<AICompletionSuggestion[]> {
  if (!aiProvider) {
    return []
  }

  const prompt = `You are providing code completions for a ${language} file.

Context (previous lines):
\`\`\`${language}
${context}
\`\`\`

Current line being edited (cursor at column ${position.column}):
${line}

Suggest 3-5 completions for what the user might type next. Consider:
- Kubernetes resource field names and values
- YAML/JSON syntax
- Common patterns and best practices
- Current indentation level

Respond with ONLY a JSON array of completions:
[
  {"label": "field-name", "text": "field-name: ", "kind": "property", "documentation": "Description"},
  ...
]`

  try {
    const response = await aiProvider.complete({
      prompt,
      systemPrompt: 'You are a code completion assistant. Respond only with valid JSON.',
      temperature: 0.3,
      maxTokens: 500
    })

    // Parse JSON response
    const jsonMatch = response.content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.warn('AI completion: No JSON array in response')
      return []
    }

    const suggestions = JSON.parse(jsonMatch[0]) as AICompletionSuggestion[]
    return suggestions
  } catch (error) {
    console.warn('AI completion error:', error)
    return []
  }
}

/**
 * Map AI completion kind to Monaco completion kind
 */
function getMonacoCompletionKind(kind?: string): monaco.languages.CompletionItemKind {
  switch (kind?.toLowerCase()) {
    case 'property':
    case 'field':
      return monaco.languages.CompletionItemKind.Property
    case 'value':
      return monaco.languages.CompletionItemKind.Value
    case 'enum':
      return monaco.languages.CompletionItemKind.Enum
    case 'snippet':
      return monaco.languages.CompletionItemKind.Snippet
    case 'keyword':
      return monaco.languages.CompletionItemKind.Keyword
    default:
      return monaco.languages.CompletionItemKind.Text
  }
}

/**
 * Determine if AI completions should be triggered
 *
 * Skip if:
 * - User is still typing a word (not at a trigger character)
 * - Position is at start of line with no context
 */
function shouldProvideCompletions(
  model: monaco.editor.ITextModel,
  position: monaco.Position,
  context: monaco.languages.CompletionContext
): boolean {
  // Always provide on explicit trigger
  if (context.triggerKind === monaco.languages.CompletionTriggerKind.TriggerCharacter) {
    return true
  }

  // Provide if user explicitly invoked (Ctrl+Space)
  if (context.triggerKind === monaco.languages.CompletionTriggerKind.Invoke) {
    return true
  }

  // Skip if at very beginning of document
  if (position.lineNumber === 1 && position.column === 1) {
    return false
  }

  return true
}

let aiProvider: AIProvider | null = null
let providerInitialized = false

/**
 * Register AI completion provider for YAML and JSON
 *
 * @returns Disposable to unregister the provider
 */
export function registerAICompletionProvider(): monaco.IDisposable[] {
  const disposables: monaco.IDisposable[] = []

  // Initialize AI provider (async)
  if (!providerInitialized) {
    providerInitialized = true
    getAIProvider().then(provider => {
      aiProvider = provider
      if (aiProvider) {
        console.log('AI completion provider initialized:', aiProvider.name)
      }
    })
  }

  // Register for YAML
  disposables.push(
    monaco.languages.registerCompletionItemProvider('yaml', {
      triggerCharacters: [' ', '.', ':', '-', '\n'],

      async provideCompletionItems(model, position, context, token) {
        // Check if AI provider is available
        if (!aiProvider) {
          return { suggestions: [] }
        }

        // Check if we should provide completions
        if (!shouldProvideCompletions(model, position, context)) {
          return { suggestions: [] }
        }

        try {
          // Get word being typed for range calculation
          const word = model.getWordUntilPosition(position)
          const range = new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          )

          // Build completion prompt
          const { context: fileContext, line } = buildCompletionPrompt(model, position)

          // Request completions from AI
          const suggestions = await getAICompletions('yaml', fileContext, line, {
            line: position.lineNumber,
            column: position.column
          })

          // Map to Monaco completions
          return {
            suggestions: suggestions.map(s => ({
              label: s.label,
              kind: getMonacoCompletionKind(s.kind),
              documentation: s.documentation ? { value: s.documentation } : undefined,
              insertText: s.text,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
              sortText: s.sortText || `_${s.label}`, // Sort AI suggestions first
              detail: s.detail || '✨ AI Suggestion'
            }))
          }
        } catch (error) {
          console.warn('AI completion error:', error)
          return { suggestions: [] }
        }
      }
    })
  )

  // Register for JSON
  disposables.push(
    monaco.languages.registerCompletionItemProvider('json', {
      triggerCharacters: ['"', ':', ' ', '\n'],

      async provideCompletionItems(model, position, context, token) {
        // Check if AI provider is available
        if (!aiProvider) {
          return { suggestions: [] }
        }

        // Check if we should provide completions
        if (!shouldProvideCompletions(model, position, context)) {
          return { suggestions: [] }
        }

        try {
          // Get word being typed for range calculation
          const word = model.getWordUntilPosition(position)
          const range = new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          )

          // Build completion prompt
          const { context: fileContext, line } = buildCompletionPrompt(model, position)

          // Request completions from AI
          const suggestions = await getAICompletions('json', fileContext, line, {
            line: position.lineNumber,
            column: position.column
          })

          // Map to Monaco completions
          return {
            suggestions: suggestions.map(s => ({
              label: s.label,
              kind: getMonacoCompletionKind(s.kind),
              documentation: s.documentation ? { value: s.documentation } : undefined,
              insertText: s.text,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
              sortText: s.sortText || `_${s.label}`, // Sort AI suggestions first
              detail: s.detail || '✨ AI Suggestion'
            }))
          }
        } catch (error) {
          console.warn('AI completion error:', error)
          return { suggestions: [] }
        }
      }
    })
  )

  return disposables
}

/**
 * Check if AI completion provider is available
 */
export function isAICompletionAvailable(): boolean {
  return aiProvider !== null
}
