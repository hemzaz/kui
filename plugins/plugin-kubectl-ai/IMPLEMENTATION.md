# @kui-shell/plugin-kubectl-ai Implementation Guide

## Overview

This plugin provides AI-powered assistance for Kubernetes operations within the Kui terminal. It integrates with Claude (Anthropic), GPT-4 (OpenAI), and other LLM providers to help with troubleshooting, manifest generation, and cluster management.

## Project Structure

```
plugins/plugin-kubectl-ai/
├── package.json              # NPM package configuration
├── tsconfig.json             # TypeScript configuration
├── README.md                 # User documentation
├── IMPLEMENTATION.md         # This file
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore patterns
├── src/
│   ├── index.ts              # Main plugin entry point
│   ├── preload.ts            # Command registration with Kui
│   ├── types/
│   │   ├── ai-types.ts       # AI provider interfaces and types
│   │   ├── cluster-types.ts  # Kubernetes cluster data types
│   │   └── index.ts          # Type exports
│   ├── services/
│   │   ├── ai-provider.ts    # Base AI provider interface
│   │   ├── anthropic-provider.ts  # Claude implementation
│   │   ├── openai-provider.ts     # GPT-4 implementation (TODO)
│   │   ├── ollama-provider.ts     # Local LLM implementation (TODO)
│   │   └── provider-factory.ts    # Provider instantiation
│   ├── context/
│   │   ├── cluster-data-collector.ts  # Gather cluster state
│   │   ├── resource-context.ts        # Resource-specific context (TODO)
│   │   └── log-collector.ts           # Pod log gathering (TODO)
│   ├── prompts/
│   │   ├── system-prompts.ts          # Base system prompts
│   │   ├── troubleshooting.ts         # Debugging prompts (TODO)
│   │   ├── manifest-generation.ts     # Manifest prompts (TODO)
│   │   └── optimization.ts            # Optimization prompts (TODO)
│   ├── cache/
│   │   ├── cache-manager.ts           # Cache abstraction
│   │   ├── memory-cache.ts            # In-memory implementation (TODO)
│   │   └── cache-strategies.ts        # TTL strategies (TODO)
│   ├── commands/
│   │   ├── ai-ask.ts        # /ai ask command handler (TODO)
│   │   ├── ai-debug.ts      # /ai debug command handler (TODO)
│   │   ├── ai-create.ts     # /ai create command handler (TODO)
│   │   └── ai-config.ts     # /ai config command handler (TODO)
│   └── ui/
│       ├── AIChatSidebar.tsx    # Main chat interface (TODO)
│       ├── AISettings.tsx       # Settings panel (TODO)
│       ├── ContextPanel.tsx     # Context display (TODO)
│       └── MessageList.tsx      # Chat messages (TODO)
└── tests/
    ├── services/
    ├── context/
    └── prompts/
```

## Implementation Status

### Phase 1: Foundation (Current)

- [x] Plugin structure created
- [x] TypeScript configuration
- [x] Type definitions (AIProvider, ClusterSnapshot, etc.)
- [x] Base service stubs
- [x] Package.json with dependencies
- [x] Added to root workspace
- [x] Basic command registration
- [ ] Anthropic provider implementation
- [ ] Cache manager implementation
- [ ] Cluster data collector implementation

### Phase 2: Core Features (Next)

- [ ] Complete command handlers
- [ ] Streaming response support
- [ ] Context gathering from kubectl
- [ ] Privacy-aware data filtering
- [ ] Basic UI components

### Phase 3: Advanced Features

- [ ] OpenAI provider
- [ ] Ollama provider
- [ ] Chat sidebar UI
- [ ] Settings panel
- [ ] Cost tracking
- [ ] Advanced caching strategies

## Getting Started

### 1. Install Dependencies

```bash
cd /Users/elad/PROJ/kui/plugins/plugin-kubectl-ai
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your API keys
```

### 3. Build the Plugin

```bash
cd /Users/elad/PROJ/kui
npm run compile
```

### 4. Test the Plugin

```bash
# Run Kui with the plugin
npm run watch

# In Kui terminal, try:
ai ask "help me troubleshoot my cluster"
```

## Key Files to Implement

### Priority 1: Core Functionality

1. **src/services/anthropic-provider.ts**
   - Implement streaming completion
   - Implement full completion
   - Add error handling
   - Implement cost calculation

2. **src/context/cluster-data-collector.ts**
   - Use `exec` from @kui-shell/core to run kubectl commands
   - Parse cluster version, nodes, namespaces
   - Gather resource status, events, logs
   - Implement privacy filtering

