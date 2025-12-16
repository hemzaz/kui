# AI Provider System - Directory Structure

## Overview

This document shows the complete directory structure of the AI provider system implementation.

## Directory Tree

```
plugins/plugin-kubectl-ai/
├── README.md                        # Main documentation
├── EXAMPLES.md                      # Usage examples
├── IMPLEMENTATION_SUMMARY.md        # Implementation details
├── STRUCTURE.md                     # This file
│
├── src/
│   ├── types/                       # TypeScript type definitions
│   │   ├── index.ts                # Type exports (22 lines)
│   │   ├── ai-types.ts             # AI provider types (245 lines)
│   │   │   ├── AIProvider          # Base provider interface
│   │   │   ├── AICompletionRequest # Request interface
│   │   │   ├── AIResponse          # Response interface
│   │   │   ├── AIChunk             # Streaming chunk
│   │   │   ├── AITool              # Tool/function definition
│   │   │   ├── AIConfig            # Configuration
│   │   │   ├── DEFAULT_AI_CONFIG   # Default config
│   │   │   ├── AIProviderError     # Error class
│   │   │   └── AIProviderErrorCode # Error enum
│   │   │
│   │   └── cluster-types.ts        # Cluster context types (71 lines)
│   │       ├── ClusterSnapshot     # Cluster state snapshot
│   │       └── KubernetesEvent     # K8s event interface
│   │
│   └── services/                    # AI provider implementations
│       ├── index.ts                # Service exports (22 lines)
│       ├── ai-provider.ts          # Base provider (82 lines)
│       │   ├── BaseAIProvider      # Abstract base class
│       │   ├── estimateTokens()    # Token estimation
│       │   ├── buildSystemPrompt() # System prompt builder
│       │   └── logUsage()          # Usage tracking
│       │
│       ├── anthropic-provider.ts   # Anthropic implementation (320 lines)
│       │   ├── AnthropicProvider   # Claude provider class
│       │   ├── streamCompletion()  # Streaming support
│       │   ├── complete()          # Non-streaming support
│       │   ├── testConnection()    # Connection test
│       │   ├── estimateCost()      # Cost estimation
│       │   ├── buildPrompt()       # Prompt builder
│       │   ├── enrichPromptWithContext() # Context enrichment
│       │   ├── calculateCost()     # Cost calculation
│       │   └── handleError()       # Error handling
│       │
│       └── provider-factory.ts     # Provider factory (171 lines)
│           ├── ProviderFactory     # Factory class
│           ├── getProvider()       # Get/create provider
│           ├── createProvider()    # Private factory method
│           ├── clearCache()        # Cache management
│           ├── testProvider()      # Connection testing
│           ├── getSupportedProviders() # List providers
│           ├── getDefaultModels()  # Model defaults
│           └── createProvider()    # Helper function
```

## File Statistics

### Type Definitions

- **ai-types.ts**: 245 lines
  - 9 interfaces/types
  - 1 default config
  - 1 error class
  - 1 error enum

- **cluster-types.ts**: 71 lines
  - 2 interfaces

- **index.ts**: 22 lines
  - Export barrel

**Total**: 338 lines

### Service Implementations

- **ai-provider.ts**: 82 lines
  - 1 abstract class
  - 3 protected methods

- **anthropic-provider.ts**: 320 lines
  - 1 concrete class
  - 8 public/private methods
  - Full Anthropic API integration

- **provider-factory.ts**: 171 lines
  - 1 factory class
  - 6 static methods
  - 1 helper function

- **index.ts**: 22 lines
  - Export barrel

**Total**: 595 lines

### Documentation

- **README.md**: ~250 lines
- **EXAMPLES.md**: ~500 lines
- **IMPLEMENTATION_SUMMARY.md**: ~350 lines
- **STRUCTURE.md**: This file

**Total**: ~1,100 lines

### Grand Total

- **TypeScript Code**: 931 lines
- **Documentation**: ~1,100 lines
- **Total Project Size**: ~2,031 lines

## Key Components

### 1. Type System (src/types/)

Complete TypeScript type definitions for:

- AI provider interfaces
- Request/response objects
- Configuration structures
- Error handling
- Cluster context

### 2. Base Provider (src/services/ai-provider.ts)

Abstract base class providing:

- Common interface implementation
- Token estimation utilities
- System prompt generation
- Usage logging

### 3. Anthropic Provider (src/services/anthropic-provider.ts)

Full Claude implementation with:

- Streaming and non-streaming modes
- Context enrichment
- Cost calculation
- Error handling
- Connection testing

### 4. Provider Factory (src/services/provider-factory.ts)

Factory pattern implementation for:

- Provider instantiation
- Instance caching
- Model defaults
- Connection testing

## Integration Points

### External Dependencies

```typescript
// Required packages
import Anthropic from '@anthropic-ai/sdk' // Anthropic SDK

// Kui dependencies (when needed)
import type { Registrar } from '@kui-shell/core'
```

### Environment Variables

```bash
# Required for Anthropic provider
ANTHROPIC_API_KEY="sk-ant-..."
# or
CLAUDE_API_KEY="sk-ant-..."
```

### Configuration Files

- TypeScript: `tsconfig.json` (from parent project)
- Package: `package.json` (from parent project)
- Linting: `.eslintrc` (from parent project)

## Usage Flow

1. **Configuration**: Create or load `AIConfig`
2. **Provider Creation**: Use `ProviderFactory.getProvider(config)`
3. **Request**: Call `provider.complete()` or `provider.streamCompletion()`
4. **Response**: Process `AIResponse` or iterate `AIChunk`
5. **Error Handling**: Catch `AIProviderError` with typed codes

## Extension Points

### Adding New Providers

1. Create new provider class extending `BaseAIProvider`
2. Implement required abstract methods
3. Add to `ProviderFactory.createProvider()`
4. Update `getSupportedProviders()` and `getDefaultModels()`

### Adding New Features

- Add to `AIConfig` interface
- Update `DEFAULT_AI_CONFIG`
- Implement in base or concrete providers
- Document in README and examples

## Testing Strategy

### Unit Tests

- Test each provider method independently
- Mock API calls
- Verify error handling
- Check cost calculations

### Integration Tests

- Real API calls (with test keys)
- End-to-end flows
- Context enrichment
- Streaming behavior

### Performance Tests

- Measure latency
- Check memory usage
- Verify cache effectiveness
- Benchmark throughput

## Next Steps

1. **Add Providers**: OpenAI, Azure, Ollama
2. **Context Collector**: Gather cluster data
3. **Cache Manager**: Response caching
4. **CLI Commands**: Terminal interface
5. **React UI**: Chat sidebar components
6. **Tests**: Comprehensive test suite

## Notes

- All files use Apache 2.0 license
- TypeScript strict mode enabled
- Modern async/await patterns
- No external state (pure functions where possible)
- Comprehensive error handling
- Full type coverage
