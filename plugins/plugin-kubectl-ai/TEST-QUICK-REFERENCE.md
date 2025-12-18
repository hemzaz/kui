# Test Quick Reference - plugin-kubectl-ai

One-page reference for common test scenarios and commands.

---

## Quick Commands

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Specific test file
npm test -- tests/services/ai-provider.spec.ts

# Specific test name
npm test -- -t "should render trigger element"

# UI tests only
npm run test:ui

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Performance tests
npm test -- -t "performance requirement"

# Accessibility tests
npm test -- -t "accessibility"

# Debug mode
npm run test:debug

# CI mode
npm run test:ci

# Clear cache and rerun
npm test -- --clearCache
```

---

## Current Status (Baseline)

```
Total Tests:        230
Passing:           117 (50.87%)
Failing:           113 (49.13%)

Test Suites:         8
Passing Suites:      1 (12.5%)
Failing Suites:      7 (87.5%)

Code Coverage:   21.07% (Target: 80%)
```

---

## Test Files Overview

| File | Tests | Status | Priority |
|------|-------|--------|----------|
| ai-provider.spec.ts | 17 | ✅ PASS | Baseline |
| cache-manager.spec.ts | 22 | ❌ FAIL | High |
| cluster-data-collector.spec.ts | 24 | ❌ FAIL | High |
| insight-generator.spec.ts | 50 | ⚠️ 49/50 | High |
| ContextMenu.spec.tsx | 40 | ❌ FAIL | Critical |
| ResourceTooltip.spec.tsx | 45 | ❌ FAIL | Critical |
| ai-ask.spec.ts | 24 | ❌ FAIL | Medium |
| context-menu-integration.spec.ts | 24 | ⚠️ 22/24 | High |

---

## Critical Fixes Needed

### 1. React Import (Highest Priority)
**Impact:** Blocks 85 tests
**Files:**
- tests/ui/ContextMenu.spec.tsx (line 17)
- tests/ui/ResourceTooltip.spec.tsx (line 17)

**Fix:**
```typescript
import React from 'react'
```

**Time:** 2 minutes
**Tests Fixed:** 85

---

### 2. Null Check in InsightGenerator
**Impact:** 1 test failing
**File:** tests/services/insight-generator.spec.ts (line 85)

**Fix:**
```typescript
private extractInsight(content: string): string {
  if (!content) return ''
  const firstSentence = content.split(/[.!?]/)[0]
  return firstSentence.substring(0, 150).trim()
}
```

**Time:** 5 minutes
**Tests Fixed:** 1

---

### 3. Create InsightGenerator Service
**Impact:** 50 tests waiting
**File:** src/services/insight-generator.ts (CREATE NEW)

**Requirements:**
- Generate AI insights for K8s resources
- <1 second response time
- Caching with TTL
- Error handling

**Time:** 3-4 hours
**Tests Fixed:** Validates 50 tests

---

### 4. Add Concurrency Control
**Impact:** 1 test failing
**File:** src/services/context-menu-service.ts

**Requirements:**
- Max 3 concurrent requests
- Request queue
- Overflow handling

**Time:** 1-2 hours
**Tests Fixed:** 1

---

### 5. Add Request Cancellation
**Impact:** 1 test failing
**File:** src/services/context-menu-service.ts

**Requirements:**
- AbortController support
- Cleanup on cancel
- Provider interface updates

**Time:** 1-2 hours
**Tests Fixed:** 1

---

## Performance Requirements

### Critical Performance Tests (MUST PASS)

**1. Tooltip Load Time**
```bash
npm test -- -t "should load insight within 1 second"
```
- Requirement: <1000ms
- File: tests/ui/ResourceTooltip.spec.tsx
- Status: Blocked by React import

**2. Insight Generation**
```bash
npm test -- -t "should generate insight within 1 second"
```
- Requirement: <1000ms
- File: tests/services/insight-generator.spec.ts
- Status: ⚠️ Needs implementation

**3. Concurrent Request Limit**
```bash
npm test -- -t "should limit concurrent AI requests"
```
- Requirement: ≤3 concurrent
- File: tests/integration/context-menu-integration.spec.ts
- Status: ❌ Failing (current: 4)

---

## Test Categories

### Unit Tests (136 tests)
```bash
npm run test:unit
```
Focus: Individual functions and classes in isolation

**Files:**
- ai-provider.spec.ts (17) ✅
- cache-manager.spec.ts (22) ❌
- cluster-data-collector.spec.ts (24) ❌
- insight-generator.spec.ts (50) ⚠️

### UI Tests (85 tests)
```bash
npm run test:ui
```
Focus: React component rendering and interaction

**Files:**
- ContextMenu.spec.tsx (40) ❌ (React import)
- ResourceTooltip.spec.tsx (45) ❌ (React import)

### Integration Tests (48 tests)
```bash
npm run test:integration
```
Focus: End-to-end workflows and system integration

**Files:**
- ai-ask.spec.ts (24) ❌
- context-menu-integration.spec.ts (24) ⚠️ (2 failing)

---

## Debugging Guide

### Issue: Test Won't Run
```bash
# Clear Jest cache
npm test -- --clearCache

# Rebuild project
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Check for ESLint errors
npx eslint src/ --ext .ts,.tsx
```

### Issue: Mock Not Working
```typescript
// In test file, before imports
jest.mock('@kui-shell/core', () => ({
  rexec: jest.fn()
}))

// In beforeEach
beforeEach(() => {
  jest.clearAllMocks()
})
```

### Issue: Async Test Timeout
```typescript
// Increase timeout for specific test
it('slow test', async () => {
  // test code
}, 60000) // 60 second timeout

