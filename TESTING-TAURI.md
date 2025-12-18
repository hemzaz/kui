# Tauri Testing Guide

This document describes the comprehensive test suite for Kui's Tauri migration.

## Overview

The Tauri test suite consists of three main components:

1. **Unit Tests** - Tests for Tauri IPC bridge and core functionality
2. **Integration Tests** - Tests for window management, IPC, and plugins
3. **E2E Tests** - End-to-end feature parity tests
4. **Performance Tests** - Benchmarks comparing Tauri vs Electron

## Test Infrastructure

### Test Files

```
kui/
├── packages/core/tests/
│   └── tauri-ipc.test.ts          # Unit tests for Tauri IPC bridge
├── tests/
│   ├── tauri-feature-parity.spec.ts   # E2E feature parity tests
│   ├── tauri-integration.spec.ts      # Integration tests
│   ├── performance-comparison.ts      # Performance benchmarks
│   └── utils/
│       └── tauri-test-helpers.ts      # Test utilities
├── jest.config.js                  # Jest configuration
├── jest.setup.js                   # Jest setup
└── playwright.config.ts            # Playwright configuration
```

### Configuration Files

- **jest.config.js** - Jest configuration for unit tests
- **playwright.config.ts** - Playwright configuration for E2E tests
- **jest.setup.js** - Jest global setup and mocks

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm ci

# Install Playwright browsers
npx playwright install
```

### Unit Tests

Run Tauri IPC bridge unit tests:

```bash
npm run test:tauri:unit
```

This runs Jest tests for:
- Tauri runtime detection
- IPC renderer interface
- Synchronous message handling
- Command invocation
- Event listeners
- Error handling

### E2E Tests

Run all E2E tests:

```bash
npm run test:tauri:e2e
```

Run specific test suites:

```bash
# Feature parity tests
npm run test:tauri:feature-parity

# Integration tests
npm run test:tauri:integration
```

Run tests with UI mode:

```bash
npm run test:tauri:e2e:ui
```

Run tests in headed mode (see browser):

```bash
npm run test:tauri:e2e:headed
```

### Integration Tests

Integration tests cover:
- Window management (create, resize, maximize)
- IPC operations (synchronous messages, exec_invoke)
- Plugin loading and execution
- Performance metrics
- Menu system
- Clipboard operations
- Dialog support

Run integration tests:

```bash
npm run test:tauri:integration
```

### Performance Tests

Run performance comparison:

```bash
npm run test:tauri:performance
```

This generates a comparison report between Tauri and Electron builds including:
- Bundle size
- Startup time
- Memory usage
- Command response time

Results are saved to `performance-results.json`.

### All Tests

Run all Tauri tests (unit + E2E):

```bash
npm run test:tauri:all
```

### View Test Reports

After running E2E tests, view the HTML report:

```bash
npm run test:tauri:report
```

## Test Categories

### 1. Runtime Detection Tests

Verify Tauri runtime is correctly detected:

```typescript
test('should detect Tauri runtime', async ({ page }) => {
  const isTauri = await isTauriRuntime(page)
  expect(typeof isTauri).toBe('boolean')
})
```

### 2. Window Management Tests

Test window creation, sizing, and lifecycle:

```typescript
test('should create main window', async ({ page }) => {
  const title = await page.title()
  expect(title).toContain('Kui')
})

test('should resize window', async ({ page }) => {
  await sendTauriMessage(page, 'enlarge-window')
  await sendTauriMessage(page, 'reduce-window')
})
```

### 3. IPC Communication Tests

Test IPC message passing:

```typescript
test('should handle synchronous messages', async ({ page }) => {
  const result = await sendTauriMessage(page, 'ping')
  expect(result).toBeDefined()
})

test('should invoke commands', async ({ page }) => {
  const result = await invokeTauriCommand(page, 'exec_invoke', {
    message: JSON.stringify({ module: 'test', fn: 'test' })
  })
  expect(result).toBeDefined()
})
```

### 4. Plugin Integration Tests

Test plugin loading and execution:

```typescript
test('should load kubectl plugin', async ({ page }) => {
  await executeKuiCommand(page, 'kubectl version --client')
  const result = await getLastReplResult(page)
  expect(result).toBeTruthy()
})
```

### 5. Performance Tests

Benchmark key metrics:

```typescript
test('should load quickly', async ({ page }) => {
  const loadTime = await measureLoadTime(page)
  expect(loadTime).toBeLessThan(2000) // < 2s
})

