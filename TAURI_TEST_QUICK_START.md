# Tauri Test Suite - Quick Start Guide

Fast track guide to running the Tauri test suite.

## Prerequisites

```bash
# Ensure you have Node.js 24+ and npm 10+
node --version  # Should be >= 24.0.0
npm --version   # Should be >= 10.0.0

# Install dependencies
npm install

# Install Playwright browsers (one time)
npx playwright install
```

## Quick Commands

### Fastest - Smoke Tests (< 2 minutes)
```bash
# Start dev server in one terminal
npm run watch:webpack

# In another terminal, run smoke tests
npm run test:tauri:smoke
```

### Full Test Suite
```bash
# Run all tests (smoke + integration + feature parity)
npm run test:tauri:all
```

### Interactive Testing
```bash
# Open Playwright UI (best for debugging)
npm run test:tauri:e2e:ui
```

### View Results
```bash
# Open HTML report
npm run test:tauri:report
```

## Command Reference

| Command | Description | Duration |
|---------|-------------|----------|
| `npm run test:tauri:smoke` | Critical path validation | ~2 min |
| `npm run test:tauri:smoke:headed` | Smoke tests with visible browser | ~2 min |
| `npm run test:tauri:integration` | Tauri-specific integration tests | ~3-5 min |
| `npm run test:tauri:feature-parity` | Full E2E feature validation | ~5-10 min |
| `npm run test:tauri:performance` | Performance benchmarking | ~2-3 min |
| `npm run test:tauri:all` | Complete test suite | ~12-20 min |
| `npm run test:tauri:e2e:ui` | Interactive UI mode | Interactive |
| `npm run test:tauri:e2e:headed` | All tests with visible browser | ~15-25 min |
| `npm run test:tauri:report` | View HTML test report | - |

## Automated Validation

```bash
# Run comprehensive validation script
chmod +x tests/validate-tests.sh
./tests/validate-tests.sh
```

This script will:
1. Check prerequisites
2. Start dev server if needed
3. Run all test suites
4. Generate summary report
5. Display results

## Environment Variables

```bash
# Custom app URL
TEST_URL=http://localhost:9080 npm run test:tauri:smoke

# Increase timeout
TEST_TIMEOUT=60000 npm run test:tauri:smoke

# Run with visible browser
TEST_HEADLESS=false npm run test:tauri:smoke

# Slow down operations (debugging)
TEST_SLOW_MO=100 npm run test:tauri:smoke
```

## Common Workflows

### Before Commit
```bash
npm run test:tauri:smoke
```

### Before Pull Request
```bash
npm run test:tauri:all
npm run test:tauri:report
```

### Debugging Failing Test
```bash
# Run specific test with UI
npm run test:tauri:e2e:ui

# Or run in headed mode
npm run test:tauri:smoke:headed
```

### Performance Testing
```bash
npm run test:tauri:performance
cat performance-results.json
```

## Troubleshooting

### Tests Timeout
```bash
# Increase timeout
TEST_TIMEOUT=60000 npm run test:tauri:smoke
```

### Dev Server Not Running
```bash
# Start manually in separate terminal
npm run watch:webpack

# Then run tests
npm run test:tauri:smoke
```

### Port Already in Use
```bash
# Kill existing process
lsof -ti:9080 | xargs kill -9

# Restart dev server
npm run watch:webpack
```

### Tauri-Specific Tests Failing
```bash
# These tests skip if not in Tauri environment
# Build Tauri first:
npm run tauri:build

# Then run tests
npm run test:tauri:integration
```

## File Locations

- **Test Suites:** `tests/*.spec.ts`
- **Test Helpers:** `tests/utils/tauri-test-helpers.ts`
- **Test Config:** `playwright.config.ts`
- **Test Results:** `test-results/`
- **HTML Report:** `test-results/html/index.html`
- **Documentation:** `tests/README.md`

## Next Steps

1. Run smoke tests: `npm run test:tauri:smoke`
2. Review results
3. Fix any failures
4. Run full suite: `npm run test:tauri:all`
5. Review HTML report: `npm run test:tauri:report`

## Support

- Full documentation: `tests/README.md`
- Implementation report: `TAURI_TEST_REPORT.md`
- Validation summary: `TAURI_TEST_VALIDATION_SUMMARY.md`
