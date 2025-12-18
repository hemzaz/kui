# Test Validation Plan - Post-Fix Testing Strategy

**Purpose:** Validate all fixes and features after ESLint and implementation fixes are applied
**Target:** 100% test pass rate with >80% code coverage
**Date:** 2025-12-17

---

## Overview

This document outlines the systematic approach to validating fixes and features after:
1. ESLint errors are resolved
2. TypeScript compilation is clean
3. Missing implementations are added
4. Test infrastructure is updated

---

## Validation Phases

### Phase 1: Pre-Validation Checklist

Before running tests, verify:

#### Build Status
```bash
# 1. Check TypeScript compilation
cd /Users/elad/PROJ/kui/plugins/plugin-kubectl-ai
npx tsc --noEmit

# 2. Check ESLint
npx eslint src/ --ext .ts,.tsx

# 3. Build the project
npm run build

# 4. Verify no dependency issues
npm install --dry-run
```

**Pass Criteria:**
- ✅ Zero TypeScript errors
- ✅ Zero ESLint errors
- ✅ Build completes successfully
- ✅ No dependency conflicts

---

### Phase 2: Unit Test Validation

Run each test suite individually to isolate issues.

#### 2.1 AI Provider Tests (Baseline - Already Passing)
```bash
npm test -- tests/services/ai-provider.spec.ts --verbose
```

**Expected Result:**
- ✅ 17/17 tests pass
- ✅ No regressions from fixes

**If Fails:**
- Check if ESLint fixes changed provider base class
- Verify type definitions match tests
- Review mock setup

---

#### 2.2 Cache Manager Tests
```bash
npm test -- tests/services/cache-manager.spec.ts --verbose
```

**Expected Result:**
- ✅ 22/22 tests pass
- ✅ Cache operations work correctly
- ✅ TTL management functional

**Validation Points:**
1. **Basic Operations:**
   - Set/get/delete work correctly
   - Keys are properly namespaced
   - Value serialization handles all types

2. **TTL Management:**
   - Cache entries expire correctly
   - TTL can be extended
   - Expired entries are cleaned up

3. **Statistics:**
   - Hit/miss counters accurate
   - Cache size reported correctly
   - Performance metrics reasonable

**If Fails:**
- Check CacheManager class export
- Verify node-cache mock in setup.ts
- Review TypeScript types for cache keys/values
- Test with real node-cache (not mocked) if needed

---

#### 2.3 Cluster Data Collector Tests
```bash
npm test -- tests/services/cluster-data-collector.spec.ts --verbose
```

**Expected Result:**
- ✅ 24/24 tests pass
- ✅ kubectl execution mocked properly
- ✅ Data collection and parsing works

**Validation Points:**
1. **Data Collection:**
   - Cluster overview retrieved correctly
   - Pod statistics calculated accurately
   - Resource quotas parsed properly
   - Namespace info collected

2. **Error Handling:**
   - kubectl failures handled gracefully
   - Timeouts don't crash collector
   - Invalid responses handled
   - Network errors logged

3. **Caching:**
   - Expensive queries cached
   - Cache invalidation works
   - TTL appropriate for data type

**If Fails:**
- Check @kui-shell/core mock setup
- Verify rexec mock returns correct format
- Test JSON parsing of kubectl output
- Check async/await error handling
- Validate ClusterDataCollector exports

---

#### 2.4 Insight Generator Tests (NEW - Needs Implementation)
```bash
npm test -- tests/services/insight-generator.spec.ts --verbose
```

**Expected Result:**
- ✅ 50/50 tests pass
- ✅ <1 second performance requirement met
- ✅ All resource types supported

**Validation Points:**
1. **Core Functionality:**
   - Generates insights for all K8s resource types
   - Prompt construction includes resource context
   - AI responses parsed correctly
   - Insights formatted for display

2. **Performance:**
   - ⚠️ CRITICAL: Insights generated in <1000ms
   - Cached insights returned immediately
   - Batch operations efficient
   - No blocking on slow AI responses

3. **Caching:**
   - Insights cached with appropriate TTL
   - Cache keys unique per resource
   - Cache hits/misses tracked
   - Stale entries cleaned up

