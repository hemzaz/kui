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
import { ProviderFactory } from '../services/provider-factory'
import { loadConfig } from '../utils/config-loader'
import { MANIFEST_GENERATION_PROMPT } from '../prompts/system-prompts'
import type { AIProviderError } from '../types/ai-types'
import * as fs from 'fs'
import * as path from 'path'

interface CreateOptions {
  namespace?: string
  n?: string
  replicas?: number
  port?: number
  image?: string
  apply?: boolean
  save?: string
}

/**
 * Command handler for /ai create
 * Generate Kubernetes manifest from description
 */
async function aiCreateHandler(args: Arguments<CreateOptions>): Promise<string> {
  const { argvNoOptions, parsedOptions, REPL } = args

  // Extract description from arguments (everything after 'create')
  const createIndex = argvNoOptions.indexOf('create')
  if (createIndex === -1) {
    throw new UsageError({ message: 'Command must include "create"' })
  }

  const description = argvNoOptions.slice(createIndex + 1).join(' ')

  if (!description || description.trim().length === 0) {
    throw new UsageError({
      message: 'Please provide a description of what to create',
      usage: {
        command: 'ai create',
        docs: 'Generate Kubernetes manifest from natural language description',
        example: 'ai create "nginx deployment with 3 replicas"',
        required: [
          {
            name: 'description',
            docs: 'Natural language description of what to create. Examples: "nginx deployment", "redis service", "configmap for app config"'
          }
        ],
        optional: [
          { name: '--namespace', alias: 'n', docs: 'Target Kubernetes namespace for the resource' },
          { name: '--replicas', docs: 'Number of replicas (for deployments/replicasets)' },
          { name: '--port', docs: 'Port number to expose' },
          { name: '--image', docs: 'Container image to use (e.g., nginx:latest)' },
          { name: '--apply', docs: 'Automatically apply the generated manifest to the cluster', boolean: true },
          { name: '--save', docs: 'Save the generated manifest to a file (e.g., --save deployment.yaml)' }
        ]
      }
    })
  }

  try {
    // Load AI configuration and initialize provider
    const config = await loadConfig()
    const provider = ProviderFactory.getProvider(config)

    // Build manifest generation prompt
    const prompt = buildCreatePrompt(description.trim(), parsedOptions)

    // Call AI provider
    const response = await provider.complete({
      prompt,
      systemPrompt: MANIFEST_GENERATION_PROMPT,
      stream: false
    })

    // Extract YAML from response (may be wrapped in markdown code blocks)
    const manifest = extractYamlFromResponse(response.content)

    // Validate that we got YAML
    if (!manifest || manifest.trim().length === 0) {
      throw new Error('No valid YAML manifest generated')
    }

    // Handle --save option
    if (parsedOptions.save) {
      const filepath = path.resolve(parsedOptions.save)
      fs.writeFileSync(filepath, manifest, 'utf8')
    }

    // Handle --apply option
    let applyResult = ''
    if (parsedOptions.apply) {
      // Write manifest to temporary file
      const tmpFile = `/tmp/kui-ai-manifest-${Date.now()}.yaml`
      fs.writeFileSync(tmpFile, manifest, 'utf8')

      try {
        // Apply using kubectl
        const result = await REPL.qexec(`kubectl apply -f ${tmpFile}`)
        applyResult = typeof result === 'string' ? result : JSON.stringify(result)
      } catch (error) {
        const err = error as Error
        applyResult = `Failed to apply: ${err.message}`
      } finally {
        // Clean up temp file
        try {
          fs.unlinkSync(tmpFile)
        } catch {
          // Ignore cleanup errors
        }
      }
    }

    return formatCreateResponse(description.trim(), manifest, parsedOptions, applyResult, response.usage, response.cost)
  } catch (error) {
    const err = error as AIProviderError
    throw new UsageError({
      message: `AI manifest generation failed: ${err.message}`,
      usage: {
        command: 'ai create',
        docs: 'Generate Kubernetes manifest from natural language description',
        example: 'ai create "nginx deployment with 3 replicas"'
      }
    })
  }
}

