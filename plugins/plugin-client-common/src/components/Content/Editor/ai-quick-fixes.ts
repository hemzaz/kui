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
 * AI-Powered Quick Fixes for Monaco Editor
 *
 * Provides intelligent error fixes using AI when YAML/JSON validation errors occur.
 */

import * as monaco from 'monaco-editor'

/**
 * AI provider interface
 */
interface AIProvider {
  complete(request: {
    prompt: string
    systemPrompt?: string
    temperature?: number
    maxTokens?: number
  }): Promise<{
    content: string
    model: string
    usage: { inputTokens: number; outputTokens: number }
  }>
  name: string
}

let aiProvider: AIProvider | null = null

/**
 * Get AI provider (shared with completion provider)
 */
async function getAIProvider(): Promise<AIProvider | null> {
  if (aiProvider) {
    return aiProvider
  }

  try {
    // @ts-expect-error - Dynamic import
    const configModule = await import('@kui-shell/plugin-kubectl-ai/utils/config-loader').catch(() => null)
    // @ts-expect-error - Dynamic import
    const providerModule = await import('@kui-shell/plugin-kubectl-ai/services/provider-factory').catch(() => null)

    if (!configModule || !providerModule) {
      return null
    }

    const config = await configModule.getAIConfig()
    if (!config || !config.apiKey) {
      return null
    }

    aiProvider = providerModule.ProviderFactory.getProvider(config)
    return aiProvider
  } catch (error) {
    console.warn('AI quick fix provider not available:', error)
    return null
  }
}

/**
 * Generate AI-powered fix for an error
 */
async function generateFix(
  model: monaco.editor.ITextModel,
  marker: monaco.editor.IMarker
): Promise<string | null> {
  const provider = await getAIProvider()
  if (!provider) {
    return null
  }

  // Get context around the error
  const errorLineContent = model.getLineContent(marker.startLineNumber)
  const contextBefore = model.getValueInRange(
    new monaco.Range(
      Math.max(1, marker.startLineNumber - 5),
      1,
      marker.startLineNumber - 1,
      model.getLineMaxColumn(marker.startLineNumber - 1)
    )
  )
  const contextAfter = model.getValueInRange(
    new monaco.Range(
      marker.startLineNumber + 1,
      1,
      Math.min(model.getLineCount(), marker.startLineNumber + 5),
      model.getLineMaxColumn(Math.min(model.getLineCount(), marker.startLineNumber + 5))
    )
  )

  const prompt = `Fix this ${model.getLanguageId()} error:

Error: ${marker.message}
Line ${marker.startLineNumber}: ${errorLineContent}

Context:
\`\`\`
${contextBefore}
>>> ${errorLineContent} <<<  (ERROR HERE)
${contextAfter}
\`\`\`

Provide ONLY the fixed line (no explanations, no markdown):
`

  try {
    const response = await provider.complete({
      prompt,
      systemPrompt: 'You are a code fix assistant. Return only the fixed line of code, nothing else.',
      temperature: 0.2,
      maxTokens: 200
    })

    // Extract the fixed line from response
    const fixedLine = response.content
      .trim()
      .replace(/^```[\w]*\n?/, '')
      .replace(/\n?```$/, '')
      .split('\n')[0]
      .trim()

    return fixedLine || null
  } catch (error) {
    console.warn('AI quick fix error:', error)
    return null
  }
}

/**
 * Register AI quick fix provider
 */
export function registerAIQuickFixProvider(): monaco.IDisposable[] {
  const disposables: monaco.IDisposable[] = []

  // Register for YAML
  disposables.push(
    monaco.languages.registerCodeActionProvider('yaml', {
      provideCodeActions: async (model, range, context, token) => {
        const actions: monaco.languages.CodeAction[] = []

        // Get markers (errors/warnings) in range
        const markers = monaco.editor.getModelMarkers({ resource: model.uri }).filter(marker => {
          return (
            marker.severity === monaco.MarkerSeverity.Error &&
            marker.startLineNumber >= range.startLineNumber &&
            marker.endLineNumber <= range.endLineNumber
          )
        })

        // Generate fixes for each error
        for (const marker of markers) {
          const fix = await generateFix(model, marker)
          if (fix) {
            actions.push({
              title: `💡 AI Fix: "${fix.substring(0, 40)}${fix.length > 40 ? '...' : ''}"`,
              kind: 'quickfix',
              edit: {
                edits: [
                  {
                    resource: model.uri,
                    versionId: model.getVersionId(),
                    textEdit: {
                      range: new monaco.Range(
                        marker.startLineNumber,
                        1,
                        marker.startLineNumber,
                        model.getLineMaxColumn(marker.startLineNumber)
                      ),
                      text: fix
                    }
                  }
                ]
              },
              diagnostics: [marker as any],
              isPreferred: true
            })
          }
        }

        return { actions, dispose: () => {} }
      }
    })
  )

  // Register for JSON
  disposables.push(
    monaco.languages.registerCodeActionProvider('json', {
      provideCodeActions: async (model, range, context, token) => {
        const actions: monaco.languages.CodeAction[] = []

        // Get markers (errors/warnings) in range
        const markers = monaco.editor.getModelMarkers({ resource: model.uri }).filter(marker => {
          return (
            marker.severity === monaco.MarkerSeverity.Error &&
            marker.startLineNumber >= range.startLineNumber &&
            marker.endLineNumber <= range.endLineNumber
          )
        })

        // Generate fixes for each error
        for (const marker of markers) {
          const fix = await generateFix(model, marker)
          if (fix) {
            actions.push({
              title: `💡 AI Fix: "${fix.substring(0, 40)}${fix.length > 40 ? '...' : ''}"`,
              kind: 'quickfix',
              edit: {
                edits: [
                  {
                    resource: model.uri,
                    versionId: model.getVersionId(),
                    textEdit: {
                      range: new monaco.Range(
                        marker.startLineNumber,
                        1,
                        marker.startLineNumber,
                        model.getLineMaxColumn(marker.startLineNumber)
                      ),
                      text: fix
                    }
                  }
                ]
              },
              diagnostics: [marker as any],
              isPreferred: true
            })
          }
        }

        return { actions, dispose: () => {} }
      }
    })
  )

  return disposables
}
