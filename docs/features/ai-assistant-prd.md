# Product Requirements Document: AI-Powered Kubernetes Assistant

**Feature Name:** Kui AI Assistant
**Version:** 1.0
**Author:** Kui Development Team
**Date:** 2025-12-16
**Status:** Planning

---

## Executive Summary

The AI-Powered Kubernetes Assistant transforms Kui from a visualization tool into an intelligent debugging and automation platform. By integrating AI capabilities directly into the kubectl workflow, users can troubleshoot issues, generate manifests, and optimize their clusters using natural language.

---

## Problem Statement

### Current Pain Points

1. **Debugging is Time-Consuming**: Engineers spend 2-4 hours debugging pod failures, analyzing logs across multiple sources
2. **Steep Learning Curve**: Junior developers struggle with kubectl commands and YAML syntax
3. **Context Switching**: Users jump between kubectl, documentation, Stack Overflow, and ChatGPT
4. **Manual Manifest Creation**: Writing production-ready Kubernetes manifests requires extensive knowledge
5. **Reactive Troubleshooting**: Issues discovered after they impact production

### User Impact

- Platform engineers waste 30-40% of time on repetitive debugging
- Teams need dedicated Kubernetes experts for troubleshooting
- Onboarding new developers takes 2-3 months
- Incident response time averages 1-2 hours

---

## Goals & Success Metrics

### Primary Goals

1. **Reduce debugging time by 70%** (from 2 hours → 30 minutes)
2. **Enable junior developers** to debug production issues independently
3. **Eliminate context switching** during troubleshooting
4. **Accelerate manifest creation** (from 30 minutes → 2 minutes)

### Success Metrics

- **Usage:** 80% of Kui users activate AI assistant within first week
- **Engagement:** Average 15+ AI queries per user per day
- **Satisfaction:** Net Promoter Score (NPS) > 8.5/10
- **Performance:** 95% of queries resolve in < 2 seconds
- **Accuracy:** 85%+ of AI suggestions are actionable

---

## Target Users

### Primary Personas

**1. Platform Engineer (Sarah)**

- Manages 20+ Kubernetes clusters
- Debugs production incidents weekly
- Needs fast root cause analysis
- Values: Speed, accuracy, context awareness

**2. Backend Developer (Alex)**

- Junior developer (1 year experience)
- Deploys services to Kubernetes
- Struggles with kubectl and YAML
- Values: Learning, guidance, examples

**3. DevOps Lead (Jordan)**

- Oversees team of 8 engineers
- Reviews manifests and incidents
- Needs team efficiency improvements
- Values: Standardization, best practices

---

## Feature Requirements

### 1. AI Provider Configuration (CRITICAL)

#### 1.1 Environment Variable Support

**User Story:** As a user, I want to configure AI API keys via environment variables so I can keep credentials secure.

**Requirements:**

- Read API keys from environment variables:
  - `CLAUDE_API_KEY` - Anthropic Claude API key
  - `OPENAI_API_KEY` - OpenAI API key
  - `ANTHROPIC_API_KEY` - Alternative Claude key name
  - `KUI_AI_PROVIDER` - Default provider selection
  - `KUI_AI_MODEL` - Default model selection
  - `KUI_AI_BASE_URL` - Custom API endpoint (for proxies/local LLMs)
  - `KUI_AI_TIMEOUT` - Request timeout in seconds (default: 30)
  - `KUI_AI_MAX_TOKENS` - Max response tokens (default: 4096)

- Support `.env` file loading from:
  - `~/.kube/kui.env`
  - `~/.config/kui/.env`
  - Project root `.env`

- Validation on startup:
  - Check if at least one API key is configured
  - Test API connection with simple request
  - Show clear error message if configuration fails

#### 1.2 Settings UI

**User Story:** As a user, I want to configure AI providers through a GUI so I don't need to edit config files.

**Requirements:**

- Settings panel accessible via:
  - Menu: `Preferences > AI Assistant`
  - Command: `/ai config`
  - Keyboard shortcut: `Cmd/Ctrl + ,` → AI tab

