# Tauri Testing Guide

Comprehensive guide for testing Tauri-specific features in the Kui application.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Categories](#test-categories)
- [Writing New Tests](#writing-new-tests)
- [Debugging Tests](#debugging-tests)
- [CI/CD Integration](#cicd-integration)
- [Known Issues](#known-issues)
- [Troubleshooting](#troubleshooting)

## Overview

The Tauri test suite validates Kui's Tauri-specific functionality including:

- **Menu System**: Native menu events, keyboard shortcuts, cross-platform handling
- **Screenshot Capture**: Screen region capture, clipboard integration, platform-specific implementations
- **Window Management**: Multi-window creation, sizing operations, state management
- **IPC Communication**: Command invocation, event emissions, error handling
- **Integration Tests**: Feature parity with Electron, performance benchmarks

## Test Structure

```
tests/
├── tauri-smoke.spec.ts              # Quick smoke tests (critical path)
├── tauri-integration.spec.ts        # General integration tests
├── tauri-feature-parity.spec.ts     # Electron vs Tauri feature parity
├── tauri-menu-system.spec.ts        # Menu system tests (NEW)
├── tauri-screenshot.spec.ts         # Screenshot functionality tests (NEW)
├── tauri-window-management.spec.ts  # Window management tests (NEW)
├── performance-comparison.ts        # Performance benchmarking
└── utils/
    └── tauri-test-helpers.ts        # Shared test utilities
```

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Build the application
npm run compile
```

### Run All Tauri Tests

```bash
# Run all Tauri tests
npm run test:tauri:all

# Run with UI (for debugging)
npm run test:tauri:e2e:ui
```

### Run Specific Test Suites

```bash
# Smoke tests (fast, critical path only)
npm run test:tauri:smoke

# Menu system tests
npx playwright test tests/tauri-menu-system.spec.ts

# Screenshot tests
npx playwright test tests/tauri-screenshot.spec.ts

# Window management tests
npx playwright test tests/tauri-window-management.spec.ts

# Integration tests
npm run test:tauri:integration

# Feature parity tests
npm run test:tauri:feature-parity

# Performance tests
npm run test:tauri:performance
```

### Run in Headed Mode

```bash
# See the browser during test execution
npm run test:tauri:e2e:headed

# Or for specific test
npx playwright test tests/tauri-menu-system.spec.ts --headed
```

### Run Specific Browser

```bash
# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Categories

### 1. Smoke Tests (`tauri-smoke.spec.ts`)

**Purpose**: Quick validation of critical functionality
**Duration**: < 2 minutes
**Run Frequency**: Every commit

Tests:
- App launches successfully
- Basic UI renders correctly
- Simple commands execute
- No JavaScript errors on load
- REPL accepts input
- Runtime detection works

### 2. Menu System Tests (`tauri-menu-system.spec.ts`)

**Purpose**: Validate native menu functionality
**Duration**: ~3-5 minutes
**Platform-Specific**: Yes

Tests:
- Menu event emissions (new-tab, new-window, close-tab, zoom, etc.)
- Keyboard shortcuts (Cmd/Ctrl+T, Cmd/Ctrl+N, F12, etc.)
- Platform-specific behavior (macOS vs Linux vs Windows)
- Error handling for unknown events
- Rapid event handling
- Integration with UI state

**Key Considerations**:
- Native menus can't be directly tested (DOM-independent)
- Tests focus on event emission and handling
- Keyboard shortcuts vary by platform (Meta on macOS, Control on Linux/Windows)

### 3. Screenshot Tests (`tauri-screenshot.spec.ts`)

**Purpose**: Validate screenshot capture functionality
**Duration**: ~3-5 minutes
**Platform-Specific**: Yes

Tests:
- Basic capture functionality
- Parameter validation (coordinates, dimensions)
- Platform-specific implementations (macOS, Linux, Windows)
- Clipboard integration
- Error handling (invalid parameters, out-of-bounds, etc.)
- Performance (capture timing)
- Concurrent captures

**Platform Support**:
- **macOS**: Full support via Core Graphics
- **Linux**: Full support via xcap (requires xclip for clipboard)
- **Windows**: Partial support (clipboard needs implementation)

**Known Limitations**:
- Tests may fail in headless/CI environments without display
- Clipboard access may be restricted
- Large captures may timeout on slow systems

### 4. Window Management Tests (`tauri-window-management.spec.ts`)

**Purpose**: Validate multi-window functionality
**Duration**: ~3-5 minutes
**Platform-Specific**: Partially

Tests:
- Window creation with custom parameters (size, title, argv)
- Sizing operations (enlarge, reduce, maximize, unmaximize)
- Window state management
- IPC operations for window control
- Error handling (invalid dimensions, failed operations)
- Lifecycle events
- Resource cleanup

**Key Operations**:
- `create_new_window`: Create new window with parameters
- `enlarge-window`: Increase window size to 1400x1050
- `reduce-window`: Decrease window size to 1024x768
- `maximize-window`: Maximize to full screen
- `unmaximize-window`: Restore from maximized state

### 5. Integration Tests (`tauri-integration.spec.ts`)

**Purpose**: Comprehensive integration testing
**Duration**: ~5-10 minutes

Tests:
- Window management
- IPC operations
- Plugin integration
- Performance benchmarks
- Shell plugin integration
- Clipboard operations
- Dialog integration

### 6. Feature Parity Tests (`tauri-feature-parity.spec.ts`)

**Purpose**: Ensure Tauri has same features as Electron
**Duration**: ~10-15 minutes

Validates:
- Command execution parity
- UI rendering consistency
- Plugin compatibility
- Performance improvements
- API compatibility

### 7. Performance Tests (`performance-comparison.ts`)

**Purpose**: Benchmark Tauri vs Electron
**Metrics**:
- Startup time
- Memory usage
- Command execution speed
- Bundle size

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test'
import {
  waitForKuiReady,
  skipIfNotTauri,
  invokeTauriCommand,
  getTestConfig
} from './utils/tauri-test-helpers'

const config = getTestConfig()

test.describe('My Test Suite', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl, { waitUntil: 'domcontentloaded' })
    await waitForKuiReady(page)
  })

  test('should do something', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Your test code here
  })
})
```

### Using Test Helpers

#### Check if Tauri Runtime

```typescript
const isTauri = await isTauriRuntime(page)
if (!isTauri) {
  test.skip()
  return
}
```

#### Invoke Tauri Commands

```typescript
// Invoke Tauri command
const result = await invokeTauriCommand(page, 'capture_to_clipboard', {
  x: 0,
  y: 0,
  width: 100,
  height: 100
})
```

#### Send Synchronous Messages

```typescript
// Send IPC message
const result = await sendTauriMessage(page, 'enlarge-window')
```

#### Execute Kui Commands

```typescript
// Execute command in REPL
await executeKuiCommand(page, 'kubectl get pods')
const result = await getLastReplResult(page)
```

#### Listen for Menu Events

```typescript
// Setup event listener
await page.evaluate(eventName => {
  return new Promise<void>(resolve => {
    if (window.__TAURI__?.event) {
      window.__TAURI__.event.listen(eventName, () => {
        ;(window as any)[`__menu_event_${eventName}`] = true
      }).then(() => resolve())
    }
  })
}, 'menu-new-tab')

// Emit event
await page.evaluate(() => {
  if (window.__TAURI__?.event) {
    return window.__TAURI__.event.emit('menu-new-tab', {})
  }
})

// Check if received
const received = await page.evaluate(eventName => {
  return !!(window as any)[`__menu_event_${eventName}`]
}, 'menu-new-tab')
```

### Platform-Specific Tests

```typescript
const platform = process.platform

test('should handle platform-specific behavior', async ({ page }) => {
  if (platform !== 'darwin') {
    test.skip()
    return
  }

  // macOS-specific test
})
```

### Performance Testing

```typescript
test('should complete quickly', async ({ page }) => {
  const startTime = Date.now()

  await executeKuiCommand(page, 'version')

  const duration = Date.now() - startTime
  expect(duration).toBeLessThan(3000)
})
```

## Debugging Tests

### View Test Results

```bash
# Show HTML report
npm run test:tauri:report

# Or open directly
open test-results/html/index.html
```

### Run with Debug Mode

```bash
# Enable Playwright debug mode
PWDEBUG=1 npx playwright test tests/tauri-menu-system.spec.ts

# Run with trace
npx playwright test --trace on
```

### View Traces

```bash
# Show trace for failed test
npx playwright show-trace test-results/trace.zip
```

### Enable Verbose Logging

```typescript
import { logTestInfo } from './utils/tauri-test-helpers'

logTestInfo('Debug message', { key: 'value' })
```

### Take Screenshots on Failure

Playwright automatically takes screenshots on failure. Find them in:
```
test-results/
  └── [test-name]/
      └── test-failed-1.png
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Tauri Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run compile

      - name: Run smoke tests
        run: npm run test:tauri:smoke

      - name: Run integration tests
        run: npm run test:tauri:integration
        if: matrix.os != 'windows-latest'

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results-${{ matrix.os }}
          path: test-results/
```

### Environment Variables

```bash
# Test URL (default: http://localhost:9080)
export TEST_URL=http://localhost:9080

# Test timeout (default: 30000ms)
export TEST_TIMEOUT=60000

# Headless mode (default: true)
export TEST_HEADLESS=false

# Slow motion (default: 0ms)
export TEST_SLOW_MO=100
```

## Known Issues

### 1. Screenshot Tests in CI

**Issue**: Screenshot captures may fail in headless CI environments
**Workaround**: Tests are designed to skip gracefully in CI
**Status**: Expected behavior

### 2. Windows Clipboard Support

**Issue**: Windows clipboard integration not fully implemented
**Status**: Known limitation (see src-tauri/src/screenshot.rs:479)
**Workaround**: Tests skip Windows clipboard operations

### 3. Menu Events in Tests

**Issue**: Native menu items can't be directly clicked in tests
**Workaround**: Tests emit events programmatically to test event handling
**Status**: Design limitation

### 4. Multi-Window Tests

**Issue**: Creating multiple windows in tests can be flaky
**Workaround**: Tests include proper cleanup and delays
**Status**: Intermittent

### 5. Linux Dependencies

**Issue**: Linux screenshot tests require xclip
**Solution**: Install with `sudo apt-get install xclip`
**Status**: Documented requirement

## Troubleshooting

### Tests Timeout

```bash
# Increase timeout
npx playwright test --timeout=120000
```

### Port Already in Use

```bash
# Change port
export TEST_URL=http://localhost:9081
```

### Display Issues (Linux)

```bash
# Run with Xvfb
xvfb-run npx playwright test
```

### Permission Issues

```bash
# Check Tauri permissions in tauri.conf.json
# Ensure required permissions are enabled
```

### Flaky Tests

```bash
# Run with retries
npx playwright test --retries=2
```

### Debug Specific Test

```bash
# Run single test with debug
npx playwright test tests/tauri-menu-system.spec.ts:42 --debug
```

## Best Practices

1. **Always check for Tauri runtime** before running Tauri-specific tests
2. **Use skipIfNotTauri()** to gracefully skip tests in browser mode
3. **Handle CI limitations** - some tests will fail in headless environments
4. **Add proper timeouts** - window operations may take time
5. **Clean up resources** - close windows, clear state between tests
6. **Log test progress** - use logTestInfo() for debugging
7. **Test error paths** - ensure graceful degradation
8. **Platform-specific handling** - skip tests on unsupported platforms
9. **Performance monitoring** - track execution times
10. **Documentation** - document known issues and workarounds

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Tauri Testing Guide](https://tauri.app/v1/guides/testing/)
- [Kui Architecture](../docs/api/README.md)
- [Tauri Migration Guide](../TAURI_MIGRATION.md)

## Contributing

When adding new Tauri tests:

1. Follow existing test structure
2. Add to appropriate test file (or create new one)
3. Update this guide with new test information
4. Ensure tests pass on all platforms
5. Document any platform-specific behavior
6. Add to CI pipeline if appropriate

## Test Coverage Goals

- **Smoke Tests**: 100% of critical path
- **Menu System**: 90%+ coverage of menu operations
- **Screenshot**: 85%+ coverage (platform limitations)
- **Window Management**: 90%+ coverage
- **IPC Commands**: 95%+ coverage
- **Integration**: 80%+ coverage of Tauri features

## Performance Targets

- Smoke tests: < 2 minutes
- Individual test suites: < 5 minutes
- Full test suite: < 20 minutes
- CI pipeline: < 30 minutes total

## Support

For questions or issues:

1. Check this guide first
2. Review existing test code for examples
3. Check [GitHub Issues](https://github.com/IBM/kui/issues)
4. Ask in project discussions
