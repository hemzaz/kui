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
import { ClusterDataCollector } from '../context/cluster-data-collector'
import { ProviderFactory } from '../services/provider-factory'
import { loadConfig } from '../utils/config-loader'
import { TROUBLESHOOTING_PROMPT } from '../prompts/system-prompts'
import type { AIProviderError } from '../types/ai-types'

interface DebugOptions {
  namespace?: string
  n?: string
  logs?: boolean
  events?: boolean
  manifest?: boolean
  'no-logs'?: boolean
  'no-events'?: boolean
}

/**
 * Parse resource string (format: kind/name or just name)
 */
function parseResourceString(resourceStr: string): { kind?: string; name: string } {
  const parts = resourceStr.split('/')
  if (parts.length === 2) {
    return { kind: parts[0], name: parts[1] }
  }
  return { name: resourceStr }
}

/**
 * Command handler for /ai debug
 * Debug a Kubernetes resource with AI assistance
 */
async function aiDebugHandler(args: Arguments<DebugOptions>): Promise<string> {
  const { argvNoOptions, parsedOptions, REPL } = args

  // Extract resource from arguments (everything after 'debug')
  const debugIndex = argvNoOptions.indexOf('debug')
  if (debugIndex === -1) {
    throw new UsageError({ message: 'Command must include "debug"' })
  }

  const resourceArg = argvNoOptions[debugIndex + 1]

  if (!resourceArg) {
    throw new UsageError({
      message: 'Please provide a resource to debug',
      usage: {
        command: 'ai debug',
        docs: 'Debug a Kubernetes resource with AI assistance',
        example: 'ai debug pod/api-server-xyz',
        required: [
          {
            name: 'resource',
            docs: 'Resource to debug (format: kind/name or just name). Examples: pod/nginx-xxx, deployment/api'
          }
        ],
        optional: [
          { name: '--namespace', alias: 'n', docs: 'Kubernetes namespace (defaults to current namespace)' },
          { name: '--logs', docs: 'Include pod logs in analysis', boolean: true },
          { name: '--events', docs: 'Include Kubernetes events in analysis', boolean: true },
          { name: '--manifest', docs: 'Include full resource manifest in analysis', boolean: true },
          { name: '--no-logs', docs: 'Exclude pod logs from analysis', boolean: true },
          { name: '--no-events', docs: 'Exclude events from analysis', boolean: true }
        ]
      }
    })
  }

  try {
    const resource = parseResourceString(resourceArg)
    const namespace = parsedOptions.namespace || parsedOptions.n || 'default'

    // Determine what to include in analysis
    // By default: include logs and events unless explicitly disabled
    const includeLogs = parsedOptions.logs !== false && parsedOptions['no-logs'] !== true
    const includeEvents = parsedOptions.events !== false && parsedOptions['no-events'] !== true
    const includeManifest = parsedOptions.manifest === true

    // Gather cluster context with resource details
    const collector = new ClusterDataCollector(REPL)
    const snapshot = await collector.captureClusterSnapshot({
      namespace,
      resource: {
        kind: resource.kind || 'pod',
        name: resource.name,
        namespace
      },
      includeLogs,
      includeEvents,
      includeManifest
    })

    // Load AI configuration and initialize provider
    const config = await loadConfig()
    const provider = ProviderFactory.getProvider(config)

    // Build debugging prompt
    const prompt = buildDebugPrompt(resource, namespace, includeLogs, includeEvents, includeManifest)

    // Call AI provider
    const response = await provider.complete({
      prompt,
      systemPrompt: TROUBLESHOOTING_PROMPT,
      clusterData: snapshot,
      stream: false
    })

    return formatDebugResponse(resource, namespace, response.content, response.usage, response.cost)
  } catch (error) {
    const err = error as AIProviderError
    throw new UsageError({
      message: `AI debug failed: ${err.message}`,
      usage: {
        command: 'ai debug',
        docs: 'Debug a Kubernetes resource with AI assistance',
        example: 'ai debug pod/api-server-xyz'
      }
    })
  }
}

/**
 * Build the debugging prompt
 */
function buildDebugPrompt(
  resource: { kind?: string; name: string },
  namespace: string,
  includeLogs: boolean,
  includeEvents: boolean,
  includeManifest: boolean
): string {
  const kind = resource.kind || 'pod'

  const parts = [
    `Please analyze and debug the ${kind} "${resource.name}" in namespace "${namespace}".`,
    '',
    'Focus on:',
    '1. Identifying any issues or errors',
    '2. Explaining the root cause',
    '3. Providing actionable fix recommendations',
    '4. Suggesting kubectl commands to resolve issues',
    ''
  ]

  if (includeLogs) {
    parts.push('- Analyze the logs for errors and warnings')
  }
  if (includeEvents) {
    parts.push('- Review Kubernetes events for problems')
  }
  if (includeManifest) {
    parts.push('- Check the manifest for configuration issues')
  }

  parts.push('')
  parts.push('Provide a clear, actionable analysis.')

  return parts.join('\n')
}

/**
 * Format the debug response for display
 */
function formatDebugResponse(
  resource: { kind?: string; name: string },
  namespace: string,
  analysis: string,
  usage?: { inputTokens: number; outputTokens: number },
  cost?: number
): string {
  const kind = resource.kind || 'pod'

  const parts = [`Debugging ${kind}/${resource.name} (namespace: ${namespace})`, '='.repeat(60), '', analysis, '']

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
 * Register the /ai debug command
 */
export default async (registrar: Registrar) => {
  registrar.listen('/ai/debug', aiDebugHandler, {
    usage: {
      command: 'debug',
      docs: 'Debug a Kubernetes resource with AI assistance',
      example: 'ai debug pod/api-server-xyz',
      required: [
        {
          name: 'resource',
          docs: 'Resource to debug (format: kind/name or just name). Examples: pod/nginx-xxx, deployment/api'
        }
      ],
      optional: [
        {
          name: '--namespace',
          alias: 'n',
          docs: 'Kubernetes namespace (defaults to current namespace)'
        },
        {
          name: '--logs',
          docs: 'Include pod logs in the debugging analysis',
          boolean: true
        },
        {
          name: '--events',
          docs: 'Include Kubernetes events in the debugging analysis',
          boolean: true
        },
        {
          name: '--manifest',
          docs: 'Include the full resource manifest (YAML) in the analysis',
          boolean: true
        },
        {
          name: '--no-logs',
          docs: 'Exclude pod logs from the analysis',
          boolean: true
        },
        {
          name: '--no-events',
          docs: 'Exclude Kubernetes events from the analysis',
          boolean: true
        }
      ]
    }
  })
}
