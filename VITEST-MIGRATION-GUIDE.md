# Migration Guide: Jest to Vitest

This guide helps you migrate existing Jest tests to Vitest in the Kui project.

## Overview

Vitest is designed to be a drop-in replacement for Jest, with better performance and modern features. Most Jest tests work with minimal changes.

## Quick Start Migration

### 1. File Naming Convention

Rename your test files to use the `.vitest.test.ts` or `.vitest.spec.ts` suffix:

```bash
# Before
my-component.test.ts
my-feature.spec.ts

# After
my-component.vitest.test.ts
my-feature.vitest.spec.ts
```

This allows Jest and Vitest tests to coexist during migration.

### 2. Update Imports

Replace Jest imports with Vitest equivalents:

```typescript
// Before (Jest)
import { describe, it, expect, jest } from '@jest/globals'

// After (Vitest)
import { describe, it, expect, vi } from 'vitest'
```

Or, if you have globals enabled (already configured in Kui):

```typescript
// Before and After (no imports needed)
describe('test suite', () => {
  it('should work', () => {
    expect(true).toBe(true)
  })
})
```

### 3. Replace `jest` with `vi`

The main difference is that Vitest uses `vi` instead of `jest`:

```typescript
// Before (Jest)
const mockFn = jest.fn()
jest.mock('./module')
jest.spyOn(obj, 'method')
jest.useFakeTimers()

// After (Vitest)
const mockFn = vi.fn()
vi.mock('./module')
vi.spyOn(obj, 'method')
vi.useFakeTimers()
```

## Detailed Migration Steps

### Step 1: Setup Files

**Before (Jest):**
```javascript
// jest.setup.js
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn()
}
```

**After (Vitest):**
```typescript
// vitest.setup.ts (already created)
import { vi } from 'vitest'

global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn()
}
```

### Step 2: Mock Functions

**Before (Jest):**
```typescript
const mockCallback = jest.fn()
mockCallback.mockReturnValue('value')
mockCallback.mockResolvedValue('async value')
mockCallback.mockImplementation((x) => x * 2)

expect(mockCallback).toHaveBeenCalled()
expect(mockCallback).toHaveBeenCalledWith('arg')
expect(mockCallback).toHaveBeenCalledTimes(3)
```

**After (Vitest):**
```typescript
const mockCallback = vi.fn()
mockCallback.mockReturnValue('value')
mockCallback.mockResolvedValue('async value')
mockCallback.mockImplementation((x) => x * 2)

expect(mockCallback).toHaveBeenCalled()
expect(mockCallback).toHaveBeenCalledWith('arg')
expect(mockCallback).toHaveBeenCalledTimes(3)
```

### Step 3: Module Mocks

**Before (Jest):**
```typescript
jest.mock('./my-module', () => ({
  myFunction: jest.fn()
}))
```

**After (Vitest):**
```typescript
vi.mock('./my-module', () => ({
  myFunction: vi.fn()
}))
```

### Step 4: Spies

**Before (Jest):**
```typescript
const spy = jest.spyOn(object, 'method')
spy.mockReturnValue('value')
spy.mockRestore()
```

**After (Vitest):**
```typescript
const spy = vi.spyOn(object, 'method')
spy.mockReturnValue('value')
spy.mockRestore()
```

### Step 5: Timers

**Before (Jest):**
```typescript
jest.useFakeTimers()
jest.advanceTimersByTime(1000)
jest.runAllTimers()
jest.clearAllTimers()
jest.useRealTimers()
```

**After (Vitest):**
```typescript
vi.useFakeTimers()
vi.advanceTimersByTime(1000)
vi.runAllTimers()
vi.clearAllTimers()
vi.useRealTimers()
```

### Step 6: Clear/Reset Mocks

**Before (Jest):**
```typescript
jest.clearAllMocks()
jest.resetAllMocks()
jest.restoreAllMocks()
mockFn.mockClear()
mockFn.mockReset()
mockFn.mockRestore()
```