4. **Error Handling:**
   - Null/undefined inputs handled
   - AI provider errors caught
   - Timeout errors handled
   - Rate limiting respected
   - Network errors provide fallback

**If Fails:**
- Verify InsightGenerator class implementation
- Check AI provider integration
- Test prompt templates for each resource type
- Measure actual performance with time tracking
- Review error handling in extractInsight()
- Validate caching logic

---

### Phase 3: UI Component Test Validation

#### 3.1 Context Menu Tests
```bash
npm test -- tests/ui/ContextMenu.spec.tsx --verbose
```

**Expected Result:**
- ✅ 40/40 tests pass
- ✅ All interactions work correctly
- ✅ Accessibility requirements met

**Validation Points:**
1. **Rendering:**
   - Component renders without errors
   - Props passed correctly
   - Resource info displayed
   - Menu initially hidden

2. **Interactions:**
   - Right-click opens menu at cursor
   - Menu positioned correctly
   - Actions trigger callbacks
   - Menu closes appropriately
   - Outside click closes menu
   - Escape key closes menu

3. **Keyboard Navigation:**
   - Tab cycles through menu items
   - Arrow keys navigate items
   - Enter activates selected item
   - Focus management correct

4. **Accessibility:**
   - ARIA roles present (menu, menuitem)
   - ARIA labels descriptive
   - Keyboard-only workflow functional
   - Screen reader announcements work

**If Fails:**
- Check React import at top of test file
- Verify AIContextMenu component exports
- Test component in isolation
- Check event handler bindings
- Validate positioning logic
- Review accessibility attributes

---

#### 3.2 Resource Tooltip Tests
```bash
npm test -- tests/ui/ResourceTooltip.spec.tsx --verbose
```

**Expected Result:**
- ✅ 45/45 tests pass
- ✅ <1 second load time requirement met
- ✅ All error states handled

**Validation Points:**
1. **Display Behavior:**
   - Tooltip hidden initially
   - Shows on hover after delay
   - Hides when mouse leaves
   - Positioned correctly near target
   - Handles viewport overflow

2. **Performance:**
   - ⚠️ CRITICAL: Insight loads in <1000ms
   - Loading state shows immediately
   - Cached insights instant
   - Debouncing prevents spam
   - No memory leaks

3. **Content:**
   - Insight text formatted correctly
   - Severity indicators shown
   - Actions rendered if present
   - Error messages clear

4. **Error Handling:**
   - Timeout errors displayed
   - Network errors handled
   - Rate limit messages shown
   - Fallback content provided

5. **Accessibility:**
   - ARIA role="tooltip" present
   - Keyboard trigger works
   - Screen reader compatible
   - Focus management proper

**If Fails:**
- Check React import at top of test file
- Verify AITooltip component exports
- Test performance with real timing
- Check insight fetching logic
- Validate error state rendering
- Review positioning algorithm

---

### Phase 4: Integration Test Validation

#### 4.1 AI Ask Command Integration
```bash
npm test -- tests/integration/ai-ask.spec.ts --verbose
```

**Expected Result:**
- ✅ 24/24 tests pass
- ✅ End-to-end workflow functional
- ✅ All providers work

**Validation Points:**
1. **Basic Functionality:**
   - Command executes correctly
   - Questions parsed properly
   - AI responses returned
   - Output formatted correctly

2. **Context Handling:**
   - Kubectl output included in context
   - Cluster context attached
   - Resource context accurate
   - Context size reasonable

3. **Provider Support:**
   - Anthropic provider works
   - OpenAI provider works
   - Azure provider works (if configured)
   - Ollama provider works (if configured)

4. **Streaming:**
   - Streaming responses display correctly
   - Progress indication shown
   - Can be interrupted
   - Error mid-stream handled

5. **Caching:**
   - Responses cached appropriately
   - Cache hits fast
   - Cache invalidation works

**If Fails:**
- Check command registration in index.ts
- Verify Args/ParsedOptions types
- Test with each provider separately
- Check provider factory initialization
- Validate streaming iterator logic
- Review cache integration

