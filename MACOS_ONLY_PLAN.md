# Kui macOS-Only Migration Plan

**Status**: In Progress
**Target**: Complete Tauri migration to 100%, macOS-only support
**Date**: 2025-12-17

## Executive Summary

This plan outlines the steps to complete the Tauri migration, simplify the codebase for macOS-only support, remove Electron completely, and integrate AI capabilities for natural language Kubernetes debugging.

### Goals

1. ✅ Complete Tauri migration to 100%
2. 🔄 Simplify codebase to macOS-only (remove Linux/Windows complexity)
3. 🔄 Remove Electron runtime completely
4. 📋 Integrate AI for natural language Kubernetes debugging

### Benefits

- **Focused Development**: Optimize for single platform (macOS)
- **Simpler Codebase**: Remove platform-specific conditionals
- **Faster Iteration**: No cross-platform testing needed
- **Better Performance**: Platform-specific optimizations
- **Smaller Bundle**: ~10-12 MB (down from ~15 MB multi-platform)

---

## Current State Analysis

### ✅ What's Complete

- Rust backend implementation in `src-tauri/`
- TypeScript bridge for Electron/Tauri compatibility
- Window management
- IPC communication system
- Menu system (File, Edit, View, Window, Help)
- Plugin system (all plugins working)
- Screenshot capture for macOS (native Cocoa/Quartz APIs)
- Clipboard integration for macOS
- All core Kui features

### 🔄 What Needs Simplification

#### 1. Screenshot Module (`src-tauri/src/screenshot.rs`)

**Current State** (514 lines, multi-platform):
- Line 100-103: macOS capture (native Cocoa/Quartz) ✅
- Line 105-108: Linux capture (xcap + xclip) ❌ Remove
- Line 110-113: Windows capture (xcap, clipboard incomplete) ❌ Remove
- Line 196-287: macOS implementation (native) ✅ Keep
- Line 302-395: Linux implementation (xcap + xclip) ❌ Remove
- Line 406-481: Windows implementation (xcap, clipboard stub) ❌ Remove

**Action**: Simplify to macOS-only, ~200 lines

#### 2. Dependencies (`src-tauri/Cargo.toml`)

**Current Dependencies**:
```toml
xcap = "0.8"              # ❌ Remove (Linux/Windows only)
image = "0.25"            # ✅ Keep (used for macOS PNG encoding)
cocoa = "0.26"            # ✅ Keep (macOS only)
objc = "0.2"              # ✅ Keep (macOS only)
core-graphics = "0.24"    # ✅ Keep (macOS only)
```

**Action**: Remove `xcap`, keep macOS-only dependencies

#### 3. Build Configuration

**Files to Update**:
- `src-tauri/tauri.conf.json` - Remove Linux/Windows targets
- `package.json` - Remove Linux/Windows build scripts
- `.github/workflows/` - Update CI/CD for macOS-only
- `npm run build` scripts - Simplify to macOS Intel + Apple Silicon only

### ❌ What to Remove Completely

#### Electron Runtime

**Files to Remove**:
- `packages/builder/dist/electron/` - Electron build tools
- Platform-specific Electron code (keep tauri-bridge for history)

**Dependencies to Remove from `package.json`**:
```json
{
  "devDependencies": {
    "electron": "^22.3.5",           // ❌ Remove
    "@electron/remote": "^2.0.9"     // ❌ Remove
  },
  "scripts": {
    "build:electron:*": "...",       // ❌ Remove all Electron build scripts
    "open:electron": "...",          // ❌ Remove Electron open script
    "test:electron": "..."           // ❌ Remove Electron test scripts
  }
}
```

