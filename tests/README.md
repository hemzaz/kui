# Tauri Test Suite Documentation

This directory contains comprehensive tests for validating Tauri feature parity with the legacy Electron implementation.

## Test Files

### tauri-smoke.spec.ts
Quick validation tests for critical path features. These tests run fast (< 2 minutes) and catch major regressions.

**Test Coverage:**
- App launches successfully
- Basic UI renders correctly
- Core commands execute (version, help, echo)
- Command history works
- No JavaScript errors on load
- REPL accepts input
- Runtime detection
- Performance validation
- Tauri API availability (when in Tauri)
- IPC communication (when in Tauri)
- Plugin loading (kubectl, bash-like)
- Error handling and recovery
- Rapid command execution

**Run smoke tests:**
```bash
npm run test:tauri:smoke
```

### tauri-feature-parity.spec.ts
Comprehensive E2E tests to verify feature parity between Electron and Tauri implementations.

**Test Coverage:**
- Window Management
  - Create main window
  - Window resize
  - Window focus
- IPC Communication
  - Runtime detection
  - Synchronous messages
  - Async invocations
- REPL Functionality
  - Accept input
  - Execute commands
  - Command history
  - Clear REPL
- UI Components
  - Top tabs rendering
  - Theme switching
  - Command palette
- Native Features
  - Clipboard operations
  - Keyboard shortcuts
- Plugin System
  - kubectl plugin
  - Custom commands
- Performance
  - Load time
  - Command response time
  - Multiple rapid commands
- Error Handling
  - Invalid commands
  - Error recovery
- Tauri-Specific Features
  - Tauri API structure
  - Available commands

**Run feature parity tests:**
```bash
npm run test:tauri:feature-parity
```

### tauri-integration.spec.ts
Tests for specific Tauri functionality including window management, IPC operations, and plugin integration.

**Test Coverage:**
- Tauri Window Management
  - Create and manage main window
  - Resize window
  - Maximize/unmaximize
  - Focus events
- Tauri IPC Operations
  - Synchronous messages
  - exec_invoke commands
  - IPC error handling
  - Concurrent IPC calls
- Tauri Plugin Integration
  - Core plugins loading
  - kubectl commands
  - bash-like commands
  - Plugin error handling
- Tauri Performance
  - Command execution speed
  - Rapid command execution
  - Memory usage monitoring
- Tauri Menu System
  - Application menu
  - Keyboard shortcuts
- Tauri Shell Plugin
  - Shell command execution
- Tauri Clipboard Integration
  - Clipboard operations
- Tauri Dialog Integration
  - Dialog capabilities

**Run integration tests:**
```bash
npm run test:tauri:integration
```

### tauri-menu-system.spec.ts
Comprehensive tests for the native menu system including event emissions, keyboard shortcuts, and cross-platform behavior.

**Test Coverage:**
- Menu Event Emissions
  - menu-new-tab, menu-new-window, menu-close-tab
  - menu-zoom-in, menu-zoom-out, menu-zoom-reset
  - menu-about
- Keyboard Shortcuts
  - Cmd/Ctrl+T (new tab)
  - Cmd/Ctrl+N (new window)
  - Cmd/Ctrl+W (close tab)
  - F12 (DevTools toggle)
  - Cmd/Ctrl+R (reload)
  - Cmd/Ctrl+Plus (zoom in)
  - Cmd/Ctrl+Minus (zoom out)
  - Cmd/Ctrl+0 (zoom reset)
- Platform-Specific Behavior
  - Meta key (macOS) vs Control key (Linux/Windows)
  - Consistent event handling across platforms
- Error Handling
  - Missing event listeners
  - Rapid menu events
  - Invalid event data
- Integration
  - UI state coordination
  - During command execution

**Run menu system tests:**
```bash
npx playwright test tests/tauri-menu-system.spec.ts
```

### tauri-screenshot.spec.ts
Tests for screenshot capture functionality including region capture, clipboard integration, and platform-specific implementations.

**Test Coverage:**
- Basic Functionality
  - Screen region capture
  - Parameter validation (coordinates, dimensions)
  - Zero-size and negative coordinate handling
- Platform-Specific Tests
  - macOS implementation (Core Graphics)
  - Linux implementation (xcap + xclip)
  - Windows implementation (partial, clipboard pending)
- Error Handling
  - Missing/invalid parameters
  - Out-of-bounds coordinates
  - Extremely large regions
  - Concurrent capture requests
- Clipboard Integration
  - PNG format copying
  - Permission handling
  - Clipboard busy states
