# Terminology Guide: Avoiding Context Confusion

**Issue:** The word "context" is used in both Kubernetes and AI domains with different meanings.

---

## ❌ Ambiguous Terms

### "Context" - DO NOT USE ALONE

**Kubernetes Context:**

- The cluster + namespace + user configuration
- Example: `kubectl config use-context production-cluster`
- Stored in kubeconfig file

**AI Context:**

- The data/information sent to an AI model
- Example: "context window" (200K tokens for Claude)
- The prompt, system message, and conversation history

---

## ✅ Clear Terminology

### For Kubernetes

| ❌ Avoid        | ✅ Use Instead            | Example                                         |
| --------------- | ------------------------- | ----------------------------------------------- |
| context         | **kubectl context**       | "Switch kubectl context to staging"             |
| context         | **cluster context**       | "Current cluster context: production-us-east-1" |
| current context | **active cluster**        | "Active cluster: prod-eks"                      |
| context info    | **cluster configuration** | "Cluster configuration shows 5 nodes"           |

**In Code:**

```typescript
// ❌ Bad
interface Context {
  name: string
  namespace: string
}

// ✅ Good
interface KubectlContext {
  clusterName: string
  namespace: string
  user: string
}

interface ClusterConfig {
  name: string
  version: string
  provider: 'eks' | 'gke' | 'aks'
}
```

---

### For AI/LLM

| ❌ Avoid       | ✅ Use Instead           | Example                                          |
| -------------- | ------------------------ | ------------------------------------------------ |
| context        | **AI context**           | "AI context includes logs and events"            |
| context        | **prompt context**       | "Prompt context: 15K tokens"                     |
| context        | **conversation context** | "Conversation context preserved across messages" |
| context window | **token limit**          | "Claude has 200K token limit"                    |
| send context   | **send cluster data**    | "Send cluster data to AI"                        |

**In Code:**

```typescript
// ❌ Bad
interface Context {
  cluster: any
  prompt: string
}

// ✅ Good
interface AIPromptData {
  clusterSnapshot: ClusterSnapshot
  resourceDetails: ResourceDetails
  userQuery: string
}

interface AIRequestPayload {
  systemPrompt: string
  promptData: AIPromptData
  conversationHistory: Message[]
}
```

---

## 📚 Recommended Naming Conventions

### Type Names

```typescript
// Kubernetes-related
KubectlContext // kubectl config context
ClusterConfig // Cluster configuration
ClusterSnapshot // Point-in-time cluster state
ResourceDetails // Individual resource information
NamespaceInfo // Namespace metadata
ClusterMetadata // Cluster-level metadata

// AI-related
AIPromptData // Data sent to AI
AIRequestPayload // Complete API request
AIResponseData // AI response
ConversationHistory // Chat history
PromptTemplate // Prompt structure
TokenBudget // Token allocation
```

### Variable Names

```typescript
// ❌ Ambiguous
const context = getContext()
const currentContext = getCurrentContext()

// ✅ Clear - Kubernetes
const kubectlContext = getCurrentKubectlContext()
const activeCluster = getActiveCluster()
const clusterConfig = getClusterConfig()
const clusterSnapshot = captureClusterState()

// ✅ Clear - AI
const aiPromptData = buildAIPrompt()
const promptPayload = createAIRequest()
const conversationHistory = getChatHistory()
```

### Function Names

```typescript
// ❌ Ambiguous
getContext()
setContext()
collectContext()

// ✅ Clear - Kubernetes
getCurrentKubectlContext()
switchToCluster(name)
captureClusterSnapshot()
fetchClusterConfig()

// ✅ Clear - AI
buildAIPromptData()
enrichPromptWithClusterData()
sendToAI()
```

---

## 🏗️ Architecture Term Mapping

### Old Names → New Names

