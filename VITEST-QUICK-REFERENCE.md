# Vitest Quick Reference

A one-page reference for Vitest testing in Kui.

## Commands

```bash
# Run all tests
npm run test:vitest

# Watch mode
npm run test:vitest:watch

# UI mode
npm run test:vitest:ui

# Coverage (when available)
npm run test:coverage

# Run specific file
npx vitest run path/to/file.vitest.test.ts

# Run specific test
npx vitest run --testNamePattern="test name"

# Debug
npx vitest --inspect-brk
```

## Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('Feature', () => {
  beforeEach(() => {
    // Setup before each test
  })

  afterEach(() => {
    // Cleanup after each test
  })

  it('should do something', () => {
    // Arrange
    const input = 'test'

    // Act
    const result = input.toUpperCase()

    // Assert
    expect(result).toBe('TEST')
  })
})
```

## Imports

```typescript
// With globals enabled (Kui default)
describe('test', () => {
  it('works', () => {
    expect(true).toBe(true)
  })
})

// Or explicit imports
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
```

## Mocking

```typescript
import { vi } from 'vitest'

// Mock function
const mockFn = vi.fn()
mockFn.mockReturnValue('value')
mockFn.mockResolvedValue('async')
mockFn.mockRejectedValue(new Error())

// Mock module
vi.mock('./module', () => ({
  export: vi.fn()
}))

// Spy
const spy = vi.spyOn(obj, 'method')
spy.mockReturnValue('value')
spy.mockRestore()

// Timers
vi.useFakeTimers()
vi.advanceTimersByTime(1000)
vi.runAllTimers()
vi.useRealTimers()

// Clear mocks
vi.clearAllMocks()
vi.resetAllMocks()
vi.restoreAllMocks()
```

## React Components

```typescript
import { renderWithProviders, screen, userEvent } from '../../test-utils'

it('should render and handle click', async () => {
  const user = userEvent.setup()
  const mockOnClick = vi.fn()

  renderWithProviders(<Button onClick={mockOnClick} label="Click" />)

  expect(screen.getByText('Click')).toBeInTheDocument()

  await user.click(screen.getByRole('button'))

  expect(mockOnClick).toHaveBeenCalledTimes(1)
})
```

## Common Matchers

```typescript
// Equality
expect(value).toBe(expected)              // ===
expect(value).toEqual(expected)           // Deep equality
expect(value).toStrictEqual(expected)     // Strict deep equality

// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeUndefined()
expect(value).toBeDefined()

// Numbers
expect(value).toBeGreaterThan(3)
expect(value).toBeLessThan(5)
expect(value).toBeCloseTo(0.3)

// Strings
expect(string).toContain('substring')
expect(string).toMatch(/regex/)

// Arrays
expect(array).toContain(item)
expect(array).toHaveLength(3)

// Objects
expect(obj).toHaveProperty('key')
expect(obj).toHaveProperty('key', value)

// Functions
expect(fn).toHaveBeenCalled()
expect(fn).toHaveBeenCalledWith('arg')
expect(fn).toHaveBeenCalledTimes(3)

// Exceptions
expect(() => fn()).toThrow()
expect(() => fn()).toThrow('error')
expect(() => fn()).toThrow(Error)

// Async
await expect(promise).resolves.toBe(value)
await expect(promise).rejects.toThrow()

// DOM (with @testing-library/jest-dom)
expect(element).toBeInTheDocument()
expect(element).toHaveTextContent('text')
expect(element).toBeVisible()
expect(element).toBeDisabled()
```

## Async Testing

```typescript
// Async/await
it('should handle async', async () => {
  const result = await fetchData()
  expect(result).toBeDefined()
})

// Promises
it('should handle promises', async () => {
  await expect(Promise.resolve('value')).resolves.toBe('value')
  await expect(Promise.reject('error')).rejects.toBe('error')
})