- Performance
  - Capture timing benchmarks
  - Small vs large regions
  - No UI blocking during capture

**Run screenshot tests:**
```bash
npx playwright test tests/tauri-screenshot.spec.ts
```

**Platform Notes:**
- **macOS**: Full support, no dependencies
- **Linux**: Requires `xclip` for clipboard (`sudo apt-get install xclip`)
- **Windows**: Capture works, clipboard copy not yet implemented

### tauri-window-management.spec.ts
Tests for multi-window management including creation, sizing, state management, and IPC operations.

**Test Coverage:**
- Window Creation
  - Custom dimensions (800x600, 1280x960, 1920x1080)
  - Custom titles
  - With argv parameters
  - Minimal parameters (defaults)
- Sizing Operations
  - Enlarge window (1400x1050)
  - Reduce window (1024x768)
  - Maximize window
  - Unmaximize window
  - Rapid resize operations
- State Management
  - State preservation after resize
  - Focus and blur events
  - Visibility tracking
- IPC Operations
  - Synchronous window messages
  - New window creation
  - open-graphical-shell
  - Unknown operation rejection
  - Concurrent operations
- Error Handling
  - Invalid dimensions
  - Extremely large dimensions
  - Failed operation recovery
- Lifecycle
  - Window initialization
  - Lifecycle events
  - Resource cleanup
- Integration
  - UI coordination during operations
  - Responsiveness during window ops

**Run window management tests:**
```bash
npx playwright test tests/tauri-window-management.spec.ts
```

### performance-comparison.ts
Benchmarks key metrics between Tauri and legacy Electron builds.

**Metrics Measured:**
- Bundle size
- Memory usage
- Startup time
- Command response time
- CPU usage

**Run performance comparison:**
```bash
npm run test:tauri:performance
```

## Test Utilities

### utils/tauri-test-helpers.ts
Helper functions for testing Tauri-specific functionality:

- `isTauriRuntime(page)` - Check if running in Tauri
- `getTauriRuntimeInfo(page)` - Get runtime information
- `invokeTauriCommand(page, command, args)` - Invoke Tauri commands
- `sendTauriMessage(page, operation, data)` - Send IPC messages
- `waitForKuiReady(page)` - Wait for Kui to initialize
- `executeKuiCommand(page, command, options)` - Execute REPL commands
- `getLastReplResult(page)` - Get last command result
- `clearRepl(page)` - Clear REPL output
- `measureCommandTime(page, command)` - Measure execution time
- `getMemoryUsage(page)` - Get memory statistics
- `mockTauriEnvironment(page)` - Mock Tauri for testing
- And many more...

## Running Tests

### Run all tests
```bash
npm run test:tauri:all
```

### Run specific test suites
```bash
# Smoke tests (fastest)
npm run test:tauri:smoke

# Feature parity tests
npm run test:tauri:feature-parity

# Integration tests
npm run test:tauri:integration

# Performance comparison
npm run test:tauri:performance
```

### Run with UI
```bash
npm run test:tauri:e2e:ui
```

### Run in headed mode (see browser)
```bash
npm run test:tauri:e2e:headed
```

### View test report
```bash
npm run test:tauri:report
```

## Configuration

Tests are configured via `playwright.config.ts`:

- **Test directory**: `./tests`
- **Base URL**: `http://localhost:9080` (configurable via `TEST_URL`)
- **Timeout**: 30 seconds for navigation, 10 seconds for actions
- **Retries**: 2 in CI, 0 locally
- **Workers**: 1 in CI, auto-detect locally
- **Reporters**: list, html, json, junit

### Environment Variables

- `TEST_URL` - Application URL (default: `http://localhost:9080`)
- `TEST_TIMEOUT` - Global timeout in ms (default: `30000`)
- `TEST_HEADLESS` - Run in headless mode (default: `true`)
- `TEST_SLOW_MO` - Slow down operations in ms (default: `0`)
- `CI` - Enable CI mode (stricter settings)

## Test Strategy

### Kaizen Approach

Following the kaizen philosophy of continuous improvement:

1. **Start with critical path** - Smoke tests cover the most important functionality
2. **Expand coverage incrementally** - Add more tests as features stabilize
3. **Quick feedback** - Smoke tests run in < 2 minutes
4. **Comprehensive validation** - Full suite validates feature parity

### Test Pyramid

- **Unit tests** (70%): Fast, isolated tests (Jest)
- **Integration tests** (20%): Component interaction tests
- **E2E tests** (10%): Full application tests (Playwright)

### Runtime Compatibility

Tests work with both Tauri and Electron/browser environments:

