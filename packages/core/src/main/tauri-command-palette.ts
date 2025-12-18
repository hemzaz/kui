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
 * Tauri Command Palette Persistence Layer
 *
 * Provides TypeScript bindings for the Tauri backend SQLite database
 * that tracks command invocations, usage statistics, and search queries.
 */

import { getIpcRenderer, isTauriRuntime } from './tauri-bridge'

/**
 * Command statistics
 */
export interface CommandStats {
  command_id: string
  hit_count: number
  last_used: string
  avg_execution_time?: number
}

/**
 * Recent query entry
 */
export interface RecentQuery {
  query: string
  timestamp: string
  result_count: number
}

/**
 * Kubernetes resource summary
 */
export interface ResourceSummary {
  kind: string
  name: string
  namespace?: string
  context?: string
  last_accessed: string
  access_count: number
}

/**
 * Command pattern for smart history
 */
export interface CommandPattern {
  pattern_id: string
  command_sequence: string[]
  frequency: number
  confidence: number
  last_seen: string
  avg_time_between_commands?: number
}

/**
 * Pattern suggestion for next command
 */
export interface PatternSuggestion {
  next_command: string
  confidence: number
  pattern_frequency: number
  context: string
}

/**
 * Command history entry for fuzzy search
 */
export interface CommandHistory {
  command_id: string
  timestamp: string
  execution_time_ms?: number
  success: boolean
}

/**
 * Record a command invocation in the database
 *
 * @param commandId - Unique identifier for the command
 * @param executionTimeMs - Optional execution time in milliseconds
 * @param success - Whether the command executed successfully
 * @param errorMessage - Optional error message if command failed
 * @param context - Optional context information (JSON string)
 */
export async function recordCommandInvocation(
  commandId: string,
  executionTimeMs?: number,
  success = true,
  errorMessage?: string,
  context?: string
): Promise<void> {
  if (!isTauriRuntime()) {
    // Fallback to localStorage for non-Tauri runtimes
    const key = 'kui-command-invocations'
    const stored = localStorage.getItem(key)
    const invocations = stored ? JSON.parse(stored) : {}

    if (!invocations[commandId]) {
      invocations[commandId] = { count: 0, lastUsed: new Date().toISOString() }
    }

    invocations[commandId].count++
    invocations[commandId].lastUsed = new Date().toISOString()

    localStorage.setItem(key, JSON.stringify(invocations))
    return
  }

  const ipc = getIpcRenderer()
  await ipc.invoke('record_command_invocation', {
    command_id: commandId,
    execution_time_ms: executionTimeMs,
    success,
    error_message: errorMessage,
    context
  })
}

/**
 * Get command statistics
 *
 * @param commandId - Optional command ID to get stats for a specific command
 * @returns Array of command statistics
 */
export async function getCommandStats(commandId?: string): Promise<CommandStats[]> {
  if (!isTauriRuntime()) {
    // Fallback to localStorage for non-Tauri runtimes
    const key = 'kui-command-invocations'
    const stored = localStorage.getItem(key)
    if (!stored) return []

    const invocations = JSON.parse(stored)
    const stats: CommandStats[] = []

    for (const [id, data] of Object.entries(invocations) as [string, any][]) {
      if (!commandId || id === commandId) {
        stats.push({
          command_id: id,
          hit_count: data.count,
          last_used: data.lastUsed,
          avg_execution_time: undefined
        })
      }
    }

    return stats.sort((a, b) => b.hit_count - a.hit_count)
  }

  const ipc = getIpcRenderer()
  return (await ipc.invoke('get_command_stats', { command_id: commandId })) as CommandStats[]
}

/**
 * Get top N most frequently used commands
 *
 * @param limit - Maximum number of commands to return
 * @returns Array of top command statistics
 */
export async function getTopCommands(limit = 10): Promise<CommandStats[]> {
  if (!isTauriRuntime()) {
    const stats = await getCommandStats()
    return stats.slice(0, limit)
  }

  const ipc = getIpcRenderer()
  return (await ipc.invoke('get_top_commands', { limit })) as CommandStats[]
}

/**
 * Record a search query
 *
 * @param query - The search query string
 * @param resultCount - Number of results returned
 */
