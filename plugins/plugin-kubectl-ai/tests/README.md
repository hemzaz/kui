# Test Infrastructure for plugin-kubectl-ai

This directory contains comprehensive test infrastructure for the AI plugin.

## Directory Structure

```
tests/
├── setup.ts                    # Global test setup and mocks
├── fixtures/                   # Mock data and test fixtures
│   ├── cluster-context.fixtures.ts
│   └── ai-responses.fixtures.ts
├── helpers/                    # Test utility functions
│   └── test-utils.ts
├── services/                   # Unit tests for services
│   ├── cache-manager.spec.ts
│   └── cluster-data-collector.spec.ts
└── integration/                # Integration tests
    └── ai-ask.spec.ts
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Debug Mode
```bash
npm run test:debug
```

### CI Mode
```bash
npm run test:ci
```

### Verbose Output
```bash
npm run test:verbose
```

## Test Configuration

The test configuration is defined in `jest.config.js` and includes:

- **TypeScript Support**: Uses ts-jest for TypeScript compilation
- **Coverage Thresholds**: 80% minimum for branches, functions, lines, and statements
- **Module Resolution**: Automatic resolution of @kui-shell packages
- **Test Timeout**: 30 seconds (for AI operations)
- **Setup Files**: Automatic mocking of external dependencies

## Writing Tests

### Unit Tests

Unit tests focus on individual functions and classes in isolation:

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals'
import { CacheManager } from '../../src/cache/cache-manager'

describe('CacheManager', () => {
  let cacheManager: CacheManager

  beforeEach(() => {
    cacheManager = new CacheManager()
  })

  it('should cache and retrieve data', () => {
    cacheManager.cacheContext('key', mockData)
    const result = cacheManager.getContext('key')
    expect(result).toBeDefined()
  })
})
```

### Integration Tests

Integration tests verify end-to-end behavior:

```typescript
import { describe, it, expect } from '@jest/globals'

describe('AI Ask Command Integration', () => {
  it('should handle complete workflow', async () => {
    const args = {
      argvNoOptions: ['ai', 'ask', 'test', 'question'],
      parsedOptions: { context: true }
    }

    const response = await commandHandler(args)
    expect(response).toContain('question')
  })
})
```

## Test Fixtures

Pre-defined test data is available in the `fixtures/` directory:

```typescript
import {
  mockClusterSnapshot,
  mockAIResponse,
  mockKubectlOutputs
} from '../fixtures/cluster-context.fixtures'
```

## Test Utilities

Helper functions are available in `helpers/test-utils.ts`:

```typescript
import {
  createMockCompletionRequest,
  createMockAIResponse,
  createAsyncIterator,
  waitFor,
  measureTime
} from '../helpers/test-utils'
```

## Mocking

### Anthropic SDK
Automatically mocked in `setup.ts`. Override in individual tests:

```typescript
import Anthropic from '@anthropic-ai/sdk'

const mockCreate = jest.fn().mockResolvedValue(mockAnthropicResponse)
;(Anthropic as any).mockImplementation(() => ({
  messages: { create: mockCreate }
}))
```

### kubectl Execution
Automatically mocked via `@kui-shell/core.rexec`:

```typescript
import { rexec } from '@kui-shell/core'

const mockRexec = rexec as jest.MockedFunction<typeof rexec>
mockRexec.mockResolvedValue({
  content: { stdout: 'mock output' }
})
```

### Cache
node-cache is automatically mocked. All cache operations use an in-memory Map.

## Coverage Reports

After running tests with coverage, reports are available in:

- **HTML Report**: `coverage/lcov-report/index.html`
- **LCOV Report**: `coverage/lcov.info`
- **JSON Summary**: `coverage/coverage-summary.json`

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use `beforeEach` and `afterEach` for setup/teardown
3. **Mocking**: Mock external dependencies and network calls
4. **Assertions**: Use clear, specific assertions
5. **Performance**: Tests should complete quickly (< 5s each)
6. **Documentation**: Add comments for complex test scenarios

## Debugging Tests

### Run Single Test File
```bash
npx jest tests/services/cache-manager.spec.ts
```

### Run Single Test Case
```bash
npx jest -t "should cache and retrieve data"
```

### Enable Debug Output
```bash
DEBUG=true npm test
```

### VSCode Debugging
Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Continuous Integration

Tests run automatically in CI with:
```bash
npm run test:ci
```

This runs tests with:
- Coverage reporting
- Limited workers for stability
- CI-optimized configuration
- Fail-fast on errors

## Test Coverage Goals

Current coverage targets (enforced by jest.config.js):

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Common Issues

### Mock not working
- Ensure `jest.clearAllMocks()` is called in `beforeEach`
- Check that mock is defined before the test imports the module

### Timeout errors
- Increase timeout: `jest.setTimeout(60000)`
- Or in individual test: `it('test', async () => {...}, 60000)`

### Module resolution errors
- Check `moduleNameMapper` in jest.config.js
- Ensure packages are compiled: `npm run compile`

### Type errors
- Install type definitions: `npm install -D @types/jest`
- Check tsconfig.json includes test files

## Feature #3: Context Menu Integration Tests

### Overview

Comprehensive test suite for Context Menu and Tooltip functionality with AI-powered insights.

### New Test Files

```
tests/
├── ui/                              # Component unit tests (NEW)
│   ├── ContextMenu.spec.tsx        # Context menu component (40+ tests)
│   └── ResourceTooltip.spec.tsx    # Tooltip component (45+ tests)
├── services/
│   └── insight-generator.spec.ts   # AI insight generation (50+ tests)
└── integration/
    └── context-menu-integration.spec.ts  # E2E tests (30+ tests)
```

