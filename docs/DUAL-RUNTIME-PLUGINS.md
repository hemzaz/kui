# Dual-Runtime Plugin System

This document describes how Kui's plugin system works seamlessly across both Tauri and Electron runtimes.

## Overview

Kui now supports two runtime environments:
- **Tauri**: Modern, lightweight Rust-based framework (recommended)
- **Electron**: Traditional Node.js-based framework (legacy support)

The plugin system automatically detects the runtime and applies appropriate loading strategies for optimal performance.

## Architecture

### Core Components

1. **tauri-bridge.ts** (`packages/core/src/main/tauri-bridge.ts`)
   - Runtime detection (Tauri vs Electron)
   - Unified IPC abstraction layer
   - Platform-agnostic communication

2. **tauri-plugins.ts** (`packages/core/src/main/tauri-plugins.ts`)
   - Runtime-aware plugin loading configuration
   - Performance optimizations per runtime
   - Timeout and concurrency management

3. **resolver.ts** (`packages/core/src/plugins/resolver.ts`)
   - Plugin resolution and loading
   - Integrates with tauri-plugins for runtime-specific behavior
   - Maintains backward compatibility

### Runtime Detection

The system detects the runtime using the following checks:

```typescript
// Tauri detection
const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined

// Electron detection
const isElectron = !isTauri && typeof window !== 'undefined' &&
  window.process?.type === 'renderer'
```

## Plugin Loading Strategy

### Tauri Runtime (Optimized)

When running in Tauri:
- **Preloading**: Enabled by default for critical plugins
- **Concurrency**: 8 parallel plugin loads
- **Timeout**: 5 seconds per plugin
- **Strategy**: Aggressive preloading for faster startup

```typescript
{
  preload: true,
  concurrency: 8,
  timeout: 5000
}
```

### Electron Runtime (Conservative)

When running in Electron:
- **Preloading**: Disabled (lazy loading preferred)
- **Concurrency**: 4 parallel plugin loads
- **Timeout**: 10 seconds per plugin
- **Strategy**: On-demand loading to reduce memory usage

```typescript
{
  preload: false,
  concurrency: 4,
  timeout: 10000
}
```

### Browser Runtime (Fallback)

When running in browser:
- **Preloading**: Disabled (network constraints)
- **Concurrency**: 4 parallel plugin loads
- **Timeout**: 10 seconds per plugin
- **Strategy**: Conservative loading for network efficiency

```typescript
{
  preload: false,
  concurrency: 4,
  timeout: 10000
}
```

## Plugin Loading Flow

1. **Command Execution**: User enters a command in the REPL
2. **Command Resolution**: Resolver matches command to plugin
3. **Runtime Detection**: Check if Tauri or Electron
4. **Strategy Selection**: Apply runtime-specific loading options
5. **Plugin Import**: Dynamic import with webpack bundling
6. **Runtime Wrapper**: Apply timeout and performance monitoring
7. **Plugin Registration**: Register commands with REPL
8. **Command Execution**: Execute the command handler

### Code Example

```typescript
// In resolver.ts
const importPromise =
  module.path.charAt(0) === '/'
    ? import(/* webpackIgnore: true */ module.path)
    : import('@kui-shell/plugin-' + webpackPath(module.route) + '/mdist/plugin')

// Apply runtime-specific strategy
const registrationRef = shouldUseTauriEnhancements()
  ? await applyRuntimeStrategy(importPromise, route)
  : await importPromise
```

## Performance Benefits

### Tauri Advantages

- **10x smaller bundle size**: ~15 MB vs ~150 MB (Electron)
- **50% less memory**: ~80 MB vs ~150 MB (Electron)
- **4x faster startup**: ~0.5s vs ~2s (Electron)
- **Faster plugin loading**: Higher concurrency and better resource management

### Optimization Techniques

1. **Parallel Loading**: Load multiple plugins concurrently
2. **Timeout Management**: Prevent hanging plugins from blocking startup
3. **Performance Monitoring**: Track plugin load times
4. **Critical Plugin Preloading**: Load essential plugins during initialization

## Plugin Compatibility

All Kui plugins work with both Tauri and Electron without modification. The plugin loading system provides a transparent abstraction layer.

### Compatible Plugins

- ✅ plugin-kubectl (full compatibility)
- ✅ plugin-bash-like (full compatibility)
- ✅ plugin-client-common (full compatibility)
- ✅ plugin-core-support (full compatibility)
- ✅ plugin-kubectl-ai (full compatibility)

### Plugin Development

When developing plugins:

