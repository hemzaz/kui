[![GitHub Stars](https://badgen.net/github/stars/IBM/kui)](https://github.com/IBM/kui/stargazers)
[![GitHub Forks](https://badgen.net/github/forks/IBM/kui)](https://github.com/IBM/kui/network/members)
![ts](https://flat.badgen.net/badge/-/TypeScript?icon=typescript&label&labelColor=blue&color=555555)
![Tauri](https://flat.badgen.net/badge/Tauri/2.9/purple)
![Rust](https://flat.badgen.net/badge/Rust/1.85/orange)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg?style=flat-square)](https://opensource.org/licenses/Apache-2.0)
[![test](https://github.com/kubernetes-sigs/kui/actions/workflows/test.yaml/badge.svg)](https://github.com/kubernetes-sigs/kui/actions/workflows/test.yaml)

[**Blogs**](https://medium.com/the-graphical-terminal) **|** [**PDF Summary**](docs/presentations/kui-cloudnative-devx-2021.pdf) **|** [**Installation**](#install) **|** [**API**](docs/api/README.md) **|** [**Custom Graphical CLIs**](#custom)

# Kui: a Framework for Enhancing CLIs with Graphics

<img width="600" align="right" src="docs/readme/images/kui-experience.gif">

We love CLIs, and think they are critical for interacting in a
flexible way with the cloud. We need the power to go off the
rails. But ASCII is tedious.

Kui takes your normal `kubectl` command line requests and **responds
with graphics**. Instead of ASCII tables, you are presented with
sortable ones. Instead of copying and pasting long auto-generated
resource names, in Kui **you just click**.

Kui is also fast. It launches in **under a second**, and can process `kubectl`
commands **2-3 times faster** than `kubectl` itself. Built with **Tauri** and **Rust**,
Kui delivers a modern, secure, and lightweight desktop experience.

<img height="185" src="docs/readme/images/grid-watch.gif"><img height="185" src="docs/readme/images/sequence-diagram.png"><img height="185" src="docs/readme/images/pod.png">

## What's New: Powered by Tauri

Kui has been rebuilt on [Tauri](https://tauri.app), a modern framework for building lightweight desktop applications. This brings significant improvements:

| Feature          | Tauri (New)        | Electron (Legacy)   | Improvement     |
| ---------------- | ------------------ | ------------------- | --------------- |
| **Bundle Size**  | ~15 MB             | ~150 MB             | **10x smaller** |
| **Memory Usage** | ~80 MB             | ~150 MB             | **50% less**    |
| **Startup Time** | ~0.5s              | ~2s                 | **4x faster**   |
| **Security**     | Rust memory safety | Node.js in renderer | **Enhanced**    |
| **Architecture** | System webview     | Bundled Chromium    | **Modern**      |

> Help us make Kubernetes tools better by filling out a [quick 2
> minute survey](https://forms.gle/BMvpscU9Yi5Horp29) on your tool
> preferences. Thanks!

<a name="install">

## Installing Kui for Kubernetes

We offer prebuilt images optimized for an enhanced Kubernetes CLI
experience. Kui is now powered by **Tauri** for better performance and smaller downloads.

<img width="575" align="right" src="docs/readme/images/minisplits.png">

### MacOS (Intel and Apple Silicon)

```bash
brew install kui
kubectl kui get pods
open /Applications/Kui.app
```

**Or download directly:**

- [Download for macOS Intel](https://github.com/kubernetes-sigs/kui/releases/latest/download/Kui-macos-x64.dmg)
- [Download for macOS Apple Silicon](https://github.com/kubernetes-sigs/kui/releases/latest/download/Kui-macos-arm64.dmg)

### Windows

[Download for Windows](https://github.com/kubernetes-sigs/kui/releases/latest/download/Kui-windows-x64.msi)

Install the MSI package, then use `kubectl kui` or launch the `Kui` application from your Start Menu.

> **Windows Note**: Please use forward slashes for filepaths, e.g. c:/users, not c:\users.

### Linux

**Debian/Ubuntu (Recommended):**

```bash
# Download DEB package
wget https://github.com/kubernetes-sigs/kui/releases/latest/download/Kui-linux-x64.deb

# Install
sudo dpkg -i Kui-linux-x64.deb

# Or with dependencies
sudo apt install ./Kui-linux-x64.deb
```

**AppImage (Universal):**

```bash
# Download AppImage
wget https://github.com/kubernetes-sigs/kui/releases/latest/download/Kui-linux-x64.AppImage

# Make executable
chmod +x Kui-linux-x64.AppImage

# Run
./Kui-linux-x64.AppImage
```

**Other architectures:**

- [ARM64 for Linux](https://github.com/kubernetes-sigs/kui/releases/latest)

### I don't trust the prebuilts

We hear you. Choose your platform, execute the following, then look in `./src-tauri/target/release/bundle`.

**Prerequisites:**

- Node.js 24+ and npm 10+
- Rust toolchain ([Install Rust](https://rustup.rs))
- Platform-specific dependencies (see [Building from Source](#building))

```sh
git clone git@github.com:kubernetes-sigs/kui.git && cd kui && npm ci && \
    npm run build:tauri:mac:amd64
```

Replace `mac:amd64` with your platform:

- `mac:amd64` - macOS Intel
- `mac:arm64` - macOS Apple Silicon
- `linux:amd64` - Linux x86-64
- `linux:arm64` - Linux ARM64
- `win32:amd64` - Windows x86-64

<a name="building">

## Building from Source

### System Requirements

**Rust Toolchain:**

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add targets for cross-compilation (optional)
rustup target add x86_64-apple-darwin      # macOS Intel
rustup target add aarch64-apple-darwin     # macOS Apple Silicon
rustup target add x86_64-unknown-linux-gnu # Linux x64
rustup target add aarch64-unknown-linux-gnu # Linux ARM64
rustup target add x86_64-pc-windows-msvc   # Windows
```

**Linux Dependencies:**

```bash
sudo apt-get update
sudo apt-get install -y \
    libgtk-3-dev \
    libwebkit2gtk-4.0-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    patchelf \
    libwayland-dev \
    libxkbcommon-dev \
    wayland-protocols
```

**macOS Dependencies:**

```bash
# Xcode Command Line Tools
xcode-select --install
```

**Windows Dependencies:**

- Microsoft Visual C++ Build Tools
- WebView2 Runtime (usually pre-installed on Windows 10/11)

### Build Commands

```bash
# Clone and install dependencies
git clone https://github.com/kubernetes-sigs/kui.git
cd kui
npm ci

# Build TypeScript
npm run compile

# Build for your platform
npm run build:tauri:mac:amd64    # macOS Intel
npm run build:tauri:mac:arm64    # macOS Apple Silicon
npm run build:tauri:linux:amd64  # Linux x64
npm run build:tauri:win32:amd64  # Windows x64
```

Build output location: `src-tauri/target/release/bundle/`

### Development Mode

```bash
# Start Tauri in development mode (recommended)
npm run open

# Or with separate terminal processes
npm run watch:browser   # Terminal 1: Webpack dev server
npm run tauri:dev      # Terminal 2: Tauri app

# Browser mode (for frontend development)
npm run watch:browser
# Then open http://localhost:9080
```

<a name="custom">

## I Want to Make a Custom Graphical CLI

Kui is a framework for adding graphics to CLIs. Kui allows for either
a hosted client-server architecture, or the distribution of
double-clickable applications (via [Tauri](https://tauri.app) or legacy [Electron](https://electronjs.org)).

Using the Kui framework, you can design your own Kubernetes
enhancements, set a custom theme or custom icon, and enhance the
commands of your favorite CLI. Check out the [template
repo](https://github.com/kui-shell/KuiClientTemplate). If your
enhancements would be generally valuable, please PR them back here,
e.g. awesome Kubernetes enhancements can be integrated with the [core
Kubernetes plugin](plugins/plugin-kubectl).

### Technology Stack

- **Frontend**: TypeScript, React, Webpack
- **Backend**: Rust (Tauri), system webview
- **Legacy**: Electron still supported for compatibility

### Key Features

- **Plugin Architecture**: Extend functionality with custom plugins
- **Multi-runtime Support**: Works in browser, Electron, or Tauri
- **Theme System**: Customize appearance with Carbon or PatternFly themes
- **Command System**: Enhance any CLI tool with graphical output
- **Table Rendering**: Sortable, filterable tables with rich interactions

## Architecture

Kui consists of three main layers:

1. **Core Framework** (`packages/core`): Command processing, REPL, plugin system
2. **React UI** (`packages/react`): UI components, tables, terminal integration
3. **Runtime Layer**:
   - **Tauri** (`src-tauri/`): Rust backend for desktop apps (recommended)
   - **Electron**: Legacy runtime (still supported)
   - **Browser**: Web-based deployment

## Documentation

- [API Documentation](docs/api/README.md) - Complete API reference
- [CLAUDE.md](CLAUDE.md) - Developer guide for contributors
- [TAURI_MIGRATION.md](TAURI_MIGRATION.md) - Technical details of Tauri migration
- [Tauri Bridge Usage](docs/TAURI-BRIDGE-USAGE.md) - IPC communication guide
- [Examples](docs/example/) - Example applications
- [Medium Blog](https://medium.com/the-graphical-terminal) - Articles and tutorials

## Testing

```bash
# Run full test suite
npm run test

# Run Tauri-specific tests
npm run test:tauri:unit          # Unit tests
npm run test:tauri:e2e           # End-to-end tests
npm run test:tauri:integration   # Integration tests
npm run test:tauri:performance   # Performance benchmarks

# Browser tests
npm run test:browser
```

## Performance Benchmarks

Kui with Tauri delivers exceptional performance:

```
Startup Time:      ~0.5s (4x faster than Electron)
Memory Usage:      ~80 MB (50% less than Electron)
Bundle Size:       ~15 MB (10x smaller than Electron)
kubectl Commands:  2-3x faster than native kubectl
```

## Migration from Electron

If you're upgrading from an Electron-based version of Kui:

1. **Automatic Migration**: Settings and data are preserved
2. **Same Features**: All functionality works identically
3. **Better Performance**: Immediate performance improvements
4. **Smaller Size**: Faster downloads and less disk space

See [Migrating to Tauri](docs/MIGRATING_TO_TAURI.md) for detailed information.

## Security

Tauri provides enhanced security compared to Electron:

- **Rust Memory Safety**: No buffer overflows or memory leaks
- **No Node.js in Renderer**: Reduced attack surface
- **Sandboxed Webview**: System webview with restricted permissions
- **CSP Enforcement**: Content Security Policy strictly enforced
- **Command Allowlist**: Only explicitly allowed commands can be invoked

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/my-feature`
3. **Make your changes**: Follow our coding standards
4. **Run tests**: `npm run test`
5. **Commit**: `git commit -m "feat: add my feature"`
6. **Push**: `git push origin feature/my-feature`
7. **Open a Pull Request**

See [CLAUDE.md](CLAUDE.md) for detailed development guidelines.

### Code Standards

- TypeScript strict mode enabled
- ESLint and Prettier for code quality
- Write tests for new functionality
- Follow existing patterns and conventions
- Use the Tauri bridge for IPC communication

## Community

- [GitHub Issues](https://github.com/IBM/kui/issues) - Bug reports and feature requests
- [GitHub Discussions](https://github.com/IBM/kui/discussions) - Questions and ideas
- [Medium Blog](https://medium.com/the-graphical-terminal) - Articles and updates

## Code of Conduct

Participation in the Kubernetes community is governed by the [Kubernetes Code
of Conduct](https://github.com/kubernetes-sigs/krew/blob/master/code-of-conduct.md).

## License

Apache 2.0. See [LICENSE](LICENSE) for details.

## Acknowledgments

Kui is a Kubernetes SIG-CLI project, built with contributions from IBM and the open source community. Special thanks to:

- The Tauri team for building an amazing framework
- The Kubernetes community for feedback and contributions
- All our contributors and users

---

**Built with**: TypeScript, React, Rust, and Tauri | **License**: Apache 2.0 | **Status**: Production Ready
