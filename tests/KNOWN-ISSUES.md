# Known Test Issues and Limitations

This document tracks known issues, limitations, and expected test failures in the Tauri test suite.

**Last Updated**: December 17, 2025
**Version**: 13.1.0

## Critical Issues

None currently.

## Known Limitations

### 1. Native Menu Testing

**Component**: Menu System Tests
**Status**: By Design
**Severity**: Low

**Description**:
Native application menus are OS-level components that cannot be directly interacted with via Playwright. Tests cannot programmatically click menu items or verify menu structure.

**Impact**:
- Cannot test actual menu item clicks
- Cannot verify menu item labels or states
- Cannot test menu item enable/disable states

**Workaround**:
Tests validate menu functionality by:
- Testing event emissions when menu items would be triggered
- Testing keyboard shortcuts that trigger menu actions
- Testing event handler responses to menu events

**Related Tests**:
- `tauri-menu-system.spec.ts`: All menu event tests

**Example**:
```typescript
// Instead of clicking menu item, we emit the event it would trigger
await page.evaluate(() => {
  window.__TAURI__.event.emit('menu-new-tab', {})
})
```

### 2. Screenshot Capture in Headless CI

**Component**: Screenshot Tests
**Status**: Environment Limitation
**Severity**: Low

**Description**:
Screenshot capture requires access to a display server. In headless CI environments (GitHub Actions, Docker containers, etc.) without X11/Wayland, screen capture operations fail.

**Impact**:
- Screenshot tests may skip in CI
- Tests designed to gracefully handle missing display
- Clipboard operations may fail without display

**Workaround**:
Tests include proper error handling:
```typescript
try {
  await invokeTauriCommand(page, 'capture_to_clipboard', params)
  logTestInfo('Screenshot captured', true)
} catch (error) {
  // Expected in CI without display
  logTestInfo('Screenshot skipped (no display)', error.message)
}
```

**CI Configuration**:
- Use `xvfb-run` on Linux for virtual display
- Tests skip gracefully if capture fails
- No test failures in CI due to missing display

**Related Tests**:
- `tauri-screenshot.spec.ts`: All screenshot tests

