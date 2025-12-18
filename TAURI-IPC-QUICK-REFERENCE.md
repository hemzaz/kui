# Tauri IPC Bridge - Quick Reference

**Status:** ✅ Migration Complete - All Electron IPC calls replaced with unified bridge

## TL;DR

✅ **Migration is COMPLETE** - No direct Electron IPC calls remain in the codebase
✅ **All IPC goes through the Tauri bridge** - Works with both Electron and Tauri
✅ **Zero breaking changes** - Fully backward compatible

## Quick Start

### Import the Bridge
```typescript
import { getIpcRenderer } from '@kui-shell/core/src/main/tauri-bridge'
```

### Basic Usage
```typescript
const ipc = getIpcRenderer()

// Send message
ipc.send('my-channel', data)

// Invoke command
const result = await ipc.invoke('my-channel', data)

// Listen for events
ipc.on('my-event', (event, data) => {
  console.log('Received:', data)
})
```

## What Changed?

### ❌ OLD (No longer used)
```typescript
const { ipcRenderer } = require('electron')
ipcRenderer.send('channel', data)
```

### ✅ NEW (Current pattern)
```typescript
import { getIpcRenderer } from '@kui-shell/core/src/main/tauri-bridge'
const ipc = getIpcRenderer()
ipc.send('channel', data)
```

## Runtime Detection

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

## Supported Channels

| Channel | Purpose | Status |
|---------|---------|--------|
| `/exec/invoke` | Execute commands | ✅ Working |
| `synchronous-message` | Sync messages | ✅ Working |
| `capture-page-to-clipboard` | Screenshots | ✅ Working |

## Verification

### Check Migration Status
```bash
# Should only find bridge implementation (1 file)
grep -r "ipcRenderer" --include="*.ts" --include="*.tsx" packages/ plugins/ | \
  grep -v "mdist\|node_modules\|\.d\.ts"

# Should find ~19 usages
grep -r "getIpcRenderer" --include="*.ts" --include="*.tsx" packages/ plugins/ | \
  grep -v "mdist\|node_modules\|\.d\.ts" | wc -l
```

### Compile
```bash
npm run compile
# ✅ SUCCESS - No IPC-related errors
```

### Run
```bash
npm run open        # Electron (legacy)
npm run open:tauri  # Tauri (new)
```

## Documentation

📚 **Full Documentation:**
- `/Users/elad/PROJ/kui/docs/TAURI-BRIDGE-USAGE.md` - Complete API reference
- `/Users/elad/PROJ/kui/TAURI-IPC-MIGRATION-COMPLETE.md` - Detailed migration report
- `/Users/elad/PROJ/kui/TAURI-IPC-MIGRATION-REPORT.md` - Original analysis report

## Key Points

✅ **No action required** - Migration is complete
✅ **Use the bridge** - Always import from `@kui-shell/core/src/main/tauri-bridge`
✅ **Works everywhere** - Electron, Tauri, and browser (with detection)
✅ **Type-safe** - Full TypeScript support
✅ **Well-tested** - Comprehensive test suite

## Need Help?

1. Check `/Users/elad/PROJ/kui/docs/TAURI-BRIDGE-USAGE.md` for examples
2. Review `/Users/elad/PROJ/kui/packages/core/tests/tauri-ipc.test.ts` for test patterns
3. Look at existing usages: `grep -r "getIpcRenderer" packages/ plugins/`

---

**Migration Status:** ✅ 100% COMPLETE
**Last Verified:** 2025-12-17
