# Claude Guide for Kui Development

This guide helps AI assistants understand and work effectively with the Kui codebase.

## Project Overview

Kui is a framework that enhances command-line interfaces with graphical elements. It transforms traditional ASCII terminal output into interactive, visual experiences. The primary use case is Kubernetes tooling, where `kubectl` commands are enhanced with sortable tables, clickable elements, and rich visualizations.

**Key Facts:**

- Built with TypeScript, React, and Rust (Tauri)
- Successfully migrated from Electron to Tauri (migration complete)
- Monorepo structure with multiple packages and plugins
- 2-3x faster than native `kubectl` for many operations
- Supports desktop apps (Tauri primary, Electron legacy) and web-based deployments
- Tauri provides 10x smaller bundles, 50% less memory, and 4x faster startup
## Documentation Map

Kui has comprehensive documentation organized by audience:

### For End Users
- **[User Guide](TAURI_USER_GUIDE.md)** - Complete guide for installing and using Kui
  - Installation instructions (macOS, Windows, Linux)
  - Getting started and first run
  - Using Kui with Kubernetes
  - Troubleshooting and FAQ

- **[Migration Guide](docs/MIGRATING_TO_TAURI.md)** - Upgrading from Electron to Tauri
  - What's changed (nothing user-facing!)
  - Installation and upgrade process
  - Performance improvements
  - Troubleshooting migration issues

### For Developers
- **[Developer Guide](TAURI_DEVELOPER_GUIDE.md)** - Complete guide for contributing to Kui
  - Development setup (all platforms)
  - Architecture overview
  - Building and testing
  - Adding features and IPC commands
  - Debugging and optimization
  - Contributing guidelines

- **[This File (CLAUDE.md)]** - Quick reference for AI assistants
  - Project structure and key concepts
  - Common development patterns
  - Quick start for making changes

### Technical Documentation
- **[Tauri Migration](TAURI_MIGRATION.md)** - Technical details of the Tauri migration
  - Architecture comparison (Electron vs Tauri)
  - Implementation details
  - Performance benchmarks
  - Platform-specific considerations

- **[Tauri Bridge Usage](docs/TAURI-BRIDGE-USAGE.md)** - IPC communication guide
  - Using the unified IPC bridge
  - Command patterns
  - Event handling
  - Error management

- **[Dual Runtime Plugins](docs/DUAL-RUNTIME-PLUGINS.md)** - Plugin compatibility
  - Supporting both Tauri and Electron
  - Runtime detection
  - Migration patterns for plugins

