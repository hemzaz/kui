# Testing Guide for plugin-kubectl-ai

Complete guide for testing the AI-powered Kubernetes assistant plugin.

## Quick Start

```bash
# Install dependencies
cd plugins/plugin-kubectl-ai
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Test Infrastructure Overview

### Files Created

```
plugins/plugin-kubectl-ai/
├── jest.config.js                          # Jest configuration
├── tests/
│   ├── README.md                          # Test documentation
│   ├── setup.ts                           # Global setup & mocks
│   ├── .eslintrc.js                       # ESLint config for tests
│   ├── fixtures/
│   │   ├── cluster-context.fixtures.ts    # Mock cluster data
│   │   └── ai-responses.fixtures.ts       # Mock AI responses
│   ├── helpers/
│   │   └── test-utils.ts                  # Test utilities
│   ├── services/
│   │   ├── cache-manager.spec.ts          # Cache unit tests
│   │   ├── cluster-data-collector.spec.ts # Data collector tests
│   │   └── ai-provider.spec.ts            # AI provider tests
│   └── integration/
│       └── ai-ask.spec.ts                 # Command integration tests
```

## Test Categories

### 1. Unit Tests (`tests/services/`)

Test individual services and utilities in isolation.

**cache-manager.spec.ts** (45 test cases)

- Context caching and retrieval
- Response caching with TTL
- Cache invalidation strategies
- Query hashing and deduplication
- Statistics and monitoring
- Singleton pattern

**cluster-data-collector.spec.ts** (25 test cases)

- Cluster snapshot capture
- kubectl command execution
- Resource counting
- Event collection
- Log retrieval
- Provider detection (EKS, GKE, AKS, etc.)
- Error handling

**ai-provider.spec.ts** (40 test cases)

- Token estimation
- System prompt generation
- Streaming completions
- Complete responses
- Cost estimation
- Connection testing
- Performance benchmarks
- Edge cases

### 2. Integration Tests (`tests/integration/`)

Test end-to-end command behavior.

**ai-ask.spec.ts** (50 test cases)

- Command registration
- Argument parsing
- Flag handling (--context, --streaming, etc.)
- Error validation
- Question formatting
- Response structure
- Real-world scenarios
- Edge cases

## Test Utilities

### Fixtures

Pre-built mock data for consistent testing:

```typescript
import {
  mockClusterSnapshot,
  mockClusterSnapshotWithResource,
  mockEKSClusterSnapshot,
  mockKubectlOutputs
} from './fixtures/cluster-context.fixtures'

import { mockAIResponse, mockStreamingChunks, mockAnthropicAPIResponse } from './fixtures/ai-responses.fixtures'
```

### Helper Functions

```typescript
import {
  createMockCompletionRequest,
  createMockAIResponse,
  createAsyncIterator,
  waitFor,
  measureTime,
  testData
} from './helpers/test-utils'

// Example usage
const request = createMockCompletionRequest({ prompt: 'Test' })
const response = await measureTime(() => provider.complete(request))
```

### Mock Executors

```typescript
import { MockKubectlExecutor } from './helpers/test-utils'

const mockKubectl = new MockKubectlExecutor()
mockKubectl
  .addResponse('get pods', mockPodOutput)
  .addResponse('get nodes', mockNodeOutput)
  .addError('get invalid', new Error('Not found'))
```

## Mocking Strategy

### Automatic Mocks (setup.ts)

The following are mocked globally:

1. **@kui-shell/core**
   - `rexec`: kubectl command execution
   - `PreloadRegistrar`: command registration
   - `UsageError`: error handling

2. **@anthropic-ai/sdk**
   - Anthropic client and messages API
   - Streaming responses

3. **openai**
   - OpenAI client
   - Chat completions

4. **node-cache**
   - In-memory cache implementation

### Custom Mocks

Override mocks in specific tests:

```typescript
import { rexec } from '@kui-shell/core'

const mockRexec = rexec as jest.MockedFunction<typeof rexec>

