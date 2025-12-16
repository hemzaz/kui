# Platform Integration Agents

Agents responsible for platform-specific integration (Tauri, Electron, build).

## Agent A51: Tauri Backend Agent

**Scope**: Rust backend, window management, native integration

**Location**: `src-tauri/src/`

**Key Responsibilities**:
- Tauri application lifecycle
- Window creation and management
- Native menu integration
- System tray support
- File system access

**Key Files**:
- `main.rs` - Application entry point
- `commands.rs` - IPC command handlers
- `window.rs` - Window utilities
- `menu.rs` - Menu management
- `ipc.rs` - IPC utilities

**Communication**:
- Receives IPC calls from **A11 Client Shell** (web view)
- Coordinates with **A52 IPC Agent** for communication
- Manages windows requested by **A11**

**Quality Standards**:
- Fast startup (< 0.5s)
- Low memory usage (< 80MB)
- Small bundle size (< 20MB)
- Cross-platform support (macOS, Linux, Windows)

---

## Agent A52: IPC Communication Agent

**Scope**: Inter-process communication between Rust and JavaScript

**Location**: `src-tauri/src/ipc.rs` and `packages/core/src/main/`

**Key Responsibilities**:
- IPC protocol implementation
- Message serialization/deserialization
- Command registration (Rust side)
- Command invocation (JavaScript side)
- Error propagation across IPC boundary

**Key Patterns**:
```rust
// Rust command definition
#[tauri::command]
fn execute_command(command: String) -> Result<String, String> {
    // Implementation
}
```

```typescript
// JavaScript invocation
const result = await invoke('execute_command', { command: 'kubectl get pods' })
```

**Communication**:
- Used by **A11 Client Shell** to call Rust functions
- Used by **A51 Tauri Backend** to respond to web view
- Bridges **A01 REPL Core** with native functionality

**Quality Standards**:
- Type-safe IPC calls
- Async/await support
- Error handling across boundary
- Performance: < 1ms IPC overhead

---

## Agent A53: Menu Management Agent

**Scope**: Application menus, context menus, tray menus

**Location**: `src-tauri/src/menu.rs`

**Key Responsibilities**:
- Native menu creation
- Menu item handling
- Dynamic menu updates
- Context menu integration
- System tray menu

**Key Menus**:
- Application menu (File, Edit, View, Window, Help)
- Context menu (right-click in terminal)
- System tray menu (minimize to tray)

**Communication**:
- Coordinates with **A51 Tauri Backend** for menu creation
- Sends menu events to **A11 Client Shell**
- Responds to menu changes from **A11**

**Quality Standards**:
- Native platform menus
- Keyboard shortcuts (Cmd+Q, etc.)
- Dynamic menu updates (enabled/disabled states)
- Accessibility support

---

## Agent A54: Window Utilities Agent

**Scope**: Window positioning, sizing, state management

**Location**: `src-tauri/src/window.rs`

**Key Responsibilities**:
- Window creation with options
- Window positioning and sizing
- Window state persistence
- Multi-window management
- Fullscreen support

**Key Features**:
- Remember window bounds
- Multi-monitor support
- Minimize to tray
- Always on top
- Custom window decorations

**Communication**:
- Called by **A51 Tauri Backend** for window ops
- Persists state via **A61 Settings Agent**
- Responds to requests from **A11 Client Shell**

**Quality Standards**:
- Smooth window operations (no flicker)
- State persistence across sessions
- Multi-monitor aware
- Platform-specific behaviors (macOS traffic lights, etc.)

---

## Agent A61: Settings Management Agent

**Scope**: Application settings and preferences

**Location**: `packages/core/src/core/settings.ts`

**Key Responsibilities**:
- Settings storage and retrieval
- Settings validation
- Settings UI
- Settings migration
- Platform-specific settings paths

**Key Settings**:
- Theme preference
- Font size and family
- Window bounds
- Keyboard shortcuts
- kubectl context

**Communication**:
- Used by all agents for preference storage
- **A16 Theme Agent** reads theme preference
- **A54 Window Utilities** reads window bounds
- **A11 Client Shell** provides settings UI

**Quality Standards**:
- Atomic writes (no corruption)
- Settings validation
- Migration for breaking changes
- Platform-specific paths (config dir)

---

## Agent A62: Build System Agent

**Scope**: Webpack configuration, TypeScript compilation, asset processing

**Location**: `packages/webpack/`