- Configuration options:

  ```
  AI Provider Settings
  ├── Provider Selection
  │   ├── [ ] Anthropic Claude (recommended)
  │   ├── [ ] OpenAI GPT-4
  │   ├── [ ] Azure OpenAI
  │   ├── [ ] Local LLM (Ollama)
  │   └── [ ] Custom Endpoint
  │
  ├── API Configuration
  │   ├── API Key: [••••••••••••••] [Test Connection]
  │   ├── Base URL: [https://api.anthropic.com]
  │   ├── Model: [claude-3-5-sonnet-20241022 ▾]
  │   └── Timeout: [30 seconds]
  │
  ├── Performance Settings
  │   ├── Max Tokens: [4096]
  │   ├── Temperature: [0.7] (0 = focused, 1 = creative)
  │   ├── Streaming: [✓] Enable real-time responses
  │   └── Caching: [✓] Cache cluster context for 5 minutes
  │
  └── Privacy Settings
      ├── [✓] Send cluster metadata (namespaces, resource counts)
      ├── [ ] Send resource names
      ├── [ ] Send log contents
      └── [ ] Send pod/node names
  ```

- Visual feedback:
  - Connection status indicator (green/yellow/red)
  - Estimated monthly cost based on usage
  - Last successful API call timestamp

#### 1.3 Provider Presets

**User Story:** As a user, I want quick setup for popular AI providers.

**Presets:**

```typescript
interface AIProviderPreset {
  name: string
  provider: 'anthropic' | 'openai' | 'azure' | 'ollama' | 'custom'
  baseUrl: string
  models: string[]
  recommended: string
  features: {
    streaming: boolean
    vision: boolean
    functionCalling: boolean
    contextWindow: number
  }
  pricing: {
    inputPerMillion: number
    outputPerMillion: number
  }
}
```

**Default Presets:**

1. **Anthropic Claude** (Recommended)
   - Model: claude-3-5-sonnet-20241022
   - Context: 200K tokens
   - Features: Streaming, function calling
   - Cost: $3/$15 per million tokens

2. **OpenAI GPT-4**
   - Model: gpt-4-turbo-preview
   - Context: 128K tokens
   - Features: Streaming, vision, function calling
   - Cost: $10/$30 per million tokens

3. **Local LLM (Ollama)**
   - Model: llama3:70b
   - Context: 8K tokens
   - Features: Free, private, slower
   - Cost: $0

---

### 2. Interactive AI Interface (CRITICAL)

#### 2.1 Chat Sidebar

**User Story:** As a user, I want a persistent chat interface so I can ask questions while viewing resources.

**Requirements:**

- Toggle sidebar: `Cmd/Ctrl + K` or click AI icon
- Layout:

  ```
  ┌─────────────────┬────────────────────┐
  │                 │  AI Assistant      │
  │  Main Terminal  │  ┌──────────────┐  │
  │                 │  │ Context      │  │
  │  $ kubectl get  │  │ Namespace: defau│
  │    pods         │  │ Resources: 47   │
  │                 │  │ Cluster: prod-1 │
  │  NAME      READY │  └──────────────┘  │
  │  api-..   1/1   │                    │
  │  web-..   0/1   │  Chat History      │
  │                 │  ┌──────────────┐  │
  │                 │  │ You: Why is   │  │
  │                 │  │ web-* failing?│  │
  │                 │  │              │  │
  │                 │  │ AI: Checking  │  │
  │                 │  │ pod logs...   │  │
  │                 │  └──────────────┘  │
  │                 │                    │
  │                 │  [Ask a question..]│
  └─────────────────┴────────────────────┘
  ```

- Features:
  - Resizable sidebar (drag to adjust width)
  - Collapsible context panel
  - Scrollable chat history (persist 100 messages)
  - Markdown rendering for code blocks
  - Copy code snippets with one click
  - Clear chat button
  - Export conversation to markdown

#### 2.2 Inline Command Suggestions

**User Story:** As a user, I want AI suggestions as I type kubectl commands.

**Requirements:**

- Trigger: Type `/` or `?` in command line
- Show floating suggestion panel:

  ```
  $ kubectl get pods --help?

  ┌─────────────────────────────────┐
  │ 💡 AI Suggestion               │
  │                                 │
  │ Try: kubectl get pods -o wide   │
  │ Shows: IP addresses, nodes      │
  │                                 │
  │ Or: kubectl get pods --watch    │
  │ Shows: Live updates             │
  │                                 │
  │ [Ask AI] [Dismiss]              │
  └─────────────────────────────────┘
  ```

- Auto-complete kubectl options with explanations
- Suggest commands based on current context
- Learn from user's command history

#### 2.3 Mouse Interactions

**User Story:** As a user, I want to interact with AI using mouse clicks.

**Requirements:**

- Right-click context menu on resources:

  ```
  pod/api-server-xyz
  ├── Get Logs
  ├── Describe
  ├── Delete
  ├── ──────────
  ├── 🤖 Ask AI: "Why is this pod failing?"
  ├── 🤖 Ask AI: "Show me recent errors"
  └── 🤖 Ask AI: "How to fix CrashLoopBackOff?"
  ```

