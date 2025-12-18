# Kui Test Utilities

This directory contains shared test utilities and helpers for Vitest tests in the Kui project.

## Overview

The test utilities provide:

- **Render Helpers**: Custom render functions for React components
- **Mock Helpers**: Utilities for mocking modules, functions, and Kui-specific objects
- **Test Template**: Comprehensive template showing all test patterns
- **Common Patterns**: Reusable patterns for Kui-specific testing scenarios

## Contents

- `render-helpers.tsx` - React component testing utilities
- `mock-helpers.ts` - Mocking utilities for Kui objects
- `test-template.vitest.test.ts` - Template showing all test patterns
- `index.ts` - Main entry point (exports all utilities)

## Usage

### Import Utilities

```typescript
// Import everything
import * from '../../test-utils'

// Import specific utilities
import { renderWithProviders, screen, userEvent } from '../../test-utils'
import { createMockTauriEnvironment, sleep } from '../../test-utils'
```

## Render Helpers

### `renderWithProviders`

Renders a React component with all necessary providers (theme, context, etc.).

```typescript
import { renderWithProviders, screen } from '../../test-utils'

it('should render component', () => {
  renderWithProviders(<MyComponent />)
  expect(screen.getByText('Hello')).toBeInTheDocument()
})

// With options
it('should render with theme', () => {
  renderWithProviders(<MyComponent />, {
    theme: 'dark',
    initialState: { user: 'test' }
  })
})
```

### `createMockCallbacks`

Creates multiple mock callbacks at once.

```typescript
import { createMockCallbacks } from '../../test-utils'

type Callbacks = {
  onClick: () => void
  onChange: (value: string) => void
}

const mocks = createMockCallbacks<Callbacks>(['onClick', 'onChange'])

renderWithProviders(<MyComponent onClick={mocks.onClick} onChange={mocks.onChange} />)

expect(mocks.onClick).toHaveBeenCalled()
```

### `waitForCondition`

Waits for a condition to become true.

```typescript
import { waitForCondition } from '../../test-utils'

await waitForCondition(
  () => screen.queryByText('Loaded') !== null,
  5000, // timeout
  50    // check interval
)
```

### `flushPromises`

Flushes all pending promises.

```typescript
import { flushPromises } from '../../test-utils'

doAsyncOperation()
await flushPromises()

// Now all promises have resolved
expect(screen.getByText('Complete')).toBeInTheDocument()
```

## Mock Helpers

### `createMockTauriEnvironment`

Creates a mock Tauri runtime environment.

```typescript
import { createMockTauriEnvironment } from '../../test-utils'

describe('Tauri Feature', () => {
  let tauri: ReturnType<typeof createMockTauriEnvironment>

  beforeEach(() => {
    tauri = createMockTauriEnvironment()
  })

  afterEach(() => {
    tauri.cleanup()
  })

  it('should invoke Tauri command', async () => {
    tauri.mockInvoke.mockResolvedValue({ result: 'success' })

    const result = await window.__TAURI__.core.invoke('my-command', { arg: 'value' })

    expect(result).toEqual({ result: 'success' })
    expect(tauri.mockInvoke).toHaveBeenCalledWith('my-command', { arg: 'value' })
  })
})
```

### `createMockIpcRenderer`

Creates a mock IPC renderer (Electron-style).

```typescript
import { createMockIpcRenderer } from '../../test-utils'

const ipc = createMockIpcRenderer()

ipc.invoke.mockResolvedValue({ data: 'test' })

const result = await ipc.invoke('my-channel', { arg: 'value' })

expect(result).toEqual({ data: 'test' })
expect(ipc.invoke).toHaveBeenCalledWith('my-channel', { arg: 'value' })
```

### `createMockKubectlResponse`

Creates a mock kubectl response.

```typescript
import { createMockKubectlResponse } from '../../test-utils'

const mockResponse = createMockKubectlResponse({
  name: 'my-pod',
  status: 'Running'
})

expect(mockResponse.kind).toBe('Table')
expect(mockResponse.body[0].name).toBe('my-pod')
```

### `createMockCommandTree`

Creates a mock command tree for testing command registration.

```typescript
import { createMockCommandTree } from '../../test-utils'

const commandTree = createMockCommandTree()

// Register a command
commandTree.listen('/my-command', async () => 'result')

// Find a command
const cmd = commandTree.find('/my-command')
expect(cmd).toBeDefined()
```

### `createMockExecOptions`

Creates mock exec options for command execution.

```typescript
import { createMockExecOptions } from '../../test-utils'

const execOptions = createMockExecOptions({
  tab: { uuid: 'custom-tab-id' }
})

expect(execOptions.tab.uuid).toBe('custom-tab-id')
```

### Utility Functions

```typescript
import { sleep, nextTick, flushPromises } from '../../test-utils'

// Wait for a specific time
await sleep(1000) // 1 second

// Wait for next event loop tick
await nextTick()

// Flush all pending promises
await flushPromises()
```

## Testing React Components

### Basic Component Test

```typescript
import { renderWithProviders, screen } from '../../test-utils'
import MyButton from './MyButton'

describe('MyButton', () => {
  it('should render with label', () => {
    renderWithProviders(<MyButton label="Click Me" />)
    expect(screen.getByText('Click Me')).toBeInTheDocument()
  })
})
```

### Component with Interactions