test('should respond to commands quickly', async ({ page }) => {
  const responseTime = await measureCommandTime(page, 'version')
  expect(responseTime).toBeLessThan(1000) // < 1s
})
```

### 6. Error Handling Tests

Test error recovery:

```typescript
test('should handle invalid commands gracefully', async ({ page }) => {
  await executeKuiCommand(page, 'invalid-command')
  // Should show error, not crash
  const result = await getLastReplResult(page)
  expect(result).toBeTruthy()
})
```

## Test Utilities

The `tauri-test-helpers.ts` module provides utilities for testing:

### Runtime Detection

```typescript
import { isTauriRuntime, getTauriRuntimeInfo } from './utils/tauri-test-helpers'

// Check if running in Tauri
const isTauri = await isTauriRuntime(page)

// Get runtime info
const info = await getTauriRuntimeInfo(page)
```

### IPC Communication

```typescript
import { invokeTauriCommand, sendTauriMessage } from './utils/tauri-test-helpers'

// Invoke Tauri command
const result = await invokeTauriCommand(page, 'command_name', { args })

// Send synchronous message
const response = await sendTauriMessage(page, 'operation', { data })
```

### REPL Interaction

```typescript
import {
  waitForKuiReady,
  executeKuiCommand,
  getLastReplResult,
  clearRepl
} from './utils/tauri-test-helpers'

// Wait for Kui to be ready
await waitForKuiReady(page)

// Execute command
await executeKuiCommand(page, 'kubectl get pods')

// Get result
const result = await getLastReplResult(page)

// Clear REPL
await clearRepl(page)
```

### Window Management

```typescript
import { createTauriWindow } from './utils/tauri-test-helpers'

// Create new window
await createTauriWindow(page, {
  width: 1024,
  height: 768,
  title: 'Test Window'
})
```

### Performance Measurement

```typescript
import { measureCommandTime, getMemoryUsage } from './utils/tauri-test-helpers'

// Measure command execution time
const time = await measureCommandTime(page, 'version')

// Get memory usage
const memory = await getMemoryUsage(page)
```

### Conditional Test Skipping

```typescript
import { skipIfNotTauri, skipIfNotBrowser } from './utils/tauri-test-helpers'

// Skip if not Tauri
if (await skipIfNotTauri(page)) {
  test.skip()
  return
}

// Skip if not browser
if (await skipIfNotBrowser(page)) {
  test.skip()
  return
}
```

## Environment Variables

Configure tests with environment variables:

```bash
# Test URL (default: http://localhost:9080)
export TEST_URL=http://localhost:9080

# Test timeout (default: 30000ms)
export TEST_TIMEOUT=30000

# Run tests in headless mode (default: true)
export TEST_HEADLESS=false

# Slow motion for debugging (default: 0ms)
export TEST_SLOW_MO=100
```

## CI/CD Integration

Tests are configured for CI/CD:

```yaml
# GitHub Actions example
- name: Run Tauri Tests
  run: |
    npm ci
    npx playwright install --with-deps
    npm run test:tauri:all
  env:
    CI: true
    TEST_HEADLESS: true
```

## Test Results

### Unit Test Output

```
PASS packages/core/tests/tauri-ipc.test.ts
  Tauri IPC Bridge
    Runtime Detection
      ✓ should detect when running in Tauri (15ms)
      ✓ should detect when not running in Tauri (3ms)
      ✓ should return correct runtime name (2ms)
    IPC Renderer
      ✓ should get IPC renderer in Tauri environment (5ms)
      ✓ should throw error when Tauri is not available (2ms)
    IPC Communication
      ✓ should send synchronous messages (8ms)
      ✓ should invoke commands (6ms)
      ✓ should handle event listeners (4ms)
