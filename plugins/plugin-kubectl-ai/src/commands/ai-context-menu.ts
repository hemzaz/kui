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

import type { Arguments, Registrar } from '@kui-shell/core'
import { getContextMenuService } from '../services/context-menu-service'
import { extractResourceContextFast } from '../utils/resource-context-extractor'
import { DEFAULT_AI_CONFIG } from '../types/ai-types'

/**
 * Command to generate quick insights for context menu tooltips
 *
 * Usage: kubectl ai insight <kind> <name> -n <namespace>
 *
 * Performance target: < 1s response time
 */
async function aiInsightCommand(args: Arguments) {
  const { REPL, argvNoOptions, parsedOptions } = args

  if (argvNoOptions.length < 3) {
    throw new Error('Usage: kubectl ai insight <kind> <name> -n <namespace>')
  }

  const kind = argvNoOptions[1]
  const name = argvNoOptions[2]
  const namespace = (parsedOptions.n as string) || (parsedOptions.namespace as string) || 'default'

  try {
    // Extract resource context (fast, no metrics)
    const context = await extractResourceContextFast(REPL, kind, name, namespace)

    // Get context menu service
    const service = getContextMenuService(DEFAULT_AI_CONFIG)

    // Generate quick insight
    const insight = await service.generateQuickInsight(context)

    // Return insight as plain text
    return {
      apiVersion: 'v1',
      kind: 'Text',
      metadata: {
        name: 'ai-insight'
      },
      spec: {
        content: insight.insight,
        contentType: 'text/plain'
      }
    }
  } catch (error) {
    const err = error as Error
    throw new Error(`Failed to generate insight: ${err.message}`)
  }
}

/**
 * Command to generate context menu actions
 *
 * Usage: kubectl ai actions <kind> <name> -n <namespace>
 */
async function aiActionsCommand(args: Arguments) {
  const { REPL, argvNoOptions, parsedOptions } = args

  if (argvNoOptions.length < 3) {
    throw new Error('Usage: kubectl ai actions <kind> <name> -n <namespace>')
  }

  const kind = argvNoOptions[1]
  const name = argvNoOptions[2]
  const namespace = (parsedOptions.n as string) || (parsedOptions.namespace as string) || 'default'

  try {
    // Extract resource context (with more details)
    const context = await extractResourceContextFast(REPL, kind, name, namespace)

    // Get context menu service
    const service = getContextMenuService(DEFAULT_AI_CONFIG)

    // Generate actions
    const result = await service.generateActions(context)

    // Return actions as JSON
    return {
      apiVersion: 'v1',
      kind: 'Table',
      metadata: {
        name: 'ai-actions'
      },
      spec: {
        header: {
          name: 'LABEL',
          attributes: [{ key: 'command', value: 'COMMAND' }, { key: 'description', value: 'DESCRIPTION' }]
        },
        body: result.actions.map(action => ({
          name: action.label,
          attributes: [{ key: 'command', value: action.command }, { key: 'description', value: action.description }],
          onclick: `sendtopty ${action.command}`
        }))
      }
    }
  } catch (error) {
    const err = error as Error
    throw new Error(`Failed to generate actions: ${err.message}`)
  }
}

/**
 * Command to invalidate context menu cache
 *
 * Usage: kubectl ai cache-clear <kind> <name> -n <namespace>
 */
async function aiCacheClearCommand(args: Arguments) {
  const { argvNoOptions, parsedOptions } = args

  if (argvNoOptions.length < 3) {
    throw new Error('Usage: kubectl ai cache-clear <kind> <name> -n <namespace>')
  }

  const kind = argvNoOptions[1]
  const name = argvNoOptions[2]
  const namespace = (parsedOptions.n as string) || (parsedOptions.namespace as string) || 'default'

  const service = getContextMenuService(DEFAULT_AI_CONFIG)
  service.invalidateCache(namespace, kind, name)

  return `Cache cleared for ${kind}/${name} in namespace ${namespace}`
}

/**
 * Register context menu commands
 */
export default async function registerContextMenuCommands(registrar: Registrar) {
  // Register insight command
  registrar.listen(
    '/kubectl/ai/insight',
    aiInsightCommand,
    {
      usage: {
        command: 'insight',
        docs: 'Generate quick insight for resource (< 1s)',
        required: [
          { name: 'kind', docs: 'Resource kind (Pod, Deployment, etc.)' },
          { name: 'name', docs: 'Resource name' }
        ],
        optional: [{ name: 'namespace', docs: 'Kubernetes namespace (default: default)' }]
      },
      flags: {
        boolean: ['help'],
        alias: {
          n: ["namespace"],
          h: ["help"]
        }
      }
    }
  )

  // Register actions command
  registrar.listen(
    '/kubectl/ai/actions',
    aiActionsCommand,
    {
      usage: {
        command: 'actions',
        docs: 'Generate contextual kubectl commands for resource',
        required: [
          { name: 'kind', docs: 'Resource kind (Pod, Deployment, etc.)' },
          { name: 'name', docs: 'Resource name' }
        ],
        optional: [{ name: 'namespace', docs: 'Kubernetes namespace (default: default)' }]
      },
      flags: {
        boolean: ['help'],
        alias: {
          n: ["namespace"],
          h: ["help"]
        }
      }
    }
  )

  // Register cache-clear command
  registrar.listen(
    '/kubectl/ai/cache-clear',
    aiCacheClearCommand,
    {
      usage: {
        command: 'cache-clear',
        docs: 'Clear context menu cache for specific resource',
        required: [
          { name: 'kind', docs: 'Resource kind (Pod, Deployment, etc.)' },
          { name: 'name', docs: 'Resource name' }
        ],
        optional: [{ name: 'namespace', docs: 'Kubernetes namespace (default: default)' }]
      },
      flags: {
        boolean: ['help'],
        alias: {
          n: ["namespace"],
          h: ["help"]
        }
      }
    }
  )
}
