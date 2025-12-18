# Tauri Tests - Quick Reference

Fast reference guide for running and debugging Tauri tests.

## Quick Commands

```bash
# Run all smoke tests (2 min)
npm run test:tauri:smoke

# Run specific test file
npx playwright test tests/tauri-menu-system.spec.ts
npx playwright test tests/tauri-screenshot.spec.ts
npx playwright test tests/tauri-window-management.spec.ts

# Run with UI (for debugging)
npm run test:tauri:e2e:ui

# Run in headed mode (see browser)
npx playwright test --headed

# Run single test
npx playwright test tests/tauri-menu-system.spec.ts:42

# Run with debug
npx playwright test --debug

# View test report
npm run test:tauri:report
```

## Test Suites

| Command | Duration | Purpose |
|---------|----------|---------|
| `npm run test:tauri:smoke` | 2 min | Quick critical path validation |
| `npx playwright test tests/tauri-menu-system.spec.ts` | 5 min | Menu system and keyboard shortcuts |
| `npx playwright test tests/tauri-screenshot.spec.ts` | 5 min | Screenshot capture functionality |
| `npx playwright test tests/tauri-window-management.spec.ts` | 5 min | Window creation and management |
| `npm run test:tauri:integration` | 10 min | General integration tests |
| `npm run test:tauri:feature-parity` | 15 min | Electron vs Tauri parity |
| `npm run test:tauri:all` | 20 min | All Tauri tests |

## Common Use Cases

### Daily Development
```bash
# Quick validation before commit
npm run test:tauri:smoke

# Test specific feature
npx playwright test tests/tauri-menu-system.spec.ts --headed
```

### Debugging Failed Test
```bash
# Run with debug UI
npx playwright test tests/tauri-menu-system.spec.ts --debug

# Run with trace
npx playwright test --trace on

# View trace
npx playwright show-trace test-results/trace.zip

# View screenshots
open test-results/
```

### CI/CD
```bash
# Set environment
export CI=true
export TEST_HEADLESS=true

# Run smoke tests
npm run test:tauri:smoke

# Run all tests with retries
npx playwright test --retries=2
```

### Platform-Specific Testing

#### macOS
```bash
npm run test:tauri:smoke
npx playwright test tests/tauri-screenshot.spec.ts
```

#### Linux
```bash
# Install dependencies
sudo apt-get install xclip

# Run tests
npm run test:tauri:smoke
npx playwright test tests/tauri-screenshot.spec.ts
```

#### Windows
```bash
npm run test:tauri:smoke
npx playwright test tests/tauri-window-management.spec.ts
# Note: Screenshot clipboard tests will skip
```

## Test Helpers

### Check Tauri Runtime
```typescript
import { isTauriRuntime, skipIfNotTauri } from './utils/tauri-test-helpers'

// Method 1: Check and skip
if (await skipIfNotTauri(page)) {
  test.skip()
  return
}

// Method 2: Get boolean
const isTauri = await isTauriRuntime(page)
```

### Invoke Commands
```typescript
import { invokeTauriCommand, sendTauriMessage } from './utils/tauri-test-helpers'

// Invoke Tauri command
await invokeTauriCommand(page, 'capture_to_clipboard', {
  x: 0, y: 0, width: 100, height: 100
})

// Send synchronous message
await sendTauriMessage(page, 'enlarge-window')
```

### Execute Kui Commands
```typescript
import { executeKuiCommand, getLastReplResult } from './utils/tauri-test-helpers'

// Execute command
await executeKuiCommand(page, 'kubectl get pods')

// Get result
const result = await getLastReplResult(page)
```

### Menu Events
```typescript
// Setup listener
await page.evaluate(eventName => {
  return new Promise(resolve => {
    window.__TAURI__.event.listen(eventName, () => {
      (window as any)[`__event_${eventName}`] = true
    }).then(resolve)
  })
}, 'menu-new-tab')

// Emit event
await page.evaluate(() => {
  window.__TAURI__.event.emit('menu-new-tab', {})
})

// Check received
const received = await page.evaluate(name => {
  return !!(window as any)[`__event_${name}`]
}, 'menu-new-tab')
```

## Environment Variables