**Key Responsibilities**:
- Webpack configuration
- TypeScript compilation
- Asset bundling and optimization
- Development server
- Production builds

**Key Configurations**:
- Client bundle (React app)
- Headless bundle (Node.js API)
- Monaco editor workers
- WASM modules
- CSS/SCSS processing

**Communication**:
- Used during build process
- Coordinates with **A63 Asset Processing Agent**
- Generates bundles for **A51 Tauri** and browsers

**Quality Standards**:
- Fast incremental builds (< 5s)
- Small bundle sizes (< 2MB gzipped)
- Tree-shaking for dead code elimination
- Source maps for debugging

---

## Agent A63: Asset Processing Agent

**Scope**: Icon generation, image optimization, font processing

**Location**: `bin/seticon.js`, `tools/`

**Key Responsibilities**:
- Icon generation for multiple platforms
- Image optimization
- Font subsetting
- Asset versioning
- Asset manifest generation

**Key Assets**:
- Application icons (macOS, Linux, Windows)
- Splash screens
- UI icons and images
- Fonts (Menlo, Fira Code, etc.)

**Communication**:
- Called by **A62 Build System** during builds
- Generates assets for **A51 Tauri**
- Optimizes assets for **A11 Client Shell**

**Quality Standards**:
- Multiple icon sizes (16x16 to 512x512)
- Optimized file sizes
- Platform-specific formats
- Retina/HiDPI support

---

## Agent A64: Packaging Agent

**Scope**: Application packaging for distribution

**Location**: `packages/builder/`, `src-tauri/tauri.conf.json`

**Key Responsibilities**:
- Tauri app bundling
- Platform-specific packaging (DMG, DEB, MSI, AppImage)
- Code signing (macOS, Windows)
- Auto-update configuration
- Distribution artifact generation

**Supported Formats**:
- **macOS**: DMG, PKG, App Bundle
- **Linux**: DEB, RPM, AppImage
- **Windows**: MSI, NSIS installer

**Communication**:
- Uses **A62 Build System** for app bundles
- Coordinates with **A51 Tauri** for configuration
- Generates distributables for deployment

**Quality Standards**:
- Small package sizes (< 20MB Tauri, < 150MB Electron)
- Code signing for trusted installation
- Auto-update support
- Multi-architecture support (Intel, Apple Silicon)

---

## Communication Patterns

### Pattern 1: IPC Command Flow
```
User action in web view
  ↓
A11 Client Shell (invoke IPC command)
  ↓
A52 IPC Agent (serialize and send)
  ↓
A51 Tauri Backend (execute Rust command)
  ↓
A52 IPC Agent (deserialize and return)
  ↓
A11 Client Shell (handle result)
```

### Pattern 2: Window Management Flow
```
A11 Client Shell (request new window)
  ↓
A52 IPC Agent (send create_window command)
  ↓
A51 Tauri Backend → A54 Window Utilities (create window)
  ↓
A54 (restore saved bounds from A61 Settings)
  ↓
A51 (show window)
```

### Pattern 3: Build Flow
```
npm run build
  ↓
A62 Build System (compile TypeScript)
  ↓
A62 (bundle with Webpack)
  ↓
A63 Asset Processing (optimize assets)
  ↓
A62 (generate bundles)
  ↓
A64 Packaging (create Tauri app)
  ↓
Distribution artifacts
```

### Pattern 4: Settings Persistence Flow
```
User changes theme
  ↓
A16 Theme Agent (apply theme)
  ↓
A61 Settings Agent (save theme preference)
  ↓
Platform-specific config file (JSON)
  ↓
On next startup → A61 (load theme)
  ↓
A16 Theme Agent (apply saved theme)
```

## Testing Strategy

Platform agents must have:
- **Unit tests**: Rust command handlers
- **Integration tests**: IPC communication
- **E2E tests**: Window creation and management
- **Platform tests**: Test on macOS, Linux, Windows
- **Performance tests**: Startup time, IPC latency

## Development Guidelines

When modifying platform agents:
1. Test on all platforms (macOS, Linux, Windows)
2. Test both Intel and Apple Silicon (macOS)
3. Verify code signing still works
4. Test IPC boundary carefully (serialization)
5. Follow Tauri security best practices
6. Minimize Rust dependencies for smaller bundles
7. Use async Rust for non-blocking operations
8. Test both Tauri and Electron modes (legacy)
