# Kui Main Process Modules

This directory contains modules that handle main process functionality and runtime abstraction.

## Overview

Kui supports multiple runtime environments with seamless plugin loading:
- **Tauri**: Modern Rust-based runtime (recommended)
- **Electron**: Traditional Node.js runtime (legacy)

## Key Modules

### tauri-bridge.ts

Provides runtime detection and unified IPC abstraction.

```typescript
import {
  isTauriRuntime,
  isElectronRuntime,
  getIpcRenderer
} from './tauri-bridge'

// Detect runtime
if (isTauriRuntime()) {
  console.log('Running in Tauri')
}

// Use unified IPC
const ipc = getIpcRenderer()
ipc.invoke('/exec/invoke', command)
```

**Features:**
- Runtime detection (Tauri vs Electron)
- Unified IPC interface for both runtimes
- Transparent platform abstraction

### tauri-plugins.ts

Provides runtime-aware plugin loading with performance optimizations.

```typescript
import {
  shouldUseTauriEnhancements,
  applyRuntimeStrategy,
  getPluginLoadOptions
} from './tauri-plugins'

// Check if Tauri enhancements are available
if (shouldUseTauriEnhancements()) {
  // Use optimized loading
}

// Get runtime-specific options
const options = getPluginLoadOptions()
console.log('Concurrency:', options.concurrency)
console.log('Preload:', options.preload)

// Wrap plugin loading with runtime strategy
const plugin = await applyRuntimeStrategy(
  import('@kui-shell/plugin-kubectl'),
  'kubectl'
)
```

**Features:**
- Runtime-specific plugin loading strategies
- Performance monitoring and timeout handling
- Configurable concurrency and preloading
- Automatic optimization based on runtime

## Runtime-Specific Behavior

### Tauri (Optimized)

```typescript
{
  preload: true,      // Aggressive preloading
  concurrency: 8,     // High parallelism
  timeout: 5000       // Fast timeout
}
```

**Why:** Tauri is faster and more efficient, can handle aggressive loading.

### Electron (Conservative)

```typescript
{
  preload: false,     // Lazy loading
  concurrency: 4,     // Moderate parallelism
  timeout: 10000      // Longer timeout
}
```

**Why:** Electron is heavier, prefers on-demand loading to reduce memory.

## Usage in Plugin Development

### No Changes Needed

Plugins work automatically in both runtimes:

```typescript
// plugin/src/preload.ts
export default async (registrar: Registrar) => {
  registrar.listen('/mycommand', async () => {
    // Works in both Tauri and Electron
    return 'Hello World'
  })
}
```

### Using Runtime Detection

Only if you need runtime-specific behavior:

```typescript
import { isTauriRuntime } from '@kui-shell/core/mdist/main/tauri-bridge'

export default async (registrar: Registrar) => {
  if (isTauriRuntime()) {
    // Tauri-specific optimization
  } else {
    // Electron fallback
  }
}
```

## Integration with Resolver

The resolver automatically uses tauri-plugins:

```typescript
// In packages/core/src/plugins/resolver.ts

// Import tauri-plugins utilities
import {
  shouldUseTauriEnhancements,
  applyRuntimeStrategy
} from '../main/tauri-plugins'

// Apply runtime strategy when loading plugins
const registrationRef = shouldUseTauriEnhancements()
  ? await applyRuntimeStrategy(importPromise, route)
  : await importPromise
```

This provides:
- Automatic timeout management
- Performance monitoring
- Error recovery
- Load time tracking

## Debugging

Enable debug logging:

```bash
# Set debug flags
export DEBUG=main/tauri-plugins,core/plugins/resolver

# Or in browser console
localStorage.debug = 'main/tauri-plugins,core/plugins/resolver'
```

View runtime diagnostics:

```typescript
import { getPluginRuntimeInfo } from '@kui-shell/core/mdist/main/tauri-plugins'

const info = getPluginRuntimeInfo()
console.log(info)
// {
//   runtime: 'Tauri',
//   options: { preload: true, concurrency: 8, timeout: 5000 },
//   features: { preloading: true, asyncImports: true, ... }
// }
```

## Testing

Test both runtimes:

```bash
# Test with Tauri
npm run open:tauri

# Test with Electron
npm run open

# Run specific commands
kubectl get pods
ls -la
```

## Performance Tips

1. **Use Tauri for Development**: 4x faster startup
2. **Critical Plugins Preload**: In Tauri, essential plugins load early
3. **Monitor Load Times**: Check debug logs for slow plugins
4. **Optimize Imports**: Keep plugin dependencies minimal

## See Also

- [Dual-Runtime Plugin System](../../../docs/DUAL-RUNTIME-PLUGINS.md) - Full documentation
- [Tauri Migration Guide](../../../TAURI_MIGRATION.md) - Migration details
- [Plugin Development](../../../docs/api/README.md) - Plugin API guide
