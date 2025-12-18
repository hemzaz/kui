# Monaco Editor v0.52 Modern Features in Kui

## Overview

Kui now leverages the latest Monaco Editor v0.52 features to provide a superior code editing experience. This document describes the modern features available, how to use them, and how to configure them.

## Features Available

### 1. Sticky Scroll 📌

**What it does**: Keeps important context (function names, class declarations, block structures) visible at the top of the editor while you scroll through long files.

**When it's enabled**:
- ✅ Full editor mode
- ❌ Simple editor mode (disabled for minimal UI)

**How to use**:
1. Open a long file (e.g., a Kubernetes deployment YAML with multiple resources)
2. Scroll down through the file
3. Notice the context (resource kind, metadata name) stays "stuck" at the top
4. Up to 5 context lines are shown

**Configuration**:
```typescript
stickyScroll: {
  enabled: true,
  maxLineCount: 5,
  defaultModel: 'outlineModel',
  scrollWithEditor: true
}
```

**Use cases**:
- Long Kubernetes manifests with multiple resources
- TypeScript files with many functions/classes
- JSON/YAML configuration files with nested structures

---

### 2. Bracket Pair Colorization 🌈

**What it does**: Automatically colors matching brackets, braces, and parentheses with the same color, making it easy to identify matching pairs in nested structures.

**When it's enabled**:
- ✅ Full editor mode
- ❌ Simple editor mode

**How to use**:
1. Open a file with nested structures (JSON, YAML, TypeScript)
2. Notice matching brackets have the same color
3. Different bracket types get different colors
4. Easier to spot mismatched brackets

**Configuration**:
```typescript
bracketPairColorization: {
  enabled: true,
  independentColorPoolPerBracketType: true
}
```

**Use cases**:
- Nested JSON configuration files
- YAML with complex list and map structures
- TypeScript/JavaScript with nested functions and objects
- Kubernetes manifests with spec sections

---

### 3. Bracket Pair Guides 📏

**What it does**: Draws vertical and horizontal lines connecting matching bracket pairs, making structure immediately visible.

**When it's enabled**:
- ✅ All editor modes (always on)

**How to use**:
1. Open a file with brackets
2. Notice vertical lines connecting opening and closing brackets
3. When cursor is inside brackets, horizontal lines highlight the pair
4. Active bracket pair is highlighted

**Configuration**:
```typescript
guides: {
  bracketPairs: true,
  bracketPairsHorizontal: 'active',
  highlightActiveBracketPair: true
}
```

**Use cases**:
- Navigating deeply nested JSON
- Understanding YAML structure hierarchy
- Identifying code block boundaries
- Finding mismatched brackets quickly

---

### 4. Inlay Hints 💡

**What it does**: Shows parameter names, type hints, and other contextual information inline with your code.

**When it's enabled**:
- ✅ Full editor mode
- ❌ Simple editor mode
- 🔄 Toggle visibility with Alt key

**How to use**:
1. Open a TypeScript/JavaScript file
2. See parameter names shown inline for function calls
3. See type hints for variables
4. Press and hold **Alt** to temporarily hide hints
5. Release **Alt** to show hints again

**Configuration**:
```typescript
inlayHints: {
  enabled: 'onUnlessPressed', // Show hints, hide when Alt pressed
  fontSize: Math.floor(editorFontSize * 0.9), // 90% of editor font
  fontFamily: 'var(--font-monospace)',
  padding: true
}
```

**Use cases**:
- TypeScript development with type information
- JavaScript function calls with parameter hints
- Understanding complex function signatures
- Learning unfamiliar APIs

---

### 5. Inline Suggestions 👻

**What it does**: Shows "ghost text" autocomplete suggestions as you type, similar to GitHub Copilot's inline suggestions.

**When it's enabled**:
- ✅ Full editor mode (editable files only)
- ❌ Simple editor mode
- ❌ Read-only mode

**How to use**:
1. Start typing in an editable file
2. Monaco suggests completions as ghost text
3. Press **Tab** or **→** to accept the suggestion
4. Press **Esc** to dismiss
5. Hover over the suggestion to see a toolbar with options

**Configuration**:
```typescript
inlineSuggest: {
  enabled: true,
  mode: 'subwordSmart', // Smart subword matching
  showToolbar: 'onHover',
  suppressSuggestions: false,
  keepOnBlur: false
}
```

**Use cases**:
- Faster code completion
- Property name suggestions in JSON/YAML
- Variable name autocomplete
- Repetitive text entry

---

### 6. Smooth Scrolling 🎨

**What it does**: Adds smooth animation when scrolling through files, making navigation feel more polished.

**When it's enabled**:
- ✅ All editor modes (always on)

