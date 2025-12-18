# Vitest Setup Guide for Kui

This guide explains how to use Vitest for testing in the Kui project.

## Overview

Vitest is a modern, fast test runner built on Vite. It provides:

- **Speed**: 2-10x faster than Jest
- **ESM Support**: Native ES modules support
- **Vite Integration**: Uses the same config as Vite
- **Jest Compatibility**: Drop-in replacement for Jest API
- **Watch Mode**: Smart and fast watch mode
- **Coverage**: Built-in code coverage via v8 or istanbul
- **UI**: Beautiful web-based test UI
- **Concurrent by Default**: Tests run in parallel

## Installation

Vitest and related dependencies are already installed. If you need to reinstall:

```bash
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm run test:vitest

# Run tests in watch mode (reruns on file changes)
npm run test:vitest:watch

# Run tests with UI
npm run test:vitest:ui

# Run tests with coverage
npm run test:coverage

# Run tests with coverage and UI
npm run test:coverage:ui
```

### Advanced Commands

```bash
# Run specific test file
npx vitest run packages/core/tests/tauri-bridge.vitest.test.ts

# Run tests matching pattern
npx vitest run --testNamePattern="Runtime Detection"

# Run tests in specific directory
npx vitest run packages/core

# Run with debugging
npx vitest --inspect-brk

# Update snapshots
npx vitest run -u
```

## Configuration

The Vitest configuration is in `/Users/elad/PROJ/kui/vitest.config.ts`.

Key settings:

- **Environment**: `jsdom` (browser-like environment)
- **Globals**: Enabled (use `describe`, `it`, `expect` without imports)
- **Coverage Threshold**: 60% for all metrics
- **Test Timeout**: 10 seconds
- **Workers**: 50% of CPU cores

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest'

describe('Feature Name', () => {
  it('should do something', () => {
    expect(1 + 1).toBe(2)
  })
})
```

### Setup and Teardown

```typescript
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'

describe('Feature with Setup', () => {
  beforeAll(() => {
    // Runs once before all tests
  })

  beforeEach(() => {
    // Runs before each test
  })

  afterEach(() => {
    // Runs after each test
  })

  afterAll(() => {
    // Runs once after all tests
  })

  it('should test with setup', () => {
    expect(true).toBe(true)
  })
})
```

### Mocking with Vitest

```typescript
import { describe, it, expect, vi } from 'vitest'

// Mock a module
vi.mock('./my-module', () => ({
  myFunction: vi.fn().mockReturnValue('mocked value')
}))

// Mock a function
const mockFn = vi.fn()
mockFn.mockReturnValue('value')
mockFn.mockResolvedValue('async value')
mockFn.mockRejectedValue(new Error('error'))

// Spy on a method
const spy = vi.spyOn(object, 'method')

// Assert on mocks
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith('arg')
expect(mockFn).toHaveBeenCalledTimes(3)
```

### Testing React Components

```typescript
import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen, userEvent } from '../../test-utils'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    renderWithProviders(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should handle user interaction', async () => {
    const user = userEvent.setup()
    const mockOnClick = vi.fn()

    renderWithProviders(<MyComponent onClick={mockOnClick} />)

    const button = screen.getByRole('button')
    await user.click(button)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })
})
```

### Testing Async Code

```typescript
import { describe, it, expect } from 'vitest'

describe('Async Tests', () => {
  it('should handle promises', async () => {
    const result = await Promise.resolve('value')
    expect(result).toBe('value')
  })

  it('should handle async/await', async () => {
    const data = await fetchData()
    expect(data).toBeDefined()
  })

  it('should handle rejections', async () => {
    await expect(Promise.reject('error')).rejects.toBe('error')
  })
})
```

## Test Utilities

Kui provides custom test utilities in `/Users/elad/PROJ/kui/test-utils/`.

### Render Helpers

```typescript
import { renderWithProviders, screen } from '../../test-utils'

// Renders component with all necessary providers
const { container } = renderWithProviders(<MyComponent />, {
  theme: 'dark',
  initialState: {}
})
```

### Mock Helpers

```typescript
import {
  createMockTauriEnvironment,
  createMockIpcRenderer,
  createMockCommandTree,
  sleep,
  flushPromises
} from '../../test-utils'