3. **src/cache/cache-manager.ts**
   - Complete NodeCache integration
   - Add response caching with hash keys
   - Implement cache invalidation
   - Add stats tracking

4. **src/commands/ai-ask.ts**
   - Parse user question
   - Gather context if requested
   - Call AI provider
   - Stream or return full response
   - Format output for Kui

### Priority 2: Additional Providers

5. **src/services/openai-provider.ts**
   - Similar structure to Anthropic provider
   - Use OpenAI SDK
   - Implement streaming
   - Add cost calculation

6. **src/services/ollama-provider.ts**
   - HTTP client for Ollama API
   - Support local models
   - No cost calculation needed

### Priority 3: UI Components

7. **src/ui/AIChatSidebar.tsx**
   - React component for chat interface
   - Use PatternFly 4 components (already in Kui)
   - Implement markdown rendering
   - Add streaming message updates

8. **src/ui/AISettings.tsx**
   - Provider selection
   - Privacy settings
   - Cost tracking display
   - Test connection button

## Integration with Kui

### Command Registration

Commands are registered in `src/preload.ts` using the Kui Registrar:

```typescript
export default async function(registrar: Registrar) {
  registrar.listen('/ai/ask', handler, { usage: { ... } })
}
```

### Response Types

Kui supports multiple response formats:

- **String**: Simple text output
- **Table**: Sortable, filterable data tables
- **MultiModalResponse**: Rich content with tabs
- **XtermResponse**: Terminal output with streaming

For AI responses, we'll use:

- Text for simple answers
- MultiModalResponse for complex explanations with examples
- XtermResponse for streaming responses

### Accessing Kubernetes

Use Kui's exec function to run kubectl commands:

```typescript
import { exec } from '@kui-shell/core'

const output = await exec('kubectl get pods -o json')
```

## Testing Strategy

### Unit Tests

- Test each provider independently with mocked API calls
- Test context gathering with mocked kubectl output
- Test cache operations
- Test prompt building

### Integration Tests

- Test full command flow (ask -> gather context -> call AI -> display)
- Test with real kubectl (in test cluster)
- Test streaming responses
- Test error handling

### Manual Testing

```bash
# Test basic query
ai ask "what is a pod?"

# Test with context
kubectl get pod failing-pod
ai debug pod/failing-pod

# Test manifest generation
ai create "nginx deployment with 3 replicas"

# Test configuration
ai config
```

## Dependencies

### Production

- `@anthropic-ai/sdk` (^0.32.0) - Claude API client
- `openai` (^4.52.0) - OpenAI API client
- `node-cache` (^5.1.2) - In-memory caching
- `dotenv` (^16.4.5) - Environment variables
- `markdown-it` (^14.1.0) - Markdown rendering

### Development

- `@types/node-cache` - TypeScript types for node-cache
- `@types/markdown-it` - TypeScript types for markdown-it

### Already Available (from Kui)

- `@kui-shell/core` - Core APIs, command execution
- `@kui-shell/react` - React components
- `react`, `react-dom` - UI framework
- PatternFly 4 - UI components

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:

- `ANTHROPIC_API_KEY` or `CLAUDE_API_KEY` - For Claude
- `OPENAI_API_KEY` - For GPT-4
- `AI_PROVIDER` - Provider selection (anthropic, openai, ollama)
- `PRIVACY_*` - Privacy controls
- `COST_MONTHLY_LIMIT` - Cost limit in USD

## Next Steps

1. **Complete Anthropic Provider**
   - Implement streaming with async generator
   - Add proper error handling
   - Test with real API

2. **Implement Cluster Data Collector**
   - Use Kui's exec() to call kubectl
   - Parse JSON output
   - Gather logs and events
   - Apply privacy filters

3. **Build Command Handlers**
   - Start with `ai ask` (simplest)
   - Then `ai debug` (needs context)
   - Then `ai create` (needs validation)
   - Finally `ai config` (needs UI)

4. **Add Tests**
   - Unit tests for providers
   - Integration tests for commands
   - E2E tests with real cluster

5. **Build UI Components**
   - Start with settings panel
   - Then chat sidebar
   - Add context display
   - Polish with animations

## Resources

- Kui Plugin Development: https://github.com/IBM/kui/tree/master/docs
- Anthropic API Docs: https://docs.anthropic.com/
- OpenAI API Docs: https://platform.openai.com/docs
- TypeScript Handbook: https://www.typescriptlang.org/docs/

## Questions?

See docs/features/ai-assistant-tech-spec.md for the full technical specification.
