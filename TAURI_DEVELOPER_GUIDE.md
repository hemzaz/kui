# Kui Tauri Developer Guide

**Comprehensive guide for developers working on Kui with Tauri**

## Table of Contents

- [Development Setup](#development-setup)
- [Architecture Overview](#architecture-overview)
- [Building and Testing](#building-and-testing)
- [Development Workflow](#development-workflow)
- [Adding Features](#adding-features)
- [IPC Communication](#ipc-communication)
- [Platform-Specific Development](#platform-specific-development)
- [Testing Strategy](#testing-strategy)
- [Debugging](#debugging)
- [Performance Optimization](#performance-optimization)
- [Contributing Guidelines](#contributing-guidelines)
- [Reference](#reference)

## Development Setup

### Prerequisites

**Required Tools:**

1. **Node.js and npm**
   ```bash
   # macOS (via Homebrew)
   brew install node@20

   # Verify
   node --version  # Should be v20+
   npm --version   # Should be 10+
   ```

2. **Rust Toolchain**
   ```bash
   # Install Rust
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

   # Add to PATH (add to ~/.bashrc or ~/.zshrc)
   source $HOME/.cargo/env

   # Verify
   rustc --version  # Should be 1.85+
   cargo --version  # Should be 1.85+
   ```

3. **Tauri CLI**
   ```bash
   # Install globally (optional but helpful)
   cargo install tauri-cli --version "^2.9"

   # Or use via npm (already in package.json)
   npm install
   ```

### Platform-Specific Setup

**macOS:**

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Verify
xcode-select -p
# Should output: /Library/Developer/CommandLineTools
```

**Linux (Ubuntu/Debian):**

```bash
# Install system dependencies
sudo apt-get update
sudo apt-get install -y \
    libgtk-3-dev \
    libwebkit2gtk-4.0-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    patchelf \
    libwayland-dev \
    libxkbcommon-dev \
    wayland-protocols \
    libssl-dev \
    pkg-config \
    build-essential

# For screenshot support
sudo apt-get install -y xclip

# Verify
pkg-config --modversion gtk+-3.0
pkg-config --modversion webkit2gtk-4.0
```

**Linux (Fedora/RHEL):**

```bash
# Install system dependencies
sudo dnf install \
    gtk3-devel \
    webkit2gtk3-devel \
    libappindicator-gtk3-devel \
    librsvg2-devel \
    openssl-devel \
    wayland-devel \
    libxkbcommon-devel \
    wayland-protocols-devel

# For screenshot support
sudo dnf install xclip
```

**Windows:**

1. **Visual Studio Build Tools**
   - Download: https://visualstudio.microsoft.com/downloads/
   - Install "Desktop development with C++"
   - Include: MSVC v143, Windows 10 SDK

2. **WebView2 Runtime**
   - Usually pre-installed on Windows 10/11
   - If needed: https://developer.microsoft.com/microsoft-edge/webview2/

3. **Verify**
   ```powershell
   # Check Visual Studio
   where cl.exe

   # Check WebView2
   reg query "HKLM\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"
   ```

### Initial Project Setup

```bash
# Clone repository
git clone https://github.com/kubernetes-sigs/kui.git
cd kui

# Install npm dependencies
npm ci

# Compile TypeScript
npm run compile

# Verify Rust backend compiles
cd src-tauri
cargo check
cd ..
```

### Cross-Compilation Setup (Optional)

For building for different platforms from a single machine:

```bash
# Install Rust targets
rustup target add x86_64-apple-darwin      # macOS Intel
rustup target add aarch64-apple-darwin     # macOS Apple Silicon
rustup target add x86_64-unknown-linux-gnu # Linux x64
rustup target add aarch64-unknown-linux-gnu # Linux ARM64
rustup target add x86_64-pc-windows-msvc   # Windows

# Install additional tools
cargo install cargo-bundle
cargo install cross  # For Linux cross-compilation
```

### IDE Setup

**Recommended: Visual Studio Code**

```bash
# Install VS Code
brew install --cask visual-studio-code  # macOS

# Install extensions
code --install-extension rust-lang.rust-analyzer
code --install-extension tauri-apps.tauri-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
```

**VS Code Configuration** (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[rust]": {
    "editor.defaultFormatter": "rust-lang.rust-analyzer"
  },
  "rust-analyzer.check.command": "clippy",
  "rust-analyzer.cargo.features": "all"
}
```

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Browser)                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  React UI (TypeScript)                          │   │
│  │  - Components (packages/react)                  │   │
│  │  - Command Processor (packages/core)            │   │
│  │  - Plugin System                                │   │
│  └─────────────────┬───────────────────────────────┘   │
│                    │ Tauri Bridge (IPC)                 │
│                    │ packages/core/src/main/tauri-bridge.ts
└────────────────────┼───────────────────────────────────┘
                     │
┌────────────────────┼───────────────────────────────────┐
│                    ▼                                    │
│              Tauri Core (Rust)                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Command Handlers (src-tauri/src/)              │   │
│  │  - main.rs         : Entry point & setup        │   │
│  │  - commands.rs     : IPC command handlers       │   │
│  │  - menu.rs         : Native menu system         │   │
│  │  - window.rs       : Window management          │   │
│  │  - screenshot.rs   : Screenshot capture         │   │
│  │  - ipc.rs          : IPC utilities              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  System Webview (Platform Native)                       │
│  - macOS: WebKit                                        │
│  - Linux: WebKit2GTK                                    │
│  - Windows: WebView2 (Chromium-based)                   │
└─────────────────────────────────────────────────────────┘
```

### Directory Structure

```
kui/
├── src-tauri/                    # Rust backend (Tauri)
│   ├── Cargo.toml               # Rust dependencies
│   ├── Cargo.lock               # Dependency lock file
│   ├── tauri.conf.json          # Tauri configuration
│   ├── build.rs                 # Build script
│   ├── capabilities/            # Security capabilities
│   │   └── default.json         # Default permissions
│   ├── icons/                   # Application icons
│   └── src/
│       ├── main.rs              # Entry point
│       ├── commands.rs          # IPC command handlers
│       ├── ipc.rs               # IPC utilities
│       ├── menu.rs              # Menu system
│       ├── window.rs            # Window management
│       └── screenshot.rs        # Screenshot functionality
│
├── packages/                     # TypeScript packages
│   ├── core/                    # Core framework
│   │   └── src/main/
│   │       └── tauri-bridge.ts  # Unified IPC bridge
│   ├── react/                   # React UI components
│   ├── webpack/                 # Build configuration
│   └── test/                    # Testing infrastructure
│
├── plugins/                      # Feature plugins
│   ├── plugin-kubectl/          # Kubernetes enhancements
│   ├── plugin-bash-like/        # Shell features
│   └── plugin-*/                # Other plugins
│
└── docs/                         # Documentation
    ├── TAURI-BRIDGE-USAGE.md    # IPC documentation
    └── MIGRATING_TO_TAURI.md    # User migration guide
```

### Key Components

**1. Tauri Bridge (`packages/core/src/main/tauri-bridge.ts`)**

Unified IPC abstraction that works with both Tauri and Electron:

```typescript
import { getIpcRenderer } from '@kui-shell/core/src/main/tauri-bridge'

const ipc = getIpcRenderer()
await ipc.invoke('command_name', { arg1, arg2 })
```

**2. Rust Backend (`src-tauri/src/`)**

Native backend handling:
- Window lifecycle
- Native menus
- Screenshot capture
- IPC communication
- System integration

**3. React Frontend (`packages/react/`)**

UI layer with:
- Component system
- Table rendering
- Terminal integration
- Theme system

**4. Plugin System**

Extensible architecture:
- Command registration
- Mode registration
- Badge registration
- Theme registration

## Building and Testing

### Development Mode

**Quick Start:**

```bash
# Start everything (recommended)
npm run open

# This runs:
# 1. Webpack dev server (port 9080)
# 2. TypeScript compilation
# 3. Tauri dev mode with hot reload
```

**Manual Control:**

```bash
# Terminal 1: Watch TypeScript compilation
npm run watch:source

# Terminal 2: Webpack dev server
npm run watch:browser

# Terminal 3: Tauri dev
npm run tauri:dev
```

**Browser-Only Mode:**

```bash
# For frontend development without Tauri
npm run watch:browser

# Then open: http://localhost:9080
```

### Production Builds

**Build Commands:**

```bash
# macOS Intel
npm run build:tauri:mac:amd64

# macOS Apple Silicon
npm run build:tauri:mac:arm64

# Linux x64
npm run build:tauri:linux:amd64

# Linux ARM64
npm run build:tauri:linux:arm64

# Windows x64
npm run build:tauri:win32:amd64
```

**Build Process:**

1. **Prepare frontend**: `npm run build:prep`
   - Compiles TypeScript
   - Bundles with Webpack
   - Outputs to `dist/webpack/`

2. **Build Rust backend**: `cargo build --release`
   - Compiles Rust code
   - Links Tauri plugins
   - Creates native binary

3. **Package application**: `cargo tauri build`
   - Bundles frontend and backend
   - Creates platform packages
   - Signs application (macOS)

**Build Output:**

```
src-tauri/target/release/bundle/
├── macos/
│   └── Kui.app           # macOS application
│   └── Kui.dmg           # DMG installer
├── deb/
│   └── kui_*.deb         # Debian package
├── appimage/
│   └── kui_*.AppImage    # Universal Linux
└── msi/
    └── Kui_*.msi         # Windows installer
```

### Testing

**Unit Tests:**

```bash
# Run all tests
npm run test

# Tauri-specific unit tests
npm run test:tauri:unit

# Specific test file
npm test -- path/to/test.spec.ts
```

**Integration Tests:**

```bash
# Run all Tauri integration tests
npm run test:tauri:integration

# Specific integration test
npm run test:tauri:integration -- --grep "menu system"
```

**End-to-End Tests:**

```bash
# Run all E2E tests
npm run test:tauri:e2e

# Run with UI (interactive)
npm run test:tauri:e2e:ui

# Run headed (see browser)
npm run test:tauri:e2e:headed

# Smoke tests only
npm run test:tauri:smoke
```

**Performance Tests:**

```bash
# Run performance benchmarks
npm run test:tauri:performance

# Compare with Electron
npm run test:tauri:performance -- --compare
```

**Test Everything:**

```bash
# Complete test suite
npm run test:tauri:all

# Generate coverage report
npm run test:tauri:all -- --coverage

# View test report
npm run test:tauri:report
```

### Linting and Formatting

**TypeScript/JavaScript:**

```bash
# Lint all code
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix

# Format with Prettier
npm run format
```

**Rust:**

```bash
# Format Rust code
cd src-tauri
cargo fmt

# Check formatting
cargo fmt -- --check

# Lint with Clippy
cargo clippy

# Fix Clippy warnings
cargo clippy --fix
```

**Pre-commit Hooks:**

Configured via Husky (`.husky/pre-commit`):
- Runs ESLint on TypeScript
- Runs `cargo fmt --check` on Rust
- Runs quick tests

## Development Workflow

### Typical Development Session

1. **Update dependencies**
   ```bash
   git pull
   npm ci
   cd src-tauri && cargo update && cd ..
   ```

2. **Start development mode**
   ```bash
   npm run open
   # Or separate terminals for more control
   ```

3. **Make changes**
   - Edit TypeScript: Hot reload in browser
   - Edit Rust: Save triggers rebuild and restart
   - Edit UI: See changes immediately

4. **Test changes**
   ```bash
   # Run affected tests
   npm test -- --grep "feature name"

   # Test in browser mode
   # Open http://localhost:9080
   ```

5. **Commit**
   ```bash
   git add .
   git commit -m "feat: add feature description"
   # Pre-commit hooks run automatically
   ```

### Feature Development Workflow

**Example: Adding a new IPC command**

1. **Define Rust command** (`src-tauri/src/commands.rs`):
   ```rust
   #[tauri::command]
   async fn my_new_command(param: String) -> Result<String, String> {
       log::info!("my_new_command called with: {}", param);

       // Implementation
       let result = process_param(param);

       Ok(result)
   }
   ```

2. **Register command** (`src-tauri/src/main.rs`):
   ```rust
   .invoke_handler(tauri::generate_handler![
       my_new_command,
       // ... other commands
   ])
   ```

3. **Add TypeScript types** (`packages/core/src/main/tauri-bridge.ts`):
   ```typescript
   interface TauriCommands {
       my_new_command(param: string): Promise<string>
       // ... other commands
   }
   ```

4. **Use in frontend**:
   ```typescript
   import { getIpcRenderer } from '@kui-shell/core/src/main/tauri-bridge'

   const ipc = getIpcRenderer()
   const result = await ipc.invoke('my_new_command', { param: 'value' })
   ```

5. **Add tests**:
   ```typescript
   // tests/tauri-integration.spec.ts
   test('my_new_command works', async () => {
       const result = await window.__TAURI__.core.invoke('my_new_command', {
           param: 'test'
       })
       expect(result).toBe('expected_value')
   })
   ```

6. **Document** (`docs/TAURI-BRIDGE-USAGE.md`):
   ```markdown
   ### my_new_command

   Description of command.

   **Parameters:**
   - `param: string` - Parameter description

   **Returns:** `Promise<string>` - Result description

   **Example:**
   ```typescript
   const result = await ipc.invoke('my_new_command', { param: 'value' })
   ```
   ```

### Debugging Workflow

**Backend (Rust):**

```bash
# Enable debug logging
export RUST_LOG=debug
npm run open

# Or specific module
export RUST_LOG=kui=debug,tauri=info
npm run open

# View logs
tail -f ~/Library/Logs/org.kui-shell.kui/kui.log
```

**Frontend (TypeScript):**

```bash
# Enable bridge debugging
# In browser DevTools console:
localStorage.debug = 'main/tauri-bridge'
# Reload: Cmd+R / Ctrl+R

# Enable all debugging
localStorage.debug = '*'
```

**IPC Communication:**

```bash
# Backend: See incoming commands
export RUST_LOG=tauri::ipc=debug

# Frontend: See outgoing commands
localStorage.debug = 'main/tauri-bridge:ipc'
```

## Adding Features

### Adding a Menu Item

**1. Update Rust menu** (`src-tauri/src/menu.rs`):

```rust
pub fn create_menu(app: &App) -> Result<Menu<Wry>, Error> {
    let menu = Menu::with_items(app, &[
        &Submenu::with_items(app, "File", true, &[
            &MenuItem::with_id(
                app,
                "my_action",
                "My Action",
                true,
                Some("Cmd+Shift+M")
            )?,
            // ... other items
        ])?,
        // ... other menus
    ])?;

    Ok(menu)
}

pub fn handle_menu_event(app: &AppHandle, event: MenuEvent) {
    match event.id().as_ref() {
        "my_action" => {
            // Handle menu action
            log::info!("My action triggered");

            // Emit event to frontend
            let _ = app.emit("menu:my_action", ());
        }
        _ => {}
    }
}
```

**2. Handle in frontend**:

```typescript
import { listen } from '@tauri-apps/api/event'

listen('menu:my_action', () => {
    console.log('Menu action triggered')
    // Perform action
})
```

**3. Add tests**:

```typescript
test('menu action works', async () => {
    const promise = new Promise((resolve) => {
        listen('menu:my_action', resolve)
    })

    // Trigger menu action
    // ...

    await promise
})
```

### Adding a Screenshot Feature

**Already implemented!** See `src-tauri/src/screenshot.rs` for reference.

**Key components:**
1. Platform-specific capture code
2. Clipboard integration
3. Error handling
4. Performance optimization

### Adding Plugin Support

**Create new plugin** (`plugins/plugin-my-feature/`):

```typescript
// src/index.ts
import { Registrar } from '@kui-shell/core'

export default async (registrar: Registrar) => {
    // Register commands
    registrar.listen('/my-command', async ({ command }) => {
        // Command implementation
        return 'Response'
    }, {
        usage: {
            docs: 'My command description'
        }
    })

    // Register modes (tabs in response)
    registrar.registerMode({
        mode: 'my-mode',
        label: 'My Mode',
        content: async (tab, response) => {
            // Return React component or HTML
        }
    })
}

// package.json
{
    "name": "@kui-shell/plugin-my-feature",
    "main": "dist/index.js",
    "kui": {
        "plugin": true
    }
}
```

**Register plugin** (`plugins/plugin-client-default/src/preload.tsx`):

```typescript
import myFeature from '@kui-shell/plugin-my-feature'

export default async (commandTree: Registrar) => {
    await myFeature(commandTree)
    // ... other plugins
}
```

## IPC Communication

### Tauri Bridge Architecture

The Tauri bridge provides a unified API for IPC communication that works with both Tauri and Electron (for backward compatibility).

**Basic Usage:**

```typescript
import { getIpcRenderer, isTauriRuntime } from '@kui-shell/core/src/main/tauri-bridge'

// Get IPC instance
const ipc = getIpcRenderer()

// Invoke command (async)
const result = await ipc.invoke('command_name', { arg1, arg2 })

// Send message (fire and forget)
ipc.send('channel_name', { data })

// Listen for events
ipc.on('event_name', (event, data) => {
    console.log('Received:', data)
})

// Check runtime
if (isTauriRuntime()) {
    // Tauri-specific code
}
```

### Command Patterns

**1. Simple Command:**

```rust
#[tauri::command]
fn simple_command() -> String {
    "result".to_string()
}
```

```typescript
const result = await ipc.invoke('simple_command', {})
```

**2. Command with Parameters:**

```rust
#[tauri::command]
fn command_with_params(name: String, count: i32) -> String {
    format!("Hello {} (count: {})", name, count)
}
```

```typescript
const result = await ipc.invoke('command_with_params', {
    name: 'World',
    count: 42
})
```

**3. Async Command:**

```rust
#[tauri::command]
async fn async_command(url: String) -> Result<String, String> {
    let response = reqwest::get(&url)
        .await
        .map_err(|e| e.to_string())?;

    response.text()
        .await
        .map_err(|e| e.to_string())
}
```

```typescript
try {
    const result = await ipc.invoke('async_command', {
        url: 'https://api.example.com'
    })
} catch (error) {
    console.error('Command failed:', error)
}
```

**4. Command with State:**

```rust
struct AppState {
    count: Mutex<i32>,
}

#[tauri::command]
fn increment_counter(state: State<AppState>) -> i32 {
    let mut count = state.count.lock().unwrap();
    *count += 1;
    *count
}

// Register state
fn main() {
    tauri::Builder::default()
        .manage(AppState {
            count: Mutex::new(0),
        })
        .invoke_handler(tauri::generate_handler![increment_counter])
        .run(tauri::generate_context!())
        .expect("error while running application");
}
```

**5. Command with Window Access:**

```rust
#[tauri::command]
async fn command_with_window(
    window: Window,
    message: String
) -> Result<(), String> {
    window.emit("notification", message)
        .map_err(|e| e.to_string())?;
    Ok(())
}
```

### Event Patterns

**Backend to Frontend:**

```rust
// Emit event
app.emit("custom_event", payload).unwrap();

// Emit to specific window
window.emit("window_event", data).unwrap();
```

```typescript
// Listen for events
listen('custom_event', (event) => {
    console.log('Received:', event.payload)
})

// Listen once
listenOnce('one_time_event', (event) => {
    console.log('Received once:', event.payload)
})

// Unlisten
const unlisten = await listen('event', handler)
unlisten() // Stop listening
```

**Frontend to Backend:**

```typescript
// Emit from frontend
emit('frontend_event', { data: 'value' })
```

```rust
// Listen in backend (less common, use commands instead)
// Events are primarily backend → frontend
```

### Error Handling

**Rust side:**

```rust
#[tauri::command]
async fn command_with_errors(
    input: String
) -> Result<String, String> {
    if input.is_empty() {
        return Err("Input cannot be empty".to_string());
    }

    let result = process_input(input)
        .map_err(|e| format!("Processing failed: {}", e))?;

    Ok(result)
}
```

**TypeScript side:**

```typescript
try {
    const result = await ipc.invoke('command_with_errors', {
        input: userInput
    })
    console.log('Success:', result)
} catch (error) {
    console.error('Error:', error)
    // Show user-friendly error message
}
```

### Performance Considerations

**1. Minimize IPC calls:**

```typescript
// Bad: Multiple calls
for (const item of items) {
    await ipc.invoke('process_item', { item })
}

// Good: Batch processing
await ipc.invoke('process_items', { items })
```

**2. Use events for streaming:**

```rust
#[tauri::command]
async fn stream_data(window: Window) -> Result<(), String> {
    for i in 0..100 {
        window.emit("progress", i).unwrap();
        tokio::time::sleep(Duration::from_millis(100)).await;
    }
    Ok(())
}
```

```typescript
listen('progress', (event) => {
    updateProgressBar(event.payload)
})
await ipc.invoke('stream_data', {})
```

**3. Optimize payload size:**

```typescript
// Bad: Sending large objects
await ipc.invoke('save_data', { data: largeObject })

// Good: Send only what's needed
await ipc.invoke('save_data', {
    id: object.id,
    changes: object.modifiedFields
})
```

## Platform-Specific Development

### macOS Development

**Code Signing:**

```bash
# Development builds
# No signing needed

# Release builds
# Configure in tauri.conf.json
{
    "bundle": {
        "macOS": {
            "signingIdentity": "Developer ID Application: Your Name"
        }
    }
}
```

**Native APIs:**

```rust
#[cfg(target_os = "macos")]
use cocoa::appkit::NSApp;

#[cfg(target_os = "macos")]
fn macos_specific_function() {
    // macOS-specific code
}
```

**Testing:**

```bash
# Test on macOS
npm run build:tauri:mac:amd64

# Test both architectures
npm run build:tauri:mac:arm64

# Universal binary (combine both)
lipo -create \
    src-tauri/target/x86_64-apple-darwin/release/kui \
    src-tauri/target/aarch64-apple-darwin/release/kui \
    -output src-tauri/target/release/kui-universal
```

### Linux Development

**Wayland Support:**

```rust
#[cfg(target_os = "linux")]
use gtk::prelude::*;

#[cfg(target_os = "linux")]
fn linux_specific_function() {
    // Check if Wayland
    if std::env::var("WAYLAND_DISPLAY").is_ok() {
        // Wayland-specific code
    } else {
        // X11-specific code
    }
}
```

**Dependencies:**

```toml
[target.'cfg(target_os = "linux")'.dependencies]
gtk = "0.18"
webkit2gtk = "0.19"
```

**Testing:**

```bash
# Test DEB package
npm run build:tauri:linux:amd64
sudo dpkg -i src-tauri/target/release/bundle/deb/*.deb

# Test AppImage
chmod +x src-tauri/target/release/bundle/appimage/*.AppImage
./src-tauri/target/release/bundle/appimage/*.AppImage
```

### Windows Development

**WebView2 Integration:**

```rust
#[cfg(target_os = "windows")]
use webview2_com::*;

#[cfg(target_os = "windows")]
fn windows_specific_function() {
    // Windows-specific code
}
```

**Testing:**

```powershell
# Build
npm run build:tauri:win32:amd64

# Test MSI
msiexec /i src-tauri\target\release\bundle\msi\*.msi

# Test installed app
& "C:\Program Files\Kui\Kui.exe"
```

**Code Signing:**

```json
// tauri.conf.json
{
    "bundle": {
        "windows": {
            "certificateThumbprint": "YOUR_THUMBPRINT",
            "digestAlgorithm": "sha256",
            "timestampUrl": "http://timestamp.digicert.com"
        }
    }
}
```

### Cross-Platform Code

**Conditional Compilation:**

```rust
#[cfg(target_os = "macos")]
fn platform_specific() {
    // macOS
}

#[cfg(target_os = "linux")]
fn platform_specific() {
    // Linux
}

#[cfg(target_os = "windows")]
fn platform_specific() {
    // Windows
}

// Common code
fn common_function() {
    platform_specific();
}
```

**Feature Flags:**

```toml
# Cargo.toml
[features]
default = []
screenshot-native = []  # Use native screenshot APIs
screenshot-xlib = []    # Use X11 for screenshots

[target.'cfg(target_os = "macos")'.dependencies]
# macOS dependencies

[target.'cfg(target_os = "linux")'.dependencies]
# Linux dependencies
```

## Testing Strategy

### Test Pyramid

```
                    /\
                   /  \
                  /E2E \      Few, slow, expensive
                 /______\
                /        \
               /Integration\  More, medium speed
              /____________\
             /              \
            /   Unit Tests   \  Many, fast, cheap
           /__________________\
```

### Unit Testing

**Rust Unit Tests:**

```rust
// src-tauri/src/commands.rs
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_my_command() {
        let result = my_command("test".to_string());
        assert_eq!(result, "expected");
    }

    #[tokio::test]
    async fn test_async_command() {
        let result = async_command("param".to_string())
            .await
            .unwrap();
        assert!(!result.is_empty());
    }
}
```

**TypeScript Unit Tests:**

```typescript
// packages/core/src/main/tauri-bridge.spec.ts
import { isTauriRuntime, getIpcRenderer } from './tauri-bridge'

describe('Tauri Bridge', () => {
    it('should detect runtime', () => {
        const isTauri = isTauriRuntime()
        expect(typeof isTauri).toBe('boolean')
    })

    it('should provide IPC renderer', () => {
        const ipc = getIpcRenderer()
        expect(ipc).toBeDefined()
        expect(ipc.invoke).toBeDefined()
    })
})
```

### Integration Testing

**Playwright Tests:**

```typescript
// tests/tauri-integration.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Tauri Integration', () => {
    test('should launch application', async ({ page }) => {
        await page.goto('tauri://localhost')
        await expect(page).toHaveTitle(/Kui/)
    })

    test('should execute IPC command', async ({ page }) => {
        await page.goto('tauri://localhost')

        const result = await page.evaluate(async () => {
            return await window.__TAURI__.core.invoke('get_app_version', {})
        })

        expect(result).toMatch(/\d+\.\d+\.\d+/)
    })
})
```

### E2E Testing

**Complete User Flows:**

```typescript
// tests/tauri-e2e.spec.ts
import { test, expect } from '@playwright/test'

test.describe('E2E: Kubectl Integration', () => {
    test('should list pods', async ({ page }) => {
        await page.goto('tauri://localhost')

        // Execute kubectl command
        await page.fill('input[type="text"]', 'kubectl get pods')
        await page.press('input[type="text"]', 'Enter')

        // Wait for table
        await page.waitForSelector('.kui--data-table')

        // Verify table has rows
        const rows = await page.$$('.kui--data-table tbody tr')
        expect(rows.length).toBeGreaterThan(0)
    })
})
```

### Performance Testing

**Benchmark Tests:**

```typescript
// tests/performance-comparison.ts
import { performance } from 'perf_hooks'

async function benchmarkStartup() {
    const start = performance.now()
    // Launch app
    const end = performance.now()
    return end - start
}

async function benchmarkCommand() {
    const start = performance.now()
    // Execute command
    const end = performance.now()
    return end - start
}

async function runBenchmarks() {
    console.log('Startup:', await benchmarkStartup(), 'ms')
    console.log('Command:', await benchmarkCommand(), 'ms')
}
```

### Test Coverage

**Generate Coverage:**

```bash
# TypeScript coverage
npm run test -- --coverage

# View coverage report
open coverage/index.html

# Rust coverage (requires cargo-tarpaulin)
cargo install cargo-tarpaulin
cd src-tauri
cargo tarpaulin --out Html
open tarpaulin-report.html
```

## Debugging

### Rust Backend Debugging

**Logging:**

```rust
// Add to code
log::info!("Information message");
log::debug!("Debug message: {:?}", variable);
log::warn!("Warning message");
log::error!("Error: {}", error);

// Run with logging
export RUST_LOG=debug
npm run open

// Module-specific logging
export RUST_LOG=kui=debug,tauri=info
```

**Debugger:**

```bash
# VS Code: Add launch configuration
# .vscode/launch.json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "lldb",
            "request": "launch",
            "name": "Debug Tauri",
            "cargo": {
                "args": [
                    "build",
                    "--manifest-path=./src-tauri/Cargo.toml"
                ]
            },
            "cwd": "${workspaceFolder}"
        }
    ]
}
```

**GDB/LLDB:**

```bash
# Build with debug symbols
cd src-tauri
cargo build

# Debug with GDB (Linux)
gdb target/debug/kui

# Debug with LLDB (macOS)
lldb target/debug/kui
```

### Frontend Debugging

**Browser DevTools:**

```bash
# Launch with DevTools open
npm run open

# Press F12 or Cmd+Option+I (macOS)
```

**Console Debugging:**

```typescript
// Enable debug logging
localStorage.debug = 'main/tauri-bridge'

// Enable all
localStorage.debug = '*'

// Disable
localStorage.debug = ''
```

**Network Debugging:**

```typescript
// Monitor IPC calls
localStorage.debug = 'main/tauri-bridge:ipc'

// See in console:
// → invoke: command_name { arg1: "value" }
// ← result: "response"
```

### Common Issues

**1. Build Fails:**

```bash
# Clean everything
npm run clean
rm -rf node_modules
npm ci
cd src-tauri && cargo clean && cd ..

# Rebuild
npm run compile
npm run build:tauri:mac:amd64
```

**2. IPC Not Working:**

```bash
# Check command registered
grep "command_name" src-tauri/src/main.rs

# Enable IPC debugging
export RUST_LOG=tauri::ipc=debug
localStorage.debug = 'main/tauri-bridge:ipc'
```

**3. Menu Not Appearing:**

```bash
# Check menu setup
grep "setup_menu" src-tauri/src/main.rs

# Test menu events
localStorage.debug = 'main/tauri-bridge:menu'
```

## Performance Optimization

### Rust Performance

**1. Use Release Builds:**

```bash
# Development (debug)
cargo build

# Production (optimized)
cargo build --release
```

**2. Profile with Cargo:**

```bash
# Install profiler
cargo install cargo-flamegraph

# Generate flamegraph
cd src-tauri
cargo flamegraph --bin kui

# Opens flamegraph.svg
```

**3. Optimize Hot Paths:**

```rust
// Use inline for small functions
#[inline]
fn hot_function() {
    // ...
}

// Use const for compile-time computation
const VALUE: i32 = compute_at_compile_time();
```

**4. Minimize Allocations:**

```rust
// Bad: Multiple allocations
fn build_string() -> String {
    let mut s = String::new();
    s.push_str("Hello");
    s.push_str(" ");
    s.push_str("World");
    s
}

// Good: Pre-allocate capacity
fn build_string() -> String {
    let mut s = String::with_capacity(11);
    s.push_str("Hello");
    s.push_str(" ");
    s.push_str("World");
    s
}
```

### Frontend Performance

**1. Lazy Load Plugins:**

```typescript
// Bad: Load all upfront
import plugin1 from './plugin1'
import plugin2 from './plugin2'

// Good: Load on demand
const loadPlugin = async (name: string) => {
    return await import(`./plugins/${name}`)
}
```

**2. Memoize Expensive Computations:**

```typescript
import { useMemo } from 'react'

function Component({ data }) {
    const processed = useMemo(() => {
        return expensiveProcessing(data)
    }, [data])

    return <div>{processed}</div>
}
```

**3. Virtual Scrolling:**

```typescript
// Use virtual scrolling for large lists
import { FixedSizeList } from 'react-window'

function LargeList({ items }) {
    return (
        <FixedSizeList
            height={600}
            itemCount={items.length}
            itemSize={35}
        >
            {({ index, style }) => (
                <div style={style}>{items[index]}</div>
            )}
        </FixedSizeList>
    )
}
```

### Bundle Size Optimization

**1. Tree Shaking:**

```javascript
// webpack.config.js
module.exports = {
    optimization: {
        usedExports: true,
        sideEffects: false
    }
}
```

**2. Code Splitting:**

```typescript
// Dynamic imports
const HeavyComponent = lazy(() => import('./HeavyComponent'))

function App() {
    return (
        <Suspense fallback={<Loading />}>
            <HeavyComponent />
        </Suspense>
    )
}
```

**3. Analyze Bundle:**

```bash
# Install analyzer
npm install -D webpack-bundle-analyzer

# Run analysis
npm run build -- --analyze

# Opens visualization in browser
```

## Contributing Guidelines

### Code Style

**TypeScript:**
- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting
- Prefer `async`/`await` over callbacks
- Use meaningful variable names

**Rust:**
- Follow Rust style guide
- Use `cargo fmt` before committing
- Run `cargo clippy` and fix warnings
- Use `Result` for error handling
- Document public APIs

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(menu): add screenshot menu item

Add native menu item for taking screenshots with keyboard
shortcut. Implements screenshot capture on macOS and Linux.

Closes #123
```

```
fix(ipc): handle errors in async commands

Properly propagate errors from async Rust commands to
frontend. Previously errors were silently swallowed.

Fixes #456
```

### Pull Request Process

1. **Create feature branch:**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "feat: add my feature"
   ```

3. **Run tests:**
   ```bash
   npm run test
   npm run lint
   cd src-tauri && cargo test && cargo clippy
   ```

4. **Push and create PR:**
   ```bash
   git push origin feature/my-feature
   # Create PR on GitHub
   ```

5. **Address review feedback:**
   ```bash
   # Make changes
   git add .
   git commit -m "fix: address review comments"
   git push
   ```

6. **Squash commits (if needed):**
   ```bash
   git rebase -i main
   # Follow interactive rebase instructions
   git push --force-with-lease
   ```

### Documentation Requirements

When adding features:

1. **Code comments**: Document complex logic
2. **API documentation**: Update relevant docs
3. **User guide**: Update if user-facing
4. **CHANGELOG**: Add entry for notable changes
5. **Tests**: Include tests for new functionality

### Code Review Checklist

**For Reviewers:**

- [ ] Code follows style guidelines
- [ ] Tests are comprehensive
- [ ] Documentation is updated
- [ ] No performance regressions
- [ ] Security considerations addressed
- [ ] Cross-platform compatibility verified
- [ ] IPC commands properly documented
- [ ] Error handling is robust

**For Contributors:**

- [ ] Feature works as intended
- [ ] Tests pass locally
- [ ] Linting passes
- [ ] Documentation updated
- [ ] Changelog entry added
- [ ] Screenshots included (if UI change)
- [ ] Breaking changes noted

## Reference

### Useful Commands

```bash
# Development
npm run open                    # Start dev mode
npm run watch:browser          # Browser-only dev
npm run compile                # Compile TypeScript

# Building
npm run build:tauri:mac:amd64  # Build for macOS Intel
npm run build:tauri:mac:arm64  # Build for macOS ARM
npm run build:tauri:linux:amd64 # Build for Linux
npm run build:tauri:win32:amd64 # Build for Windows

# Testing
npm run test                   # All tests
npm run test:tauri:all        # All Tauri tests
npm run test:tauri:e2e        # E2E tests
npm run lint                  # Lint code

# Rust
cd src-tauri
cargo check                    # Check compilation
cargo build                    # Debug build
cargo build --release         # Release build
cargo test                    # Run tests
cargo fmt                     # Format code
cargo clippy                  # Lint code

# Cleaning
npm run clean                 # Clean all
cd src-tauri && cargo clean  # Clean Rust
```

### Key Files

```
Configuration:
- src-tauri/tauri.conf.json     # Tauri configuration
- src-tauri/Cargo.toml          # Rust dependencies
- package.json                  # npm scripts & dependencies
- tsconfig.json                 # TypeScript configuration
- webpack.config.js             # Webpack configuration

Entry Points:
- src-tauri/src/main.rs         # Rust entry point
- packages/core/src/main/tauri-bridge.ts  # IPC bridge

Documentation:
- TAURI_USER_GUIDE.md           # User documentation
- TAURI_DEVELOPER_GUIDE.md      # This file
- docs/TAURI-BRIDGE-USAGE.md    # IPC documentation
- docs/MIGRATING_TO_TAURI.md    # Migration guide
- CLAUDE.md                     # AI assistant guide
```

### Resources

**Official Documentation:**
- Tauri: https://tauri.app/v1/guides/
- Rust: https://doc.rust-lang.org/book/
- TypeScript: https://www.typescriptlang.org/docs/
- React: https://react.dev/

**Kui Specific:**
- GitHub: https://github.com/kubernetes-sigs/kui
- Issues: https://github.com/IBM/kui/issues
- Discussions: https://github.com/IBM/kui/discussions
- Blog: https://medium.com/the-graphical-terminal

**Community:**
- Tauri Discord: https://discord.com/invite/tauri
- Rust Users Forum: https://users.rust-lang.org/

### Version Information

- **Kui Version**: 13.1.0+
- **Tauri Version**: 2.9+
- **Rust Version**: 1.85+
- **Node.js Version**: 20+
- **TypeScript Version**: 5.0+

### License

Apache 2.0 - See LICENSE file

---

**Ready to contribute?** Follow the [Development Setup](#development-setup) and start building!

**Need help?** Open an issue or discussion on GitHub.

**Found this helpful?** Star the repo and share with others!