### Test Coverage

**ContextMenu.spec.tsx** (40+ tests)
- ✅ Rendering and initialization
- ✅ Right-click interactions
- ✅ Menu positioning at cursor
- ✅ Action handlers (Ask AI, Debug, Explain)
- ✅ Menu closing (outside click, Escape, after action)
- ✅ Keyboard navigation (Tab, Arrow keys, Enter)
- ✅ Accessibility (ARIA, screen readers)
- ✅ Multiple instances
- ✅ Edge cases (long names, special characters)

**ResourceTooltip.spec.tsx** (45+ tests)
- ✅ Rendering and visibility
- ✅ Hover interactions with delay
- ✅ **Performance requirement: < 1s** (CRITICAL)
- ✅ Loading states
- ✅ Error handling (timeout, network, rate limit)
- ✅ Caching and debouncing
- ✅ Accessibility (keyboard, screen readers)
- ✅ Positioning and viewport overflow

**insight-generator.spec.ts** (50+ tests)
- ✅ Insight generation for all resource types
- ✅ Prompt construction and optimization
- ✅ Response extraction and formatting
- ✅ Caching with TTL and deduplication
- ✅ **Performance requirement: < 1s** (CRITICAL)
- ✅ Error handling
- ✅ Batch processing
- ✅ Token usage limits

**context-menu-integration.spec.ts** (30+ tests)
- ✅ End-to-end Ask AI flow
- ✅ End-to-end Debug flow
- ✅ End-to-end Explain flow
- ✅ Tooltip integration
- ✅ Cluster context integration
- ✅ Multiple resources
- ✅ Performance under load
- ✅ User experience flows

### Running Feature #3 Tests

```bash
# All Feature #3 tests
npm test -- --testPathPattern="(ContextMenu|ResourceTooltip|insight-generator|context-menu-integration)"

# UI component tests only
npm test -- --testPathPattern="tests/ui"

# Context menu tests
npm test -- ContextMenu.spec.tsx

# Tooltip tests
npm test -- ResourceTooltip.spec.tsx

# Insight generator tests
npm test -- insight-generator.spec.ts

# Integration tests
npm test -- context-menu-integration.spec.ts
```

### Performance Testing

Critical requirement: Tooltip must display insight within 1 second.

```bash
# Run performance-specific tests
npm test -- -t "performance requirement"

# Run with real timers for accurate measurement
npm test -- --testTimeout=5000 ResourceTooltip.spec.tsx
```

**Performance Tests:**
- `should load insight within 1 second (requirement)` - ResourceTooltip
- `should generate insight within 1 second (requirement)` - InsightGenerator
- `should use cached insights immediately` - ResourceTooltip
- `should handle concurrent requests efficiently` - Integration

### Accessibility Testing

All components include comprehensive accessibility tests:

```bash
# Run accessibility tests
npm test -- -t "accessibility"
```

**Accessibility Coverage:**
- ARIA roles (menu, menuitem, tooltip)
- ARIA labels and descriptions
- Keyboard navigation (Tab, Arrow, Enter, Escape)
- Screen reader announcements
- Focus management
- Keyboard-only workflows

### Mock AI Provider

Tests use mock AI provider with configurable responses:

```typescript
import { createMockAIResponse } from '../helpers/test-utils'

const mockAIProvider = {
  complete: jest.fn().mockResolvedValue(
    createMockAIResponse({
      content: 'Pod is running normally with all containers ready.'
    })
  )
}
```

### Test Utilities

New utilities for Feature #3:

```typescript
// Performance measurement
const { result, durationMs } = await measureTime(async () => {
  return await generator.generateInsight('pod-1', 'Pod')
})
expect(durationMs).toBeLessThan(1000)

// Mock kubectl
const mockKubectl = new MockKubectlExecutor()
mockKubectl.addResponse('get pod nginx', '{"status": "Running"}')

// Performance helpers
await performanceHelpers.assertPerformance(
  () => loadTooltip(),
  1000,  // max duration in ms
  'Tooltip loading'
)
```

### Coverage Goals

Feature #3 specific coverage targets:

- **ContextMenu Component**: >95% coverage
- **ResourceTooltip Component**: >95% coverage
- **InsightGenerator Service**: >90% coverage
- **Integration Tests**: 100% of user flows

### Test-Driven Development

Tests were written following TDD principles:

1. ✅ Tests written first (before implementation)
2. ✅ Tests define component contracts
3. ✅ Tests verify performance requirements
4. ✅ Tests validate accessibility
5. ✅ Tests cover error conditions

### CI/CD Integration

Tests run automatically:
- On every commit
- In pull requests
- Before merging to main

**GitHub Actions workflow:**
```yaml
- name: Run Feature #3 Tests
  run: |
    npm test -- --testPathPattern="(ContextMenu|ResourceTooltip|insight-generator|context-menu-integration)"
    npm run test:coverage
```

### Known Limitations

1. **React Testing Library**: Requires React 16.8+ for hooks
2. **Fake Timers**: Some tests use fake timers for performance testing
3. **Mocked AI**: Tests use mocked AI responses, not real API calls
4. **No E2E Browser**: Component tests don't run in real browser

### Next Steps

1. Implement components based on test specifications
2. Run tests in watch mode during development
3. Achieve >90% coverage before marking feature complete
4. Add visual regression tests (optional)

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Accessibility Testing](https://www.w3.org/WAI/test-evaluate/)
- [Kui Testing Guide](../../docs/testing.md)