// Or set globally in describe block
describe('My Tests', () => {
  jest.setTimeout(60000)
  // tests...
})
```

### Issue: React Component Won't Render
```typescript
// Ensure these imports
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Check testEnvironment in jest.config.js
// Should be: testEnvironment: 'jsdom'
```

---

## Coverage Targets

### Current Coverage: 21.07%
### Target Coverage: 80%

**Priority Files (Need >80%):**

**Services:**
- ✅ ai-provider.ts: 100%
- ❌ anthropic-provider.ts: 12% → 80%
- ❌ openai-provider.ts: 3% → 80%
- ❌ azure-provider.ts: 2% → 80%
- ❌ ollama-provider.ts: 2% → 80%
- ❌ provider-factory.ts: 28% → 80%

**Commands:**
- ❌ ai-ask.ts: 38% → 80%

**Context:**
- ❌ cluster-data-collector.ts: 55% → 80%

**Cache:**
- ❌ cache-manager.ts: 30% → 80%

**Utils:**
- ❌ config-loader.ts: 44% → 80%

---

## Common Test Patterns

### Testing Async Functions
```typescript
it('should fetch data', async () => {
  const result = await fetchData()
  expect(result).toBeDefined()
})
```

### Testing Errors
```typescript
it('should throw on invalid input', async () => {
  await expect(doSomething(null)).rejects.toThrow('Invalid input')
})
```

### Testing React Components
```typescript
it('should render button', () => {
  render(<MyComponent />)
  expect(screen.getByRole('button')).toBeInTheDocument()
})
```

### Testing User Interactions
```typescript
it('should call handler on click', async () => {
  const handleClick = jest.fn()
  render(<Button onClick={handleClick} />)

  await userEvent.click(screen.getByRole('button'))
  expect(handleClick).toHaveBeenCalledTimes(1)
})
```

### Testing Performance
```typescript
it('should complete in under 1 second', async () => {
  const startTime = Date.now()
  await performOperation()
  const duration = Date.now() - startTime

  expect(duration).toBeLessThan(1000)
})
```

---

## Test Utilities

### Available in tests/setup.ts
```typescript
// Wait for specified time
await testUtils.wait(100)

// Create mock async iterator
testUtils.createMockAsyncIterator(['item1', 'item2'])

// Create streaming iterator with delay
testUtils.createStreamingIterator(['chunk1', 'chunk2'], 10)
```

### Available in tests/helpers/test-utils.ts
```typescript
// Create mock completion request
createMockCompletionRequest(options)

// Create mock AI response
createMockAIResponse(options)

// Wait for condition
await waitFor(() => expect(element).toBeVisible())

// Measure execution time
const { result, durationMs } = await measureTime(async () => {
  return await someOperation()
})
```

---

## Mocked Dependencies

### Automatically Mocked (in tests/setup.ts)

**Kui Core:**
- `@kui-shell/core` → rexec, PreloadRegistrar, Arguments, UsageError

**AI Providers:**
- `@anthropic-ai/sdk` → Anthropic client
- `openai` → OpenAI client

**Caching:**
- `node-cache` → In-memory cache implementation

### Environment Variables (in tests/setup.ts)
```typescript
process.env.NODE_ENV = 'test'
process.env.ANTHROPIC_API_KEY = 'test-api-key-12345'
process.env.OPENAI_API_KEY = 'test-openai-key-12345'
```

---

## Validation Checklist

Before committing fixes:

**Build:**
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] No compiler warnings

**Tests:**
- [ ] All 230 tests pass
- [ ] All 8 test suites pass
- [ ] No skipped tests
- [ ] No timeout errors

**Coverage:**
- [ ] Statement coverage >80%
- [ ] Branch coverage >80%
- [ ] Function coverage >80%
- [ ] Line coverage >80%

**Performance:**
- [ ] Tooltip <1s requirement met
- [ ] Insight generation <1s met
- [ ] Concurrent requests ≤3

**Accessibility:**
- [ ] All ARIA tests pass
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

---

## Next Steps

### Immediate (0-1 hour)
1. Fix React imports in UI test files
2. Add null check in insight-generator test mock
3. Update Jest config (remove deprecation warnings)

### Short-term (1-4 hours)
1. Create InsightGenerator service implementation
2. Debug cache-manager test failures
3. Debug cluster-data-collector test failures

### Medium-term (4-8 hours)
1. Add concurrency control to context-menu-service
2. Add request cancellation support
3. Debug ai-ask integration test failures

### Long-term (8+ hours)
1. Expand provider test coverage (Azure, OpenAI, Ollama)
2. Add UI component tests (AIChatSidebar, AISettings, etc.)
3. Add command handler tests (ai-config, ai-create, ai-debug)

---

## Documentation Links

- **Full Test Report:** TEST-BASELINE-REPORT.md
- **Validation Plan:** TEST-VALIDATION-PLAN.md
- **Test Guide:** tests/README.md
- **Quick Start:** tests/QUICK-START.md
- **Feature #3 Tests:** TESTS-FEATURE3-COMPLETE.md

---

## Success Metrics

**Target State:**
```
Tests Passing:      230/230 (100%)
Test Suites:        8/8 (100%)
Code Coverage:      >80%
Performance Tests:  All passing (<1s)
Accessibility:      All passing
Build Status:       ✅ Clean
```

**Current State:**
```
Tests Passing:      117/230 (50.87%)
Test Suites:        1/8 (12.5%)
Code Coverage:      21.07%
Performance Tests:  Blocked
Accessibility:      Blocked
Build Status:       ⚠️ Has issues
```

---

**Last Updated:** 2025-12-17
**Version:** 1.0
**Status:** Ready for Use