### API and Features
- **[API Documentation](docs/api/README.md)** - Complete API reference
- **[Features Documentation](docs/features/)** - Feature-specific guides
- **[Plugin Development](TAURI_DEVELOPER_GUIDE.md#adding-features)** - Creating plugins


## Repository Structure

```
kui/
├── src-tauri/          # Rust backend (Tauri) - PRIMARY RUNTIME
│   ├── Cargo.toml     # Rust dependencies
│   ├── tauri.conf.json # Tauri configuration
│   ├── icons/         # Application icons
│   ├── capabilities/  # Security capabilities
│   └── src/           # Rust source code
│       ├── main.rs    # Main entry point
│       ├── commands.rs # Command handlers
│       ├── ipc.rs     # IPC utilities
│       ├── menu.rs    # Menu management
│       ├── window.rs  # Window utilities
│       └── screenshot.rs # Screenshot functionality
├── packages/           # Core framework components
│   ├── core/          # Core APIs, REPL, command processing
│   │   └── src/main/
│   │       └── tauri-bridge.ts  # Unified IPC bridge
│   ├── builder/       # Build tools for Electron apps (legacy)
│   ├── react/         # React components and UI framework
│   ├── webpack/       # Webpack configuration and loaders
│   ├── proxy/         # Client-server proxy support
│   └── test/          # Testing infrastructure
├── plugins/           # Feature plugins
│   ├── plugin-kubectl/         # Kubernetes enhancements
│   ├── plugin-bash-like/       # Bash-like shell features
│   ├── plugin-client-*/        # Client implementations
│   ├── plugin-*-themes/        # Theme providers
│   └── [others]/              # Git, S3, Electron, etc.
└── docs/              # API and technical documentation
    ├── TAURI-BRIDGE-USAGE.md   # IPC bridge documentation
    ├── MIGRATING_TO_TAURI.md   # User migration guide
    ├── DUAL-RUNTIME-PLUGINS.md # Plugin compatibility
    ├── api/                     # API reference
    └── features/                # Feature documentation
```

## Core Architecture

### Command Processing Flow

1. User enters command in REPL
2. Command parsed by `@kui-shell/core`
3. Matched against registered command handlers
4. Handler executes and returns response
5. Response rendered based on type (Table, HTML, Terminal, etc.)

### Response Types

Kui supports multiple response formats:

- **Table**: Sortable, filterable data tables
- **MultiModalResponse**: Rich content with multiple modes/views
- **Terminal/XtermResponse**: Traditional terminal output
- **HTML/React**: Custom rendered components
- **NavResponse**: Navigation and drilldown experiences

### Plugin System

Plugins extend Kui functionality through:

- **Command Registration**: Add new CLI commands
- **Mode Registration**: Add views/tabs to responses
- **Badge Registration**: Add status indicators
- **Theme Registration**: Custom visual themes
- **Preload Registration**: Initialization hooks

Each plugin exports a `preload` function that receives a `Registrar` to register its capabilities.

## Key Packages

### @kui-shell/core

The foundation of Kui. Contains:

- REPL (Read-Eval-Print-Loop) implementation
- Command registration and routing
- Event system
- Plugin loading mechanism
- Core response types (Table, Cell, Row)
- **Tauri Bridge**: Unified IPC for Electron and Tauri

**Important files:**

- `src/repl/exec.ts` - Command execution
- `src/core/command-tree.ts` - Command routing
- `src/models/` - Core data models
- `src/main/tauri-bridge.ts` - IPC abstraction layer

### @kui-shell/react

React components for the UI:

- Client shell and tab management
- Card/Table renderers
- Terminal (xterm.js) integration
- Split views and layouts

### @kui-shell/plugin-kubectl

The most feature-rich plugin, providing:

- Enhanced kubectl command output
- Resource drilldown and navigation
- YAML/JSON editors with validation
- Pod logs with streaming
- Helm, odo, and oc integration

## Development Workflow

### Setup

```bash
npm ci                  # Install dependencies
npm run compile         # Build TypeScript
npm run link            # Link packages (compatibility command)
```

### Prerequisites for Tauri Development

**Rust Toolchain:**

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Verify installation
rustc --version
cargo --version
```
For complete setup instructions, see [TAURI_DEVELOPER_GUIDE.md](TAURI_DEVELOPER_GUIDE.md#development-setup).


**Platform Dependencies:**

- **macOS**: Xcode Command Line Tools (`xcode-select --install`)
- **Linux**: GTK3, WebKit2GTK, and development libraries (see [TAURI_MIGRATION.md](TAURI_MIGRATION.md))
- **Windows**: Microsoft Visual C++ Build Tools, WebView2 Runtime

### Development Mode

```bash
# Tauri development (RECOMMENDED)
npm run open            # Starts both webpack dev server and Tauri app

# Or separately
npm run watch:browser   # Terminal 1: Webpack dev server
npm run tauri:dev      # Terminal 2: Tauri app

# Browser-only mode (for frontend development)
npm run watch:browser
# Then open http://localhost:9080
```

### Building

**Tauri (Primary):**

```bash
npm run build:tauri:mac:amd64    # Mac Intel
npm run build:tauri:mac:arm64    # Mac Apple Silicon
npm run build:tauri:linux:amd64  # Linux x64
npm run build:tauri:linux:arm64  # Linux ARM64
npm run build:tauri:win32:amd64  # Windows x64
```

**Electron (Legacy):**

```bash
npm run build:electron:mac:amd64    # Mac Intel
npm run build:electron:mac:arm64    # Mac Apple Silicon
npm run build:electron:linux:amd64  # Linux x64
npm run build:electron:win32:amd64  # Windows x64
```

**Build Output:**

- Tauri: `src-tauri/target/release/bundle/`
- Electron: `dist/electron/Kui-*/`

### Testing

```bash
# Full test suite
npm run test

# Tauri-specific tests
npm run test:tauri:unit          # Unit tests
npm run test:tauri:e2e           # End-to-end tests
npm run test:tauri:integration   # Integration tests
npm run test:tauri:performance   # Performance benchmarks
npm run test:tauri:all           # All Tauri tests

# Browser tests
npm run test:browser

# Legacy Electron tests
npm run test1           # Run with PORT_OFFSET=0
```

## Making Changes

### Adding a Command

1. Create command handler in appropriate plugin
2. Define command registration in plugin's `preload`
3. Implement command logic with proper response type
4. Add tests in plugin's test directory

Example:

```typescript
export default async (commandTree: Registrar) => {
  commandTree.listen(
    '/mycommand',
    async ({ command, parsedOptions, execOptions }) => {
      // Command logic here
      return 'Response'
    },
    {
      usage: {
        docs: 'Description of command'
      }
    }
  )
}
```

### Modifying UI Components

1. Locate React component in `packages/react` or plugin
2. Ensure TypeScript types are maintained
3. Test in both Tauri and browser contexts
4. Verify theme compatibility

### Working with IPC (Tauri Bridge)

**IMPORTANT**: Always use the Tauri bridge for IPC communication. Never import Electron directly.

**Correct:**

```typescript
import { getIpcRenderer } from '@kui-shell/core/src/main/tauri-bridge'

const ipc = getIpcRenderer()
const result = await ipc.invoke('my-channel', data)
```

**Incorrect:**

```typescript
const { ipcRenderer } = require('electron') // ❌ Don't do this
For complete IPC documentation, see [docs/TAURI-BRIDGE-USAGE.md](docs/TAURI-BRIDGE-USAGE.md).

```

**Runtime Detection:**

```typescript
import { isTauriRuntime, isElectronRuntime } from '@kui-shell/core/src/main/tauri-bridge'

if (isTauriRuntime()) {
  // Tauri-specific code
} else if (isElectronRuntime()) {
  // Electron-specific code
}
```

### Adding Tauri Backend Features

When adding features that require native functionality:

1. **Define Rust command** in `src-tauri/src/commands.rs`:

```rust
#[tauri::command]
async fn my_command(param: String) -> Result<String, String> {
    Ok(format!("Processed: {}", param))
For complete backend development guide, see [TAURI_DEVELOPER_GUIDE.md](TAURI_DEVELOPER_GUIDE.md#adding-features).

}
```

2. **Register command** in `src-tauri/src/main.rs`:

```rust
.invoke_handler(tauri::generate_handler![
    my_command,
    // ... other commands
])
```

3. **Add TypeScript types** to bridge
4. **Document** in `docs/TAURI-BRIDGE-USAGE.md`
5. **Add tests**

### Working with Kubernetes Resources

The kubectl plugin provides utilities for:

- Resource fetching: `src/controller/kubectl/exec.ts`
- Resource formatting: `src/view/modes/`
- Resource navigation: `src/controller/kubectl/drilldown.ts`

## Common Patterns

### Async Command Handlers

Commands can return promises. Kui handles loading states automatically:

```typescript
commandTree.listen('/async-cmd', async () => {
  const data = await fetchData()
  return formatAsTable(data)
})
```

### Multi-Modal Responses

Provide multiple views for a single resource:

```typescript
return {
  apiVersion: 'kui-shell/v1',
  kind: 'NavResponse',
  breadcrumbs: [...],
  menus: [...],
  links: [...],
  resource: myResource
}
```

### Streaming Responses

For long-running operations:

```typescript
return {
  apiVersion: 'kui-shell/v1',
  kind: 'XtermResponse',
  rows: [
    {
      cells: [
        {
          apiVersion: 'kui-shell/v1',
          kind: 'XtermResponseCell',
          ptyProcess: childProcess
        }
      ]
    }
  ]
}
```

## Important Conventions

1. **TypeScript strict mode**: All code uses strict type checking
2. **Linting**: ESLint and Prettier are enforced via pre-commit hooks
3. **Exports**: Use explicit exports, avoid `export *`
4. **Error handling**: Use `UsageError` for user-facing errors
5. **Internationalization**: Use i18n strings where user-facing
6. **IPC Communication**: Always use Tauri bridge, never import Electron directly
7. **Runtime Detection**: Use bridge utilities for detecting Tauri vs Electron
8. **Rust Code**: Follow Rust best practices, run `cargo fmt` and `cargo clippy`

## Testing Guidelines

- Unit tests alongside source files
- Integration tests in `tests/` directories
- Browser tests use headless Chrome
- Tauri tests use Playwright
- Test both Tauri and browser modes when possible

Test files follow pattern: `*.spec.ts` or located in `tests/` directories

## Build System

### Webpack Configuration

- Main config: `packages/webpack/`
- Custom loaders for Monaco, WASM, etc.
- Tree-shaking enabled for production
- Source maps in development

### Tauri Packaging (Primary)

- **Backend**: `src-tauri/` (Rust)
- **Configuration**: `src-tauri/tauri.conf.json`
- **Icons**: `src-tauri/icons/`
- **Capabilities**: `src-tauri/capabilities/` (security permissions)
- **Build output**: `src-tauri/target/release/bundle/`
- **Platform bundles**: DMG (macOS), DEB/AppImage (Linux), MSI (Windows)
- **Bundle size**: ~15 MB (10x smaller than Electron)
- **Startup time**: ~0.5s (4x faster than Electron)
- **Memory usage**: ~80 MB (50% less than Electron)

### Electron Packaging (Legacy)

- **Builder**: `packages/builder/`
- **Icons and assets**: Set via `seticon.js`
- **Platform-specific handling** for PTY, native modules
- **Code signing** for macOS
- **Status**: Maintained for compatibility, Tauri is recommended

## Tauri vs Electron

### Why Tauri?

**Benefits:**

- **10x smaller bundle size** (~15 MB vs ~150 MB)
- **50% less memory usage** (~80 MB vs ~150 MB)
- **4x faster startup** (~0.5s vs ~2s)
- **Better security** (Rust memory safety, no Node.js in renderer)
- **Modern architecture** (uses system webview)
- **Active development** (strong community support)

### Migration Status

Migration is **COMPLETE**. Tauri is now the primary runtime:

```bash
# Run with Tauri (recommended)
npm run open

# Run with Electron (legacy, for compatibility testing)
npm run open:electron
```

See [TAURI_MIGRATION.md](TAURI_MIGRATION.md) for technical details and [docs/MIGRATING_TO_TAURI.md](docs/MIGRATING_TO_TAURI.md) for user guide.

### Feature Parity

All Electron features have been implemented in Tauri:

- ✅ Window management
- ✅ Menu system (native menus on all platforms)
- ✅ IPC communication (via Tauri bridge)
- ✅ Clipboard operations
- ✅ Screenshot capture (macOS/Linux full, Windows partial)
- ✅ File dialogs
- ✅ Shell command execution
- ✅ External URL opening
- ✅ All plugins working

## Performance Considerations

1. **Lazy loading**: Plugins loaded on demand
2. **Virtual scrolling**: For large tables
3. **Web workers**: For heavy computation
4. **Streaming**: For large datasets
5. **Caching**: Command output caching where appropriate
6. **Rust backend**: Native performance for backend operations
7. **System webview**: Shared with OS, no separate Chromium bundle

## Debugging

### Tauri DevTools

```bash
# Enable Rust logging
export RUST_LOG=debug
npm run open

# Frontend debugging (browser DevTools available in app)
npm run open  # DevTools available via menu or Cmd+Shift+I
```

### Browser Mode

```bash
npm run watch:browser  # Accessible at localhost:9080
```

### Logs

- Tauri backend logs: Console output when `RUST_LOG=debug`
- Tauri frontend logs: Browser DevTools in app
- PTY issues: Enable debug mode in settings
- Command execution: Use REPL debug commands
- IPC debugging: `localStorage.debug = 'main/tauri-bridge'`

## Common Issues

### Build Failures

- **Clear dist**: `npm run compile:clean`
- **Rebuild node modules**: `npm run pty:rebuild`
- **Clear cache**: Remove `node_modules` and reinstall
- **Rust issues**: Run `cargo clean` in `src-tauri/`
For detailed troubleshooting, see [TAURI_USER_GUIDE.md#troubleshooting](TAURI_USER_GUIDE.md#troubleshooting).

- **Missing dependencies**: See [TAURI_MIGRATION.md](TAURI_MIGRATION.md) for platform-specific requirements

### Test Failures

- **Port conflicts**: Adjust `PORT_OFFSET`
- **Timing issues**: Increase timeouts in test specs
- **Browser issues**: Update Chrome/Playwright version
- **Tauri tests**: Ensure Rust toolchain is installed

### Module Resolution

- Check `tsconfig.json` paths
- Verify package.json exports
- Ensure `npm run link` has been run
- Check Tauri bridge imports are correct

### Tauri-Specific Issues

- **WebView errors**: Install platform webview (WebKit2GTK on Linux, WebView2 on Windows)
- **Rust compilation errors**: Run `cargo clippy` for diagnostics
- **IPC failures**: Check command is registered in `tauri::generate_handler![]`
- **Menu not working**: Verify menu setup in `src-tauri/src/menu.rs`

## Git Workflow

1. Branch from master
2. Make focused commits
3. Run tests before pushing
4. PR with clear description
5. Address review feedback

## Resources

### Primary Documentation

- **[User Guide](TAURI_USER_GUIDE.md)** - Complete guide for end users
- **[Developer Guide](TAURI_DEVELOPER_GUIDE.md)** - Complete guide for developers
- **[This File (CLAUDE.md)]** - Quick reference for AI assistants

### Technical Documentation

- **[Tauri Migration](TAURI_MIGRATION.md)** - Technical migration details
- **[Tauri Bridge Usage](docs/TAURI-BRIDGE-USAGE.md)** - IPC communication
- **[Dual Runtime Plugins](docs/DUAL-RUNTIME-PLUGINS.md)** - Plugin compatibility
- **[API Documentation](docs/api/README.md)** - API reference

### Migration and Guides

- **[User Migration Guide](docs/MIGRATING_TO_TAURI.md)** - Upgrading from Electron
- **[Features Documentation](docs/features/)** - Feature-specific guides
- **[Medium Blog](https://medium.com/the-graphical-terminal)** - Articles and updates

### External Resources

- **[Tauri Documentation](https://tauri.app)** - Tauri framework
- **[Rust Book](https://doc.rust-lang.org/book/)** - Learning Rust
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** - TypeScript docs
- **[React Documentation](https://react.dev/)** - React framework

### Repository Resources

- **[GitHub Repository](https://github.com/kubernetes-sigs/kui)** - Source code
- **[Issues](https://github.com/IBM/kui/issues)** - Bug reports and features
- **[Discussions](https://github.com/IBM/kui/discussions)** - Questions and ideas
- **[Template Repository](https://github.com/kui-shell/KuiClientTemplate)** - Custom CLI template

## Quick Reference

**File Search:**

- Command handlers: `plugins/*/src/controller/`
- UI components: `packages/react/src/` or `plugins/*/src/view/`
- Tests: `*/tests/` or `*.spec.ts`
- Types: `*/src/**/*.d.ts`
- Tauri backend: `src-tauri/src/*.rs`
- IPC bridge: `packages/core/src/main/tauri-bridge.ts`

**Key Concepts:**

- **REPL**: Read-Eval-Print-Loop (the command processor)
- **Tab**: A workspace with command history
- **Block**: A single command execution
- **Split**: Side-by-side view layout
- **Mode**: A view/tab within a response
- **Bridge**: Unified IPC layer (Electron/Tauri compatibility)
- **Runtime**: Execution environment (Tauri, Electron, or Browser)

**Common Commands:**
```bash
# Development
npm run open              # Start Tauri dev mode
npm run watch:browser    # Start browser dev mode
npm run compile          # Compile TypeScript

# Building
npm run build:tauri:mac:amd64   # Build for macOS Intel
npm run build:tauri:mac:arm64   # Build for macOS Apple Silicon
npm run build:tauri:linux:amd64 # Build for Linux

# Testing
npm run test              # All tests
npm run test:tauri:all   # All Tauri tests
npm run lint             # Lint code

# Rust
cd src-tauri
cargo check              # Check compilation
cargo build --release   # Release build
cargo test              # Run tests
cargo fmt               # Format code
cargo clippy            # Lint code
```

## Contributing Philosophy

Kui values:

**Documentation Status**: Complete and comprehensive ✅
- **Performance**: Fast startup, fast command execution (Tauri helps achieve this)
- **Extensibility**: Plugin-based architecture
- **Flexibility**: Support Tauri (primary), Electron (legacy), and browser
- **Polish**: Smooth animations, responsive UI
- **Developer experience**: Clear APIs, good documentation
- **Security**: Rust memory safety, secure IPC
- **Modern stack**: TypeScript, React, Rust, Tauri

## Best Practices for Tauri Development

1. **Always use the Tauri bridge** for IPC - never import Electron directly
2. **Test in both Tauri and browser modes** - ensure compatibility
3. **Follow Rust conventions** - use `cargo fmt` and `cargo clippy`
4. **Document IPC commands** - update docs/TAURI-BRIDGE-USAGE.md
5. **Consider security** - use Tauri's capability system properly
6. **Optimize for performance** - leverage Rust backend for heavy operations
7. **Handle errors gracefully** - use Result types in Rust
8. **Keep bundles small** - avoid unnecessary dependencies
9. **Test cross-platform** - verify on macOS, Linux, and Windows when possible
10. **Update documentation** - keep docs in sync with code changes

---

**Primary Runtime**: Tauri ✅
**Migration Status**: Complete ✅
**Recommended for**: New development and production use
**Last Updated**: 2025-12-17
