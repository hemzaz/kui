/*
 * Copyright 2024 The Kubernetes Authors
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

import { Arguments, Registrar, UsageError, XtermResponse } from '@kui-shell/core'
import { ClusterDataCollector } from '../context/cluster-data-collector'
import { ProviderFactory } from '../services/provider-factory'
import { loadConfig } from '../utils/config-loader'
import type { AIProviderError } from '../types/ai-types'

interface AskOptions {
  context?: boolean
  streaming?: boolean
  namespace?: string
  n?: string
  resource?: string
}

/**
 * Parse resource string (format: kind/name or just name)
 */
function parseResourceString(resourceStr: string): { kind: string; name: string } {
  const parts = resourceStr.split('/')
  if (parts.length === 2) {
    return { kind: parts[0], name: parts[1] }
  }
  // Default to pod if only name is provided
  return { kind: 'pod', name: resourceStr }
}

/**
 * Command handler for /ai ask
 * Ask the AI assistant a question about Kubernetes
 */
async function aiAskHandler(args: Arguments<AskOptions>): Promise<string | XtermResponse> {
  const { argvNoOptions, parsedOptions, REPL } = args

  // Extract question from arguments (everything after 'ask')
  const askIndex = argvNoOptions.indexOf('ask')
  if (askIndex === -1) {
    throw new UsageError({ message: 'Command must include "ask"' })
  }

  const question = argvNoOptions.slice(askIndex + 1).join(' ')

  if (!question || question.trim().length === 0) {
    throw new UsageError({
      message: 'Please provide a question to ask the AI assistant',
      usage: {
        command: 'ai ask',
        docs: 'Ask the AI assistant a question about Kubernetes',
        example: 'ai ask "why is my pod crashing?"',
        required: [{ name: 'question', docs: 'The question to ask' }],
        optional: [
          { name: '--context', docs: 'Include current resource context', boolean: true },
          { name: '--streaming', docs: 'Stream response in real-time', boolean: true },
          { name: '--namespace', docs: 'Kubernetes namespace to use for context', alias: 'n' },
          { name: '--resource', docs: 'Specific resource to include in context (format: kind/name)' }
        ]
      }
    })
  }

  try {
    // Load AI configuration
    const config = await loadConfig()

    // Initialize AI provider
    const provider = ProviderFactory.getProvider(config)

    // Prepare completion request
    const request = {
      prompt: question.trim(),
      stream: parsedOptions.streaming || config.streaming
    }

    // Gather cluster context if requested
    if (parsedOptions.context || parsedOptions.resource) {
      const collector = new ClusterDataCollector(REPL)
      const namespace = parsedOptions.namespace || parsedOptions.n

      const captureOptions: {
        namespace?: string
        resource?: { kind: string; name: string; namespace: string }
      } = {
        namespace
      }

      // Add resource context if specified
      if (parsedOptions.resource) {
        const resource = parseResourceString(parsedOptions.resource)
        captureOptions.resource = {
          kind: resource.kind,
          name: resource.name,
          namespace: namespace || 'default'
        }
      }

      const snapshot = await collector.captureClusterSnapshot(captureOptions)
      request['clusterData'] = snapshot
    }

    // Handle streaming vs non-streaming
    if (request.stream) {
      // For streaming, we'll accumulate chunks and return as string
      // In the future, we could use XtermResponse for true streaming
      let fullResponse = ''

      for await (const chunk of provider.streamCompletion(request)) {
        if (!chunk.done) {
          fullResponse += chunk.delta
        }
      }

      return formatResponse(question.trim(), fullResponse)
    } else {
      // Non-streaming completion
      const response = await provider.complete(request)
      return formatResponse(question.trim(), response.content, response.usage, response.cost)
    }
  } catch (error) {
    const err = error as AIProviderError
    throw new UsageError({
      message: `AI request failed: ${err.message}`,
      usage: {
        command: 'ai ask',
        docs: 'Ask the AI assistant a question about Kubernetes',
        example: 'ai ask "why is my pod crashing?"'
      }
    })
  }
}

/**
 * Format the response for display
 */
function formatResponse(
  question: string,
  answer: string,
  usage?: { inputTokens: number; outputTokens: number },
  cost?: number
): string {
  const parts = ['Question:', question, '', 'Answer:', answer, '']

  if (usage) {
    parts.push('---')
    parts.push(
      `Tokens: ${usage.inputTokens} input, ${usage.outputTokens} output (${usage.inputTokens + usage.outputTokens} total)`
    )
    if (cost) {
      parts.push(`Cost: $${cost.toFixed(6)}`)
    }
  }

  return parts.join('\n')
}

/**
 * Register the /ai ask command
 */
export default async (registrar: Registrar) => {
  registrar.listen('/ai/ask', aiAskHandler, {
    usage: {
      command: 'ask',
      docs: 'Ask the AI assistant a question about Kubernetes',
      example: 'ai ask "why is my pod crashing?"',
      required: [{ name: 'question', docs: 'The question to ask the AI assistant' }],
      optional: [
        {
          name: '--context',
          docs: 'Include current Kubernetes resource context in the query',
          boolean: true
        },
        {
          name: '--streaming',
          docs: 'Stream the AI response in real-time as it is generated',
          boolean: true
        },
        {
          name: '--namespace',
          alias: 'n',
          docs: 'Kubernetes namespace to use for gathering context'
        },
        {
          name: '--resource',
          docs: 'Specific resource to include in context (format: kind/name, e.g., pod/nginx-xxx)'
        }
      ]
    }
  })
}