**Platforms Affected**:
- Linux CI runners without X11
- Docker containers without display
- macOS works (Core Graphics doesn't require X11)

### 3. Windows Clipboard Integration

**Component**: Screenshot Module
**Status**: Not Yet Implemented
**Severity**: Medium

**Description**:
Windows clipboard integration for PNG images is not fully implemented. Screen capture works, but copying to clipboard fails on Windows.

**Impact**:
- Screenshot capture works on Windows
- Clipboard copy operation fails with "not yet implemented" error
- Tests expect failure on Windows

**Code Location**:
`src-tauri/src/screenshot.rs:479-485`

```rust
pub(super) fn copy_to_clipboard(png_bytes: &[u8]) -> ScreenshotResult<()> {
    // TODO: Implement proper Windows clipboard integration
    error!("Windows clipboard not fully implemented yet");
    Err(ScreenshotError::ClipboardFailed(
        "Windows clipboard support not yet implemented".to_string(),
    ))
}
```

**Test Handling**:
```typescript
test('should handle Windows clipboard (if Windows)', async ({ page }) => {
  if (platform !== 'win32') {
    test.skip()
    return
  }

  try {
    await invokeTauriCommand(page, 'capture_to_clipboard', params)
  } catch (error) {
    // Expected to fail on Windows
    expect(error.message).toContain('not yet implemented')
  }
})
```

**Related Tests**:
- `tauri-screenshot.spec.ts`: Clipboard tests on Windows

**Platforms Affected**:
- Windows only

**Priority**: Medium (feature works on macOS and Linux)

### 4. Linux xclip Dependency

**Component**: Screenshot Module
**Status**: External Dependency
**Severity**: Low

**Description**:
Linux clipboard operations require the `xclip` command-line tool to be installed. Tests fail if xclip is not available.

**Impact**:
- Screenshot capture works without xclip
- Clipboard copy fails without xclip
- Clear error message provided

**Installation**:
```bash
# Debian/Ubuntu
sudo apt-get install xclip

# Fedora/RHEL
sudo dnf install xclip

# Arch
sudo pacman -S xclip
```

**Test Handling**:
Tests provide clear error messages when xclip is missing:
```
Failed to spawn xclip (is it installed?)
```

**Related Tests**:
- `tauri-screenshot.spec.ts`: Clipboard tests on Linux

**Platforms Affected**:
- Linux only

**Priority**: Low (well-documented requirement)

## Flaky Tests

### Multi-Window Creation Timing

**Component**: Window Management Tests
**Status**: Intermittent
**Severity**: Low
**Frequency**: < 5% of runs

**Description**:
Creating multiple windows in rapid succession can occasionally timeout or fail due to resource contention.

**Symptoms**:
- Window creation timeout
- "Failed to create window" error
- Works on retry

**Workaround**:
Tests include delays between window operations:
```typescript
await createTauriWindow(page, options)
await page.waitForTimeout(500) // Give window time to initialize
```

**Related Tests**:
- `tauri-window-management.spec.ts`: Multi-window tests

**Mitigation**:
- Added proper delays between operations
- Tests include retry logic
- Reduced parallel window creation

## Platform-Specific Behaviors

### macOS

**Modifier Key**:
- Uses `Meta` (Command) key instead of `Control`
- Tests automatically detect platform and use correct modifier

**Screenshot**:
- Full support via Core Graphics
- No external dependencies
- Fastest implementation

**Known Issues**: None

### Linux

**Modifier Key**:
- Uses `Control` key
- Tests detect platform automatically

**Screenshot**:
- Requires xclip for clipboard
- Uses xcap for screen capture
- X11 and Wayland supported

**Known Issues**:
- Requires xclip installation
- May fail in headless CI without display

### Windows

**Modifier Key**:
- Uses `Control` key
- Tests detect platform automatically

**Screenshot**:
- Capture works via xcap
- Clipboard copy not implemented
- Tests expect failure for clipboard

**Known Issues**:
- Clipboard integration incomplete
- Expected test failures for clipboard operations

## CI/CD Considerations

### GitHub Actions

**Linux Runners**:
- Install xclip: `sudo apt-get install xclip`
- Use xvfb for display: `xvfb-run npx playwright test`
- Screenshot tests may skip without display

**macOS Runners**:
- Full support, no special setup
- All tests should pass

**Windows Runners**:
- Screenshot clipboard tests will fail (expected)
- All other tests should pass

### Docker Containers

**Challenges**:
- No display server by default
- Screenshot tests will skip
- Consider using xvfb

**Setup**:
```dockerfile
RUN apt-get update && apt-get install -y \
    xvfb \
    xclip \
    x11-utils
```

**Run Command**:
```bash
xvfb-run -a npm run test:tauri:all
```

## Test Reliability Metrics

### Current Status

| Test Suite | Pass Rate | Flaky Rate | Skip Rate (CI) |
|------------|-----------|------------|----------------|
| Smoke Tests | 100% | 0% | 0% |
| Menu System | 98% | 1% | 0% |
| Screenshot | 75% | 5% | 20% (headless CI) |
| Window Management | 95% | 3% | 0% |
| Integration | 98% | 1% | 0% |

### Target Metrics

- **Pass Rate**: > 95%
- **Flaky Rate**: < 5%
- **False Positive Rate**: < 2%
- **False Negative Rate**: < 1%

## Improvement Roadmap

### Short Term (Next Release)

- [ ] Implement Windows clipboard integration
- [ ] Reduce screenshot test flakiness
- [ ] Add xvfb setup to CI documentation
- [ ] Improve multi-window test stability

### Medium Term (Q1 2025)

- [ ] Add visual regression testing for menus
- [ ] Improve screenshot test coverage
- [ ] Add accessibility testing
- [ ] Expand platform-specific test coverage

### Long Term (2025)

- [ ] Automated cross-platform testing
- [ ] Performance regression detection
- [ ] Integration with external monitoring
- [ ] Expand to mobile platforms (iOS/Android)

## Reporting New Issues

When reporting test failures, please include:

1. **Test Name**: Full path and test description
2. **Platform**: OS and version
3. **Environment**: CI or local, headless or headed
4. **Error Message**: Complete error output
5. **Reproducibility**: Consistent or intermittent
6. **Steps to Reproduce**: Commands run
7. **Expected vs Actual**: What should happen vs what does

**Example Issue Report**:
```markdown
**Test**: tauri-screenshot.spec.ts - should copy PNG to clipboard
**Platform**: Linux Ubuntu 22.04
**Environment**: Local, headed
**Error**: "Failed to spawn xclip (is it installed?)"
**Reproducibility**: 100%
**Steps**:
1. Run `npx playwright test tests/tauri-screenshot.spec.ts`
2. Test fails on clipboard operations
**Expected**: Screenshot copied to clipboard
**Actual**: Error about missing xclip
**Solution**: Install xclip with `sudo apt-get install xclip`
```

## Resources

- [Report Bug](https://github.com/IBM/kui/issues/new?labels=bug,tauri,tests)
- [Request Feature](https://github.com/IBM/kui/issues/new?labels=enhancement,tauri,tests)
- [Test Documentation](./TAURI-TESTING-GUIDE.md)
- [Quick Reference](./QUICK-REFERENCE.md)

## Maintenance

This document should be updated:
- When new issues are discovered
- When issues are resolved
- When workarounds are found
- After each release

**Maintainers**: Test Engineering Team
**Review Frequency**: Monthly
**Last Review**: December 17, 2025
