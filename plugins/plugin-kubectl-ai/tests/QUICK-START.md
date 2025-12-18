# Feature #3 Tests - Quick Start Guide

## Setup (One-Time)

```bash
cd /Users/elad/PROJ/kui/plugins/plugin-kubectl-ai
npm install
```

## Running Tests

### All Feature #3 Tests
```bash
npm run test:feature3
```

### Individual Components
```bash
# Context Menu
npm test -- ContextMenu.spec.tsx

# Tooltip
npm test -- ResourceTooltip.spec.tsx

# Insight Generator
npm test -- insight-generator.spec.ts

# Integration
npm test -- context-menu-integration.spec.ts
```

### Development Workflow
```bash
# Watch mode (auto-run on file changes)
npm run test:watch

# Coverage report
npm run test:coverage
open coverage/lcov-report/index.html

# Debug
npm run test:debug
```

## Test Count by File

| File | Tests | Focus |
|------|-------|-------|
| ContextMenu.spec.tsx | 40+ | UI Component |
| ResourceTooltip.spec.tsx | 45+ | UI Component |
| insight-generator.spec.ts | 50+ | Service |
| context-menu-integration.spec.ts | 30+ | Integration |
| **TOTAL** | **165+** | **All Layers** |

## Performance Requirements

CRITICAL: These tests enforce < 1 second requirement

```bash
# Run performance tests
npm test -- -t "performance requirement"
```

## Accessibility Tests

```bash
# Run accessibility tests
npm test -- -t "accessibility"
```

## Test Files

```
tests/
├── ui/                                      # NEW
│   ├── ContextMenu.spec.tsx                # 40+ tests
│   └── ResourceTooltip.spec.tsx            # 45+ tests
├── services/
│   └── insight-generator.spec.ts           # NEW - 50+ tests
└── integration/
    └── context-menu-integration.spec.ts    # NEW - 30+ tests
```

## Next Steps

1. **Install dependencies**: `npm install`
2. **Run tests**: `npm run test:feature3`
3. **Implement components** (tests will guide you)
4. **Achieve >90% coverage**: `npm run test:coverage`

## TDD Workflow

```bash
# 1. Watch specific test
npm run test:watch -- ContextMenu.spec.tsx

# 2. Implement component
# Create: src/ui/ContextMenu.tsx

# 3. See tests pass (green)

# 4. Refactor

# 5. Repeat for next component
```

## Expected Results

Before implementation:
```
Test Suites: 4 failed, 4 total
Tests:       165 failed, 165 total
```

After implementation:
```
Test Suites: 4 passed, 4 total
Tests:       165 passed, 165 total
Coverage:    >90% for new code
```

## Documentation

- `tests/README.md` - Full test documentation
- `TESTS-FEATURE3-COMPLETE.md` - Complete test suite summary
- `QUICK-START.md` - This file

## Help

**Tests timing out?**
- Increase timeout: `jest.setTimeout(60000)`

**Mock not working?**
- Clear mocks: `jest.clearAllMocks()`

**Module errors?**
- Clear cache: `npm test -- --clearCache`
- Recompile: `npm run compile`

**Questions?**
See `tests/README.md` or open an issue.