```bash
# Test URL (default: http://localhost:9080)
export TEST_URL=http://localhost:9081

# Test timeout (default: 30000ms)
export TEST_TIMEOUT=60000

# Headless mode (default: true)
export TEST_HEADLESS=false

# Slow motion (default: 0ms)
export TEST_SLOW_MO=100

# Enable Playwright debug
export PWDEBUG=1
```

## Troubleshooting

### Test Timeouts
```bash
# Increase global timeout
npx playwright test --timeout=120000

# Or in test
test.setTimeout(120000)
```

### Port In Use
```bash
# Use different port
export TEST_URL=http://localhost:9081

# Or kill existing process
lsof -ti:9080 | xargs kill
```

### Display Issues (Linux)
```bash
# Run with Xvfb
xvfb-run npx playwright test

# Check DISPLAY
echo $DISPLAY
```

### Screenshot Issues
```bash
# macOS: No special requirements

# Linux: Install xclip
sudo apt-get install xclip

# Windows: Known limitation
# Clipboard tests will skip
```

### Flaky Tests
```bash
# Run with retries
npx playwright test --retries=2

# Run multiple times
for i in {1..5}; do npm run test:tauri:smoke; done
```

## Test Status Codes

| Status | Meaning |
|--------|---------|
| ✅ | Test passed |
| ❌ | Test failed |
| ⊘ | Test skipped |
| ⚠️ | Test passed with warnings |

## Common Error Messages

### "Tauri runtime not available"
**Cause**: Running in browser mode, not Tauri
**Solution**: Start Tauri app or skip test

### "Screenshot capture failed"
**Cause**: Headless environment or no display
**Solution**: Expected in CI, test should skip gracefully

### "Window operation failed"
**Cause**: Display server issue or permissions
**Solution**: Check display permissions, may need to skip

### "IPC timeout"
**Cause**: Command took too long
**Solution**: Increase timeout or check command validity

### "xclip not found"
**Cause**: Linux clipboard tool not installed
**Solution**: `sudo apt-get install xclip`

## Performance Targets

| Operation | Target | Acceptable |
|-----------|--------|------------|
| App Startup | < 1s | < 2s |
| Command Execution | < 300ms | < 500ms |
| Window Creation | < 500ms | < 1s |
| Screenshot Capture | < 1s | < 2s |
| IPC Round-trip | < 50ms | < 100ms |

## Test File Structure

```typescript
test.describe('Feature Name', () => {
  test.setTimeout(60000)

  test.beforeEach(async ({ page }) => {
    await page.goto(config.appUrl)
    await waitForKuiReady(page)
  })

  test('should do something', async ({ page }) => {
    if (await skipIfNotTauri(page)) {
      test.skip()
      return
    }

    // Test code
  })
})
```

## Useful Playwright Commands

```bash
# List all tests
npx playwright test --list

# Run specific project
npx playwright test --project=chromium

# Update snapshots
npx playwright test --update-snapshots

# Generate code
npx playwright codegen http://localhost:9080

# Show report
npx playwright show-report

# Install browsers
npx playwright install
```

## CI Configuration

### GitHub Actions Example
```yaml
- name: Run Tauri Tests
  run: npm run test:tauri:smoke
  env:
    CI: true
    TEST_HEADLESS: true
```

### Test Selection for CI
```bash
# Fast validation
npm run test:tauri:smoke

# Full validation (if time permits)
npm run test:tauri:all
```

## Documentation Files

1. **TAURI-TESTING-GUIDE.md** - Comprehensive guide
2. **TAURI-TEST-SUMMARY.md** - Coverage overview
3. **QUICK-REFERENCE.md** - This file
4. **README.md** - General test info

## Getting Help

1. Check this quick reference
2. Read TAURI-TESTING-GUIDE.md
3. Look at test code for examples
4. Check GitHub issues
5. Ask in discussions

## Tips

- Always run smoke tests before committing
- Use `--headed` mode when developing tests
- Use `--debug` mode when test fails
- Check test-results/ folder for screenshots
- Platform-specific tests should skip gracefully
- Add proper error messages for debugging
- Use logTestInfo() for better logs

## Last Resort

```bash
# Clean everything and start over
npm run clean
npm install
npm run compile
npm run test:tauri:smoke
```

---

**Last Updated**: December 17, 2025
**Quick Tip**: Run `npm run test:tauri:smoke` for fast validation!
