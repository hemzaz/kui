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
  const { argvNoOptions, parsedOptions } = args

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

  const resource = parseResourceString(resourceArg)

  // Build options object
  const options = {
    resource,
    namespace: parsedOptions.namespace || parsedOptions.n,
    includeLogs: parsedOptions.logs !== false && parsedOptions['no-logs'] !== true,
    includeEvents: parsedOptions.events !== false && parsedOptions['no-events'] !== true,
    includeManifest: parsedOptions.manifest || false
  }

  // TODO: Implement actual debugging logic
  // 1. Gather cluster context (ClusterDataCollector)
  // 2. Call AI provider with debug prompt
  // 3. Return formatted response

  const response = [
    `Debugging Resource: ${resource.kind || 'pod'}/${resource.name}`,
    options.namespace ? `Namespace: ${options.namespace}` : 'Namespace: default',
    '',
    'Analysis Options:',
    `- Include Logs: ${options.includeLogs}`,
    `- Include Events: ${options.includeEvents}`,
    `- Include Manifest: ${options.includeManifest}`,
    '',
    'AI Analysis:',
    'This is a placeholder response. The AI debugging integration is not yet implemented.',
    '',
    'Next Steps:',
    '1. Gather resource status, logs, and events',
    '2. Analyze with AI provider',
    '3. Provide actionable recommendations'
  ].join('\n')

  return response
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