---

#### 4.2 Context Menu Integration
```bash
npm test -- tests/integration/context-menu-integration.spec.ts --verbose
```

**Expected Result:**
- ✅ 24/24 tests pass (including previously failing 2)
- ✅ Concurrency control working
- ✅ Cancellation functional

**Validation Points:**
1. **End-to-End Flows:**
   - Ask AI flow complete
   - Debug flow functional
   - Explain flow works
   - All actions trigger correctly

2. **Tooltip Integration:**
   - Tooltip appears on hover
   - Insight loaded correctly
   - Caching reduces latency
   - Performance acceptable

3. **Concurrency Control (Previously Failing):**
   - ⚠️ CRITICAL: Max 3 concurrent requests
   - Queue overflow handled
   - Request priority respected
   - Completion callbacks correct

4. **Cancellation (Previously Failing):**
   - ⚠️ CRITICAL: Requests can be cancelled
   - AbortController working
   - Cleanup happens properly
   - No memory leaks

5. **Error Handling:**
   - kubectl errors graceful
   - AI errors handled
   - Timeout errors shown
   - Network errors fallback

**If Fails:**
- Check request queue implementation
- Verify AbortController integration
- Test concurrency limits explicitly
- Review cancellation logic
- Validate error propagation
- Check cleanup on unmount

---

### Phase 5: Coverage Validation

#### 5.1 Generate Coverage Report
```bash
npm run test:coverage
```

**Expected Result:**
- ✅ >80% statement coverage
- ✅ >80% branch coverage
- ✅ >80% function coverage
- ✅ >80% line coverage

#### 5.2 Review Coverage Report
```bash
open coverage/lcov-report/index.html
```

**Review Checklist:**

**Core Services:**
- [ ] cache-manager.ts: >80% coverage
- [ ] cluster-data-collector.ts: >80% coverage
- [ ] insight-generator.ts: >80% coverage (NEW)
- [ ] context-menu-service.ts: >80% coverage

**AI Providers:**
- [ ] ai-provider.ts: 100% (baseline)
- [ ] anthropic-provider.ts: >80% (currently 12%)
- [ ] openai-provider.ts: >80% (currently 3%)
- [ ] azure-provider.ts: >80% (currently 2%)
- [ ] ollama-provider.ts: >80% (currently 2%)
- [ ] provider-factory.ts: >80% (currently 28%)

**Commands:**
- [ ] ai-ask.ts: >80% (currently 38%)
- [ ] ai-config.ts: >80%
- [ ] ai-create.ts: >80%
- [ ] ai-debug.ts: >80%
- [ ] ai-context-menu.ts: >80%

**UI Components:**
- [ ] AIContextMenu.tsx: >80%
- [ ] AITooltip.tsx: >80%
- [ ] AIChatSidebar.tsx: >70%
- [ ] AISettings.tsx: >70%
- [ ] ContextPanel.tsx: >70%
- [ ] MessageList.tsx: >70%

**Utilities:**
- [ ] config-loader.ts: >80% (currently 44%)

**If Coverage Below Target:**
1. Identify uncovered lines in HTML report
2. Write additional tests for uncovered paths
3. Focus on error handling branches
4. Test edge cases
5. Add integration tests for missing flows

---

### Phase 6: Performance Validation

#### 6.1 Run Performance-Critical Tests
```bash
npm test -- -t "performance requirement" --verbose
```

**Expected Result:**
- ✅ All performance tests pass
- ✅ No timeouts
- ✅ Consistent results

**Tests to Validate:**
1. **Tooltip Load Time:**
   - Test: "should load insight within 1 second (requirement)"
   - File: tests/ui/ResourceTooltip.spec.tsx
   - Requirement: <1000ms

2. **Insight Generation Time:**
   - Test: "should generate insight within 1 second (requirement)"
   - File: tests/services/insight-generator.spec.ts
   - Requirement: <1000ms

3. **Concurrent Request Handling:**
   - Test: "should limit concurrent AI requests"
   - File: tests/integration/context-menu-integration.spec.ts
   - Requirement: ≤3 concurrent