- Hover tooltips with AI insights:

  ```
  pod/api-server-xyz  [🔴 CrashLoopBackOff]
       ↓
  ┌───────────────────────────────┐
  │ AI Insight:                   │
  │ This pod is failing because:  │
  │ • OOM (out of memory)         │
  │ • Memory limit: 128Mi         │
  │ • Actual usage: 156Mi         │
  │                               │
  │ Suggestion: Increase limit    │
  │ [Fix automatically] [Details] │
  └───────────────────────────────┘
  ```

- Click-to-execute AI suggestions
- Drag-and-drop YAML files for analysis

#### 2.4 Command-Based Invocation

**User Story:** As a user, I want to use AI from the command line without opening GUI.

**Requirements:**

- Commands:

  ```bash
  # Ask a question
  $ kubectl ai "why is my pod crashing?"

  # Analyze current resources
  $ kubectl ai analyze

  # Generate manifest
  $ kubectl ai create "nginx deployment with 3 replicas"

  # Debug specific resource
  $ kubectl ai debug pod/api-server-xyz

  # Explain kubectl command
  $ kubectl ai explain "kubectl rollout restart deployment/api"

  # Optimize cluster
  $ kubectl ai optimize --namespace production
  ```

- Streaming output to terminal
- JSON output mode for scripting: `--output json`
- Quiet mode: `--quiet` (only show final answer)

---

### 3. Intelligent Troubleshooting (HIGH PRIORITY)

#### 3.1 Automatic Context Gathering

**User Story:** As a user, I want AI to automatically gather relevant information when debugging.

**What AI Should Analyze:**

- Pod status, events, logs (last 100 lines)
- Deployment/ReplicaSet/StatefulSet status
- Service endpoints and networking
- ConfigMaps and Secrets (names only, not values)
- Resource limits and requests vs actual usage
- Node conditions and capacity
- Recent changes (last 24 hours)
- Similar issues in other namespaces

**Context Window Optimization:**

```typescript
interface ClusterContext {
  // Always included (< 1K tokens)
  cluster: {
    name: string
    version: string
    nodeCount: number
    namespaceCount: number
  }

  // Included if relevant (< 5K tokens)
  currentNamespace: {
    podCount: number
    serviceCount: number
    recentEvents: Event[]
  }

  // Included on demand (< 20K tokens)
  resourceDetails: {
    logs: string[]
    manifests: object[]
    metrics: object[]
  }
}
```

#### 3.2 Root Cause Analysis

**User Story:** As a user, I want AI to identify the root cause of failures, not just symptoms.

**Analysis Chain:**

1. **Symptom Detection** (< 500ms)
   - Identify error state (CrashLoopBackOff, ImagePullBackOff, etc.)
   - Extract error messages from logs/events

2. **Context Correlation** (< 1s)
   - Check recent deployments/changes
   - Analyze resource constraints
   - Review networking configuration

3. **Root Cause Hypothesis** (< 2s)
   - Generate 2-3 likely causes
   - Rank by probability
   - Provide evidence for each

4. **Solution Recommendation** (< 3s)
   - Suggest immediate fixes
   - Provide step-by-step instructions
   - Offer kubectl commands to execute

**Example Flow:**

```
User: "Why is pod api-server-xyz-abc failing?"

AI Analysis (2.1s):
┌────────────────────────────────────────┐
│ 🔍 Root Cause Analysis                │
│                                        │
│ Issue: CrashLoopBackOff                │
│ Root Cause: OOMKilled (Out of Memory)  │
│ Confidence: 95%                        │
│                                        │
│ Evidence:                              │
│ • Exit code 137 (OOM)                  │
│ • Memory limit: 128Mi                  │
│ • Actual usage peaked at 178Mi         │
│ • Heap dump in logs: "OutOfMemoryError"│
│                                        │
│ Solution:                              │
│ 1. Increase memory limit to 256Mi      │
│    $ kubectl set resources deployment...│
│                                        │
│ 2. Add memory request to prevent       │
│    resource contention                 │
│                                        │
│ 3. Investigate memory leak (optional)  │
│    • Enable heap profiling             │
│    • Add monitoring                    │
│                                        │
│ [Apply Fix] [View Full Analysis]       │
└────────────────────────────────────────┘
```

#### 3.3 Proactive Issue Detection

**User Story:** As a user, I want AI to warn me about potential issues before they cause failures.

**Detection Categories:**

