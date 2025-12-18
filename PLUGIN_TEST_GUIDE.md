# Plugin Testing Guide - Tauri Runtime

This guide provides detailed testing procedures for verifying plugin compatibility with the Tauri runtime.

## Prerequisites

```bash
# Ensure dependencies are installed
cd /Users/elad/PROJ/kui
npm ci

# Compile TypeScript
npm run compile

# Verify Rust toolchain
rustc --version
cargo --version
```

## Test Environment Setup

### 1. Build Tauri Application

```bash
# For macOS (Apple Silicon)
npm run build:tauri:mac:arm64

# For macOS (Intel)
npm run build:tauri:mac:amd64

# For Linux
npm run build:tauri:linux:amd64

# For Windows
npm run build:tauri:win32:amd64
```

### 2. Run Development Mode

```bash
# Development mode with hot reload
npm run watch:tauri

# Or run built application
npm run open:tauri
```

## Plugin Test Matrix

### Core Plugins

#### plugin-client-common

**Features to Test**:
- [ ] Table rendering
- [ ] Grid layout
- [ ] Markdown rendering
- [ ] Code syntax highlighting
- [ ] Modal dialogs
- [ ] Loading indicators

**Test Commands**:
```bash
# In Kui app
help
version
about

# Check table rendering
kubectl get pods -o wide
kubectl get nodes
```

**Expected Results**:
- Tables render with proper formatting
- Clickable cells work
- Sorting functions correctly
- No console errors

---

#### plugin-kubectl

**Features to Test**:
- [ ] kubectl command execution
- [ ] Resource listing
- [ ] Resource details
- [ ] YAML/JSON editing
- [ ] Log streaming
- [ ] Exec into pods
- [ ] Context switching

**Test Commands**:
```bash
# Basic operations
kubectl version
kubectl get pods
kubectl get pods -A
kubectl get nodes
kubectl get all -A

# Detailed views
kubectl describe node <node-name>
kubectl describe pod <pod-name>

# Resource operations
kubectl create -f <yaml-file>
kubectl apply -f <yaml-file>
kubectl delete pod <pod-name>

# Logs and exec
kubectl logs <pod-name>
kubectl logs <pod-name> -f
kubectl exec -it <pod-name> -- /bin/bash

# Context management
kubectl config get-contexts
kubectl config use-context <context>
```

**Expected Results**:
- All commands execute successfully
- Output formatted as tables where appropriate
- Streaming works (logs with -f)
- Interactive commands work (exec)
- No performance degradation vs Electron

---

#### plugin-bash-like

**Features to Test**:
- [ ] Shell command execution
- [ ] PTY initialization
- [ ] Command history
- [ ] Tab completion
- [ ] Multi-line commands
- [ ] Background jobs

**Test Commands**:
```bash
# Basic shell commands
ls -la
pwd
cd /tmp
echo "test"
cat /etc/hosts

# File operations
touch test.txt
echo "content" > test.txt
cat test.txt
rm test.txt

# Process management
ps aux | grep kui
top -n 1

# Environment
env
export TEST_VAR=value
echo $TEST_VAR
```

**Expected Results**:
- Commands execute in PTY
- Output streams correctly
- Tab completion works
- Command history navigable
- Colors and formatting preserved

---

#### plugin-core-support

**Features to Test**:
- [ ] Replay functionality
- [ ] Command registration
- [ ] Help system
- [ ] Theme support
- [ ] Settings management

**Test Commands**:
```bash
# Help and documentation
help
help kubectl
help get

# Replay commands
replay <command-id>

# Theme switching
theme set dark
theme set light
theme list

# Settings
settings
```

**Expected Results**:
- Help displays correctly
- Replay works
- Theme switching applies immediately
- Settings persist

---

### Extended Plugins

#### plugin-kubectl-ai

**Features to Test**:
- [ ] AI provider configuration
- [ ] Chat interface
- [ ] Context extraction
- [ ] Insight generation
- [ ] Multi-provider support

**Test Commands**:
```bash
# Configuration
kubectl ai config
kubectl ai config set provider anthropic
kubectl ai config set model claude-3-5-sonnet-20241022

# AI operations
kubectl ai ask "What pods are failing?"
kubectl ai debug <pod-name>
kubectl ai create deployment nginx
```

**Expected Results**:
- Configuration UI loads
- AI responses stream correctly
- Context extraction works
- No errors with missing config files

---

#### plugin-s3

**Features to Test**:
- [ ] S3 bucket listing
- [ ] Object navigation
- [ ] File downloads
- [ ] Metadata viewing

**Test Commands**:
```bash
# S3 operations
s3 ls
s3 ls s3://bucket-name
s3 cat s3://bucket-name/file.txt
```

**Expected Results**:
- Buckets list correctly
- Objects navigable
- File contents display
- May have VFS limitations (document them)

---

## Runtime Compatibility Tests

### Test 1: Plugin Loading

**Objective**: Verify all plugins load successfully

```typescript
// In browser console
console.log(window.__TAURI__)
// Should show Tauri API

// Check plugin system
localStorage.getItem('kui.plugins')
// Should show loaded plugins
```

**Success Criteria**:
- No plugin loading errors
- All expected plugins listed
- No missing dependencies

---

### Test 2: Main Process Communication

**Objective**: Verify exec_invoke works

