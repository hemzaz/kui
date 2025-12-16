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

import type { ClusterSnapshot, KubernetesEvent } from '../../src/types/cluster-types'

/**
 * Mock cluster snapshot fixtures for testing
 */

export const mockClusterSnapshot: ClusterSnapshot = {
  cluster: {
    name: 'test-cluster',
    version: '1.28.0',
    provider: 'minikube',
    nodeCount: 3
  },
  namespace: {
    name: 'default',
    resourceCounts: {
      pods: 5,
      services: 3,
      deployments: 2,
      configmaps: 4,
      secrets: 2
    }
  },
  tokenEstimate: 150,
  priority: 'medium'
}

export const mockClusterSnapshotWithResource: ClusterSnapshot = {
  ...mockClusterSnapshot,
  currentResource: {
    kind: 'Pod',
    name: 'nginx-deployment-abc123',
    namespace: 'default',
    status: {
      phase: 'Running',
      conditions: [
        {
          type: 'Ready',
          status: 'True',
          lastTransitionTime: '2024-01-01T00:00:00Z'
        }
      ],
      containerStatuses: [
        {
          name: 'nginx',
          ready: true,
          restartCount: 0,
          image: 'nginx:1.21',
          imageID: 'docker-pullable://nginx@sha256:abc123'
        }
      ]
    },
    events: [
      {
        type: 'Normal',
        reason: 'Scheduled',
        message: 'Successfully assigned default/nginx-deployment-abc123 to node-1',
        timestamp: new Date('2024-01-01T00:00:00Z'),
        involvedObject: {
          kind: 'Pod',
          name: 'nginx-deployment-abc123',
          namespace: 'default'
        }
      },
      {
        type: 'Normal',
        reason: 'Pulled',
        message: 'Container image "nginx:1.21" already present on machine',
        timestamp: new Date('2024-01-01T00:00:05Z'),
        involvedObject: {
          kind: 'Pod',
          name: 'nginx-deployment-abc123',
          namespace: 'default'
        }
      }
    ],
    logs: [
      '2024-01-01 00:00:10 [info] nginx started',
      '2024-01-01 00:00:15 [info] accepting connections on port 80',
      '2024-01-01 00:00:20 [info] GET / 200'
    ]
  },
  priority: 'high'
}

export const mockClusterSnapshotWithWarnings: ClusterSnapshot = {
  ...mockClusterSnapshot,
  currentResource: {
    kind: 'Pod',
    name: 'failing-pod-xyz789',
    namespace: 'default',
    status: {
      phase: 'Pending',
      conditions: [
        {
          type: 'PodScheduled',
          status: 'False',
          reason: 'Unschedulable',
          message: 'Insufficient memory'
        }
      ],
      containerStatuses: []
    },
    events: [
      {
        type: 'Warning',
        reason: 'FailedScheduling',
        message: 'Insufficient memory',
        timestamp: new Date('2024-01-01T00:00:00Z'),
        involvedObject: {
          kind: 'Pod',
          name: 'failing-pod-xyz789',
          namespace: 'default'
        }
      },
      {
        type: 'Warning',
        reason: 'FailedScheduling',
        message: '0/3 nodes are available: 3 Insufficient memory',
        timestamp: new Date('2024-01-01T00:00:05Z'),
        involvedObject: {
          kind: 'Pod',
          name: 'failing-pod-xyz789',
          namespace: 'default'
        }
      }
    ],
    logs: []
  },
  priority: 'high'
}

export const mockEKSClusterSnapshot: ClusterSnapshot = {
  cluster: {
    name: 'production-eks-cluster',
    version: '1.29.0',
    provider: 'eks',
    nodeCount: 10
  },
  namespace: {
    name: 'production',
    resourceCounts: {
      pods: 50,
      services: 15,
      deployments: 20,
      configmaps: 25,
      secrets: 30
    }
  },
  tokenEstimate: 500,
  priority: 'medium'
}

export const mockGKEClusterSnapshot: ClusterSnapshot = {
  cluster: {
    name: 'gke-cluster-us-central1',
    version: '1.28.5',
    provider: 'gke',
    nodeCount: 6
  },
  namespace: {
    name: 'staging',
    resourceCounts: {
      pods: 20,
      services: 8,
      deployments: 10,
      configmaps: 12,
      secrets: 10
    }
  },
  tokenEstimate: 300,
  priority: 'low'
}