// Mock Tauri runtime
const { mockInvoke, cleanup } = createMockTauriEnvironment()
mockInvoke.mockResolvedValue({ success: true })
cleanup() // Clean up after test

// Mock IPC
const ipc = createMockIpcRenderer()
ipc.invoke('channel', data)

// Sleep utility
await sleep(1000) // Wait 1 second

// Flush promises
await flushPromises() // Wait for all pending promises
```

## Custom Matchers

Kui extends Vitest with custom matchers:

```typescript
// From vitest.setup.ts
expect(50).toBeWithinRange(0, 100)

// From @testing-library/jest-dom
expect(element).toBeInTheDocument()
expect(element).toHaveTextContent('text')
expect(element).toBeVisible()
expect(element).toBeDisabled()
expect(input).toHaveValue('value')
```

## Coverage

### Generating Coverage

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/index.html
```

### Coverage Configuration

Coverage thresholds are set in `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    lines: 60,
    functions: 60,
    branches: 60,
    statements: 60
  }
}
```

### Coverage Reports

Coverage is generated in multiple formats:

- `coverage/index.html` - HTML report (viewable in browser)
- `coverage/lcov.info` - LCOV format (for CI/CD)
- `coverage/coverage-summary.json` - JSON summary

## Migration from Jest

If you're migrating tests from Jest to Vitest:

### API Compatibility

Vitest is API-compatible with Jest. Most tests work without changes:

```typescript
// Jest
import { describe, it, expect, jest } from '@jest/globals'

// Vitest (use 'vi' instead of 'jest')
import { describe, it, expect, vi } from 'vitest'
```

### Key Differences

1. **Mock Functions**: Use `vi.fn()` instead of `jest.fn()`
2. **Timers**: Use `vi.useFakeTimers()` instead of `jest.useFakeTimers()`
3. **Spies**: Use `vi.spyOn()` instead of `jest.spyOn()`
4. **Modules**: Use `vi.mock()` instead of `jest.mock()`
5. **Globals**: Can be enabled in config (already enabled for Kui)

### Migration Checklist

- [ ] Replace `jest` with `vi` in imports
- [ ] Replace `jest.fn()` with `vi.fn()`
- [ ] Replace `jest.mock()` with `vi.mock()`
- [ ] Replace `jest.spyOn()` with `vi.spyOn()`
- [ ] Update setup files to use Vitest
- [ ] Update configuration files
- [ ] Run tests to verify they pass

## Best Practices

### 1. Test Organization

```typescript
describe('Feature', () => {
  describe('Subfeature', () => {
    it('should do specific thing', () => {
      // Test implementation
    })
  })
})
```

### 2. Descriptive Test Names

```typescript
// Good
it('should increment counter when increment button is clicked', () => {})

// Bad
it('increments', () => {})
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should update user name', () => {
  // Arrange
  const user = { name: 'John' }

  // Act
  const updated = updateUserName(user, 'Jane')

  // Assert
  expect(updated.name).toBe('Jane')
})
```

### 4. One Assertion per Test (when possible)

```typescript
// Good
it('should set name', () => {
  expect(user.name).toBe('John')
})

it('should set age', () => {
  expect(user.age).toBe(30)
})

// Acceptable (related assertions)
it('should update user data', () => {
  expect(user.name).toBe('John')
  expect(user.age).toBe(30)
})
```

### 5. Test Isolation

```typescript
describe('Counter', () => {
  let counter: Counter

  beforeEach(() => {
    counter = new Counter() // Fresh instance for each test
  })

  it('should start at zero', () => {
    expect(counter.value).toBe(0)
  })
})
```

### 6. Avoid Testing Implementation Details

```typescript
// Good - test behavior
it('should display error message when form is invalid', () => {
  renderWithProviders(<Form />)
  const submitButton = screen.getByRole('button', { name: 'Submit' })
  await user.click(submitButton)
  expect(screen.getByText('Invalid form')).toBeInTheDocument()
})

// Bad - test implementation
it('should call setError with error message', () => {
  const setError = vi.fn()
  renderWithProviders(<Form setError={setError} />)
  // Testing implementation, not behavior
})
```

