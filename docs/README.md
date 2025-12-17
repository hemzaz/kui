# Kui Documentation

Welcome to the Kui documentation. Kui is a framework that enhances command-line interfaces with rich graphical elements, built with TypeScript, React, and Rust (Tauri).

## What is Kui?

Kui transforms traditional ASCII terminal output into interactive, visual experiences. Instead of parsing text, you get sortable tables, clickable elements, and rich visualizations. The primary use case is Kubernetes tooling, where `kubectl` commands are enhanced with graphical output.

**Key Features:**

- **Graphical CLI**: Transform text output into interactive tables and views
- **Fast Performance**: 2-3x faster than native `kubectl`, 4x faster startup than Electron
- **Lightweight**: 10x smaller bundles (~15 MB vs ~150 MB)
- **Modern Stack**: TypeScript, React, Rust, Tauri
- **Extensible**: Plugin-based architecture
- **Multi-runtime**: Desktop (Tauri), web, or legacy Electron support

## Quick Start

### Installation

See the [main README](../README.md#installation) for installation instructions for your platform.

### Using Kui as kubectl Plugin

After installation, enhance any kubectl command with Kui:

```bash
kubectl kui get pods
kubectl kui get nodes
kubectl kui describe pod my-pod
```

### Standalone Application

Launch Kui as a standalone app:

```bash
# macOS
open /Applications/Kui.app

# Linux
kui  # or ./Kui.AppImage

# Windows
# Launch from Start Menu
```

## Documentation Structure

### For Users

- **[Installation Guide](../README.md#installation)** - Get Kui installed on your system
- **[Migrating to Tauri](MIGRATING_TO_TAURI.md)** - Guide for upgrading from Electron version
- **[User Guide](#using-kui-as-kubectl-plugin)** - Learn how to use Kui effectively
- **[Examples](example/)** - Sample applications and use cases

### For Developers

- **[CLAUDE.md](../CLAUDE.md)** - Comprehensive development guide
- **[TAURI_MIGRATION.md](../TAURI_MIGRATION.md)** - Technical details of Tauri migration
- **[Tauri Bridge Usage](TAURI-BRIDGE-USAGE.md)** - IPC communication patterns
- **[API Documentation](api/README.md)** - Complete API reference
- **[Components Guide](components.md)** - Component library integration

### Architecture Documentation

- **[Command Processing](../CLAUDE.md#command-processing-flow)** - How commands are executed
- **[Plugin System](../CLAUDE.md#plugin-system)** - Extending Kui functionality
- **[Response Types](../CLAUDE.md#response-types)** - Different output formats
- **[Build System](../CLAUDE.md#build-system)** - Build and packaging process

## Technology Stack

### Frontend

- **TypeScript**: Type-safe JavaScript
- **React**: UI component framework
- **Webpack**: Module bundler
- **Monaco Editor**: Code editing
- **xterm.js**: Terminal emulation

### Backend

- **Tauri** (Primary): Rust-based desktop framework
- **Electron** (Legacy): Node.js-based desktop framework
- **Node.js**: For browser/server mode

### Kubernetes Integration

- **kubectl**: Native kubectl integration
- **Helm**: Chart management support
- **Custom Resources**: Support for CRDs and operators

## Key Concepts

### REPL (Read-Eval-Print-Loop)

The command processor that parses input, executes commands, and renders responses. All commands go through the REPL.

### Blocks

Each command execution creates a block in the UI. Blocks can contain tables, terminal output, or custom content.

### Modes

Multiple views of the same resource. For example, a pod can have Summary, YAML, Events, and Logs modes.

### Tables

Enhanced data grids with sorting, filtering, and clickable cells. Much better than ASCII tables.

### Plugins

Modular extensions that add commands, modes, themes, and other functionality.

## Development

### Setup

```bash
# Clone repository
git clone https://github.com/kubernetes-sigs/kui.git
cd kui

# Install dependencies
npm ci

# Build TypeScript
npm run compile
```

### Prerequisites

**For Tauri development:**

- Node.js 24+
- npm 10+
- Rust toolchain ([Install Rust](https://rustup.rs))
- Platform-specific dependencies (see [TAURI_MIGRATION.md](../TAURI_MIGRATION.md#dependencies))

### Development Mode

```bash
# Start Tauri in development mode (recommended)
npm run open

# Browser mode (frontend only)
npm run watch:browser
# Then open http://localhost:9080
```

### Building

```bash
# Build for your platform
npm run build:tauri:mac:amd64    # macOS Intel
npm run build:tauri:mac:arm64    # macOS Apple Silicon
npm run build:tauri:linux:amd64  # Linux x64
npm run build:tauri:win32:amd64  # Windows x64
```

### Testing

```bash
# Run full test suite
npm run test

# Tauri-specific tests
npm run test:tauri:unit          # Unit tests
npm run test:tauri:e2e           # End-to-end tests
npm run test:tauri:integration   # Integration tests
npm run test:tauri:performance   # Performance benchmarks
```

## Creating Plugins

Kui is designed to be extended via plugins. Here's a minimal plugin:

```typescript
import { Registrar } from '@kui-shell/core'

export default async (commandTree: Registrar) => {
  // Register a command
  commandTree.listen(
    '/my-command',
    async ({ command, parsedOptions, execOptions }) => {
      return 'Hello from my plugin!'
    },
    {
      usage: {
        docs: 'My custom command'
      }
    }
  )
}
```

See the [plugin documentation](../CLAUDE.md#plugin-system) for more details.

## Custom Graphical CLIs

You can create your own graphical CLI using Kui as a framework. See the [template repository](https://github.com/kui-shell/KuiClientTemplate) to get started.

**Use cases:**

- Enhance any CLI tool with graphics
- Build custom Kubernetes tooling
- Create developer productivity tools
- Build internal tools for your team

## Architecture

### Tauri Architecture (Current)

```
┌─────────────────────────────────────┐
│     Tauri Core (Rust)               │
│  - Window Management                │
│  - Menu System                      │
│  - IPC Handlers                     │
│  - Native APIs                      │
└──────────────┬──────────────────────┘
               │ Commands/Events
┌──────────────┴──────────────────────┐
│   System Webview                    │
│  - React UI                         │
│  - Command Processing (REPL)        │
│  - Plugin System                    │
└─────────────────────────────────────┘
```

### Core Components

1. **@kui-shell/core**: Command processing, REPL, plugin system
2. **@kui-shell/react**: UI components, tables, terminal integration
3. **@kui-shell/plugin-kubectl**: Kubernetes enhancements
4. **src-tauri/**: Rust backend for desktop features

## Performance

Kui with Tauri delivers excellent performance:

| Metric           | Value       | Compared to                |
| ---------------- | ----------- | -------------------------- |
| Startup Time     | ~0.5s       | 4x faster than Electron    |
| Memory Usage     | ~80 MB      | 50% less than Electron     |
| Bundle Size      | ~15 MB      | 10x smaller than Electron  |
| kubectl Commands | 2-3x faster | Compared to native kubectl |

## Security

Tauri provides enhanced security:

- **Rust Memory Safety**: No buffer overflows or memory leaks
- **No Node.js in Renderer**: Reduced attack surface
- **Sandboxed Webview**: System webview with restricted permissions
- **CSP Enforcement**: Content Security Policy strictly enforced
- **Command Allowlist**: Only approved commands can be invoked
- **Capability System**: Fine-grained permission control

## Browser Mode

Kui can run in a browser for web-based deployments. This is useful for:

- Hosted development environments
- CI/CD dashboards
- Team collaboration tools
- Remote access scenarios

```bash
npm run watch:browser
# Open http://localhost:9080
```

## Component Libraries

Kui supports multiple component libraries:

- **Carbon Components** (IBM)
- **PatternFly v4** (Red Hat)
- Custom themes via plugins

See [components.md](components.md) for details on component library integration.

## Contributing

We welcome contributions! Here's how to get started:

1. Read the [developer guide](../CLAUDE.md)
2. Check open [issues](https://github.com/IBM/kui/issues)
3. Review [coding standards](../CLAUDE.md#important-conventions)
4. Submit a pull request

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run `npm run test`
6. Submit PR with clear description

### Code Standards

- TypeScript strict mode
- ESLint and Prettier enforced
- Use Tauri bridge for IPC (never import Electron directly)
- Test in both Tauri and browser modes
- Follow existing patterns and conventions

## Resources

### Official Resources

- [GitHub Repository](https://github.com/IBM/kui)
- [Issues Tracker](https://github.com/IBM/kui/issues)
- [Discussions](https://github.com/IBM/kui/discussions)
- [Medium Blog](https://medium.com/the-graphical-terminal)

### Documentation

- [API Reference](api/README.md)
- [Developer Guide](../CLAUDE.md)
- [Tauri Bridge Guide](TAURI-BRIDGE-USAGE.md)
- [Migration Guide](MIGRATING_TO_TAURI.md)

### External Resources

- [Tauri Documentation](https://tauri.app)
- [Rust Book](https://doc.rust-lang.org/book/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev)

## FAQ

### Why Tauri instead of Electron?

Tauri provides significant benefits:

- 10x smaller bundle size
- 50% less memory usage
- 4x faster startup
- Better security with Rust
- Modern architecture

See [TAURI_MIGRATION.md](../TAURI_MIGRATION.md) for technical details.

### Is Electron still supported?

Yes, for compatibility. However, Tauri is the recommended runtime for new development and production use.

### Can I use Kui without Kubernetes?

Yes! Kui is a general framework for enhancing CLIs. While Kubernetes is the primary use case, you can use Kui with any CLI tool.

### How do I migrate from Electron to Tauri?

See the [migration guide](MIGRATING_TO_TAURI.md) for detailed instructions. Migration is automatic for most users.

### Does Kui work on Windows/Linux/macOS?

Yes, Kui works on all three platforms with native installers for each.

### Can I use Kui in a browser?

Yes, Kui supports browser mode for web-based deployments.

### How do I create a custom theme?

Create a theme plugin following the pattern in existing theme plugins. See `plugins/plugin-*-themes/` for examples.

### How do I add support for a new CLI tool?

Create a plugin that registers commands for your tool. See [CLAUDE.md](../CLAUDE.md#adding-a-command) for details.

## Community

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions and community discussions
- **Medium Blog**: Articles, tutorials, and updates
- **Stack Overflow**: Tag questions with `kui-shell`

## License

Apache 2.0. See [LICENSE](../LICENSE) for details.

## Acknowledgments

Kui is a Kubernetes SIG-CLI project, built with contributions from IBM and the open source community.

Special thanks to:

- The Tauri team for building an amazing framework
- The Kubernetes community for feedback and contributions
- All our contributors and users
- IBM for sponsoring development

---

**Built with**: TypeScript, React, Rust, and Tauri
**License**: Apache 2.0
**Status**: Production Ready
**Last Updated**: 2025-12-17