```typescript
// In browser console
const { invoke } = window.__TAURI__.core

// Test generic invoke
invoke('exec_invoke', {
  message: JSON.stringify({
    module: 'generic',
    method: 'test',
    args: []
  })
}).then(console.log)
// Should return { success: true, returnValue: null }

// Test PTY invoke
invoke('exec_invoke', {
  message: JSON.stringify({
    module: 'pty',
    method: 'spawn',
    args: []
  })
}).then(console.log)
// Should return acknowledgment
```

**Success Criteria**:
- Invocations complete successfully
- Proper response structure
- Error handling works

---

### Test 3: PTY Operations

**Objective**: Verify terminal functionality

```bash
# In Kui app
bash
# Should open a new terminal

ls -la
# Should execute in PTY

exit
# Should close terminal
```

**Success Criteria**:
- PTY spawns correctly
- Commands execute
- Output displays properly
- Terminal closes cleanly

---

### Test 4: Performance Benchmarks

**Objective**: Compare Tauri vs Electron performance

**Metrics to Measure**:
1. Application startup time
2. First plugin load time
3. Command execution time
4. Memory usage (Activity Monitor / Task Manager)
5. Bundle size

**Test Procedure**:
```bash
# Measure startup
time npm run open:tauri
# vs
time npm run open

# Memory usage
# Check Activity Monitor during operation

# Bundle size
du -sh src-tauri/target/release/bundle/
# vs Electron build size
```

**Expected Results**:
- Tauri starts faster (target: 2-4x)
- Tauri uses less memory (target: 40-50% less)
- Tauri bundle smaller (target: 10x smaller)
- Command execution similar or faster

---

## Automated Testing

### Unit Tests

```bash
# Run plugin-specific tests
npm test -- plugin-kubectl
npm test -- plugin-bash-like
npm test -- plugin-client-common
```

### Integration Tests

```bash
# Run with Tauri runtime
RUNTIME=tauri npm test

# Run specific integration tests
npm test -- --grep "plugin"
```

---

## Common Issues and Solutions

### Issue: Plugin Not Loading

**Symptoms**:
- Plugin commands not recognized
- "Command not found" errors

**Debug Steps**:
1. Check browser console for errors
2. Verify plugin in prescan.json
3. Check TypeScript compilation errors

**Solution**:
```bash
npm run compile
npm run link
```

### Issue: PTY Not Working

**Symptoms**:
- Shell commands hang
- No terminal output

**Debug Steps**:
1. Check WebSocket connection
2. Verify PTY server is running
3. Check for port conflicts

**Solution**:
```bash
# Check PTY server logs
tail -f ~/.kui/logs/pty-server.log

# Restart with fresh session
rm -rf ~/.kui/session
```

### Issue: Main Process Invoke Fails

**Symptoms**:
- exec_invoke returns errors
- Privileged operations fail

**Debug Steps**:
1. Check Rust logs: `RUST_LOG=debug npm run open:tauri`
2. Verify message format
3. Check Tauri version

**Solution**:
```bash
# Rebuild Tauri
cd src-tauri
cargo clean
cargo build --release
```

---

## Test Reporting

### Success Report Template

```markdown
## Plugin Test Report

**Plugin**: plugin-name
**Runtime**: Tauri 2.5
**Date**: YYYY-MM-DD
**Tester**: Name

### Results

- [ ] Plugin loads successfully
- [ ] All commands execute
- [ ] UI renders correctly
- [ ] Performance acceptable
- [ ] No console errors

### Performance

- Startup time: Xs
- Memory usage: XMB
- Command execution: Xms

### Issues

None / List issues

### Recommendation

✅ Ready for production
⚠️ Minor issues (detail)
❌ Not ready (detail)
```

---

## Regression Testing

### Before Each Release

1. **Run Full Test Suite**
   ```bash
   npm test
   npm run test:integration
   ```

2. **Manual Smoke Tests**
   - Start application
   - Load each major plugin
   - Execute core commands
   - Verify UI functionality

3. **Performance Verification**
   - Measure startup time
   - Check memory usage
   - Verify no degradation

4. **Cross-Platform Testing**
   - macOS (Intel and Apple Silicon)
   - Linux (Ubuntu, Fedora)
   - Windows 10/11

---

## Continuous Integration

### CI Pipeline Tests

```yaml
# .github/workflows/plugin-tests.yml
name: Plugin Tests

on: [push, pull_request]

jobs:
  test-tauri-plugins:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest, windows-latest]

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - uses: actions-rs/toolchain@v1

      - run: npm ci
      - run: npm run compile
      - run: npm test
      - run: npm run build:tauri
```

---

## Next Steps

After completing tests:

1. **Document Results**
   - Update PLUGIN_COMPATIBILITY_REPORT.md
   - File issues for any failures
   - Update plugin documentation

2. **Performance Optimization**
   - Profile slow operations
   - Optimize bundle size
   - Reduce memory usage

3. **Community Testing**
   - Release beta builds
   - Gather user feedback
   - Address compatibility issues

---

## Support

For issues or questions:
- File issue: https://github.com/IBM/kui/issues
- Discuss: https://github.com/IBM/kui/discussions
- Documentation: /docs/plugins.md

---

**Guide Version**: 1.0
**Last Updated**: December 17, 2025