```typescript
import { renderWithProviders, screen, userEvent } from '../../test-utils'
import MyForm from './MyForm'

describe('MyForm', () => {
  it('should submit form', async () => {
    const user = userEvent.setup()
    const mockOnSubmit = vi.fn()

    renderWithProviders(<MyForm onSubmit={mockOnSubmit} />)

    await user.type(screen.getByLabelText('Name'), 'John Doe')
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(mockOnSubmit).toHaveBeenCalledWith({ name: 'John Doe' })
  })
})
```

### Component with State

```typescript
import { renderWithProviders, screen, userEvent } from '../../test-utils'
import Counter from './Counter'

describe('Counter', () => {
  it('should increment count', async () => {
    const user = userEvent.setup()

    renderWithProviders(<Counter />)

    expect(screen.getByText('Count: 0')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Increment' }))

    expect(screen.getByText('Count: 1')).toBeInTheDocument()
  })
})
```

## Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react'
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('should increment', () => {
    const { result } = renderHook(() => useCounter())

    expect(result.current.count).toBe(0)

    act(() => {
      result.current.increment()
    })

    expect(result.current.count).toBe(1)
  })
})
```

## Testing Async Operations

```typescript
import { renderWithProviders, screen, waitFor } from '../../test-utils'
import DataLoader from './DataLoader'

describe('DataLoader', () => {
  it('should load and display data', async () => {
    renderWithProviders(<DataLoader />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Data loaded')).toBeInTheDocument()
    })
  })
})
```

## Common Patterns

### Testing Command Handlers

```typescript
import { createMockCommandTree, createMockExecOptions } from '../../test-utils'

describe('MyCommand', () => {
  it('should register command', () => {
    const commandTree = createMockCommandTree()

    registerCommand(commandTree)

    expect(commandTree.listen).toHaveBeenCalledWith(
      '/my-command',
      expect.any(Function),
      expect.any(Object)
    )
  })

  it('should execute command', async () => {
    const execOptions = createMockExecOptions()
    const result = await myCommand({ command: 'my-command', execOptions })

    expect(result).toBeDefined()
  })
})
```

### Testing Tauri Commands

```typescript
import { createMockTauriEnvironment } from '../../test-utils'

describe('Tauri Command', () => {
  let tauri: ReturnType<typeof createMockTauriEnvironment>

  beforeEach(() => {
    tauri = createMockTauriEnvironment()
  })

  afterEach(() => {
    tauri.cleanup()
  })

  it('should call Tauri backend', async () => {
    tauri.mockInvoke.mockResolvedValue({ success: true })

    const result = await invokeTauriCommand('test-command', { arg: 'value' })

    expect(result.success).toBe(true)
    expect(tauri.mockInvoke).toHaveBeenCalledWith('test-command', { arg: 'value' })
  })
})
```

### Testing with Multiple Mocks

```typescript
import {
  createMockTauriEnvironment,
  createMockIpcRenderer,
  createMockCommandTree
} from '../../test-utils'

describe('Complex Feature', () => {
  let tauri: ReturnType<typeof createMockTauriEnvironment>
  let ipc: ReturnType<typeof createMockIpcRenderer>
  let commandTree: ReturnType<typeof createMockCommandTree>

  beforeEach(() => {
    tauri = createMockTauriEnvironment()
    ipc = createMockIpcRenderer()
    commandTree = createMockCommandTree()
  })

  afterEach(() => {
    tauri.cleanup()
  })

  it('should coordinate between systems', async () => {
    // Setup mocks
    tauri.mockInvoke.mockResolvedValue({ data: 'test' })
    ipc.invoke.mockResolvedValue({ result: 'success' })

    // Test your feature
    // ...
  })
})
```

## Best Practices

1. **Always clean up mocks**
   ```typescript
   afterEach(() => {
     vi.clearAllMocks()
     tauri.cleanup()
   })
   ```

2. **Use descriptive test names**
   ```typescript
   it('should update user name when form is submitted', () => {
     // Test implementation
   })
   ```

3. **Test behavior, not implementation**
   ```typescript
   // Good - tests user-facing behavior
   expect(screen.getByText('Success')).toBeInTheDocument()

   // Bad - tests implementation details
   expect(component.state.isSuccess).toBe(true)
   ```

4. **Isolate tests**
   ```typescript
   beforeEach(() => {
     // Fresh state for each test
   })
   ```

5. **Use testing-library queries properly**
   ```typescript
   // Preferred (accessibility-friendly)
   screen.getByRole('button', { name: 'Submit' })
   screen.getByLabelText('Email')

   // Avoid (implementation details)
   screen.getByClassName('btn-primary')
   ```

## Debugging Tips

### 1. Use `screen.debug()`

```typescript
it('should render', () => {
  renderWithProviders(<MyComponent />)
  screen.debug() // Prints DOM to console
})
```

### 2. Use `logRoles`

```typescript
import { logRoles } from '@testing-library/react'

it('should render', () => {
  const { container } = renderWithProviders(<MyComponent />)
  logRoles(container) // Shows all available roles
})
```

### 3. Use `waitFor` for debugging async issues

```typescript
await waitFor(() => {
  console.log('Current DOM:', screen.debug())
  expect(screen.getByText('Loaded')).toBeInTheDocument()
})
```

## Resources

- [Testing Library Documentation](https://testing-library.com)
- [Vitest API Reference](https://vitest.dev/api/)
- [React Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet/)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Examples

See the following files for complete examples:

- `test-template.vitest.test.ts` - Comprehensive test patterns
- `../packages/core/tests/tauri-bridge.vitest.test.ts` - Unit test example
- `../packages/react/tests/example-component.vitest.test.tsx` - React component test example

---

**Last Updated**: 2025-12-17