export const mockKubernetesEvents: KubernetesEvent[] = [
  {
    type: 'Normal',
    reason: 'Scheduled',
    message: 'Successfully assigned pod to node',
    timestamp: new Date('2024-01-01T00:00:00Z'),
    involvedObject: {
      kind: 'Pod',
      name: 'test-pod',
      namespace: 'default'
    }
  },
  {
    type: 'Normal',
    reason: 'Pulling',
    message: 'Pulling image "nginx:latest"',
    timestamp: new Date('2024-01-01T00:00:05Z'),
    involvedObject: {
      kind: 'Pod',
      name: 'test-pod',
      namespace: 'default'
    }
  },
  {
    type: 'Normal',
    reason: 'Pulled',
    message: 'Successfully pulled image',
    timestamp: new Date('2024-01-01T00:00:10Z'),
    involvedObject: {
      kind: 'Pod',
      name: 'test-pod',
      namespace: 'default'
    }
  },
  {
    type: 'Normal',
    reason: 'Created',
    message: 'Created container',
    timestamp: new Date('2024-01-01T00:00:15Z'),
    involvedObject: {
      kind: 'Pod',
      name: 'test-pod',
      namespace: 'default'
    }
  },
  {
    type: 'Normal',
    reason: 'Started',
    message: 'Started container',
    timestamp: new Date('2024-01-01T00:00:20Z'),
    involvedObject: {
      kind: 'Pod',
      name: 'test-pod',
      namespace: 'default'
    }
  }
]

export const mockWarningEvents: KubernetesEvent[] = [
  {
    type: 'Warning',
    reason: 'BackOff',
    message: 'Back-off restarting failed container',
    timestamp: new Date('2024-01-01T00:00:00Z'),
    involvedObject: {
      kind: 'Pod',
      name: 'failing-pod',
      namespace: 'default'
    }
  },
  {
    type: 'Warning',
    reason: 'FailedScheduling',
    message: 'Insufficient CPU',
    timestamp: new Date('2024-01-01T00:00:05Z'),
    involvedObject: {
      kind: 'Pod',
      name: 'failing-pod',
      namespace: 'default'
    }
  }
]

/**
 * Mock kubectl command outputs
 */
export const mockKubectlOutputs = {
  version: `Client Version: v1.28.0
Server Version: v1.28.0`,

  nodes: `node-1   Ready    control-plane   30d   v1.28.0
node-2   Ready    <none>          30d   v1.28.0
node-3   Ready    <none>          30d   v1.28.0`,

  currentContext: 'test-cluster',

  pods: `nginx-deployment-abc123   1/1     Running   0          5m
redis-deployment-def456   1/1     Running   0          10m
postgres-statefulset-0    1/1     Running   0          1h
app-deployment-ghi789     2/2     Running   0          30m
worker-deployment-jkl012  1/1     Running   0          2h`,

  services: `kubernetes       ClusterIP   10.96.0.1      <none>        443/TCP    30d
nginx-service    ClusterIP   10.96.1.100    <none>        80/TCP     5m
redis-service    ClusterIP   10.96.1.200    <none>        6379/TCP   10m`,

  deployments: `nginx-deployment    1/1     1            1           5m
app-deployment      2/2     2            2           30m`,

  configmaps: `config-app      1      5m
config-nginx    1      10m
config-redis    1      15m
config-db       1      20m`,

  secrets: `secret-db       Opaque   2      5m
secret-api      Opaque   1      10m`,

  podStatus: JSON.stringify({
    status: {
      phase: 'Running',
      conditions: [
        {
          type: 'Ready',
          status: 'True',
          lastTransitionTime: '2024-01-01T00:00:00Z'
        }
      ],
      containerStatuses: [
        {
          name: 'nginx',
          ready: true,
          restartCount: 0,
          image: 'nginx:1.21'
        }
      ]
    }
  }),

  events: JSON.stringify({
    items: [
      {
        type: 'Normal',
        reason: 'Scheduled',
        message: 'Successfully assigned pod to node',
        lastTimestamp: '2024-01-01T00:00:00Z',
        involvedObject: {
          kind: 'Pod',
          name: 'test-pod',
          namespace: 'default'
        }
      }
    ]
  }),

  logs: `2024-01-01 00:00:10 [info] nginx started
2024-01-01 00:00:15 [info] accepting connections
2024-01-01 00:00:20 [info] request processed`
}