export async function recordSearchQuery(query: string, resultCount: number): Promise<void> {
  if (!isTauriRuntime()) {
    // Fallback to localStorage for non-Tauri runtimes
    const key = 'kui-recent-queries'
    const stored = localStorage.getItem(key)
    const queries = stored ? JSON.parse(stored) : []

    queries.unshift({
      query,
      timestamp: new Date().toISOString(),
      result_count: resultCount
    })

    // Keep only last 100 queries
    if (queries.length > 100) {
      queries.splice(100)
    }

    localStorage.setItem(key, JSON.stringify(queries))
    return
  }

  const ipc = getIpcRenderer()
  await ipc.invoke('record_search_query', {
    query,
    result_count: resultCount
  })
}

/**
 * Get recent search queries
 *
 * @param limit - Maximum number of queries to return
 * @returns Array of recent queries
 */
export async function getRecentQueries(limit = 20): Promise<RecentQuery[]> {
  if (!isTauriRuntime()) {
    // Fallback to localStorage for non-Tauri runtimes
    const key = 'kui-recent-queries'
    const stored = localStorage.getItem(key)
    if (!stored) return []

    const queries = JSON.parse(stored)
    return queries.slice(0, limit)
  }

  const ipc = getIpcRenderer()
  return (await ipc.invoke('get_recent_queries', { limit })) as RecentQuery[]
}

/**
 * Cleanup old data (older than 90 days)
 */
export async function cleanupOldData(): Promise<void> {
  if (!isTauriRuntime()) {
    // No cleanup needed for localStorage
    return
  }

  const ipc = getIpcRenderer()
  await ipc.invoke('cleanup_command_palette_data')
}

/**
 * Get hit count for a specific command
 *
 * @param commandId - Command ID to get hit count for
 * @returns Hit count or 0 if not found
 */
export async function getCommandHitCount(commandId: string): Promise<number> {
  const stats = await getCommandStats(commandId)
  return stats.length > 0 ? stats[0].hit_count : 0
}

/**
 * Get all command hit counts as a Map
 *
 * @returns Map of command ID to hit count
 */
export async function getAllCommandHitCounts(): Promise<Map<string, number>> {
  const stats = await getCommandStats()
  const hitCounts = new Map<string, number>()

  for (const stat of stats) {
    hitCounts.set(stat.command_id, stat.hit_count)
  }

  return hitCounts
}

/**
 * Record a Kubernetes resource access
 *
 * @param kind - Resource kind (Pod, Deployment, Service, etc.)
 * @param name - Resource name
 * @param namespace - Optional namespace
 * @param context - Optional kubectl context
 */
export async function recordResourceAccess(
  kind: string,
  name: string,
  namespace?: string,
  context?: string
): Promise<void> {
  if (!isTauriRuntime()) {
    // Fallback to localStorage for non-Tauri runtimes
    const key = 'kui-recent-resources'
    const stored = localStorage.getItem(key)
    const resources = stored ? JSON.parse(stored) : []

    // Find existing resource or create new
    const resourceId = `${kind}/${name}/${namespace || 'default'}/${context || 'default'}`
    const existing = resources.find((r: any) => r.id === resourceId)

    if (existing) {
      existing.access_count = (existing.access_count || 0) + 1
      existing.last_accessed = new Date().toISOString()
    } else {
      resources.unshift({
        id: resourceId,
        kind,
        name,
        namespace,
        context,
        last_accessed: new Date().toISOString(),
        access_count: 1
      })
    }

    // Keep only last 100 resources
    if (resources.length > 100) {
      resources.splice(100)
    }

    localStorage.setItem(key, JSON.stringify(resources))
    return
  }

  const ipc = getIpcRenderer()
  await ipc.invoke('record_resource_access', {
    kind,
    name,
    namespace,
    context
  })
}

/**
 * Get recent Kubernetes resources
 *
 * @param limit - Maximum number of resources to return
 * @param kindFilter - Optional filter by resource kind
 * @returns Array of recent resources
 */