**How to use**:
1. Open any file
2. Scroll using mouse wheel, trackpad, or scrollbar
3. Notice smooth animation instead of instant jumps

**Configuration**:
```typescript
smoothScrolling: true
```

**Use cases**:
- Better visual feedback when scrolling
- Easier to track where you are in the file
- More polished user experience

---

### 7. Multi-Cursor Enhancements ✏️

**What it does**: Improved multi-cursor editing with better paste behavior and easier cursor placement.

**When it's enabled**:
- ✅ All editor modes (always on)

**How to use**:
1. **Alt+Click** to add a cursor at any position
2. **Cmd+Alt+↑/↓** (Mac) or **Ctrl+Alt+↑/↓** (Win/Linux) for vertical cursors
3. When pasting with multiple cursors, content spreads across cursors
4. Select text and **Cmd+D** (Mac) or **Ctrl+D** (Win/Linux) to add next occurrence

**Configuration**:
```typescript
multiCursorModifier: 'alt', // Alt+Click for multi-cursor
multiCursorPaste: 'spread' // Spread paste across cursors
```

**Use cases**:
- Batch editing similar lines
- Renaming variables in multiple places
- Adding similar content to multiple locations
- Formatting multiple lines simultaneously

---

### 8. Enhanced Find/Replace 🔍

**What it does**: Smarter find/replace with automatic scoping and better search seeding.

**When it's enabled**:
- ✅ All editor modes (always on)

**How to use**:
1. Select text and press **Cmd+F** (Mac) or **Ctrl+F** (Win/Linux)
2. Selected text is automatically used as search query
3. For multiline selections, search automatically scopes to selection
4. Find widget has extra space for better visibility

**Configuration**:
```typescript
find: {
  addExtraSpaceOnTop: true,
  autoFindInSelection: 'multiline',
  seedSearchStringFromSelection: 'selection'
}
```

**Use cases**:
- Finding text within a specific YAML section
- Replacing within selected code block
- Quick search for selected identifier
- Scoped search and replace operations

---

## Feature Matrix by Editor Mode

| Feature | Simple Mode | Full Mode | Read-only |
|---------|:-----------:|:---------:|:---------:|
| **Sticky Scroll** | ❌ | ✅ | ✅ |
| **Bracket Colorization** | ❌ | ✅ | ✅ |
| **Bracket Guides** | ✅ | ✅ | ✅ |
| **Inlay Hints** | ❌ | ✅ | ✅ |
| **Inline Suggestions** | ❌ | ✅ | ❌ |
| **Smooth Scrolling** | ✅ | ✅ | ✅ |
| **Multi-cursor** | ✅ | ✅ | ✅ |
| **Enhanced Find** | ✅ | ✅ | ✅ |

### Editor Modes Explained

- **Simple Mode**: Inline editors with minimal UI, used for small edits
- **Full Mode**: Full-featured editor with all capabilities
- **Read-only**: View-only mode, no editing allowed

---

## Keyboard Shortcuts

### New in Monaco v0.52

| Shortcut | Action | Platform |
|----------|--------|----------|
| **Alt+Click** | Add cursor at position | All |
| **Alt (hold)** | Hide inlay hints temporarily | All |
| **Cmd+Alt+↑/↓** | Add cursor above/below | macOS |
| **Ctrl+Alt+↑/↓** | Add cursor above/below | Win/Linux |
| **Cmd+D** | Add next occurrence to selection | macOS |
| **Ctrl+D** | Add next occurrence to selection | Win/Linux |
| **Tab** | Accept inline suggestion | All |
| **→** | Accept inline suggestion | All |
| **Esc** | Dismiss inline suggestion | All |

### Existing Shortcuts (still work)

| Shortcut | Action | Platform |
|----------|--------|----------|
| **Cmd+F** | Find | macOS |
| **Ctrl+F** | Find | Win/Linux |
| **Cmd+H** | Replace | macOS |
| **Ctrl+H** | Replace | Win/Linux |
| **Cmd+G** | Find next | macOS |
| **F3** | Find next | Win/Linux |
| **Cmd+Shift+G** | Find previous | macOS |
| **Shift+F3** | Find previous | Win/Linux |

---

## Customization

### Disabling Features

If you want to disable specific features, you can modify the editor options in your code:

```typescript
import defaultMonacoOptions from '@kui-shell/plugin-client-common/src/components/Content/Editor/lib/defaults'

// Get default options
const options = defaultMonacoOptions({ simple: false })

// Customize as needed
const customOptions = {
  ...options,
  stickyScroll: { enabled: false }, // Disable sticky scroll
  bracketPairColorization: { enabled: false }, // Disable bracket colorization
  inlayHints: { enabled: 'off' } // Disable inlay hints
}
```

### Per-Language Configuration