mockRexec.mockImplementation((command: string) => {
  if (command.includes('get pods')) {
    return Promise.resolve({ content: { stdout: mockOutput } })
  }
  return Promise.reject(new Error('Command failed'))
})
```

## Coverage Requirements

Minimum coverage thresholds (enforced):

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

View coverage report:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Test Scripts

| Command                    | Description                    |
| -------------------------- | ------------------------------ |
| `npm test`                 | Run all tests                  |
| `npm run test:watch`       | Watch mode for development     |
| `npm run test:coverage`    | Generate coverage report       |
| `npm run test:ci`          | CI-optimized test run          |
| `npm run test:unit`        | Run only unit tests            |
| `npm run test:integration` | Run only integration tests     |
| `npm run test:verbose`     | Verbose output                 |
| `npm run test:debug`       | Debug mode with Node inspector |

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'

describe('MyService', () => {
  let service: MyService

  beforeEach(() => {
    service = new MyService()
  })

  afterEach(() => {
    // Cleanup
  })

  describe('myMethod', () => {
    it('should do something', () => {
      const result = service.myMethod('input')
      expect(result).toBe('expected')
    })

    it('should handle errors', () => {
      expect(() => service.myMethod('')).toThrow()
    })
  })
})
```

### Integration Test Template

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals'

describe('MyCommand Integration', () => {
  let commandHandler: Function

  beforeEach(async () => {
    const module = await import('../../src/commands/my-command')
    const mockRegistrar = { listen: jest.fn() }
    await module.default(mockRegistrar)
    commandHandler = mockRegistrar.listen.mock.calls[0][1]
  })

  it('should handle valid input', async () => {
    const args = {
      argvNoOptions: ['cmd', 'arg'],
      parsedOptions: {}
    }

    const response = await commandHandler(args)
    expect(response).toBeDefined()
  })
})
```

## Debugging Tests

### Run Single Test

```bash
npx jest tests/services/cache-manager.spec.ts
```

### Run Specific Test Case

```bash
npx jest -t "should cache and retrieve data"
```

### Enable Debug Logging

```bash
DEBUG=true npm test
```

### VSCode Debug Configuration

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "cwd": "${workspaceFolder}/plugins/plugin-kubectl-ai",
  "console": "integratedTerminal"
}
```

## CI/CD Integration

Tests run automatically in CI with:

```bash
npm run test:ci
```

Features:

- Limited workers for stability
- Coverage reporting
- Fail-fast on errors
- CI-optimized configuration

## Performance Testing

The test suite includes performance benchmarks:

```typescript
import { performanceHelpers } from '../helpers/test-utils'

await performanceHelpers.assertPerformance(
  async () => provider.complete(request),
  5000, // max 5 seconds
  'AI completion'
)
```

## Memory Leak Detection

```typescript
import { memoryHelpers } from '../helpers/test-utils'

await memoryHelpers.assertNoMemoryLeak(
  async () => cache.set('key', data),
  100, // iterations
  10 // max 10MB growth
)
```

## Best Practices

### ✅ DO

- Write isolated, independent tests
- Use descriptive test names
- Mock external dependencies
- Test edge cases and errors
- Keep tests fast (< 5s each)
- Use fixtures for consistent data
- Clean up after tests

### ❌ DON'T

- Don't test implementation details
- Don't share state between tests
- Don't make real API calls
- Don't skip cleanup
- Don't ignore flaky tests
- Don't commit only passing tests

## Common Issues

### Issue: Tests fail with "Cannot find module"

**Solution**: Run `npm run compile` to build TypeScript files

### Issue: Mock not working

**Solution**: Ensure `jest.clearAllMocks()` in `beforeEach`

### Issue: Timeout errors

**Solution**: Increase timeout in jest.config.js or test

### Issue: Coverage below threshold

**Solution**: Add tests for uncovered code paths

## Test Maintenance

### Adding New Tests

1. Create test file in appropriate directory
2. Import required fixtures and utilities
3. Follow existing test patterns
4. Run tests and verify coverage
5. Update documentation if needed

### Updating Fixtures

1. Modify files in `tests/fixtures/`
2. Ensure backwards compatibility
3. Update dependent tests if needed
4. Verify all tests still pass

### Updating Mocks

1. Modify `tests/setup.ts` for global mocks
2. Test across all test files
3. Document changes in comments

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [TypeScript Testing Guide](https://typescript-eslint.io/docs/)
- [Kui Testing Patterns](../../docs/testing.md)
- [Test Fixtures README](tests/README.md)

## Support

For issues or questions:

1. Check this guide and test README
2. Review existing test examples
3. Check Jest documentation
4. Open an issue on GitHub