## Test Patterns

### Testing Hooks

```typescript
import { renderHook } from '@testing-library/react'

it('should update count', () => {
  const { result } = renderHook(() => useCounter())

  act(() => {
    result.current.increment()
  })

  expect(result.current.count).toBe(1)
})
```

### Testing Context

```typescript
import { renderWithProviders } from '../../test-utils'

it('should use theme from context', () => {
  renderWithProviders(<MyComponent />, {
    theme: 'dark'
  })

  const element = screen.getByTestId('themed-element')
  expect(element).toHaveAttribute('data-theme', 'dark')
})
```

### Testing Event Handlers

```typescript
import { renderWithProviders, screen, userEvent } from '../../test-utils'

it('should call onChange when input changes', async () => {
  const user = userEvent.setup()
  const mockOnChange = vi.fn()

  renderWithProviders(<Input onChange={mockOnChange} />)

  const input = screen.getByRole('textbox')
  await user.type(input, 'hello')

  expect(mockOnChange).toHaveBeenCalled()
})
```

## Debugging Tests

### 1. Use `screen.debug()`

```typescript
it('should render', () => {
  renderWithProviders(<MyComponent />)
  screen.debug() // Prints DOM to console
})
```

### 2. Use VSCode Debugger

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test:vitest:watch"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### 3. Use `--inspect-brk`

```bash
npx vitest --inspect-brk --no-file-parallelism
```

Then open `chrome://inspect` in Chrome.

### 4. Use `test.only()` and `test.skip()`

```typescript
it.only('should test only this one', () => {
  // Only this test runs
})

it.skip('should skip this test', () => {
  // This test is skipped
})
```

## Continuous Integration

### GitHub Actions Example

```yaml
- name: Run Vitest Tests
  run: npm run test:vitest

- name: Generate Coverage
  run: npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Troubleshooting

### Issue: Tests are slow

**Solution**:
- Reduce the number of workers: `npx vitest --maxWorkers=1`
- Check for heavy setup/teardown in `beforeEach`
- Use `vi.mocked()` to avoid expensive operations

### Issue: Module resolution errors

**Solution**:
- Check `resolve.alias` in `vitest.config.ts`
- Ensure TypeScript paths match Vitest aliases
- Run `npm run compile` to build TypeScript

### Issue: jsdom errors

**Solution**:
- Ensure tests don't require Node.js-specific APIs
- Use `happy-dom` instead: Change `environment: 'happy-dom'` in config
- Mock browser APIs in `vitest.setup.ts`

### Issue: Coverage not generated

**Solution**:
- Ensure `@vitest/coverage-v8` is installed
- Check `coverage.include` patterns in config
- Run with `--coverage.enabled` flag

## Performance Tips

1. **Use `vi.mock()` for expensive modules**: Mock heavy dependencies
2. **Parallelize tests**: Vitest runs tests in parallel by default
3. **Use `test.concurrent()`**: For independent async tests
4. **Optimize setup/teardown**: Avoid repeated expensive operations
5. **Use coverage selectively**: Only generate coverage when needed

## Examples

### Complete Test File Example

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderWithProviders, screen, userEvent } from '../../test-utils'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  let mockOnClick: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnClick = vi.fn()
  })

  it('should render with default props', () => {
    renderWithProviders(<MyComponent onClick={mockOnClick} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should handle click events', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MyComponent onClick={mockOnClick} />)

    const button = screen.getByRole('button')
    await user.click(button)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('should match snapshot', () => {
    const { container } = renderWithProviders(<MyComponent onClick={mockOnClick} />)
    expect(container.firstChild).toMatchSnapshot()
  })
})
```

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Library Documentation](https://testing-library.com)
- [Vitest API Reference](https://vitest.dev/api/)
- [Migration from Jest](https://vitest.dev/guide/migration.html)

## Support

For questions or issues with Vitest in Kui:

1. Check this documentation
2. Review example tests in `packages/core/tests/` and `packages/react/tests/`
3. Check the [Vitest GitHub Issues](https://github.com/vitest-dev/vitest/issues)
4. Ask in Kui project discussions

---

**Last Updated**: 2025-12-17