| Component        | Old Name           | New Name                 |
| ---------------- | ------------------ | ------------------------ |
| **Type**         | ClusterContext     | ClusterSnapshot          |
| **Type**         | ContextCollector   | ClusterDataCollector     |
| **Type**         | AIContext          | AIPromptData             |
| **Function**     | collectContext()   | captureClusterSnapshot() |
| **Function**     | getContext()       | getClusterSnapshot()     |
| **Function**     | buildContext()     | buildAIPromptData()      |
| **Class**        | ContextCollector   | ClusterDataCollector     |
| **File**         | cluster-context.ts | cluster-snapshot.ts      |
| **File**         | context-types.ts   | cluster-types.ts         |
| **UI Component** | ContextPanel       | ClusterInfoPanel         |

---

## 📝 Documentation Guidelines

### In User-Facing Documentation

**Use full, descriptive terms:**

- ✅ "The AI Assistant gathers information about your Kubernetes cluster..."
- ✅ "Switch to your production kubectl context..."
- ✅ "The AI analyzes cluster data including logs and events..."
- ❌ "The context is sent to the AI..."

**Be explicit:**

- ✅ "Current cluster: production-us-east-1"
- ✅ "AI prompt includes: cluster metadata, pod logs, recent events"
- ❌ "Current context: production"

### In Code Comments

```typescript
// ❌ Ambiguous
// Get the context for the AI

// ✅ Clear
// Capture current cluster state (pods, logs, events) for AI analysis

// ❌ Ambiguous
// Switch context before running command

// ✅ Clear
// Switch kubectl context to target cluster before executing command
```

---

## 🎯 Quick Reference Card

**When you mean Kubernetes cluster information:**

- Primary: `ClusterSnapshot`
- Alternative: `ClusterConfig`, `ClusterState`, `ClusterInfo`

**When you mean data for AI:**

- Primary: `AIPromptData`
- Alternative: `PromptPayload`, `AIRequestData`

**When you mean kubectl context:**

- Primary: `KubectlContext`
- Alternative: `ClusterContext` (acceptable if clearly Kubernetes-only)

**When you mean conversation context:**

- Primary: `ConversationHistory`
- Alternative: `ChatHistory`, `MessageHistory`

---

## 🔄 Migration Plan

### Phase 1: New Code (Starting Now)

- Use new terminology in all new code
- Follow naming conventions above
- Update type definitions

### Phase 2: Documentation Updates

- Update PRD, tech spec, user journeys
- Replace ambiguous "context" references
- Add terminology guide references

### Phase 3: Code Refactoring (During Implementation)

- Rename types and interfaces
- Update function names
- Refactor variable names
- Update comments

---

## 💡 Examples in Practice

### User Interface Text

```typescript
// ❌ Confusing
<ContextPanel context={context} />
// User sees: "Context: production"
// Thinks: "Which context? Kubernetes or AI?"

// ✅ Clear
<ClusterInfoPanel cluster={clusterSnapshot} />
// User sees: "Cluster: production-us-east-1"
// Thinks: "Ah, my Kubernetes cluster"
```

### Chat Messages

```typescript
// ❌ Confusing
'Analyzing context...'

// ✅ Clear - When gathering Kubernetes data
'Gathering cluster information...'
'Fetching pod logs and events...'

// ✅ Clear - When sending to AI
'Analyzing your cluster data...'
'Processing 2,347 tokens...'
```

### Error Messages

```typescript
// ❌ Confusing
'Failed to load context'

// ✅ Clear
'Failed to connect to Kubernetes cluster'
'Unable to gather cluster information'
'AI request failed: token limit exceeded'
```

---

## 📋 Checklist for Contributors

Before submitting code, verify:

- [ ] No standalone use of "context" variable/type names
- [ ] Kubernetes terms use: Cluster, Kubectl, Namespace
- [ ] AI terms use: Prompt, Request, Payload, Conversation
- [ ] Comments explain which "context" is meant
- [ ] User-facing text is unambiguous
- [ ] Error messages specify Kubernetes or AI

---

## 🔗 See Also

- Technical Specification: Updated type definitions
- Code Style Guide: Naming conventions
- API Documentation: Request/response structures
