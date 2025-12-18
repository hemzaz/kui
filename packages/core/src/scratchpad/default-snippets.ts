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
 * Default Snippet Library
 *
 * Pre-built command snippets for common Kubernetes operations
 */

export interface Snippet {
  id: string
  name: string
  description: string
  content: string
  category: string
  tags: string[]
}

export const defaultSnippets: Snippet[] = [
  // Pod Debugging
  {
    id: 'get-failing-pods',
    name: 'Get Failing Pods',
    description: 'List all pods that are not in Running or Succeeded state',
    content: `kubectl get pods --all-namespaces \\
  --field-selector=status.phase!=Running,status.phase!=Succeeded`,
    category: 'debugging',
    tags: ['pods', 'debugging', 'status']
  },
  {
    id: 'pod-logs-tail',
    name: 'Pod Logs with Timestamps',
    description: 'Get recent logs from a pod with timestamps',
    content: `kubectl logs <POD_NAME> --timestamps --tail=100`,
    category: 'debugging',
    tags: ['logs', 'pods']
  },
  {
    id: 'pod-logs-follow',
    name: 'Follow Pod Logs',
    description: 'Stream logs from a pod in real-time',
    content: `kubectl logs -f <POD_NAME>`,
    category: 'debugging',
    tags: ['logs', 'pods', 'streaming']
  },
  {
    id: 'pod-events',
    name: 'Pod Events',
    description: 'Show events for a specific pod',
    content: `kubectl describe pod <POD_NAME> | grep -A 10 Events`,
    category: 'debugging',
    tags: ['pods', 'events']
  },
  {
    id: 'pod-shell',
    name: 'Shell into Pod',
    description: 'Open an interactive shell in a pod',
    content: `kubectl exec -it <POD_NAME> -- /bin/bash`,
    category: 'debugging',
    tags: ['pods', 'exec', 'shell']
  },

  // Resource Queries
  {
    id: 'all-resources',
    name: 'List All Resources',
    description: 'List all resources in a namespace',
    content: `kubectl api-resources --verbs=list --namespaced -o name | \\
  xargs -n 1 kubectl get --show-kind --ignore-not-found -n <NAMESPACE>`,
    category: 'query',
    tags: ['resources', 'namespace']
  },
  {
    id: 'find-old-images',
    name: 'Find Old Images',
    description: 'Find deployments using a specific image',
    content: `kubectl get deploy --all-namespaces -o json | \\
  jq '.items[] | select(.spec.template.spec.containers[].image | contains("<IMAGE_NAME>")) | {name:.metadata.name, namespace:.metadata.namespace}'`,
    category: 'query',
    tags: ['deployments', 'images']
  },
  {
    id: 'pending-pods',
    name: 'Pending Pods',
    description: 'Find pods stuck in Pending state',
    content: `kubectl get pods --all-namespaces --field-selector=status.phase=Pending`,
    category: 'query',
    tags: ['pods', 'status', 'pending']
  },

  // Monitoring
  {
    id: 'node-resources',
    name: 'Node Resource Usage',
    description: 'Show CPU and memory usage for all nodes',
    content: `kubectl top nodes`,
    category: 'monitoring',
    tags: ['nodes', 'resources', 'monitoring']
  },
  {
    id: 'pod-resources',
    name: 'Pod Resource Usage',
    description: 'Show CPU and memory usage for all pods',
    content: `kubectl top pods --all-namespaces`,
    category: 'monitoring',
    tags: ['pods', 'resources', 'monitoring']
  },
  {
    id: 'resource-quotas',
    name: 'Resource Quotas',
    description: 'List resource quotas across all namespaces',
    content: `kubectl get resourcequota --all-namespaces`,
    category: 'monitoring',
    tags: ['quotas', 'resources']
  },
  {
    id: 'pvc-usage',
    name: 'PVC Usage',
    description: 'List all persistent volume claims',
    content: `kubectl get pvc --all-namespaces`,
    category: 'monitoring',
    tags: ['storage', 'pvc']
  },

  // Cluster Operations
  {
    id: 'cluster-info',
    name: 'Cluster Info',
    description: 'Display cluster information',
    content: `kubectl cluster-info`,
    category: 'cluster',
    tags: ['cluster', 'info']
  },
  {
    id: 'api-versions',
    name: 'API Versions',
    description: 'List available API versions',
    content: `kubectl api-versions`,
    category: 'cluster',
    tags: ['api', 'versions']
  },
  {
    id: 'node-conditions',
    name: 'Node Conditions',
    description: 'Check node health conditions',
    content: `kubectl get nodes -o json | \\
  jq '.items[] | {name:.metadata.name, conditions:.status.conditions}'`,
    category: 'cluster',
    tags: ['nodes', 'health']
  },

  // Configuration
  {
    id: 'configmaps',
    name: 'List ConfigMaps',
    description: 'List all config maps in a namespace',
    content: `kubectl get configmaps -n <NAMESPACE>`,
    category: 'config',
    tags: ['configmaps', 'configuration']
  },
  {
    id: 'secrets',
    name: 'List Secrets',
    description: 'List all secrets in a namespace',
    content: `kubectl get secrets -n <NAMESPACE>`,
    category: 'config',
    tags: ['secrets', 'configuration']
  },

  // Networking
  {
    id: 'services',
    name: 'List Services',
    description: 'List all services with their endpoints',
    content: `kubectl get services --all-namespaces -o wide`,
    category: 'networking',
    tags: ['services', 'networking']
  },
  {
    id: 'ingress',
    name: 'List Ingresses',
    description: 'List all ingress resources',
    content: `kubectl get ingress --all-namespaces`,
    category: 'networking',
    tags: ['ingress', 'networking']
  },
  {
    id: 'network-policies',
    name: 'Network Policies',
    description: 'List all network policies',
    content: `kubectl get networkpolicies --all-namespaces`,
    category: 'networking',
    tags: ['network-policies', 'networking', 'security']
  },

  // Batch Operations
  {
    id: 'restart-deployments',
    name: 'Restart Deployments',
    description: 'Restart all deployments in a namespace',
    content: `kubectl rollout restart deployment --all -n <NAMESPACE>`,
    category: 'batch',
    tags: ['deployments', 'restart', 'rollout']
  },
  {
    id: 'delete-failed-pods',
    name: 'Delete Failed Pods',
    description: 'Delete all pods in Failed state',
    content: `kubectl delete pods --field-selector=status.phase=Failed --all-namespaces`,
    category: 'batch',
    tags: ['pods', 'cleanup', 'failed']
  },
  {
    id: 'scale-deployment',
    name: 'Scale Deployment',
    description: 'Scale a deployment to a specific replica count',
    content: `kubectl scale deployment <DEPLOYMENT_NAME> --replicas=<COUNT> -n <NAMESPACE>`,
    category: 'batch',
    tags: ['deployments', 'scale']
  },

  // Advanced Queries
  {
    id: 'pod-ip-addresses',
    name: 'Pod IP Addresses',
    description: 'List all pod names and their IP addresses',
    content: `kubectl get pods --all-namespaces -o json | \\
  jq '.items[] | {name:.metadata.name, namespace:.metadata.namespace, ip:.status.podIP}'`,
    category: 'query',
    tags: ['pods', 'networking', 'ip']
  },
  {
    id: 'container-images',
    name: 'Container Images',
    description: 'List all unique container images used in the cluster',
    content: `kubectl get pods --all-namespaces -o json | \\
  jq -r '.items[].spec.containers[].image' | sort | uniq`,
    category: 'query',
    tags: ['containers', 'images']
  },
  {
    id: 'resource-limits',
    name: 'Resource Limits',
    description: 'Show resource requests and limits for all pods',
    content: `kubectl get pods --all-namespaces -o json | \\
  jq '.items[] | {name:.metadata.name, namespace:.metadata.namespace, resources:.spec.containers[].resources}'`,
    category: 'query',
    tags: ['resources', 'limits', 'requests']
  }
]

/**
 * Get snippets by category
 */
export function getSnippetsByCategory(category: string): Snippet[] {
  return defaultSnippets.filter(s => s.category === category)
}

/**
 * Get snippets by tag
 */
export function getSnippetsByTag(tag: string): Snippet[] {
  return defaultSnippets.filter(s => s.tags.includes(tag))
}

/**
 * Search snippets
 */
export function searchSnippets(query: string): Snippet[] {
  const lowerQuery = query.toLowerCase()
  return defaultSnippets.filter(s =>
    s.name.toLowerCase().includes(lowerQuery) ||
    s.description.toLowerCase().includes(lowerQuery) ||
    s.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  return [...new Set(defaultSnippets.map(s => s.category))].sort()
}

/**
 * Get all tags
 */
export function getTags(): string[] {
  const tags = new Set<string>()
  defaultSnippets.forEach(s => s.tags.forEach(tag => tags.add(tag)))
  return [...tags].sort()
}