**After (Vitest):**
```typescript
vi.clearAllMocks()
vi.resetAllMocks()
vi.restoreAllMocks()
mockFn.mockClear()
mockFn.mockReset()
mockFn.mockRestore()
```

## Common Patterns

### Testing React Components

**Before (Jest):**
```typescript
import { render, screen } from '@testing-library/react'

describe('MyComponent', () => {
  it('should render', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

**After (Vitest):**
```typescript
import { renderWithProviders, screen } from '../../test-utils'

describe('MyComponent', () => {
  it('should render', () => {
    renderWithProviders(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Testing Async Code

**Before and After (Same):**
```typescript
it('should handle async operations', async () => {
  const result = await fetchData()
  expect(result).toBeDefined()
})

it('should handle promise rejections', async () => {
  await expect(failingPromise()).rejects.toThrow('error')
})
```

### Snapshot Testing

**Before (Jest):**
```typescript
expect(component).toMatchSnapshot()
```

**After (Vitest):**
```typescript
expect(component).toMatchSnapshot()
// Same API, but snapshots are stored differently
```

## Breaking Changes and Differences

### 1. Dynamic Imports

**Jest:**
```typescript
const module = require('./module')
```

**Vitest:**
```typescript
const module = await import('./module')
// Vitest prefers ESM
```

### 2. Module Resolution

Vitest uses Vite's module resolution. Update your config if needed:

```typescript
// vitest.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@/': new URL('./src/', import.meta.url).pathname
    }
  }
})
```

### 3. Coverage

**Jest:**
```bash
npm run test -- --coverage
```

**Vitest:**
```bash
npm run test:coverage
```

Note: Coverage is currently disabled in Kui due to Node.js v24 compatibility issues.

### 4. Watch Mode

**Jest:**
```bash
npm run test -- --watch
```

**Vitest:**
```bash
npm run test:vitest:watch
```

## Migration Checklist

Use this checklist when migrating a test file:

- [ ] Rename file to `.vitest.test.ts` or `.vitest.spec.ts`
- [ ] Update imports: `@jest/globals` → `vitest`
- [ ] Replace all `jest` with `vi`
- [ ] Replace all `jest.fn()` with `vi.fn()`
- [ ] Replace all `jest.mock()` with `vi.mock()`
- [ ] Replace all `jest.spyOn()` with `vi.spyOn()`
- [ ] Replace all `jest.useFakeTimers()` with `vi.useFakeTimers()`
- [ ] Replace all `jest.clearAllMocks()` with `vi.clearAllMocks()`
- [ ] Update module mocks if using `require()`
- [ ] Run the test to verify it passes
- [ ] Check that coverage is included (if applicable)

## Example Migration

### Before (Jest)

```typescript
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { CacheManager } from '../cache-manager'

describe('CacheManager', () => {
  let cacheManager: CacheManager
  let mockFetch: jest.Mock

  beforeEach(() => {
    cacheManager = new CacheManager()
    mockFetch = jest.fn()
    global.fetch = mockFetch
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should cache responses', () => {
    const key = 'test-key'
    const value = { data: 'test' }

    cacheManager.set(key, value)

    expect(cacheManager.get(key)).toEqual(value)
  })

  it('should expire after TTL', async () => {
    jest.useFakeTimers()
    const key = 'test-key'
    const value = { data: 'test' }

    cacheManager.set(key, value, 1000)

    jest.advanceTimersByTime(1001)

    expect(cacheManager.get(key)).toBeUndefined()

    jest.useRealTimers()
  })
})
```

### After (Vitest)

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CacheManager } from '../cache-manager'

describe('CacheManager', () => {
  let cacheManager: CacheManager
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    cacheManager = new CacheManager()
    mockFetch = vi.fn()
    global.fetch = mockFetch
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should cache responses', () => {
    const key = 'test-key'
    const value = { data: 'test' }

    cacheManager.set(key, value)

    expect(cacheManager.get(key)).toEqual(value)
  })

  it('should expire after TTL', async () => {
    vi.useFakeTimers()
    const key = 'test-key'
    const value = { data: 'test' }

    cacheManager.set(key, value, 1000)

    vi.advanceTimersByTime(1001)

    expect(cacheManager.get(key)).toBeUndefined()

    vi.useRealTimers()
  })
})
```

## Automated Migration

For bulk migrations, use find and replace:

### VS Code Find and Replace

1. Open Find in Files (Cmd/Ctrl + Shift + F)
2. Enable regex mode
3. Use these patterns:

**Replace imports:**
```regex
Find: import \{ (.*?), jest \} from '@jest/globals'
Replace: import { $1, vi } from 'vitest'
```

**Replace jest with vi:**
```regex
Find: \bjest\b
Replace: vi
```

**Rename files:**
```bash
# In terminal
find . -name "*.test.ts" -not -path "*/node_modules/*" | while read file; do
  mv "$file" "${file%.test.ts}.vitest.test.ts"
done
```

## Testing Your Migration

After migrating a test file:

1. **Run the specific test:**
   ```bash
   npx vitest run path/to/test.vitest.test.ts
   ```

2. **Run in watch mode:**
   ```bash
   npx vitest path/to/test.vitest.test.ts
   ```

3. **Check coverage (when available):**
   ```bash
   npm run test:coverage
   ```

4. **Run with UI:**
   ```bash
   npm run test:vitest:ui
   ```

## Troubleshooting

### Issue: Test not found

**Problem:** Vitest doesn't find your test file.

**Solution:** Ensure the file has `.vitest.test.ts` or `.vitest.spec.ts` suffix and is in the correct directory.

### Issue: Module not found

**Problem:** Import paths not resolving correctly.

**Solution:** Check `resolve.alias` in `vitest.config.ts` matches your `tsconfig.json` paths.

### Issue: Global not defined

**Problem:** `describe`, `it`, `expect` not defined.

**Solution:** Either:
1. Import them: `import { describe, it, expect } from 'vitest'`
2. Or ensure `globals: true` in `vitest.config.ts` (already configured)

### Issue: Mock not working

**Problem:** `vi.mock()` not working as expected.

**Solution:**
1. Ensure mock is at the top of the file (before imports)
2. Use `vi.hoisted()` for complex mocks
3. Check module path is correct

### Issue: Timer not advancing

**Problem:** `vi.advanceTimersByTime()` not working.

**Solution:**
1. Ensure `vi.useFakeTimers()` is called before test
2. Call `vi.useRealTimers()` in cleanup
3. Use `await vi.advanceTimersByTimeAsync()` for async timers

## Performance Benefits

After migration, you should see:

- **2-10x faster test execution** (especially with large suites)
- **Faster watch mode** (smart re-run on file changes)
- **Better parallel execution** (tests run concurrently by default)
- **Faster startup** (no need to compile all files upfront)

## Gradual Migration Strategy

You don't need to migrate all tests at once:

1. **Phase 1:** Setup Vitest (✅ Complete)
   - Install dependencies
   - Create configuration
   - Create example tests

2. **Phase 2:** Migrate unit tests
   - Start with simple utility tests
   - Migrate one module at a time
   - Keep Jest tests running alongside

3. **Phase 3:** Migrate integration tests
   - Migrate component tests
   - Migrate API tests
   - Update CI/CD pipeline

4. **Phase 4:** Remove Jest
   - Once all tests migrated
   - Remove Jest dependencies
   - Update documentation

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Migration from Jest](https://vitest.dev/guide/migration.html)
- [Vitest API Reference](https://vitest.dev/api/)
- [Test Utils Documentation](./test-utils/README.md)
- [Vitest Setup Guide](./VITEST-SETUP.md)

## Support

If you encounter issues during migration:

1. Check this guide
2. Review [VITEST-SETUP.md](./VITEST-SETUP.md)
3. Look at example tests in `packages/core/tests/` and `packages/react/tests/`
4. Search [Vitest GitHub Issues](https://github.com/vitest-dev/vitest/issues)
5. Ask in Kui project discussions

---

**Last Updated**: 2025-12-17