Some features work better with certain languages:

- **Inlay Hints**: Most useful for TypeScript, JavaScript
- **Sticky Scroll**: Great for YAML, JSON, TypeScript, Python
- **Bracket Guides**: Essential for JSON, YAML, any nested structures
- **Inline Suggestions**: Helpful for all languages

---

## Performance Considerations

All features have been optimized for performance:

1. **Sticky Scroll**: Uses efficient outline model, minimal overhead
2. **Bracket Colorization**: Independent color pools prevent performance issues
3. **Inlay Hints**: 90% font size reduces visual clutter
4. **Inline Suggestions**: Only enabled in editable mode

### Performance Metrics

Expected performance characteristics:

- **Editor startup**: < 100ms additional time
- **Typing latency**: < 10ms with all features enabled
- **Memory overhead**: < 5MB per editor instance
- **Scrolling**: 60 FPS with smooth scrolling

---

## Browser Compatibility

All features work in modern browsers:

- ✅ Chrome/Chromium 90+ (Tauri webview)
- ✅ Safari 14+ (macOS Tauri webview)
- ✅ Edge 90+ (Windows Tauri webview)
- ✅ Firefox 88+ (browser mode)

---

## Troubleshooting

### Sticky Scroll Not Working

**Problem**: Sticky scroll doesn't show context lines

**Solutions**:
1. Verify you're in full editor mode (not simple mode)
2. Check the file has structure (functions, classes, YAML resources)
3. Try scrolling further down to see the effect

### Bracket Colors Not Showing

**Problem**: Brackets all look the same color

**Solutions**:
1. Ensure you're in full editor mode
2. Check your theme supports bracket colorization
3. Verify the file contains brackets, braces, or parentheses

### Inlay Hints Not Appearing

**Problem**: No parameter names or type hints shown

**Solutions**:
1. Make sure you're editing a TypeScript/JavaScript file
2. Verify you're in full editor mode
3. Check if you're holding the Alt key (which hides hints)
4. Ensure the language server has type information

### Inline Suggestions Not Working

**Problem**: No ghost text suggestions appear

**Solutions**:
1. Verify you're in full editor mode
2. Ensure the file is editable (not read-only)
3. Check that quick suggestions aren't disabled
4. Try typing more characters to trigger suggestions

---

## Examples

### Example 1: Editing Kubernetes YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment    # Sticky scroll shows this context
spec:
  replicas: 3
  selector:
    matchLabels:           # Bracket guides show structure
      app: nginx           # Inline suggestions help complete
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:          # Bracket colorization helps navigation
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80
```

**Features in action**:
- **Sticky scroll**: Shows "metadata: name: nginx-deployment" at top when scrolled
- **Bracket guides**: Vertical lines show yaml structure hierarchy
- **Bracket colorization**: Lists and maps have distinct colors
- **Enhanced find**: Select "nginx" and press Cmd+F to find all occurrences

### Example 2: Editing TypeScript

```typescript
function calculateTotal(
  items: Item[],        // Inlay hints show parameter types
  discount: number,
  tax: number
): number {            // Sticky scroll keeps function signature visible
  const subtotal = items.reduce((sum, item) => {
    return sum + item.price * item.quantity
  }, 0)               // Bracket guides show closure structure

  const discounted = subtotal * (1 - discount)
  const total = discounted * (1 + tax)

  return total       // Multi-cursor: Alt+Click multiple lines
}
```

**Features in action**:
- **Inlay hints**: Shows `:Item[]`, `:number` parameter types
- **Sticky scroll**: Keeps "function calculateTotal" visible when scrolled
- **Bracket colorization**: Different colors for function, reduce callback, object
- **Multi-cursor**: Alt+Click to edit multiple lines simultaneously
- **Inline suggestions**: Ghost text suggests "return" statement completion

---

## Additional Resources

- **Monaco Editor Documentation**: https://microsoft.github.io/monaco-editor/
- **Monaco API Reference**: https://microsoft.github.io/monaco-editor/docs.html
- **VS Code Editing Features**: https://code.visualstudio.com/docs/editor/codebasics
- **Kui Documentation**: See TAURI_DEVELOPER_GUIDE.md and TAURI_USER_GUIDE.md

---

## Feedback and Issues

If you encounter issues with Monaco v0.52 features:

1. Check this documentation for troubleshooting steps
2. Verify your editor mode (simple vs full)
3. Check browser console for error messages
4. File an issue on Kui's GitHub repository with:
   - Feature affected
   - Steps to reproduce
   - Editor mode and file type
   - Browser/platform information

---

**Document Version**: 1.0
**Last Updated**: 2025-12-17
**Monaco Version**: 0.52.2
**Kui Version**: 13.1.0