1. **No changes required**: Plugins work identically in both runtimes
2. **Use standard APIs**: IPC, command registration, mode registration
3. **Avoid runtime checks**: Let the plugin system handle runtime differences
4. **Test both runtimes**: Verify functionality in Tauri and Electron

## API Reference

### tauri-plugins Module

#### `shouldUseTauriEnhancements(): boolean`

Returns `true` if running in Tauri and enhancements should be used.

```typescript
import { shouldUseTauriEnhancements } from '@kui-shell/core/mdist/main/tauri-plugins'

if (shouldUseTauriEnhancements()) {
  // Use Tauri-specific optimizations
}
```

#### `getPluginLoadOptions(): PluginLoadOptions`

Returns runtime-specific plugin loading configuration.

```typescript
interface PluginLoadOptions {
  preload?: boolean
  concurrency?: number
  timeout?: number
}
```

#### `applyRuntimeStrategy<T>(promise, route): Promise<T>`

Wraps a plugin loading promise with runtime-specific behavior.

```typescript
const loadPromise = import('@kui-shell/plugin-kubectl')
const plugin = await applyRuntimeStrategy(loadPromise, 'kubectl')
```

#### `getPluginRuntimeInfo()`

Returns diagnostic information about the runtime and plugin system.

```typescript
{
  runtime: 'Tauri' | 'Electron' | 'Browser',
  options: PluginLoadOptions,
  features: {
    preloading: boolean,
    asyncImports: boolean,
    webpackBundling: boolean,
    tauriEnhancements: boolean
  }
}
```

### tauri-bridge Module

#### `isTauriRuntime(): boolean`

Check if running in Tauri runtime.

#### `isElectronRuntime(): boolean`

Check if running in Electron runtime.

#### `getRuntimeName(): string`

Get current runtime name ('Tauri', 'Electron', or 'Unknown').

#### `getIpcRenderer(): IpcRenderer`

Get unified IPC renderer for the current runtime.

## Migration Guide

### From Electron-Only to Dual-Runtime

**Before:**
```typescript
// Manual runtime checks scattered throughout code
if (window.process?.type === 'renderer') {
  // Electron-specific code
}
```

**After:**
```typescript
// Use abstraction layers
import { isTauriRuntime } from '@kui-shell/core/mdist/main/tauri-bridge'

// Let the plugin system handle runtime differences
// No changes needed in most cases
```

### Plugin Updates

No changes required! Existing plugins work with both runtimes automatically.

## Testing

### Test Both Runtimes

```bash
# Test with Tauri (recommended)
npm run open:tauri

# Test with Electron (legacy)
npm run open

# Test specific plugin
kubectl get pods  # Should work in both runtimes
```

### Debug Plugin Loading

Enable debug logging:

```bash
# In browser console or terminal
localStorage.debug = 'main/tauri-plugins,core/plugins/resolver'
```

This will show:
- Plugin loading times
- Runtime detection
- Strategy selection
- Error details

## Best Practices

1. **Use Tauri for Development**: Faster startup and better performance
2. **Test Both Runtimes**: Ensure compatibility with Electron for users
3. **Monitor Performance**: Check plugin load times with debug logging
4. **Optimize Critical Path**: Ensure essential plugins load quickly
5. **Handle Timeouts**: Design plugins to load within timeout limits

## Troubleshooting

### Plugin Loading Timeout

**Symptom**: Plugin fails to load with timeout error

**Solution**:
- Check plugin dependencies
- Reduce plugin initialization time
- Increase timeout in tauri-plugins.ts (for development only)

### Runtime Detection Issues

**Symptom**: Wrong runtime detected

**Solution**:
- Check browser/console for `window.__TAURI__` object
- Verify Tauri initialization completed
- Check for conflicting Electron checks

### Import Errors

**Symptom**: Cannot import tauri-plugins or tauri-bridge

**Solution**:
- Run `npm run compile` to rebuild
- Check tsconfig.json paths
- Verify webpack configuration

## Performance Monitoring

Track plugin loading performance:

```typescript
import { getPluginRuntimeInfo } from '@kui-shell/core/mdist/main/tauri-plugins'

const info = getPluginRuntimeInfo()
console.log('Runtime:', info.runtime)
console.log('Load Options:', info.options)
console.log('Features:', info.features)
```

## Future Enhancements

Potential improvements:
- [ ] Plugin lazy loading optimization
- [ ] Progressive plugin initialization
- [ ] Plugin dependency graph optimization
- [ ] Hot module replacement for plugins
- [ ] Plugin load priority system

## See Also

- [Tauri Migration Guide](TAURI_MIGRATION.md)
- [Plugin Development Guide](api/README.md)
- [Tauri Documentation](https://tauri.app)
