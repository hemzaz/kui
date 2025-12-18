# Tauri Test Suite - Quick Start Guide

Quick reference for running Tauri tests.

## Setup (One-Time)

```bash
# Install dependencies
npm ci

# Install Playwright browsers
npx playwright install
```

## Run Tests

### Quick Test Run

```bash
# Run all tests
npm run test:tauri:all

# Run only unit tests (fastest)
npm run test:tauri:unit

# Run only E2E tests
npm run test:tauri:e2e
```

### Specific Test Suites

```bash
# Feature parity tests
npm run test:tauri:feature-parity

# Integration tests
npm run test:tauri:integration

# Performance benchmarks
npm run test:tauri:performance
```

### Debug Mode

```bash
# Interactive UI mode
npm run test:tauri:e2e:ui

# Run with visible browser
npm run test:tauri:e2e:headed

# Debug specific test
npx playwright test tests/tauri-integration.spec.ts --debug
```

## View Results

```bash
# HTML test report
npm run test:tauri:report

# Performance results
cat performance-results.json
```

## Common Commands

```bash
# Watch mode (unit tests)
npm run test:tauri:unit -- --watch

# Run specific test file
npm run test:tauri:unit -- tauri-ipc.test.ts

# Run with coverage
npm run test:tauri:unit -- --coverage

# Update snapshots
npm run test:tauri:e2e -- --update-snapshots
```

## Test Structure

```
tests/
├── tauri-feature-parity.spec.ts    # E2E feature tests
├── tauri-integration.spec.ts       # Integration tests
├── performance-comparison.ts       # Performance benchmarks
└── utils/
    └── tauri-test-helpers.ts       # Test utilities

packages/core/tests/
└── tauri-ipc.test.ts              # Unit tests
```

## Environment Variables

```bash
# Set test URL
export TEST_URL=http://localhost:9080

# Set timeout
export TEST_TIMEOUT=30000

# Run in headed mode
export TEST_HEADLESS=false

# Slow motion for debugging
export TEST_SLOW_MO=100
```

## Troubleshooting

### Tests Won't Run
```bash
# Reinstall dependencies
npm ci
npx playwright install
```

### Port Already in Use
```bash
# Change test URL
export TEST_URL=http://localhost:9081
```

### Browser Issues
```bash
# Reinstall browsers
npx playwright install --force
```

### Test Failures
```bash
# Run in debug mode
npm run test:tauri:e2e:ui
```

## CI/CD Integration

```bash
# For GitHub Actions
npm ci
npx playwright install --with-deps
npm run test:tauri:all
```

## Full Documentation

See `TESTING-TAURI.md` for complete documentation.
