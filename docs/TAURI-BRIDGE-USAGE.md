# Tauri Bridge Usage Guide

**Quick Reference for IPC Communication in Kui**

The Tauri Bridge provides a unified IPC (Inter-Process Communication) API that works seamlessly with both Electron and Tauri runtimes.

## Quick Start

### Import the Bridge

```typescript
import { getIpcRenderer } from '@kui-shell/core/src/main/tauri-bridge'
```

### Basic Usage

```typescript
// Get the IPC renderer (works with both Electron and Tauri)
const ipc = getIpcRenderer()

// Send a message
ipc.send('my-channel', { data: 'hello' })

// Invoke and wait for response
const result = await ipc.invoke('/exec/invoke', { command: 'ls' })

// Listen for events
ipc.on('my-event', (event, data) => {
  console.log('Received:', data)
})

// Listen once
ipc.once('my-event', (event, data) => {
  console.log('Received once:', data)
})

// Remove listener
ipc.removeListener('my-event', handler)
```

## Runtime Detection

### Check Current Runtime

```typescript
import {
  isTauriRuntime,
  isElectronRuntime,
  getRuntimeName
} from '@kui-shell/core/src/main/tauri-bridge'

console.log('Runtime:', getRuntimeName())  // 'Tauri' | 'Electron' | 'Unknown'

if (isTauriRuntime()) {
  // Tauri-specific code
}

if (isElectronRuntime()) {
  // Electron-specific code
}
```

### Using Capabilities API (Recommended for UI)

For broader runtime detection in UI components:

```typescript
import {
  inTauri,
  inElectron,
  inBrowser
} from '@kui-shell/core/mdist/api/Capabilities'

if (inBrowser()) {
  // Browser-only features
} else if (inElectron()) {
  // Desktop features (Electron)
} else if (inTauri()) {
  // Desktop features (Tauri)
}
```

## Supported IPC Channels

### Execution Commands

```typescript
// Execute a command
await ipc.invoke('/exec/invoke', {
  module: 'kubectl',
  fn: 'get',
  args: ['pods']
})
```

### Synchronous Messages

```typescript
// Send synchronous message
await ipc.invoke('synchronous-message', {
  operation: 'ping'
})
```

### Screenshot Capture

```typescript
// Capture page to clipboard
await ipc.invoke('capture-page-to-clipboard', null, {
  x: 0,
  y: 0,
  width: 800,
  height: 600
})
```

## Best Practices

### ✅ Do This

```typescript
// Import from the bridge
import { getIpcRenderer } from '@kui-shell/core/src/main/tauri-bridge'

// Get IPC instance
const ipc = getIpcRenderer()

// Use the unified API
await ipc.invoke('my-channel', data)
```

### ❌ Don't Do This

```typescript
// Don't import electron directly
const { ipcRenderer } = require('electron')  // ❌

// Don't use window.electron
(window as any).electron.ipcRenderer  // ❌

// Don't assume runtime
const electron = require('electron')  // ❌ Breaks in Tauri
```

## Error Handling

```typescript
import { getIpcRenderer } from '@kui-shell/core/src/main/tauri-bridge'

try {
  const ipc = getIpcRenderer()
  const result = await ipc.invoke('my-channel', data)
  // Handle result
} catch (error) {
  if (error.message.includes('runtime not detected')) {
    // Running in browser or headless mode
    console.log('IPC not available in this environment')
  } else {
    // Other IPC error
    console.error('IPC error:', error)
  }
}
```

## Common Patterns

### Conditional IPC Usage

```typescript
import {
  isElectronRuntime,
  isTauriRuntime,
  getIpcRenderer
} from '@kui-shell/core/src/main/tauri-bridge'

// Only use IPC in desktop environments
if (isElectronRuntime() || isTauriRuntime()) {
  const ipc = getIpcRenderer()
  // Desktop-specific IPC code
} else {
  // Browser fallback
  console.log('IPC not available in browser')
}
```

### Safe IPC Wrapper

```typescript
export async function safeIpcInvoke(
  channel: string,
  ...args: unknown[]
): Promise<unknown> {
  try {
    const ipc = getIpcRenderer()
    return await ipc.invoke(channel, ...args)
  } catch (error) {
    console.warn('IPC not available:', error.message)
    return null
  }
}

// Usage
const result = await safeIpcInvoke('/exec/invoke', { command: 'ls' })
```

### Event Listener Cleanup

```typescript
import { useEffect } from 'react'
import { getIpcRenderer } from '@kui-shell/core/src/main/tauri-bridge'

function MyComponent() {
  useEffect(() => {
    const ipc = getIpcRenderer()

    const handler = (event, data) => {
      console.log('Received:', data)
    }

    // Add listener
    ipc.on('my-event', handler)

    // Cleanup on unmount
    return () => {
      ipc.removeListener('my-event', handler)
    }
  }, [])

  return <div>My Component</div>
}
```

