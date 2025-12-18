# Tauri Dependency Update - December 17, 2025

## Summary

Updated Tauri Rust dependencies to latest stable versions, focusing on Tauri 2.9.x ecosystem.

## Changes Made

### Core Framework Updates

| Package | Previous Version | New Version | Notes |
|---------|-----------------|-------------|-------|
| `tauri` | 2.5 | 2.9 | Core framework - locked to 2.9.5 |
| `tauri-build` | 2.5 | 2.5 | Latest available (2.5.3) - no 2.9 release yet |

### Plugin Updates

| Package | Previous Version | New Version | Notes |
|---------|-----------------|-------------|-------|
| `tauri-plugin-shell` | 2.3 | 2.3 | Locked to 2.3.3 |
| `tauri-plugin-clipboard-manager` | 2.3 | 2.3 | Locked to 2.3.2 |
| `tauri-plugin-dialog` | 2.4 | 2.4 | Locked to 2.4.2 |

### Supporting Dependencies

| Package | Previous Version | New Version | Notes |
|---------|-----------------|-------------|-------|
| `xcap` | 0.0.12 | 0.8 | Major version bump - screen capture library |
| `cocoa` (macOS) | 0.25 | 0.26 | macOS bindings update |
| `core-graphics` (macOS) | - | 0.24 | Added by cargo - required by cocoa 0.26 |

### Unchanged Dependencies

- `serde`: 1.0 (with derive features)
- `serde_json`: 1.0
- `tokio`: 1.48 (with full features)
- `log`: 0.4
- `env_logger`: 0.11
- `urlencoding`: 2.1
- `image`: 0.25
- `open`: 5.0
- `objc`: 0.2

## Version Compatibility Notes

### Why tauri-build is still 2.5

The `tauri-build` crate has not yet released a 2.9 version. The latest available is 2.5.3, which is compatible with Tauri 2.9.x runtime. This is intentional - build-time dependencies can have different version numbers than runtime dependencies.

### Semantic Versioning Behavior

Cargo uses semantic versioning:
- `"2.5"` in Cargo.toml means `">=2.5.0, <3.0.0"`
- `"2.9"` in Cargo.toml means `">=2.9.0, <3.0.0"`

This allows Cargo to automatically use the latest compatible version within the major version range.

### Plugin Version Availability

The Tauri plugins (shell, clipboard-manager, dialog) have not yet released 2.9 versions. The latest available versions are:
- `tauri-plugin-shell`: 2.3.3
- `tauri-plugin-clipboard-manager`: 2.3.2
- `tauri-plugin-dialog`: 2.4.2

These are fully compatible with Tauri 2.9.x.

## New Transitive Dependencies Added

The update to `xcap` 0.8 and `cocoa` 0.26 brought in several new dependencies:

### Screen Capture (xcap)
- `libwayshot-xcap`: Wayland screenshot support
- `pipewire`, `pipewire-sys`: PipeWire integration for Linux
- `drm`, `drm-ffi`, `drm-fourcc`, `drm-sys`: Direct Rendering Manager for Linux
- `gbm`, `gbm-sys`: Generic Buffer Management for Linux
- `wayland-server`: Wayland protocol support

### Graphics (cocoa/objc2)
- `objc2-*` family: Modern Objective-C 2.0 bindings for macOS frameworks
  - `objc2-av-foundation`, `objc2-avf-audio`: Audio/Video support
  - `objc2-core-audio`, `objc2-core-audio-types`: Audio frameworks
  - `objc2-core-media`, `objc2-media-toolbox`: Media handling
  - `objc2-image-io`: Image I/O
  - `objc2-metal`, `objc2-quartz-core`: Graphics acceleration
  - `objc2-app-kit`, `objc2-web-kit`: UI frameworks

### Async Runtime
- `async-*` family: Enhanced async support
  - `async-channel`, `async-executor`, `async-io`, `async-lock`
  - `async-process`, `async-signal`, `async-task`

### System Integration
- `nix`: Unix/Linux system interface (0.27.1)
- `rustix`: Safe Rust bindings to POSIX/Linux/Winsock syscalls

## Removed Dependencies

Several dependencies were removed as they're no longer needed:
- `ntapi`: Windows NT API (replaced by newer windows-* crates)
- `dbus`, `libdbus-sys`: D-Bus support (refactored into pipewire)
- `sysinfo`: System information (no longer needed)
- Older `windows` and `windows-core` versions

## Testing Results

### Compilation Test
```bash
cd src-tauri && cargo check
```

**Result**: ✅ Success (28.51s)

**Warnings**: 16 warnings related to:
- Unused imports (can be fixed with `cargo fix`)
- Dead code in utility modules
- No errors or breaking changes

### Locked Versions

Actual versions locked in `Cargo.lock`:
- `tauri`: 2.9.5
- `tauri-build`: 2.5.3
- `tauri-plugin-shell`: 2.3.3
- `tauri-plugin-clipboard-manager`: 2.3.2
- `tauri-plugin-dialog`: 2.4.2
- `tauri-runtime`: 2.9.2
- `tauri-runtime-wry`: 2.9.3
- `xcap`: 0.8.0
- `cocoa`: 0.26.1

## Breaking Changes

None identified. All updates are backwards compatible.

## Recommendations

1. **Clean up warnings**: Run `cargo fix --bin "kui" -p kui` to automatically fix unused import warnings
2. **Test runtime**: Run full integration tests to ensure screen capture and UI features work correctly
3. **Monitor for updates**: Watch for future releases of:
   - `tauri-build` 2.9.x (when available)
   - Plugin updates to 2.9.x versions (when released)

## Build Commands

```bash
# Update dependencies
cd src-tauri
cargo update

# Check compilation
cargo check

# Build release
cargo build --release

# Run tests (if available)
cargo test
```

## References

- [Tauri 2.9 Release](https://github.com/tauri-apps/tauri/releases)
- [Cargo Version Specifiers](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html)
- [xcap 0.8.0 Changelog](https://crates.io/crates/xcap)
- [cocoa 0.26 Changelog](https://crates.io/crates/cocoa)

## Date

December 17, 2025
