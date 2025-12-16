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
  const { argvNoOptions, parsedOptions } = args

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

  // Build options object
  const options = {
    description: description.trim(),
    namespace: parsedOptions.namespace || parsedOptions.n,
    replicas: parsedOptions.replicas,
    port: parsedOptions.port,
    image: parsedOptions.image,
    apply: parsedOptions.apply || false,
    save: parsedOptions.save
  }

  // TODO: Implement actual manifest generation
  // 1. Send description to AI provider with manifest generation prompt
  // 2. Parse and validate generated YAML
  // 3. Optionally apply or save
  // 4. Return formatted response

  const response = [
    `Creating Kubernetes manifest for: ${options.description}`,
    '',
    'Configuration:',
    options.namespace ? `- Namespace: ${options.namespace}` : '- Namespace: default',
    options.replicas ? `- Replicas: ${options.replicas}` : '',
    options.port ? `- Port: ${options.port}` : '',
    options.image ? `- Image: ${options.image}` : '',
    '',
    'Generated Manifest:',
    '---',
    '# This is a placeholder manifest',
    '# The AI manifest generation is not yet implemented',
    'apiVersion: apps/v1',
    'kind: Deployment',
    'metadata:',
    '  name: example',
    '  namespace: ' + (options.namespace || 'default'),
    'spec:',
    '  replicas: ' + (options.replicas || 1),
    '  selector:',
    '    matchLabels:',
    '      app: example',
    '  template:',
    '    metadata:',
    '      labels:',
    '        app: example',
    '    spec:',
    '      containers:',
    '      - name: app',
    '        image: ' + (options.image || 'nginx:latest'),
    options.port ? `        ports:\n        - containerPort: ${options.port}` : '',
    '---',
    '',
    options.apply
      ? 'Status: Would apply to cluster (not implemented)'
      : 'Tip: Use --apply to automatically create this resource',
    options.save
      ? `Status: Would save to ${options.save} (not implemented)`
      : 'Tip: Use --save <filename> to save this manifest'
  ]
    .filter(Boolean)
    .join('\n')

  return response
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
