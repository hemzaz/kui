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

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Kui Testing Guide](../../docs/testing.md)
