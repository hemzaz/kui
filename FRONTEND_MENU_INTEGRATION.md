# Frontend Menu Integration Guide

This document explains how to integrate the Tauri menu system with Kui's frontend.

## Overview

The Tauri menu system emits events that the frontend must handle. All menu actions that affect the UI state are delegated to the frontend through these events.

## Required Event Listeners

### 1. Tab Management

```typescript
// New Tab
window.__TAURI__.event.listen('menu-new-tab', async () => {
  console.log('Menu: New Tab requested');
  // Your tab creation logic here
  // Example:
  // await createNewTab();
});

// Close Tab
window.__TAURI__.event.listen('menu-close-tab', async () => {
  console.log('Menu: Close Tab requested');
  // Your tab closing logic here
  // Example:
  // await closeCurrentTab();
});
```

### 2. Window Management

```typescript
// New Window
window.__TAURI__.event.listen('menu-new-window', async () => {
  console.log('Menu: New Window requested');
  // Create new window via Tauri command
  try {
    await window.__TAURI__.core.invoke('create_new_window', {
      argv: ['shell'],
      width: 1280,
      height: 960,
      title: 'Kui'
    });
  } catch (error) {
    console.error('Failed to create window:', error);
  }
});
```

### 3. Zoom Controls

```typescript
// Zoom In
window.__TAURI__.event.listen('menu-zoom-in', () => {
  console.log('Menu: Zoom In requested');
  // Increase zoom level
  const currentZoom = parseFloat(document.body.style.zoom || '1');
  const newZoom = Math.min(currentZoom + 0.1, 2.0); // Max 200%
  document.body.style.zoom = `${newZoom}`;
  localStorage.setItem('zoomLevel', newZoom.toString());
});

// Zoom Out
window.__TAURI__.event.listen('menu-zoom-out', () => {
  console.log('Menu: Zoom Out requested');
  // Decrease zoom level
  const currentZoom = parseFloat(document.body.style.zoom || '1');
  const newZoom = Math.max(currentZoom - 0.1, 0.5); // Min 50%
  document.body.style.zoom = `${newZoom}`;
  localStorage.setItem('zoomLevel', newZoom.toString());
});

// Reset Zoom
window.__TAURI__.event.listen('menu-zoom-reset', () => {
  console.log('Menu: Reset Zoom requested');
  // Reset zoom to 100%
  document.body.style.zoom = '1';
  localStorage.setItem('zoomLevel', '1');
});
```

### 4. About Dialog

```typescript
// Show About Dialog
window.__TAURI__.event.listen('menu-about', () => {
  console.log('Menu: About requested');
  // Show about dialog
  showAboutDialog();
});

function showAboutDialog() {
  // Example implementation
  const dialog = document.createElement('dialog');
  dialog.innerHTML = `
    <div class="about-dialog">
      <h1>Kui</h1>
      <p>Version: 13.1.0</p>
      <p>A hybrid command-line/GUI Kubernetes tool</p>
      <p>© 2025 The Kubernetes Authors</p>
      <button onclick="this.closest('dialog').close()">Close</button>
    </div>
  `;
  document.body.appendChild(dialog);
  dialog.showModal();
}
```

## Complete Integration Example

Here's a complete example of integrating all menu events:

```typescript
// File: packages/core/src/main/menu-integration.ts

/**
 * Initialize Tauri menu event listeners
 */
export function initializeMenuListeners() {
  if (!window.__TAURI__) {
    console.log('Not running in Tauri, skipping menu initialization');
    return;
  }

  console.log('Initializing Tauri menu listeners');

  // Tab management
  window.__TAURI__.event.listen('menu-new-tab', handleNewTab);
  window.__TAURI__.event.listen('menu-close-tab', handleCloseTab);

  // Window management
  window.__TAURI__.event.listen('menu-new-window', handleNewWindow);

  // Zoom controls
  window.__TAURI__.event.listen('menu-zoom-in', handleZoomIn);
  window.__TAURI__.event.listen('menu-zoom-out', handleZoomOut);
  window.__TAURI__.event.listen('menu-zoom-reset', handleZoomReset);

  // Help menu
  window.__TAURI__.event.listen('menu-about', handleAbout);

  // Restore saved zoom level
  restoreZoomLevel();
}

// Handler implementations
async function handleNewTab() {
  console.log('Creating new tab');
  // Implement your tab creation logic
  // This should integrate with your existing tab management
}

async function handleCloseTab() {
  console.log('Closing current tab');
  // Implement your tab closing logic
  // Should confirm if there are unsaved changes
}

async function handleNewWindow() {
  console.log('Creating new window');
  try {
    await window.__TAURI__.core.invoke('create_new_window', {
      argv: ['shell'],
      width: 1280,
      height: 960,
      title: 'Kui'
    });
  } catch (error) {
    console.error('Failed to create window:', error);
  }
}

function handleZoomIn() {
  const currentZoom = getZoomLevel();
  const newZoom = Math.min(currentZoom + 0.1, 2.0);
  setZoomLevel(newZoom);
  console.log(`Zoom increased to ${Math.round(newZoom * 100)}%`);
}

function handleZoomOut() {
  const currentZoom = getZoomLevel();
  const newZoom = Math.max(currentZoom - 0.1, 0.5);
  setZoomLevel(newZoom);
  console.log(`Zoom decreased to ${Math.round(newZoom * 100)}%`);
}

function handleZoomReset() {
  setZoomLevel(1.0);
  console.log('Zoom reset to 100%');
}

function handleAbout() {
  console.log('Showing about dialog');
  showAboutDialog();
}

// Zoom level management
function getZoomLevel(): number {
  const saved = localStorage.getItem('zoomLevel');
  return saved ? parseFloat(saved) : 1.0;
}

function setZoomLevel(level: number) {
  document.body.style.zoom = `${level}`;
  localStorage.setItem('zoomLevel', level.toString());
}

function restoreZoomLevel() {
  const savedZoom = getZoomLevel();
  if (savedZoom !== 1.0) {
    document.body.style.zoom = `${savedZoom}`;
    console.log(`Restored zoom level: ${Math.round(savedZoom * 100)}%`);
  }
}

function showAboutDialog() {
  // Implement based on your UI framework
  // React, Vue, vanilla JS, etc.
}
```