**Performance Measurement:**
```bash
# Run with real timers for accurate measurement
npm test -- --testTimeout=5000 -t "performance requirement"
```

**If Performance Tests Fail:**
1. Profile code with timing logs
2. Check for blocking I/O operations
3. Verify caching is working
4. Optimize prompt sizes
5. Consider parallel processing
6. Review AI provider latency

---

### Phase 7: Accessibility Validation

#### 7.1 Run Accessibility Tests
```bash
npm test -- -t "accessibility" --verbose
```

**Expected Result:**
- ✅ All accessibility tests pass
- ✅ ARIA attributes correct
- ✅ Keyboard navigation works

**Tests to Validate:**
1. **Context Menu Accessibility:**
   - ARIA roles (menu, menuitem)
   - Keyboard navigation (Tab, Arrow, Enter, Escape)
   - Focus management
   - Screen reader announcements

2. **Tooltip Accessibility:**
   - ARIA role="tooltip"
   - Keyboard trigger
   - Focus management
   - Screen reader compatibility

3. **Integration Accessibility:**
   - Keyboard-only workflows
   - Screen reader announcements
   - Focus traps avoided

**Manual Accessibility Testing:**
```bash
# Run in browser with screen reader
npm run watch:browser
# Test with:
# - VoiceOver (Mac)
# - NVDA (Windows)
# - JAWS (Windows)
# - Keyboard only (no mouse)
```

**If Accessibility Tests Fail:**
1. Check ARIA role assignments
2. Verify label associations
3. Test keyboard event handlers
4. Review focus management
5. Validate semantic HTML
6. Test with real screen readers

---

### Phase 8: Regression Testing

#### 8.1 Run Full Test Suite
```bash
npm test -- --verbose
```

**Expected Result:**
- ✅ 230/230 tests pass
- ✅ 8/8 test suites pass
- ✅ No regressions from fixes

#### 8.2 Regression Checklist

**Core Functionality:**
- [ ] AI completions still work
- [ ] All providers functional
- [ ] Caching still works
- [ ] Commands execute correctly
- [ ] UI components render

**After ESLint Fixes:**
- [ ] No broken imports
- [ ] No type errors
- [ ] No undefined references
- [ ] No async/await issues
- [ ] No promise handling problems

**After TypeScript Fixes:**
- [ ] Types match implementations
- [ ] Generic types correct
- [ ] Optional properties handled
- [ ] Union types work
- [ ] Type guards functional

**After Implementation Additions:**
- [ ] New code doesn't break existing
- [ ] Interfaces backward compatible
- [ ] Dependencies resolved correctly
- [ ] No circular dependencies
- [ ] Exports are correct

---

## Test Execution Scripts

### Quick Validation Script
```bash
#!/bin/bash
# validate-tests.sh

echo "🧪 Starting Test Validation..."

# Phase 1: Build
echo "📦 Phase 1: Building..."
npm run build || exit 1

# Phase 2: Unit Tests
echo "🔬 Phase 2: Unit Tests..."
npm run test:unit || exit 1

# Phase 3: UI Tests
echo "🎨 Phase 3: UI Tests..."
npm run test:ui || exit 1

# Phase 4: Integration Tests
echo "🔗 Phase 4: Integration Tests..."
npm run test:integration || exit 1

# Phase 5: Coverage
echo "📊 Phase 5: Coverage..."
npm run test:coverage || exit 1

# Phase 6: Performance
echo "⚡ Phase 6: Performance..."
npm test -- -t "performance requirement" || exit 1

# Phase 7: Accessibility
echo "♿ Phase 7: Accessibility..."
npm test -- -t "accessibility" || exit 1

echo "✅ All Validations Passed!"
```

### Individual Phase Scripts
```bash
# Unit tests only
npm run test:unit

# UI tests only
npm run test:ui

# Integration tests only
npm run test:integration

# Feature #3 tests only
npm run test:feature3

# Performance tests
npm test -- -t "performance requirement"

# Accessibility tests
npm test -- -t "accessibility"
```

---

## Debugging Failed Tests

### Common Issues and Solutions

