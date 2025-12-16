# Terminology Changes Applied

**Issue Resolved:** Disambiguation of "context" between Kubernetes and AI domains

---

## 🔄 Changes Made

### Type Names

| Old Name (Ambiguous) | New Name (Clear)   | Purpose                     |
| -------------------- | ------------------ | --------------------------- |
| `ClusterContext`     | `ClusterSnapshot`  | Point-in-time cluster state |
| `AIContext`          | `AIPromptData`     | Data sent to AI model       |
| `context-types.ts`   | `cluster-types.ts` | Type definitions file       |
| `context/`           | `collectors/`      | Directory name              |

### Class Names

| Old Name                  | New Name               | File                        |
| ------------------------- | ---------------------- | --------------------------- |
| `ClusterContextCollector` | `ClusterDataCollector` | `cluster-data-collector.ts` |
| `ContextCollector`        | `ClusterDataCollector` | (same)                      |

### Function Names

| Old Name           | New Name                   | Purpose                  |
| ------------------ | -------------------------- | ------------------------ |
| `collectContext()` | `captureClusterSnapshot()` | Gather cluster state     |
| `getContext()`     | `getClusterSnapshot()`     | Retrieve cached snapshot |
| `cacheContext()`   | `cacheClusterSnapshot()`   | Store snapshot in cache  |
| `buildContext()`   | `buildAIPromptData()`      | Prepare data for AI      |

### Variable Names

| Old Name         | New Name          | Type              |
| ---------------- | ----------------- | ----------------- |
| `context`        | `clusterSnapshot` | `ClusterSnapshot` |
| `context`        | `promptData`      | `AIPromptData`    |
| `currentContext` | `activeCluster`   | Cluster config    |

### File Structure

```
Old Structure:
src/
├── context/
│   ├── cluster-context.ts
│   ├── resource-context.ts
│   └── log-collector.ts
└── types/
    └── context-types.ts

New Structure:
src/
├── collectors/
│   ├── cluster-data-collector.ts
│   ├── resource-details-collector.ts
│   └── log-collector.ts
└── types/
    ├── cluster-types.ts
    └── ai-types.ts
```

---

## 📝 Updated Documentation

### Technical Specification

**Updated sections:**

- Type definitions (`ClusterContext` → `ClusterSnapshot`)
- Class implementations (`ClusterContextCollector` → `ClusterDataCollector`)
- Function signatures (`collectContext()` → `captureClusterSnapshot()`)
- Parameter names (`context` → `clusterData` or `clusterSnapshot`)

**Example:**

```typescript
// OLD (ambiguous)
interface AICompletionRequest {
  prompt: string
  context?: ClusterContext
}

// NEW (clear)
interface AICompletionRequest {
  prompt: string
  clusterData?: ClusterSnapshot
}
```

---

## 🎯 Usage Guidelines

### When Writing Code

**Kubernetes-related:**

```typescript
// ✅ Clear
const kubectlContext = getCurrentKubectlContext()
const clusterSnapshot = await collector.captureClusterSnapshot()
const activeCluster = getActiveClusterName()
```

**AI-related:**

```typescript
// ✅ Clear
const promptData = buildAIPromptData(clusterSnapshot)
const response = await ai.complete({ prompt, clusterData: promptData })
const conversationHistory = getChatHistory()
```

### When Writing Documentation

**Use full descriptive phrases:**

- ✅ "The AI analyzes cluster data including pods, logs, and events"
- ✅ "Switch your kubectl context to the production cluster"
- ❌ "The context is sent to the AI"

### In User Interface

```typescript
// ✅ Clear UI text
<ClusterInfoPanel title="Current Cluster" data={clusterSnapshot} />
// Shows: "Current Cluster: production-us-east-1"

<PromptDataView title="Data Sent to AI" tokens={15234} />
// Shows: "Data Sent to AI: 15,234 tokens"
```

---

## 🔍 Search & Replace Guide

When refactoring existing code, use these patterns:

### Type Imports

```bash
# Find
import.*ClusterContext.*from

# Replace with
import { ClusterSnapshot } from
```

### Function Calls

```bash
# Find
\.collectContext\(

# Replace with
.captureClusterSnapshot(
```

### Variable Declarations

```bash
# Find
const context: ClusterContext

# Replace with
const clusterSnapshot: ClusterSnapshot
```

---

## ✅ Verification Checklist

Before committing code, verify:

- [ ] No `ClusterContext` type references (use `ClusterSnapshot`)
- [ ] No `collectContext()` function calls (use `captureClusterSnapshot()`)
- [ ] No standalone `context` variables without prefix
- [ ] File names updated (`context/` → `collectors/`)
- [ ] Import paths updated to new file structure
- [ ] Comments clarify Kubernetes vs AI terminology
- [ ] User-facing text uses full descriptive terms

---

## 📚 Reference Documents

- **Terminology Guide:** Complete naming conventions
- **Technical Spec:** Updated with new terminology
- **Code Examples:** Uses new naming throughout

---

## 🚀 Implementation Notes

**These changes are effective immediately for all new code.**

During implementation:

1. Use new terminology in all new files
2. Update imports as you touch files
3. Refactor incrementally during development
4. Update tests to use new names
5. Ensure documentation consistency

**No legacy "context" terminology should appear in new code.**

---

## 💡 Quick Reference

**Remember:**

- **Kubernetes** = kubectl context, cluster config, cluster snapshot
- **AI** = prompt data, request payload, conversation history
- When in doubt, use the **full descriptive term** (e.g., "cluster snapshot" instead of "context")