```

### E2E Test Output

```
Running 42 tests using 3 workers

  ✓ [chromium] › tauri-feature-parity.spec.ts:25:3 › should create main window (1.2s)
  ✓ [chromium] › tauri-feature-parity.spec.ts:32:3 › should have visible REPL (0.8s)
  ✓ [chromium] › tauri-integration.spec.ts:18:3 › should handle synchronous messages (1.5s)
  ...

  42 passed (2.3m)

To view the HTML report, run: npm run test:tauri:report
```

### Performance Report

```
==========================================================
Performance Comparison Report
==========================================================

Metric            | Tauri        | Electron    | Improvement
-----------------------------------------------------------------
Bundle Size       | 15.2 MB      | 152.5 MB    | 90.0% better
Memory Usage      | 80.0 MB      | 175.0 MB    | 54.3% better
Startup Time      | 512ms        | 2,145ms     | 76.1% better
Command Response  | 45ms         | 98ms        | 54.1% better

Summary:
--------
Average improvement: 68.6% better

Key Benefits:
  - 90.0% better smaller bundle
  - 54.3% better less memory
```

## Debugging Tests

### Debug Unit Tests

```bash
# Run with verbose output
npm run test:tauri:unit -- --verbose

# Run specific test file
npm run test:tauri:unit -- tauri-ipc.test.ts

# Run with coverage
npm run test:tauri:unit -- --coverage
```

### Debug E2E Tests

```bash
# Run with UI for debugging
npm run test:tauri:e2e:ui

# Run specific test
npx playwright test tests/tauri-feature-parity.spec.ts --debug

# Run with headed browser
npm run test:tauri:e2e:headed

# Generate trace for debugging
npx playwright test --trace on
```

### View Test Artifacts

Test artifacts are saved to `test-results/`:
- Screenshots (on failure)
- Videos (on failure)
- Traces (for debugging)
- HTML report

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect } from '@jest/globals'

describe('My Feature', () => {
  it('should work correctly', async () => {
    // Arrange
    const input = 'test'

    // Act
    const result = processInput(input)

    // Assert
    expect(result).toBe('expected')
  })
})
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test'
import { waitForKuiReady, executeKuiCommand } from './utils/tauri-test-helpers'

test.describe('My Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:9080')
    await waitForKuiReady(page)
  })

  test('should do something', async ({ page }) => {
    await executeKuiCommand(page, 'my-command')
    // Add assertions
  })
})
```

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Clean Up**: Reset state between tests
3. **Use Helpers**: Leverage test utilities
4. **Add Timeouts**: Set appropriate timeouts for async operations
5. **Skip Appropriately**: Skip tests that require specific environments
6. **Log Liberally**: Add console.log for debugging
7. **Test Error Cases**: Include negative test cases
8. **Measure Performance**: Track timing for performance-critical operations
9. **Mock When Needed**: Mock external dependencies
10. **Document Tests**: Add clear descriptions to test cases

## Known Issues

1. **Browser Context**: Some Tauri-specific features can't be tested in browser mode
2. **Native Menus**: Native menu testing requires platform-specific tools
3. **File Dialogs**: Dialog testing requires mocking or manual intervention
4. **Clipboard**: Clipboard tests require permissions in CI

## Coverage Goals

Target coverage metrics:
- Unit tests: 80%+ coverage
- Integration tests: All critical paths
- E2E tests: All user-facing features
- Performance tests: Key metrics tracked

## Maintenance

### Update Test Dependencies

```bash
# Update Playwright
npm update @playwright/test
npx playwright install

# Update Jest
npm update jest ts-jest @types/jest
```

### Regenerate Baseline Metrics

```bash
# Run performance tests to update baseline
npm run test:tauri:performance

# Commit updated metrics
git add performance-results.json
git commit -m "Update performance baseline"
```

## Support

For issues with tests:
1. Check test output for error messages
2. Review test-results/ directory for artifacts
3. Run tests in headed mode for visual debugging
4. Check CI logs for environment-specific issues
5. Consult TAURI_NEXT_STEPS.md for migration guidance

## References

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Tauri Testing Guide](https://tauri.app/v1/guides/testing/)
- [Kui Testing Infrastructure](packages/test/README.md)