## Integration in Main Application

Call the initialization function when your application starts:

```typescript
// File: packages/core/src/main/index.ts

import { initializeMenuListeners } from './menu-integration';

// In your app initialization:
document.addEventListener('DOMContentLoaded', () => {
  // Other initialization...
  
  // Initialize menu listeners
  initializeMenuListeners();
  
  // Rest of your app...
});
```

## Menu Actions Handled by Backend

These menu items are handled entirely by the Tauri backend and don't require frontend listeners:

- **File > Quit**: Handled by Tauri
- **Edit menu**: All items (Undo, Redo, Cut, Copy, Paste, Select All) handled by OS
- **View > Toggle DevTools**: Handled by Tauri
- **View > Reload**: Handled by Tauri (reloads the webview)
- **Window > Minimize**: Handled by OS
- **Window > Close Window**: Handled by Tauri
- **Help > Documentation**: Opens URL in browser (handled by Tauri)

## Testing Menu Integration

### Manual Testing Checklist

1. **New Tab** (Cmd+T / Ctrl+T)
   - [ ] Creates new tab in current window
   - [ ] New tab shows default prompt
   - [ ] Focus switches to new tab

2. **New Window** (Cmd+N / Ctrl+N)
   - [ ] Opens new Kui window
   - [ ] New window is independent
   - [ ] Both windows function correctly

3. **Close Tab** (Cmd+W / Ctrl+W)
   - [ ] Closes current tab
   - [ ] Switches to adjacent tab
   - [ ] Confirms if unsaved changes exist

4. **Zoom Controls**
   - [ ] Zoom In increases size
   - [ ] Zoom Out decreases size
   - [ ] Reset Zoom returns to 100%
   - [ ] Zoom level persists across restarts

5. **About Dialog**
   - [ ] Shows app version
   - [ ] Shows copyright info
   - [ ] Can be dismissed

### Automated Testing

```typescript
describe('Menu Integration', () => {
  it('should handle new tab event', async () => {
    const handler = jest.fn();
    window.__TAURI__.event.listen('menu-new-tab', handler);
    
    // Simulate menu event
    window.__TAURI__.event.emit('menu-new-tab');
    
    expect(handler).toHaveBeenCalled();
  });

  it('should manage zoom level', () => {
    setZoomLevel(1.5);
    expect(getZoomLevel()).toBe(1.5);
    expect(document.body.style.zoom).toBe('1.5');
  });

  // Add more tests...
});
```

## Debugging

### Enable Debug Logging

```typescript
// Add to your initialization:
window.__TAURI__.event.listen('menu-new-tab', () => {
  console.log('[DEBUG] Menu event: new-tab');
  // ... rest of handler
});
```

### Check Event Registration

```typescript
// Verify events are being received:
window.__TAURI__.event.listen('*', (event) => {
  console.log('Event received:', event);
});
```

### Test Menu Programmatically

```typescript
// Manually trigger menu events for testing:
window.__TAURI__.event.emit('menu-new-tab');
window.__TAURI__.event.emit('menu-zoom-in');
```

## Common Issues

### Issue: Events not firing
**Solution**: Ensure `initializeMenuListeners()` is called after Tauri is loaded

### Issue: Zoom not persisting
**Solution**: Check localStorage is working and not blocked

### Issue: New window not opening
**Solution**: Verify `create_new_window` command is registered in Tauri

### Issue: Multiple listeners firing
**Solution**: Only call `initializeMenuListeners()` once

## Electron Compatibility

If supporting both Electron and Tauri, wrap menu initialization:

```typescript
export function initializeMenuListeners() {
  if (window.__TAURI__) {
    initializeTauriMenus();
  } else if (window.require) {
    initializeElectronMenus();
  }
}
```

## Next Steps

1. Copy the integration code to your frontend
2. Customize handlers to match your app's architecture
3. Test each menu item manually
4. Add automated tests
5. Handle edge cases (empty tabs, unsaved changes, etc.)

## Support

For issues or questions:
- Check Tauri docs: https://tauri.app
- Check Kui docs: https://github.com/kubernetes-sigs/kui
- Review menu.rs implementation: `src-tauri/src/menu.rs`

---

**Last Updated**: 2025-12-17
**Tauri Version**: 2.5
**Kui Version**: 13.1.0