- **Resource Exhaustion:** Pods approaching memory/CPU limits
- **Configuration Errors:** Missing env vars, incorrect ports
- **Security Issues:** Privileged containers, missing security contexts
- **Performance Problems:** High restart counts, slow response times
- **Cost Optimization:** Overprovisioned resources

**UI Notification:**

```
┌────────────────────────────────────┐
│ ⚠️  AI Detected Potential Issues  │
│                                    │
│ 3 pods nearing memory limits       │
│ 2 deployments without health checks│
│ 1 service with no endpoints        │
│                                    │
│ [Review Issues] [Dismiss]          │
└────────────────────────────────────┘
```

---

### 4. Manifest Generation (HIGH PRIORITY)

#### 4.1 Natural Language to YAML

**User Story:** As a user, I want to describe what I need and get production-ready YAML.

**Examples:**

```bash
# Simple deployment
User: "Create nginx deployment with 3 replicas"
AI generates:
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx
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
        image: nginx:1.25-alpine
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "128Mi"
            cpu: "200m"
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 15
          periodSeconds: 20
```

#### 4.2 Best Practices Enforcement

**User Story:** As a user, I want AI-generated manifests to follow production best practices.

**Automatic Additions:**

- Resource requests and limits
- Health checks (readiness/liveness probes)
- Security contexts (non-root user, read-only filesystem)
- Pod disruption budgets
- Network policies (if requested)
- Horizontal pod autoscaling (if requested)
- Anti-affinity rules for high availability

#### 4.3 Interactive Manifest Editor

**User Story:** As a user, I want to refine AI-generated manifests iteratively.

**Workflow:**

1. AI generates initial manifest
2. User: "Add PostgreSQL sidecar"
3. AI adds PostgreSQL container with proper configuration
4. User: "Use secrets for database password"
5. AI updates to reference Kubernetes secret
6. User: "Apply to staging namespace"
7. AI executes kubectl apply

---

### 5. Latency Optimization (CRITICAL)

#### 5.1 Performance Targets

- **Interactive queries:** < 2 seconds (P95)
- **Streaming responses:** First token in < 500ms
- **Context gathering:** < 300ms
- **Background analysis:** < 5 seconds

#### 5.2 Optimization Strategies

**A. Request Optimization**

```typescript
// Parallel API calls
const [pods, events, logs] = await Promise.all([
  k8s.listPods(namespace),
  k8s.listEvents(namespace),
  k8s.getPodLogs(podName, { tail: 100 })
])

// Streaming responses
for await (const chunk of ai.streamCompletion(prompt)) {
  updateUI(chunk)
}
```

**B. Caching Strategy**

```typescript
interface CacheConfig {
  clusterInfo: { ttl: 5 * 60 * 1000 },      // 5 minutes
  resourceLists: { ttl: 30 * 1000 },         // 30 seconds
  logs: { ttl: 10 * 1000 },                  // 10 seconds
  aiResponses: { ttl: 60 * 60 * 1000 }       // 1 hour
}
```

**C. Prompt Optimization**

- Use structured prompts with clear sections
- Compress cluster context (send summary, not full data)
- Use function calling for tool invocation
- Batch multiple questions in single request

**D. Prefetching**

- Predict likely next questions
- Pre-load common contexts
- Cache frequent query patterns

**E. Progressive Enhancement**

```typescript
// Show fast, low-confidence answer immediately
const quickAnswer = await ai.complete(prompt, { maxTokens: 100 })
displayAnswer(quickAnswer)

// Then enhance with detailed analysis
const detailedAnswer = await ai.complete(enhancedPrompt, { maxTokens: 2000 })
updateAnswer(detailedAnswer)
```

---

## Technical Architecture (High-Level)