**Keep**:
- `packages/core/src/main/tauri-bridge.ts` (historical reference, won't be called)
- Documentation files (for migration history)

---

## Implementation Plan

### Phase 1: macOS-Only Simplification (Week 1)

#### Task 1.1: Simplify Screenshot Module ⏱️ 2-3 hours

**File**: `src-tauri/src/screenshot.rs`

**Actions**:
1. Remove Linux implementation (lines 302-395)
2. Remove Windows implementation (lines 406-481)
3. Remove platform conditional compilation (lines 100-120, 169-189)
4. Simplify to macOS-only implementation
5. Remove unused imports and dependencies
6. Update documentation

**Expected Result**:
- ~200 lines (down from 514)
- Single macOS implementation
- Cleaner, more maintainable code

#### Task 1.2: Simplify Cargo.toml ⏱️ 1 hour

**File**: `src-tauri/Cargo.toml`

**Actions**:
1. Remove `xcap = "0.8"` dependency
2. Keep macOS-only dependencies:
   - `cocoa = "0.26"`
   - `objc = "0.2"`
   - `core-graphics = "0.24"`
   - `image = "0.25"` (for PNG encoding)
3. Add documentation comment: `# macOS-only build`

#### Task 1.3: Update Build Configuration ⏱️ 2 hours

**Files**:
- `src-tauri/tauri.conf.json`
- `package.json`
- `.github/workflows/tauri-build.yml`

**Actions**:

1. **tauri.conf.json**: Remove Linux/Windows bundle targets
   ```json
   {
     "bundle": {
       "targets": ["dmg"],  // macOS only
       "macOS": {
         "minimumSystemVersion": "10.15"
       }
     }
   }
   ```

2. **package.json**: Keep only macOS build scripts
   ```json
   {
     "scripts": {
       "build": "npm run build:tauri:mac",
       "build:tauri:mac": "npm run tauri:build",
       "build:tauri:mac:amd64": "tauri build --target x86_64-apple-darwin",
       "build:tauri:mac:arm64": "tauri build --target aarch64-apple-darwin"
     }
   }
   ```

3. **CI/CD**: Update GitHub Actions to macOS-only
   ```yaml
   jobs:
     build-tauri:
       strategy:
         matrix:
           platform: [macos-latest]
           target: [x86_64-apple-darwin, aarch64-apple-darwin]
   ```

#### Task 1.4: Clean Up Documentation ⏱️ 1-2 hours

**Files to Update**:
- `README.md` - Update installation instructions (macOS-only)
- `TAURI_MIGRATION.md` - Note macOS-only status
- `TAURI_DEPLOYMENT_PLAN.md` - Update for macOS-only
- `CLAUDE.md` - Update platform support section

**Actions**:
1. Add "macOS-only" badges and notices
2. Remove Linux/Windows installation instructions
3. Update system requirements (macOS 10.15+, Xcode Command Line Tools)
4. Simplify build instructions

### Phase 2: Electron Removal (Week 1-2)

#### Task 2.1: Remove Electron Dependencies ⏱️ 1 hour

**File**: `package.json`

**Actions**:
1. Remove Electron from `devDependencies`
2. Remove all `build:electron:*` scripts
3. Remove `open:electron` script
4. Remove `test:electron` scripts
5. Update `open` script to use Tauri only:
   ```json
   {
     "scripts": {
       "open": "npm run open:tauri"
     }
   }
   ```

#### Task 2.2: Remove Electron Build Tools ⏱️ 30 min

**Actions**:
1. Remove `packages/builder/dist/electron/` directory
2. Archive Electron-specific documentation to `docs/archive/electron/`
3. Update main documentation to reflect Tauri-only approach

#### Task 2.3: Update Tests ⏱️ 2-3 hours

**Actions**:
1. Remove Electron-specific tests
2. Update test suite to Tauri-only
3. Ensure all tests pass with Tauri runtime
4. Update test documentation

### Phase 3: Testing & Validation (Week 2)

#### Task 3.1: Build Testing ⏱️ 2-3 hours

**Platforms**:
- macOS Intel (x86_64-apple-darwin)
- macOS Apple Silicon (aarch64-apple-darwin)

**Test Matrix**:
- [ ] Clean build succeeds
- [ ] Application launches
- [ ] All menu items work
- [ ] Window management works
- [ ] Screenshots work
- [ ] Clipboard operations work
- [ ] Plugins load correctly
- [ ] kubectl commands execute
- [ ] Tables render and sort
- [ ] Terminal integration works
- [ ] Theme switching works

#### Task 3.2: Performance Validation ⏱️ 1-2 hours

**Metrics to Verify**:
- [ ] Bundle size < 12 MB
- [ ] Memory usage < 80 MB (idle)
- [ ] Startup time < 0.5s
- [ ] kubectl execution < 0.5s

#### Task 3.3: Code Quality ⏱️ 1 hour

**Actions**:
1. Run `cargo clippy` - ensure no warnings
2. Run `cargo fmt --check` - ensure formatting
3. Run `npm run lint` - ensure TypeScript quality
4. Run `npm test` - ensure all tests pass
5. Security audit: `cargo audit`

---

## Phase 4: AI Integration Planning (Week 2-3)

### Overview

Integrate AI capabilities to enable natural language Kubernetes debugging. Users can ask questions in plain English and get actionable insights about their cluster.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Kui Shell Interface                                    │
│  - Natural language input: "why is my pod crashing?"    │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────┐
│  AI Integration Layer                                   │
│  - Query parser & context builder                       │
│  - kubectl context extraction                           │
│  - Resource state analyzer                              │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────┐
│  AI Provider Selection                                  │
│  - Claude (Anthropic API)                               │
│  - OpenAI (GPT-4)                                       │
│  - Perplexity                                           │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────┐
│  Response Processor                                     │
│  - Parse AI response                                    │
│  - Extract kubectl commands                             │
│  - Generate actionable suggestions                      │
└─────────────────────────────────────────────────────────┘
```

### Components

#### 1. Config UI for API Keys 📋

**Location**: `plugins/plugin-kubectl-ai/src/ui/AISettings.tsx` (already exists!)

**Enhancements Needed**:
1. Add API key input for each provider (Claude, OpenAI, Perplexity)
2. Add model selection dropdown
3. Add "Test Connection" button
4. Persist securely using `@kui-shell/core/src/config`

**Configuration Schema**:
```typescript
interface AIConfig {
  provider: 'claude' | 'openai' | 'perplexity'
  apiKey: string  // Encrypted storage
  model: string   // e.g., 'claude-sonnet-4', 'gpt-4', 'pplx-70b'
  maxTokens: number
  temperature: number
}
```

#### 2. Natural Language Query Interface 📋

**New Command**: `kubectl ai "natural language question"`

**Examples**:
```bash
# Debug pod issues
kubectl ai "why is my nginx pod crashing?"

# Analyze resource usage
kubectl ai "which pods are using the most memory?"

# Troubleshoot networking
kubectl ai "why can't my frontend pod reach the backend service?"

# Check cluster health
kubectl ai "is my cluster healthy?"

# Investigate deployment issues
kubectl ai "why isn't my deployment rolling out?"
```

#### 3. Context Extraction 📋

**Auto-gather context for AI**:
- Current namespace
- Recent kubectl commands
- Pod status and logs (last 50 lines)
- Events (last 10)
- Resource configurations (YAML)
- Node status
- Cluster metrics

**Smart Context Builder**:
```typescript
async function buildAIContext(query: string): Promise<AIContext> {
  return {
    query,
    namespace: getCurrentNamespace(),
    recentCommands: getRecentCommands(10),
    resources: await gatherRelevantResources(query),
    logs: await gatherRelevantLogs(query),
    events: await getRecentEvents(),
    metrics: await getClusterMetrics()
  }
}
```

#### 4. AI Provider Interface 📋

**Provider Abstraction**:
```typescript
interface AIProvider {
  name: string
  sendQuery(context: AIContext, config: AIConfig): Promise<AIResponse>
  streamQuery(context: AIContext, config: AIConfig): AsyncIterator<string>
}

class ClaudeProvider implements AIProvider {
  async sendQuery(context, config) {
    // Use Anthropic API
  }
}

class OpenAIProvider implements AIProvider {
  async sendQuery(context, config) {
    // Use OpenAI API
  }
}

class PerplexityProvider implements AIProvider {
  async sendQuery(context, config) {
    // Use Perplexity API
  }
}
```

#### 5. Response Processing 📋

**Parse AI response and extract**:
- Root cause analysis
- Recommended kubectl commands (executable)
- Step-by-step debugging steps
- Related documentation links
- Similar issues / solutions

**Response Format**:
```markdown
## Root Cause

Your nginx pod is crashing due to a misconfigured health check.

## Analysis

The liveness probe is checking port 8080, but nginx is running on port 80.

## Suggested Fix

1. Update your deployment's liveness probe:
   ```yaml
   livenessProbe:
     httpGet:
       path: /
       port: 80  # Changed from 8080
   ```

2. Apply the change:
   ```bash
   kubectl apply -f deployment.yaml
   ```

3. Verify the pod is now healthy:
   ```bash
   kubectl get pods
   ```

## Related Commands

- View pod logs: `kubectl logs nginx-deployment-xxxx`
- Describe pod: `kubectl describe pod nginx-deployment-xxxx`
- Check events: `kubectl get events --field-selector involvedObject.name=nginx-deployment-xxxx`
```

### Implementation Tasks

#### Task 4.1: Config Management Integration ⏱️ 3-4 hours

**Files**:
- `packages/core/src/config/config-manager.ts` (already exists)
- `plugins/plugin-kubectl-ai/src/utils/config-loader.ts` (already exists)
- `plugins/plugin-kubectl-ai/src/ui/AISettings.tsx` (needs enhancement)

**Actions**:
1. Integrate ConfigManager for AI settings
2. Add encrypted API key storage
3. Update AISettings UI with:
   - Provider selection (Claude/OpenAI/Perplexity)
   - API key input (secure, masked)
   - Model selection dropdown
   - Test connection button
4. Add config validation schema

#### Task 4.2: Natural Language Command ⏱️ 4-5 hours

**New File**: `plugins/plugin-kubectl-ai/src/commands/ai-query.ts`

**Actions**:
1. Create `kubectl ai` command handler
2. Implement context extraction from current kubectl state
3. Build AI prompt with system instructions + user query + context
4. Call AI provider API
5. Parse and format response
6. Display in Kui with syntax highlighting

**Example Command Registration**:
```typescript
commandTree.listen(
  '/kubectl/ai',
  async ({ argvNoOptions, parsedOptions }) => {
    const query = argvNoOptions.slice(2).join(' ')

    // Extract context
    const context = await buildAIContext(query)

    // Get AI response
    const provider = getAIProvider()
    const response = await provider.sendQuery(context, getAIConfig())

    // Format and return
    return formatAIResponse(response)
  },
  {
    usage: {
      docs: 'Ask Kubernetes questions in natural language',
      example: 'kubectl ai "why is my pod crashing?"'
    }
  }
)
```

#### Task 4.3: AI Provider Implementation ⏱️ 6-8 hours

**New Files**:
- `plugins/plugin-kubectl-ai/src/services/claude-provider.ts`
- `plugins/plugin-kubectl-ai/src/services/openai-provider.ts`
- `plugins/plugin-kubectl-ai/src/services/perplexity-provider.ts`
- `plugins/plugin-kubectl-ai/src/services/ai-provider-factory.ts`

**Actions**:
1. Implement Claude provider (Anthropic API)
   - Use existing `anthropic-provider.ts` as base
   - Add streaming support
   - Error handling
2. Implement OpenAI provider
   - Use OpenAI SDK
   - Support GPT-4 and GPT-4-turbo
3. Implement Perplexity provider
   - Use Perplexity API
   - Support pplx-70b-online
4. Create factory for provider selection
5. Add retry logic and rate limiting
6. Add token counting and cost estimation

#### Task 4.4: Context Builder ⏱️ 3-4 hours

**New File**: `plugins/plugin-kubectl-ai/src/services/context-builder.ts`

**Actions**:
1. Implement smart resource gathering based on query keywords
2. Extract recent kubectl commands from history
3. Fetch relevant logs (intelligently limited)
4. Get recent events (filtered by relevance)
5. Fetch resource YAMLs (only if needed)
6. Add context size optimization (fit within token limits)

#### Task 4.5: Response Parser ⏱️ 2-3 hours

**New File**: `plugins/plugin-kubectl-ai/src/services/response-parser.ts`

**Actions**:
1. Parse AI markdown response
2. Extract code blocks (kubectl commands, YAML)
3. Make commands executable (clickable)
4. Syntax highlighting for code blocks
5. Add "Copy" and "Execute" buttons

#### Task 4.6: System Prompts ⏱️ 2-3 hours

**Enhance**: `plugins/plugin-kubectl-ai/src/prompts/system-prompts.ts`

**Actions**:
1. Create specialized system prompt for debugging
2. Add examples of good responses
3. Instruct AI to:
   - Always provide root cause analysis
   - Suggest specific kubectl commands
   - Include relevant documentation links
   - Format responses in clear markdown
   - Be concise but thorough

---

## Timeline Summary

```
┌────────────────────────────────────────────────────────┐
│  Kui macOS-Only Migration Timeline                    │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Week 1: macOS-Only Simplification                    │
│    Day 1-2:  Simplify screenshot.rs & Cargo.toml      │
│    Day 3-4:  Update build config & documentation      │
│    Day 5:    Remove Electron dependencies             │
│                                                        │
│  Week 2: Testing & AI Planning                        │
│    Day 1-2:  macOS testing (Intel + Apple Silicon)    │
│    Day 3-4:  Design AI integration architecture       │
│    Day 5:    Create config UI wireframes              │
│                                                        │
│  Week 3: AI Implementation                            │
│    Day 1-2:  Config management & UI                   │
│    Day 3-4:  AI providers implementation              │
│    Day 5:    Context builder & response parser        │
│                                                        │
│  Week 4: AI Polish & Launch                           │
│    Day 1-2:  Natural language command integration     │
│    Day 3-4:  Testing & refinement                     │
│    Day 5:    Documentation & release                  │
│                                                        │
└────────────────────────────────────────────────────────┘

Total: 4 weeks to full completion
```

---

## Success Criteria

### Phase 1-2: macOS-Only & Electron Removal

- [ ] `src-tauri/src/screenshot.rs` < 250 lines (macOS-only)
- [ ] `Cargo.toml` has no Linux/Windows dependencies
- [ ] `package.json` has no Electron dependencies
- [ ] Build produces only macOS bundles (Intel + Apple Silicon)
- [ ] Bundle size < 12 MB
- [ ] Startup time < 0.5s
- [ ] All tests pass
- [ ] No compilation warnings

### Phase 3-4: AI Integration

- [ ] Config UI allows setting API keys for Claude/OpenAI/Perplexity
- [ ] `kubectl ai` command works with natural language queries
- [ ] AI provides accurate root cause analysis
- [ ] AI suggests relevant kubectl commands
- [ ] Response is formatted with syntax highlighting
- [ ] Commands are executable from response
- [ ] Token usage is tracked and displayed
- [ ] Error handling is graceful
- [ ] Documentation is complete

---

## Risk Mitigation

### Risk: Breaking Existing Functionality

**Mitigation**:
- Comprehensive testing after each phase
- Keep git history for rollback
- Test on both Intel and Apple Silicon Macs

### Risk: AI Integration Complexity

**Mitigation**:
- Start with single provider (Claude)
- Add others incrementally
- Extensive error handling
- Rate limiting and retry logic

### Risk: API Key Security

**Mitigation**:
- Use encrypted storage via ConfigManager
- Never log API keys
- Add key rotation support
- Provide clear security documentation

---

## Next Steps

### Immediate (Today)

1. ✅ Read and understand current codebase
2. ✅ Create comprehensive plan (this document)
3. 🔄 Start Phase 1: Simplify screenshot.rs

### This Week

1. Complete Phase 1 (macOS-only simplification)
2. Complete Phase 2 (Electron removal)
3. Start Phase 3 (Testing)

### Next Week

1. Complete Phase 3 (Testing & validation)
2. Start Phase 4 (AI integration planning)
3. Implement config UI

### Following Weeks

1. Implement AI providers
2. Build natural language query interface
3. Polish and release

---

## Resources

- [Tauri Documentation](https://tauri.app/)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Perplexity API Documentation](https://docs.perplexity.ai/)
- [Existing kubectl-ai Plugin](plugins/plugin-kubectl-ai/)
- [Config Management System](packages/core/src/config/)

---

**Status**: Plan complete, ready for implementation
**Next Action**: Start Phase 1, Task 1.1 - Simplify screenshot.rs
**Owner**: AI Assistant + User
**Date**: 2025-12-17