## TypeScript Types

### IpcRenderer Interface

```typescript
interface IpcRenderer {
  send(channel: string, ...args: unknown[]): void
  invoke(channel: string, ...args: unknown[]): Promise<unknown>
  on(channel: string, listener: IpcListener): void
  once(channel: string, listener: IpcListener): void
  removeListener(channel: string, listener: (...args: unknown[]) => void): void
}

type IpcListener = (
  event: Record<string, unknown>,
  ...args: unknown[]
) => void
```

### Using Types

```typescript
import type { IpcRenderer } from '@kui-shell/core/src/main/tauri-bridge'

function setupIpc(): IpcRenderer {
  return getIpcRenderer()
}

const ipc: IpcRenderer = setupIpc()
```

## Migration from Direct Electron Usage

### Before (Electron-specific)

```typescript
const { ipcRenderer } = require('electron')

ipcRenderer.send('my-channel', data)

ipcRenderer.invoke('my-channel', data)
  .then(result => console.log(result))

ipcRenderer.on('my-event', (event, data) => {
  console.log(data)
})
```

### After (Unified Bridge)

```typescript
import { getIpcRenderer } from '@kui-shell/core/src/main/tauri-bridge'

const ipc = getIpcRenderer()

ipc.send('my-channel', data)

const result = await ipc.invoke('my-channel', data)
console.log(result)

ipc.on('my-event', (event, data) => {
  console.log(data)
})
```

## Testing

### Unit Tests

```typescript
import { getIpcRenderer, getRuntimeName } from '@kui-shell/core/src/main/tauri-bridge'

describe('IPC Bridge', () => {
  it('should detect runtime', () => {
    const runtime = getRuntimeName()
    expect(['Tauri', 'Electron', 'Unknown'].includes(runtime)).toBe(true)
  })

  it('should get IPC renderer in desktop mode', () => {
    try {
      const ipc = getIpcRenderer()
      expect(ipc).toBeDefined()
      expect(ipc.send).toBeDefined()
      expect(ipc.invoke).toBeDefined()
    } catch (error) {
      // Expected in browser mode
      console.log('Test skipped (desktop runtime required)')
    }
  })
})
```

### Integration Tests

```typescript
describe('IPC Communication', () => {
  it('should invoke command successfully', async () => {
    const ipc = getIpcRenderer()

    const result = await ipc.invoke('/exec/invoke', {
      module: 'test',
      fn: 'ping'
    })

    expect(result).toBeDefined()
  })
})
```

## Debugging

### Enable Debug Logging

```bash
# Set DEBUG environment variable
DEBUG=main/tauri-bridge npm run open

# Or in code
localStorage.debug = 'main/tauri-bridge'
```

### Check Runtime

```typescript
import { getRuntimeName } from '@kui-shell/core/src/main/tauri-bridge'

console.log('Current runtime:', getRuntimeName())
```

### Inspect IPC Calls

The bridge logs all IPC operations when debug mode is enabled:

```
main/tauri-bridge Runtime detection: { isTauri: true, isElectron: false }
main/tauri-bridge Using Tauri IPC renderer
main/tauri-bridge Tauri invoke: /exec/invoke [...]
```

## Advanced Usage

### Custom IPC Channel

```typescript
// Define custom channel handler in Rust (Tauri) or main process (Electron)
const ipc = getIpcRenderer()

// Use the channel
const result = await ipc.invoke('my-custom-channel', {
  param1: 'value1',
  param2: 'value2'
})
```

### Batch Operations

```typescript
const ipc = getIpcRenderer()

// Send multiple messages
const operations = [
  ipc.invoke('operation1', data1),
  ipc.invoke('operation2', data2),
  ipc.invoke('operation3', data3)
]

const results = await Promise.all(operations)
```

## Known Limitations

### Tauri-Specific

1. **Tray Menus:** Not currently implemented (requires Rust backend)
2. **Dynamic Menus:** Must be defined in Rust, not via IPC
3. **Advanced Window Management:** Some features limited

### Electron-Specific

1. **Modern Security:** Enable context isolation for security
2. **IPC Serialization:** Complex objects may need JSON serialization

## Support

### Get Help

- Check the [main documentation](/Users/elad/PROJ/kui/CLAUDE.md)
- Review the [migration report](/Users/elad/PROJ/kui/TAURI-IPC-MIGRATION-REPORT.md)
- Check existing usage in the codebase
- File an issue on GitHub

### Contributing

When adding new IPC channels:

1. Define channel in Tauri bridge (`packages/core/src/main/tauri-bridge.ts`)
2. Implement handler in Rust backend (`src-tauri/src/commands.rs`)
3. Implement handler in Electron main process (if supporting Electron)
4. Add tests for the new channel
5. Document the channel in this guide

---

**Last Updated:** 2025-12-17
**Bridge Version:** 2.0 (Dual runtime support)
**Compatible With:** Electron, Tauri