#### Issue: React Import Error
**Symptom:** `ReferenceError: React is not defined`
**Solution:**
```typescript
// Add to top of test file
import React from 'react'
```

#### Issue: Module Not Found
**Symptom:** `Cannot find module '@/...'`
**Solution:**
1. Check jest.config.js moduleNameMapper
2. Verify tsconfig.json paths
3. Ensure file exports are correct
4. Run `npm run build`

#### Issue: Mock Not Working
**Symptom:** Test expects mock but gets real implementation
**Solution:**
1. Check mock defined before import
2. Verify jest.mock() path is correct
3. Clear mocks: `jest.clearAllMocks()`
4. Check setup.ts for global mocks

#### Issue: Async Timeout
**Symptom:** `Exceeded timeout of 30000ms`
**Solution:**
1. Check for missing await
2. Verify promise resolves
3. Add explicit timeout: `it('test', async () => {...}, 60000)`
4. Check for infinite loops

#### Issue: Type Error
**Symptom:** `Type 'X' is not assignable to type 'Y'`
**Solution:**
1. Check TypeScript compilation: `npx tsc --noEmit`
2. Update type definitions
3. Check generic type parameters
4. Verify imports are correct

#### Issue: Performance Test Failing
**Symptom:** `Expected: <= 1000, Received: 1234`
**Solution:**
1. Profile code with timing logs
2. Check caching is working
3. Mock external services
4. Reduce data size in tests
5. Use fake timers if appropriate

---

## Success Criteria Summary

### Test Metrics
- ✅ 230/230 tests passing (100%)
- ✅ 8/8 test suites passing (100%)
- ✅ >80% code coverage (all files)
- ✅ 0 failing tests
- ✅ 0 skipped tests

### Performance Metrics
- ✅ Tooltip load time: <1000ms
- ✅ Insight generation: <1000ms
- ✅ Max concurrent requests: 3
- ✅ Test execution time: <15s

### Quality Metrics
- ✅ 0 TypeScript errors
- ✅ 0 ESLint errors
- ✅ 0 compiler warnings
- ✅ 0 test warnings
- ✅ All accessibility tests passing

### Coverage Metrics
```
Statement Coverage:  >80%
Branch Coverage:     >80%
Function Coverage:   >80%
Line Coverage:       >80%
```

---

## Reporting

### Test Results Report Template
```markdown
# Test Validation Results - [Date]

## Summary
- Tests Run: X/230
- Tests Passed: X
- Tests Failed: X
- Coverage: X%

## Detailed Results

### Unit Tests
- ai-provider: ✅ 17/17
- cache-manager: ✅ 22/22
- cluster-data-collector: ✅ 24/24
- insight-generator: ✅ 50/50

### UI Tests
- ContextMenu: ✅ 40/40
- ResourceTooltip: ✅ 45/45

### Integration Tests
- ai-ask: ✅ 24/24
- context-menu-integration: ✅ 24/24

## Coverage Report
[Link to HTML report]

## Issues Found
[List any issues]

## Recommendations
[Any recommendations]
```

---

## Next Steps After Validation

### If All Tests Pass
1. ✅ Document test results
2. ✅ Update README with test status
3. ✅ Create git commit with all fixes
4. ✅ Push to repository
5. ✅ Create pull request
6. ✅ Request code review

### If Tests Fail
1. ⚠️ Document failing tests
2. ⚠️ Categorize failures (unit/integration/ui)
3. ⚠️ Prioritize critical failures
4. ⚠️ Create bug reports
5. ⚠️ Fix issues systematically
6. ⚠️ Re-run validation

---

## Contact and Support

**Test Engineer:** Available for questions
**Documentation:**
- tests/README.md - Comprehensive test guide
- tests/QUICK-START.md - Quick reference
- TEST-BASELINE-REPORT.md - Current status

**Resources:**
- Jest Documentation: https://jestjs.io/
- React Testing Library: https://testing-library.com/
- Testing Best Practices: https://kentcdodds.com/blog

---

**Document Version:** 1.0
**Last Updated:** 2025-12-17
**Status:** Ready for Use