```
┌─────────────────────────────────────────────────────────────┐
│                        Kui Main Process                      │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐     │
│  │  Terminal  │  │  AI Sidebar │  │  Settings Panel  │     │
│  │  + Inline  │  │  + Chat     │  │  + API Config    │     │
│  │  Suggestions│  │  + Context  │  │  + Privacy       │     │
│  └────────────┘  └─────────────┘  └──────────────────┘     │
│         │               │                    │               │
│         └───────────────┴────────────────────┘               │
│                         ↓                                    │
│              ┌──────────────────────┐                        │
│              │  AI Service Layer    │                        │
│              │  (IPC/WebSocket)     │                        │
│              └──────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   Plugin: plugin-kubectl-ai                  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ AI Provider │  │ Context      │  │ Prompt           │   │
│  │ Manager     │  │ Collector    │  │ Engineering      │   │
│  │             │  │              │  │                  │   │
│  │ - Anthropic │  │ - kubectl    │  │ - System prompts │   │
│  │ - OpenAI    │  │ - Logs       │  │ - Templates      │   │
│  │ - Local LLM │  │ - Events     │  │ - Chain of       │   │
│  └─────────────┘  └──────────────┘  │   Thought        │   │
│         │                 │          └──────────────────┘   │
│         └─────────────────┴─────────────────┐               │
│                                              ↓               │
│                        ┌──────────────────────────┐          │
│                        │  Cache & Performance     │          │
│                        │  - Redis/In-memory       │          │
│                        │  - Request deduplication │          │
│                        └──────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                       External Services                      │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │ Anthropic    │  │ OpenAI        │  │ Ollama          │  │
│  │ Claude API   │  │ GPT-4 API     │  │ (Local)         │  │
│  └──────────────┘  └───────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Privacy & Security

### Data Handling

1. **No data sent by default** - User must explicitly opt-in
2. **Configurable privacy levels:**
   - Level 1: Only send error messages
   - Level 2: Send resource types and counts
   - Level 3: Send resource names
   - Level 4: Send logs and configurations (exclude secrets)

3. **Secret Detection:**
   - Automatically redact API keys, passwords, tokens
   - Hash sensitive identifiers before sending

4. **Local-first option:**
   - Support Ollama for fully local AI
   - No data leaves user's machine

### API Key Security

- Store encrypted in system keychain (macOS/Windows) or keyring (Linux)
- Never log API keys
- Rotate keys support
- Environment variable override for CI/CD

---

## User Onboarding

### First-Time Setup Wizard

```
┌───────────────────────────────────────┐
│  Welcome to Kui AI Assistant!        │
│                                       │
│  Let's get you started in 3 steps:   │
│                                       │
│  Step 1 of 3: Choose AI Provider     │
│                                       │
│  ( ) Anthropic Claude (Recommended)  │
│      Fast, accurate, 200K context    │
│      Cost: ~$5/month                  │
│                                       │
│  ( ) OpenAI GPT-4                     │
│      Great for general questions     │
│      Cost: ~$10/month                 │
│                                       │
│  ( ) Local LLM (Ollama)               │
│      100% private, slower            │
│      Cost: Free                       │
│                                       │
│  [Continue] [Skip Setup]              │
└───────────────────────────────────────┘
```

### Interactive Tutorial

- First query is a guided tour
- Tooltip hints for new features
- Example queries in chat placeholder:
  - "Why is my pod crashing?"
  - "Create a production-ready deployment"
  - "Optimize my cluster resources"

---

## Out of Scope (v1.0)

- Multi-turn conversations with memory
- Training on user's cluster data
- Automated remediation without confirmation
- Integration with Slack/Teams
- Voice input
- Multi-language support (English only v1)

---

## Success Criteria

### Must Have (Launch Blockers)

- ✅ Environment variable configuration works
- ✅ Settings UI is intuitive and functional
- ✅ Chat sidebar responds in < 2 seconds (P95)
- ✅ AI accurately identifies pod failure causes (85% accuracy)
- ✅ Generated manifests follow best practices
- ✅ Privacy controls are clearly documented

### Should Have (Post-Launch)

- Command-line AI invocation
- Proactive issue detection
- Interactive manifest refinement
- Hover tooltips with AI insights

### Nice to Have (Future)

- Multiple AI provider comparison
- Cost tracking dashboard
- Session recording and replay

---

## Next Steps

1. **Technical Specification** → Define APIs, data models, architecture
2. **User Journey Mapping** → Detail interaction flows
3. **Prototype** → Build minimal chat interface with Claude API
4. **User Testing** → Validate with 10 beta users
5. **Iteration** → Refine based on feedback
6. **Launch** → Release as experimental feature flag

---

## Questions & Decisions Needed

1. **Default AI provider?** → Recommend Claude or let user choose?
2. **Pricing model?** → Free with API key or Kui-managed subscription?
3. **Rate limiting?** → How many queries per hour?
4. **Offline mode?** → Cache responses for common queries?
5. **Analytics?** → Track usage metrics (opt-in)?

---

## Appendix

### Related Documents

- Technical Specification: `ai-assistant-tech-spec.md`
- User Journey Maps: `ai-assistant-user-journeys.md`
- API Integration Guide: `ai-assistant-api-guide.md`
- Privacy Policy: `ai-assistant-privacy.md`

### References

- Anthropic Claude API: https://docs.anthropic.com/
- OpenAI API: https://platform.openai.com/docs
- Ollama: https://ollama.ai/
- Kubernetes API: https://kubernetes.io/docs/reference/
