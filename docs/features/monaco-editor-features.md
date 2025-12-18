# Monaco Editor Features in Kui

## Overview

Kui uses Monaco Editor v0.52 (the code editor that powers VS Code) to provide a rich code editing experience for Kubernetes manifests, configuration files, and source code.

## Key Features

### Visual Enhancements

- **Bracket Pair Colorization**: Matching brackets share colors for easy identification
- **Bracket Pair Guides**: Visual lines connect matching bracket pairs
- **Sticky Scroll**: Context lines stay visible at the top while scrolling
- **Smooth Scrolling**: Animated scrolling for better visual feedback

### Code Intelligence

- **Inlay Hints**: Parameter names and type information shown inline
- **Inline Suggestions**: Ghost text autocomplete suggestions as you type
- **Syntax Highlighting**: Full syntax support for YAML, JSON, TypeScript, and more
- **Code Folding**: Collapse/expand code blocks

### Editing Capabilities

- **Multi-Cursor Editing**: Alt+Click to add cursors, spread paste across cursors
- **Enhanced Find/Replace**: Smart scoping and search seeding
- **Word Wrap**: Configurable word wrapping
- **Line Numbers**: Optional line number display

## Quick Start

### Opening Files in Editor

```bash
# View a Kubernetes resource in editor
kubectl get deploy nginx -o yaml | kui

# Edit a file
kui edit deployment/nginx
```

### Using Features

1. **Multi-Cursor**: Hold Alt and click to add cursors
2. **Toggle Hints**: Hold Alt to temporarily hide inlay hints
3. **Smart Find**: Select text, press Cmd+F (Mac) or Ctrl+F (Win/Linux)
4. **Accept Suggestions**: Press Tab or → to accept ghost text

## Editor Modes

### Full Mode

All features enabled, best for editing files:
- Sticky scroll
- Bracket colorization
- Inlay hints
- Inline suggestions

### Simple Mode

Minimal UI for inline editing:
- Basic editing only
- Bracket guides
- No sticky scroll or suggestions

### Read-Only Mode

View-only with visual aids:
- Sticky scroll
- Bracket colorization
- No inline suggestions

## Keyboard Shortcuts

| Action | macOS | Windows/Linux |
|--------|-------|---------------|
| Find | Cmd+F | Ctrl+F |
| Replace | Cmd+H | Ctrl+H |
| Multi-cursor | Alt+Click | Alt+Click |
| Add next occurrence | Cmd+D | Ctrl+D |
| Accept suggestion | Tab or → | Tab or → |
| Hide inlay hints | Hold Alt | Hold Alt |

## Supported Languages

- YAML (Kubernetes manifests)
- JSON (configuration files)
- TypeScript/JavaScript
- Markdown
- Shell scripts
- Python
- Go
- HTML/CSS
- and more...

## Performance

Monaco Editor in Kui is optimized for:
- Fast startup (< 100ms)
- Low latency typing (< 10ms)
- Smooth scrolling (60 FPS)
- Minimal memory overhead (< 5MB per editor)

## Configuration

Editor features are automatically configured based on:
- File type (language detection)
- Editor mode (simple vs full)
- Read-only status
- User preferences

## Learn More

- **Detailed Features**: See [MONACO-V052-FEATURES.md](/Users/elad/PROJ/kui/MONACO-V052-FEATURES.md)
- **Upgrade Notes**: See [MONACO-UPGRADE-NOTES.md](/Users/elad/PROJ/kui/MONACO-UPGRADE-NOTES.md)
- **Monaco Documentation**: https://microsoft.github.io/monaco-editor/

---

**Monaco Version**: 0.52.2
**Last Updated**: 2025-12-17