```typescript
const isTauri = await isTauriRuntime(page)

if (isTauri) {
  // Tauri-specific test
  await invokeTauriCommand(page, 'command', args)
} else {
  // Browser/Electron test
  test.skip()
}
```

## CI/CD Integration

Tests are designed to run in CI environments:

```yaml
- name: Run Tauri tests
  run: npm run test:tauri:all

- name: Upload test results
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: test-results
    path: test-results/
```

## Troubleshooting

### Tests failing to start

1. Ensure app is built: `npm run compile`
2. Start dev server: `npm run watch:webpack`
3. Or set `TEST_URL` to running instance

### Timeout errors

1. Increase timeout in test: `test.setTimeout(60000)`
2. Or set global timeout: `TEST_TIMEOUT=60000`
3. Check if app is slow to start

### Tauri-specific tests failing

1. Verify Tauri build exists: `npm run tauri:build`
2. Check Tauri runtime is detected: Look for `window.__TAURI__`
3. Review console for Tauri errors

### Flaky tests

1. Add explicit waits: `await page.waitForTimeout(1000)`
2. Use retry logic: `retries: 2` in test config
3. Check for race conditions

## Best Practices

1. **Use helper functions** - Don't repeat test logic
2. **Test in isolation** - Each test should be independent
3. **Clean up after tests** - Clear state between tests
4. **Mock external dependencies** - Don't rely on network/services
5. **Log useful information** - Use `logTestInfo()` for debugging
6. **Skip appropriately** - Skip tests for unavailable runtimes
7. **Validate incrementally** - Test each step, not just final result
8. **Use descriptive names** - Test names should explain what's tested

## Writing New Tests

### Template for new test file

```typescript
import { test, expect } from '@playwright/test'
import { waitForKuiReady, executeKuiCommand } from './utils/tauri-test-helpers'

test.describe('My Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:9080')
    await waitForKuiReady(page)
  })

  test('should do something', async ({ page }) => {
    // Arrange
    await executeKuiCommand(page, 'setup command')

    // Act
    await executeKuiCommand(page, 'test command')

    // Assert
    const result = await page.textContent('.result')
    expect(result).toBe('expected value')
  })
})
```

### Adding to test suite

1. Create test file in `tests/` directory
2. Name it `*.spec.ts`
3. Import helpers from `utils/tauri-test-helpers`
4. Add to package.json scripts if needed
5. Document in this README

## Metrics and Reporting

### Test Results

Test results are saved in multiple formats:

- **HTML**: `test-results/html/index.html` - Interactive report
- **JSON**: `test-results/results.json` - Machine-readable results
- **JUnit**: `test-results/results.xml` - CI-friendly format

### Performance Results

Performance benchmarks are saved in:

- `performance-results.json` - Detailed metrics and comparisons

### Coverage Goals

- **E2E Coverage**: All critical user paths
- **API Coverage**: All public IPC commands
- **Runtime Coverage**: Both Tauri and Electron
- **Platform Coverage**: macOS, Linux, Windows

## Contributing

When adding new features:

1. Add smoke test for critical functionality
2. Add integration test for detailed validation
3. Update this README with test coverage
4. Ensure tests pass in both Tauri and browser modes
5. Add performance benchmark if applicable

## Documentation Files

This test directory includes comprehensive documentation:

### TAURI-TESTING-GUIDE.md
Complete guide for testing Tauri features covering:
- Test structure and organization
- Running and debugging tests
- Writing new tests with examples
- CI/CD integration patterns
- Known issues and troubleshooting
- Best practices and tips

### TAURI-TEST-SUMMARY.md
High-level overview of test coverage:
- Test suite statistics and metrics
- Feature coverage by category
- Platform-specific support status
- Known limitations and workarounds
- Test reliability metrics
- Future testing roadmap

### QUICK-REFERENCE.md
Fast reference for common tasks:
- Quick command cheatsheet
- Common use cases
- Test helper examples
- Environment variables
- Troubleshooting tips
- Performance targets

**Recommendation**: Start with QUICK-REFERENCE.md for fast answers, then consult TAURI-TESTING-GUIDE.md for detailed information.

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Tauri Testing Guide](https://tauri.app/v1/guides/testing/)
- [Jest Documentation](https://jestjs.io/)
- [Kui Testing Guide](../packages/test/README.md)
- [TAURI-TESTING-GUIDE.md](./TAURI-TESTING-GUIDE.md) - Comprehensive Tauri testing guide
- [TAURI-TEST-SUMMARY.md](./TAURI-TEST-SUMMARY.md) - Test coverage summary
- [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - Quick command reference