export async function getRecentResources(
  limit = 20,
  kindFilter?: string
): Promise<ResourceSummary[]> {
  if (!isTauriRuntime()) {
    // Fallback to localStorage for non-Tauri runtimes
    const key = 'kui-recent-resources'
    const stored = localStorage.getItem(key)
    if (!stored) return []

    const resources = JSON.parse(stored)
    let filtered = resources

    if (kindFilter) {
      filtered = resources.filter((r: any) => r.kind === kindFilter)
    }

    return filtered.slice(0, limit)
  }

  const ipc = getIpcRenderer()
  return (await ipc.invoke('get_recent_resources', {
    limit,
    kind_filter: kindFilter
  })) as ResourceSummary[]
}

/**
 * Get most accessed Kubernetes resources
 *
 * @param limit - Maximum number of resources to return
 * @param kindFilter - Optional filter by resource kind
 * @returns Array of top resources sorted by access count
 */
export async function getTopResources(
  limit = 20,
  kindFilter?: string
): Promise<ResourceSummary[]> {
  if (!isTauriRuntime()) {
    // Fallback to localStorage for non-Tauri runtimes
    const resources = await getRecentResources(100, kindFilter)
    return resources
      .sort((a, b) => (b.access_count || 0) - (a.access_count || 0))
      .slice(0, limit)
  }

  const ipc = getIpcRenderer()
  return (await ipc.invoke('get_top_resources', {
    limit,
    kind_filter: kindFilter
  })) as ResourceSummary[]
}

/**
 * Detect command patterns from history
 *
 * Analyzes recent command history to find recurring command sequences.
 * Patterns are stored in the database with confidence scores based on
 * frequency and recency.
 *
 * @param minSequenceLength - Minimum number of commands in a pattern (default: 2)
 * @param maxSequenceLength - Maximum number of commands in a pattern (default: 5)
 * @returns Array of detected patterns
 */
export async function detectCommandPatterns(
  minSequenceLength = 2,
  maxSequenceLength = 5
): Promise<CommandPattern[]> {
  if (!isTauriRuntime()) {
    // Pattern detection not available in browser mode
    return []
  }

  const ipc = getIpcRenderer()
  return (await ipc.invoke('detect_command_patterns', {
    min_sequence_length: minSequenceLength,
    max_sequence_length: maxSequenceLength
  })) as CommandPattern[]
}

/**
 * Get stored command patterns
 *
 * Retrieves command patterns from the database, filtered by minimum
 * confidence score.
 *
 * @param minConfidence - Minimum confidence score (0.0 to 1.0, default: 0.5)
 * @param limit - Maximum number of patterns to return (default: 20)
 * @returns Array of command patterns sorted by confidence
 */
export async function getCommandPatterns(
  minConfidence = 0.5,
  limit = 20
): Promise<CommandPattern[]> {
  if (!isTauriRuntime()) {
    // Pattern detection not available in browser mode
    return []
  }

  const ipc = getIpcRenderer()
  return (await ipc.invoke('get_command_patterns', {
    min_confidence: minConfidence,
    limit
  })) as CommandPattern[]
}

/**
 * Get pattern-based suggestions for next command
 *
 * Based on the user's recent command history, suggests what commands
 * they might want to execute next. Uses stored patterns to make
 * intelligent predictions.
 *
 * @param lastCommands - Array of recent command IDs (most recent last)
 * @param limit - Maximum number of suggestions to return (default: 5)
 * @returns Array of suggestions sorted by confidence
 */
export async function getPatternSuggestions(
  lastCommands: string[],
  limit = 5
): Promise<PatternSuggestion[]> {
  if (!isTauriRuntime()) {
    // Pattern detection not available in browser mode
    return []
  }

  const ipc = getIpcRenderer()
  return (await ipc.invoke('get_pattern_suggestions', {
    last_commands: lastCommands,
    limit
  })) as PatternSuggestion[]
}

/**
 * Get command history for fuzzy search
 *
 * Retrieves recent command invocations in chronological order for
 * fuzzy history search (Ctrl+R style).
 *
 * @param limit - Maximum number of history items to return (default: 100)
 * @returns Array of command history entries sorted by timestamp (most recent first)
 */
export async function getCommandHistory(
  limit = 100
): Promise<CommandHistory[]> {
  if (!isTauriRuntime()) {
    // History not available in browser mode
    return []
  }

  const ipc = getIpcRenderer()
  return (await ipc.invoke('get_command_history', {
    limit
  })) as CommandHistory[]
}
