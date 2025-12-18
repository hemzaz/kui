# Screenshot Functionality Testing Guide

## Quick Start Testing

### Prerequisites

**macOS:**
- Kui built and running
- System Preferences → Security & Privacy → Screen Recording → Kui enabled

**Linux:**
```bash
sudo apt-get install xclip  # or yum install xclip
```

**Windows:**
- No additional prerequisites

## Test 1: Basic Screenshot Capture

### From DevTools Console

1. Open Kui with Tauri:
```bash
cd /Users/elad/PROJ/kui
npm run open:tauri
```

2. Open DevTools (View → Toggle Developer Tools)

3. In the console, run:
```javascript
// Test basic screenshot capture
await window.__TAURI__.core.invoke('capture_to_clipboard', {
  x: 0,
  y: 0,
  width: 800,
  height: 600
})
console.log('Screenshot captured!')
```

4. Open any image editor or document
5. Press Cmd+V (macOS) or Ctrl+V (Linux/Windows)
6. Verify the screenshot appears

### Expected Result
✅ Screenshot of the specified region appears in clipboard
✅ Can paste into any application
✅ Image is 800x600 pixels
✅ Image quality is good (no artifacts)

## Test 2: Full Screen Capture

```javascript
// Capture full screen (adjust dimensions for your display)
await window.__TAURI__.core.invoke('capture_to_clipboard', {
  x: 0,
  y: 0,
  width: 1920,
  height: 1080
})
```

### Expected Result
✅ Full screen captured
✅ All monitors handled correctly (captures primary)
✅ High DPI displays work correctly

## Test 3: Specific Region Capture

```javascript
// Capture a specific window or region
await window.__TAURI__.core.invoke('capture_to_clipboard', {
  x: 100,    // Offset from left
  y: 100,    // Offset from top
  width: 400,
  height: 300
})
```

### Expected Result
✅ Only specified region captured
✅ Coordinates are accurate
✅ No overflow or underflow

## Test 4: Error Handling

### Test Invalid Region
```javascript
// Test with invalid coordinates
try {
  await window.__TAURI__.core.invoke('capture_to_clipboard', {
    x: -1000,
    y: -1000,
    width: 100,
    height: 100
  })
} catch (error) {
  console.log('Expected error:', error)
}
```

### Expected Result
✅ Error is caught gracefully
✅ Error message is descriptive
✅ Application doesn't crash

### Test Huge Region
```javascript
// Test with very large region
try {
  await window.__TAURI__.core.invoke('capture_to_clipboard', {
    x: 0,
    y: 0,
    width: 10000,
    height: 10000
  })
} catch (error) {
  console.log('Expected error:', error)
}
```

### Expected Result
✅ Error or cropped to screen bounds
✅ No memory overflow
✅ Application remains responsive

## Test 5: Performance Test

```javascript
// Test multiple captures
async function performanceTest() {
  const iterations = 10
  const start = performance.now()

  for (let i = 0; i < iterations; i++) {
    await window.__TAURI__.core.invoke('capture_to_clipboard', {
      x: 0,
      y: 0,
      width: 800,
      height: 600
    })
  }

  const end = performance.now()
  const avgTime = (end - start) / iterations

  console.log(`Average capture time: ${avgTime.toFixed(2)}ms`)
  return avgTime
}

await performanceTest()
```

### Expected Results
- **macOS:** 50-150ms average
- **Linux:** 100-250ms average
- **Windows:** 100-200ms average

✅ No memory leaks
✅ Consistent performance
✅ No UI freezing

## Test 6: Multi-Monitor Support (if available)

```javascript
// Capture from secondary monitor
// Adjust x coordinate to be on second monitor
await window.__TAURI__.core.invoke('capture_to_clipboard', {
  x: 1920,   // Start of second monitor (adjust for your setup)
  y: 0,
  width: 800,
  height: 600
})
```

### Expected Result
✅ Secondary monitor captured correctly
✅ Coordinates map correctly
✅ No black/empty images

## Platform-Specific Tests

### macOS: Permission Test

1. First run without Screen Recording permission
2. Expected: Error or prompt for permission
3. Grant permission in System Preferences
4. Retry screenshot
5. Expected: Success

### Linux: xclip Test

```bash
# Verify xclip is working
echo "test" | xclip -selection clipboard
xclip -selection clipboard -o  # Should output "test"
```

If xclip works, screenshot clipboard should work.

### Windows: Clipboard Test

Currently Windows clipboard is not implemented, so:
- Screen capture should work
- Clipboard copy should return error
- Error should be graceful

## Automated Test Script

Save as `test-screenshot.js` and run from DevTools:

```javascript
async function runAllTests() {
  const tests = []

  // Test 1: Basic capture
  tests.push({
    name: 'Basic capture',
    fn: async () => {
      await window.__TAURI__.core.invoke('capture_to_clipboard', {
        x: 0, y: 0, width: 800, height: 600
      })
    }
  })

  // Test 2: Small region
  tests.push({
    name: 'Small region',
    fn: async () => {
      await window.__TAURI__.core.invoke('capture_to_clipboard', {
        x: 100, y: 100, width: 200, height: 200
      })
    }
  })

  // Test 3: Large region
  tests.push({
    name: 'Large region',
    fn: async () => {
      await window.__TAURI__.core.invoke('capture_to_clipboard', {
        x: 0, y: 0, width: 1920, height: 1080
      })
    }
  })

  // Run tests
  console.log('Running screenshot tests...\n')

  for (const test of tests) {
    try {
      const start = performance.now()
      await test.fn()
      const time = performance.now() - start
      console.log(`✅ ${test.name}: ${time.toFixed(2)}ms`)
    } catch (error) {
      console.log(`❌ ${test.name}: ${error}`)
    }
  }

  console.log('\nTests completed!')
}

// Run tests
await runAllTests()
```

