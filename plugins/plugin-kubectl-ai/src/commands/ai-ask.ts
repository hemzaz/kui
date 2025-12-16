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

import { Arguments, Registrar, UsageError } from '@kui-shell/core'

interface AskOptions {
  context?: boolean
  streaming?: boolean
  namespace?: string
  n?: string
  resource?: string
}

/**
 * Command handler for /ai ask
 * Ask the AI assistant a question about Kubernetes
 */
async function aiAskHandler(args: Arguments<AskOptions>): Promise<string> {
  const { argvNoOptions, parsedOptions } = args

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

  // Build options object
  const options = {
    question: question.trim(),
    includeContext: parsedOptions.context || false,
    streaming: parsedOptions.streaming || false,
    namespace: parsedOptions.namespace || parsedOptions.n,
    resource: parsedOptions.resource
  }

  // TODO: Implement actual AI provider call
  // For now, return a placeholder response
  const response = [
    `Question: ${options.question}`,
    '',
    'AI Response:',
    'This is a placeholder response. The AI provider integration is not yet implemented.',
    '',
    'Options:',
    `- Include context: ${options.includeContext}`,
    `- Streaming: ${options.streaming}`,
    options.namespace ? `- Namespace: ${options.namespace}` : '',
    options.resource ? `- Resource: ${options.resource}` : ''
  ]
    .filter(Boolean)
    .join('\n')

  return response
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
