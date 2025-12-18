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
 * Command categories for the command palette.
 * Inspired by kube-composer's resource categorization.
 */
export enum CommandCategory {
  Navigation = 'navigation',
  Kubectl = 'kubectl',
  AI = 'ai',
  Settings = 'settings',
  Recent = 'recent',
  // Kubernetes resource categories
  Workloads = 'workloads',      // Pods, Deployments, ReplicaSets, StatefulSets, DaemonSets
  Configuration = 'configuration', // ConfigMaps, Secrets
  Networking = 'networking',      // Services, Ingress, NetworkPolicies
  Storage = 'storage',           // PVCs, PVs, StorageClasses
  Security = 'security',         // ServiceAccounts, Roles, RoleBindings
  Batch = 'batch'               // Jobs, CronJobs
}

/**
 * Command interface with category support
 */
export interface Command {
  id: string
  name: string
  description?: string
  category: CommandCategory
  icon?: string
  keyBinding?: string
  resourceType?: string  // e.g., 'pod', 'deployment', 'service'
  action: () => void | Promise<void>
}

/**
 * Get color for command category (for UI badges)
 */
export function getCategoryColor(category: CommandCategory): string {
  const colors: Record<CommandCategory, string> = {
    [CommandCategory.Navigation]: '#0078d4',
    [CommandCategory.Kubectl]: '#326ce5',
    [CommandCategory.AI]: '#00c853',
    [CommandCategory.Settings]: '#6d6d6d',
    [CommandCategory.Recent]: '#ff6b35',
    [CommandCategory.Workloads]: '#1976d2',
    [CommandCategory.Configuration]: '#388e3c',
    [CommandCategory.Networking]: '#f57c00',
    [CommandCategory.Storage]: '#7b1fa2',
    [CommandCategory.Security]: '#d32f2f',
    [CommandCategory.Batch]: '#0097a7'
  }
  return colors[category] || '#6d6d6d'
}

/**
 * Get icon for command category
 */
export function getCategoryIcon(category: CommandCategory): string {
  const icons: Record<CommandCategory, string> = {
    [CommandCategory.Navigation]: '🧭',
    [CommandCategory.Kubectl]: '☸️',
    [CommandCategory.AI]: '🤖',
    [CommandCategory.Settings]: '⚙️',
    [CommandCategory.Recent]: '🕐',
    [CommandCategory.Workloads]: '📦',
    [CommandCategory.Configuration]: '🗂️',
    [CommandCategory.Networking]: '🌐',
    [CommandCategory.Storage]: '💾',
    [CommandCategory.Security]: '🔐',
    [CommandCategory.Batch]: '⏱️'
  }
  return icons[category] || '•'
}