## Visual Verification Checklist

After each test, paste into an image editor and verify:

- ✅ **Correct dimensions:** Image size matches requested width/height
- ✅ **Correct content:** Captured area is what was visible on screen
- ✅ **No artifacts:** No compression artifacts, corruption, or glitches
- ✅ **Color accuracy:** Colors match what was on screen
- ✅ **No black borders:** Image edges are clean
- ✅ **High DPI correct:** Retina/HiDPI displays captured at correct resolution

## Troubleshooting

### macOS: "Screen Recording permission denied"
**Solution:**
1. System Preferences → Security & Privacy → Privacy
2. Select "Screen Recording" from left sidebar
3. Check box next to Kui
4. Restart Kui

### Linux: "xclip not found" or "Failed to spawn xclip"
**Solution:**
```bash
sudo apt-get install xclip
# or
sudo yum install xclip
```

### Windows: "Clipboard operation failed"
**Expected:** This is currently not implemented. Screen capture should still work.

### General: Black or empty screenshot
**Possible causes:**
1. Invalid coordinates (outside screen bounds)
2. Permission issues
3. Display server issues (Linux Wayland)

**Solutions:**
1. Verify coordinates are within screen bounds
2. Check permissions
3. Try on X11 instead of Wayland

### Performance: Slow captures
**Possible causes:**
1. Very large regions (4K+)
2. System under load
3. Slow display server (Linux)

**Solutions:**
1. Capture smaller regions
2. Close other applications
3. Check system resources

## Logging

Enable detailed logging to diagnose issues:

```bash
# macOS/Linux
RUST_LOG=debug npm run open:tauri

# Windows (PowerShell)
$env:RUST_LOG="debug"
npm run open:tauri
```

Look for log entries like:
```
[INFO  kui] Screenshot requested: x=0, y=0, width=800, height=600
[DEBUG kui::screenshot] Capturing screen region...
[INFO  kui] Screenshot successfully captured and copied to clipboard
```

## Performance Benchmarks

Create a benchmark script:

```javascript
async function benchmark() {
  const sizes = [
    { w: 800, h: 600, name: 'Small' },
    { w: 1920, h: 1080, name: 'Full HD' },
    { w: 3840, h: 2160, name: '4K' }
  ]

  for (const size of sizes) {
    const iterations = 5
    const times = []

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await window.__TAURI__.core.invoke('capture_to_clipboard', {
        x: 0, y: 0, width: size.w, height: size.h
      })
      times.push(performance.now() - start)
    }

    const avg = times.reduce((a, b) => a + b) / times.length
    console.log(`${size.name} (${size.w}x${size.h}): ${avg.toFixed(2)}ms`)
  }
}

await benchmark()
```

## Integration with Kui

To integrate with Kui's screenshot UI, you'll need to:

1. Find the screenshot button/command in the UI
2. Wire it to call the Tauri command
3. Add user feedback (loading, success, error)
4. Handle permissions gracefully

Example integration:

```typescript
// In your screenshot handler
import { invoke } from '@tauri-apps/api/core'

async function captureAndNotify(x: number, y: number, width: number, height: number) {
  try {
    // Show loading indicator
    showToast('Capturing screenshot...', 'info')

    // Capture
    await invoke('capture_to_clipboard', { x, y, width, height })

    // Success
    showToast('Screenshot copied to clipboard!', 'success')
  } catch (error) {
    // Error
    console.error('Screenshot failed:', error)
    showToast(`Screenshot failed: ${error}`, 'error')

    // Handle permission errors specially
    if (error.includes('permission')) {
      showPermissionDialog()
    }
  }
}
```

## Success Criteria

All tests pass when:

✅ Screenshots capture correctly on macOS
✅ Screenshots capture correctly on Linux (with xclip)
✅ Screen capture works on Windows
✅ Error handling is graceful
✅ Performance is acceptable (< 200ms average)
✅ No memory leaks
✅ No crashes
✅ Clipboard integration works
✅ Multi-monitor support works
✅ High DPI displays work correctly

## Next Steps After Testing

1. Document any platform-specific quirks found
2. Add any necessary user-facing documentation
3. Implement Windows clipboard support
4. Add UI integration
5. Add tests to CI/CD pipeline
6. Consider adding screenshot preview before clipboard
7. Add screenshot history/management

## Report Issues

If you find issues during testing:

1. Check logs (RUST_LOG=debug)
2. Note platform and version
3. Record exact steps to reproduce
4. Include error messages
5. Check if it's a known limitation (see SCREENSHOT_IMPLEMENTATION.md)

## Reference

- Implementation: `/Users/elad/PROJ/kui/src-tauri/src/screenshot.rs`
- Documentation: `/Users/elad/PROJ/kui/src-tauri/SCREENSHOT_IMPLEMENTATION.md`
- Summary: `/Users/elad/PROJ/kui/src-tauri/SCREENSHOT_SUMMARY.md`
