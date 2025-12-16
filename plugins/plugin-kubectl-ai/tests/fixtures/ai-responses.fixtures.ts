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

import type { AIResponse, AIChunk } from '../../src/types/ai-types'

/**
 * Mock AI response fixtures for testing
 */

export const mockAIResponse: AIResponse = {
  content: `The pod is failing to schedule because there is insufficient memory available on the nodes.

To resolve this:

1. Check node resources:
   \`\`\`bash
   kubectl top nodes
   \`\`\`

2. Reduce pod memory requests:
   \`\`\`yaml
   resources:
     requests:
       memory: "256Mi"
     limits:
       memory: "512Mi"
   \`\`\`

3. Or scale up the cluster by adding more nodes.`,
  model: 'claude-3-5-sonnet-20241022',
  usage: {
    inputTokens: 450,
    outputTokens: 180
  },
  cost: 0.0021,
  latency: 1250,
  cached: false
}

export const mockCachedAIResponse: AIResponse = {
  ...mockAIResponse,
  content: 'This response was served from cache',
  latency: 5,
  cached: true,
  cost: 0
}

export const mockStreamingChunks: AIChunk[] = [
  {
    delta: 'The pod ',
    done: false
  },
  {
    delta: 'is failing ',
    done: false
  },
  {
    delta: 'to schedule ',
    done: false
  },
  {
    delta: 'because there ',
    done: false
  },
  {
    delta: 'is insufficient ',
    done: false
  },
  {
    delta: 'memory available ',
    done: false
  },
  {
    delta: 'on the nodes.\n\n',
    done: false
  },
  {
    delta: 'To resolve this:\n\n',
    done: false
  },
  {
    delta: '1. Check node resources',
    done: false
  },
  {
    delta: '',
    done: true,
    usage: {
      inputTokens: 450,
      outputTokens: 180
    }
  }
]

export const mockAnthropicAPIResponse = {
  id: 'msg_test123',
  type: 'message',
  role: 'assistant',
  content: [
    {
      type: 'text',
      text: mockAIResponse.content
    }
  ],
  model: 'claude-3-5-sonnet-20241022',
  stop_reason: 'end_turn',
  stop_sequence: null,
  usage: {
    input_tokens: 450,
    output_tokens: 180
  }
}

export const mockAnthropicStreamEvent = {
  type: 'message_start',
  message: {
    id: 'msg_test123',
    type: 'message',
    role: 'assistant',
    content: [],
    model: 'claude-3-5-sonnet-20241022',
    usage: {
      input_tokens: 450,
      output_tokens: 0
    }
  }
}

export const mockAnthropicStreamContentDelta = {
  type: 'content_block_delta',
  index: 0,
  delta: {
    type: 'text_delta',
    text: 'Hello from Claude'
  }
}

export const mockAnthropicStreamMessageDelta = {
  type: 'message_delta',
  delta: {
    stop_reason: 'end_turn',
    stop_sequence: null
  },
  usage: {
    output_tokens: 180
  }
}

export const mockOpenAIAPIResponse = {
  id: 'chatcmpl-test123',
  object: 'chat.completion',
  created: 1234567890,
  model: 'gpt-4',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: mockAIResponse.content
      },
      finish_reason: 'stop'
    }
  ],
  usage: {
    prompt_tokens: 450,
    completion_tokens: 180,
    total_tokens: 630
  }
}

export const mockOpenAIStreamChunk = {
  id: 'chatcmpl-test123',
  object: 'chat.completion.chunk',
  created: 1234567890,
  model: 'gpt-4',
  choices: [
    {
      index: 0,
      delta: {
        content: 'Hello from GPT-4'
      },
      finish_reason: null
    }
  ]
}

/**
 * Mock responses for different question types
 */
export const mockQuestionResponses = {
  podCrashing: {
    content: `The pod is in a CrashLoopBackOff state because the container is failing to start.

Common causes:
- Application error on startup
- Misconfigured environment variables
- Missing dependencies or files
- Port already in use
- Insufficient resources

To debug:
\`\`\`bash
kubectl logs pod-name --previous
kubectl describe pod pod-name
\`\`\``,
    model: 'claude-3-5-sonnet-20241022',
    usage: { inputTokens: 400, outputTokens: 150 },
    latency: 1100,
    cached: false
  },

  createDeployment: {
    content: `Here's a production-ready Nginx deployment:

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.21
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
\`\`\`

Apply with:
\`\`\`bash
kubectl apply -f deployment.yaml
\`\`\``,
    model: 'claude-3-5-sonnet-20241022',
    usage: { inputTokens: 350, outputTokens: 280 },
    latency: 1500,
    cached: false
  },

  optimizeResources: {
    content: `Based on your cluster analysis:

**Current Resource Usage:**
- Pods: 50
- Deployments: 20
- Services: 15

**Recommendations:**

1. **Right-size pod resources** - Many pods are over-provisioned
2. **Enable Horizontal Pod Autoscaling** for variable workloads
3. **Use PodDisruptionBudgets** to maintain availability during updates
4. **Implement ResourceQuotas** per namespace to prevent resource exhaustion

Example HPA:
\`\`\`bash
kubectl autoscale deployment app --cpu-percent=70 --min=2 --max=10
\`\`\``,
    model: 'claude-3-5-sonnet-20241022',
    usage: { inputTokens: 500, outputTokens: 200 },
    latency: 1300,
    cached: false
  },

  explainConcept: {
    content: `A Kubernetes Service is an abstraction that defines a logical set of Pods and a policy for accessing them.

**Key Concepts:**

1. **ClusterIP** (default) - Internal cluster access only
2. **NodePort** - Exposes service on each node's IP at a static port
3. **LoadBalancer** - Exposes service externally using cloud provider's load balancer
4. **ExternalName** - Maps service to a DNS name

**Example:**
\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
\`\`\`

The service routes traffic to pods matching the selector.`,
    model: 'claude-3-5-sonnet-20241022',
    usage: { inputTokens: 300, outputTokens: 220 },
    latency: 1200,
    cached: false
  }
}

/**
 * Mock error responses
 */
export const mockErrorResponses = {
  invalidAPIKey: {
    error: 'INVALID_API_KEY',
    message: 'The API key provided is invalid',
    code: 401
  },

  rateLimit: {
    error: 'RATE_LIMIT',
    message: 'Rate limit exceeded. Please try again later.',
    code: 429
  },

  timeout: {
    error: 'TIMEOUT',
    message: 'Request timed out after 30 seconds',
    code: 408
  },

  invalidRequest: {
    error: 'INVALID_REQUEST',
    message: 'Invalid request parameters',
    code: 400
  },

  networkError: {
    error: 'NETWORK_ERROR',
    message: 'Network connection failed',
    code: 500
  }
}