/**
 * Build the manifest generation prompt
 */
function buildCreatePrompt(description: string, options: CreateOptions): string {
  const parts = [
    `Generate a production-ready Kubernetes manifest for: ${description}`,
    '',
    'Requirements:',
    '- Follow Kubernetes best practices',
    '- Include appropriate labels and annotations',
    '- Add resource limits and requests',
    '- Include health checks (liveness/readiness probes) where applicable',
    '- Use secure defaults',
    ''
  ]

  if (options.namespace) {
    parts.push(`- Namespace: ${options.namespace}`)
  }
  if (options.replicas) {
    parts.push(`- Replicas: ${options.replicas}`)
  }
  if (options.port) {
    parts.push(`- Port: ${options.port}`)
  }
  if (options.image) {
    parts.push(`- Container Image: ${options.image}`)
  }

  parts.push('')
  parts.push('Return only the YAML manifest, no explanations.')
  parts.push('If multiple resources are needed (e.g., Deployment + Service), include all separated by ---')

  return parts.join('\n')
}

/**
 * Extract YAML from AI response (handles markdown code blocks)
 */
function extractYamlFromResponse(response: string): string {
  // Remove markdown code blocks if present
  const yamlBlockMatch = response.match(/```(?:yaml|yml)?\n([\s\S]*?)```/)
  if (yamlBlockMatch) {
    return yamlBlockMatch[1].trim()
  }

  // If no code blocks, assume entire response is YAML
  return response.trim()
}

/**
 * Format the create response for display
 */
function formatCreateResponse(
  description: string,
  manifest: string,
  options: CreateOptions,
  applyResult: string,
  usage?: { inputTokens: number; outputTokens: number },
  cost?: number
): string {
  const parts = ['Generated Kubernetes Manifest', '='.repeat(60), '', `Description: ${description}`, '']

  if (options.namespace) {
    parts.push(`Namespace: ${options.namespace}`)
  }
  if (options.replicas) {
    parts.push(`Replicas: ${options.replicas}`)
  }
  if (options.port) {
    parts.push(`Port: ${options.port}`)
  }
  if (options.image) {
    parts.push(`Image: ${options.image}`)
  }

  parts.push('', 'Manifest:', '---', manifest, '---', '')

  if (options.save) {
    parts.push(`Saved to: ${path.resolve(options.save)}`)
  }

  if (options.apply) {
    parts.push('', 'Apply Result:', applyResult)
  } else {
    parts.push('Tip: Use --apply to automatically create this resource in your cluster')
  }

  if (usage) {
    parts.push('')
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
 * Register the /ai create command
 */
export default async (registrar: Registrar) => {
  registrar.listen('/ai/create', aiCreateHandler, {
    usage: {
      command: 'create',
      docs: 'Generate Kubernetes manifest from natural language description',
      example: 'ai create "nginx deployment with 3 replicas"',
      required: [
        {
          name: 'description',
          docs: 'Natural language description of what to create. Examples: "nginx deployment", "redis service", "configmap for app config"'
        }
      ],
      optional: [
        {
          name: '--namespace',
          alias: 'n',
          docs: 'Target Kubernetes namespace for the resource'
        },
        {
          name: '--replicas',
          docs: 'Number of replicas (for deployments/replicasets)'
        },
        {
          name: '--port',
          docs: 'Port number to expose'
        },
        {
          name: '--image',
          docs: 'Container image to use (e.g., nginx:latest, redis:6.2)'
        },
        {
          name: '--apply',
          docs: 'Automatically apply the generated manifest to the cluster',
          boolean: true
        },
        {
          name: '--save',
          docs: 'Save the generated manifest to a file (e.g., --save deployment.yaml)'
        }
      ]
    }
  })
}