// Wait for condition
import { waitFor } from '@testing-library/react'

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})
```

## Test Utilities

```typescript
import {
  // Render helpers
  renderWithProviders,
  screen,
  userEvent,

  // Mock helpers
  createMockTauriEnvironment,
  createMockIpcRenderer,
  createMockCommandTree,

  // Utilities
  sleep,
  flushPromises
} from '../../test-utils'

// Mock Tauri
const tauri = createMockTauriEnvironment()
tauri.mockInvoke.mockResolvedValue({ success: true })
tauri.cleanup() // in afterEach

// Mock IPC
const ipc = createMockIpcRenderer()
ipc.invoke.mockResolvedValue({ data: 'test' })

// Utilities
await sleep(1000)
await flushPromises()
```

## Conditional Tests

```typescript
it.skip('skip this test', () => {})
it.only('run only this test', () => {})
it.todo('implement this later')

it.concurrent('run in parallel 1', async () => {})
it.concurrent('run in parallel 2', async () => {})
```

## Parameterized Tests

```typescript
it.each([
  [1, 2],
  [2, 4],
  [3, 6]
])('should multiply %i by 2 to get %i', (input, expected) => {
  expect(input * 2).toBe(expected)
})
```

## Jest to Vitest Migration

```typescript
// Replace imports
import { describe, it, expect, vi } from 'vitest'  // was: jest

// Replace jest with vi
vi.fn()                // was: jest.fn()
vi.mock()              // was: jest.mock()
vi.spyOn()             // was: jest.spyOn()
vi.useFakeTimers()     // was: jest.useFakeTimers()
vi.clearAllMocks()     // was: jest.clearAllMocks()
```

## File Naming

```bash
# Vitest tests (picked up by Vitest)
*.vitest.test.ts
*.vitest.spec.ts
*.vitest.test.tsx
*.vitest.spec.tsx

# Jest tests (ignored by Vitest)
*.test.ts
*.spec.ts
```

## Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',        // Browser-like environment
    globals: true,               // No imports needed
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.vitest.{test,spec}.{ts,tsx}']
  }
})
```

## Debugging

```typescript
// Print DOM
screen.debug()

// Use debugger
it('should debug', () => {
  debugger  // Add breakpoint here
  expect(true).toBe(true)
})

// Run with inspector
// npx vitest --inspect-brk
```

## Common Patterns

### Component Test
```typescript
it('should render button', () => {
  renderWithProviders(<Button label="Click" />)
  expect(screen.getByText('Click')).toBeInTheDocument()
})
```

### User Interaction
```typescript
it('should handle click', async () => {
  const user = userEvent.setup()
  const mockFn = vi.fn()

  renderWithProviders(<Button onClick={mockFn} />)
  await user.click(screen.getByRole('button'))

  expect(mockFn).toHaveBeenCalled()
})
```

### Async Loading
```typescript
it('should load data', async () => {
  renderWithProviders(<DataLoader />)

  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  })
})
```

### Mock Module
```typescript
vi.mock('./api', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'test' })
}))

it('should fetch data', async () => {
  const result = await fetchData()
  expect(result.data).toBe('test')
})
```

## Resources

- **Setup Guide**: [VITEST-SETUP.md](./VITEST-SETUP.md)
- **Migration Guide**: [VITEST-MIGRATION-GUIDE.md](./VITEST-MIGRATION-GUIDE.md)
- **Test Utils**: [test-utils/README.md](./test-utils/README.md)
- **Test Template**: [test-utils/test-template.vitest.test.ts](./test-utils/test-template.vitest.test.ts)
- **Examples**:
  - Core: [packages/core/tests/tauri-bridge.vitest.test.ts](./packages/core/tests/tauri-bridge.vitest.test.ts)
  - React: [packages/react/tests/example-component.vitest.test.tsx](./packages/react/tests/example-component.vitest.test.tsx)

---

**Vitest**: Fast, modern test runner | **Kui Version**: 13.1.0 | **Last Updated**: 2025-12-17
