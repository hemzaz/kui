# Quick Start: Plugin Testing for Tauri

## Build & Run (5 minutes)

```bash
# 1. Build Tauri app
cd /Users/elad/PROJ/kui
npm run compile
npm run build:tauri:mac:arm64

# 2. Run Tauri app
npm run open:tauri
```

## Basic Tests (2 minutes)

In the Kui app, type these commands:

```bash
# Core functionality
version
help

# kubectl plugin
kubectl version
kubectl get pods

# bash-like plugin
ls -la
pwd
echo "test"
```

## Quick Verification

### 1. Check Plugins Loaded
Open DevTools (Cmd+Option+I), then:
```javascript
// Should show Tauri API
console.log(window.__TAURI__)

// Test exec_invoke
window.__TAURI__.core.invoke('exec_invoke', {
  message: JSON.stringify({
    module: 'generic',
    method: 'test',
    args: []
  })
}).then(console.log)
// Expected: {success: true, returnValue: null}
```

### 2. Check for Errors
- Console should have no red errors
- Commands should execute
- UI should render properly

## Debug Mode

```bash
# Run with Rust debug logging
RUST_LOG=debug npm run open:tauri

# Watch for:
# - "Loading plugin: <name>"
# - "exec_invoke: module=..., method=..."
# - No error messages
```

## Common Issues

| Issue | Quick Fix |
|-------|-----------|
| App won't start | `cargo clean && npm run build:tauri:mac:arm64` |
| Commands fail | Check PTY server logs: `~/.kui/logs/` |
| Plugins missing | `npm run compile && npx kui-prescan` |

## Success Criteria

✅ App starts in <2 seconds
✅ All commands execute
✅ No console errors
✅ UI renders correctly
✅ Memory usage <100MB

## Next Steps

Once basic tests pass:
1. See PLUGIN_TEST_GUIDE.md for comprehensive testing
2. Run performance benchmarks
3. Test with real Kubernetes clusters
4. Report any issues found

## Quick Help

- Full testing guide: `PLUGIN_TEST_GUIDE.md`
- Compatibility report: `PLUGIN_COMPATIBILITY_REPORT.md`
- Implementation details: `PLUGIN_SYSTEM_IMPLEMENTATION_COMPLETE.md`

---
**Time to test**: ~10 minutes
**Last updated**: December 17, 2025
