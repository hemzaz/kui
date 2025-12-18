# CI/CD Pipeline Complete Documentation

## Overview

This document provides comprehensive documentation for the Kui Tauri CI/CD pipeline, including build automation, testing strategies, quality gates, and deployment processes.

## Pipeline Architecture

### Workflow Files

The CI/CD pipeline consists of three main workflows:

1. **`tauri-build.yml`** - Production build pipeline
2. **`tauri-test.yml`** - Comprehensive testing pipeline (NEW)
3. **`test.yaml`** - Legacy browser-based tests

### Pipeline Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Code Push / PR                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ├─────────────────────────────────────┐
                      │                                     │
          ┌───────────▼──────────┐            ┌────────────▼─────────┐
          │  tauri-test.yml      │            │  tauri-build.yml     │
          │  (Quality Gates)     │            │  (Build Artifacts)   │
          └───────────┬──────────┘            └────────────┬─────────┘
                      │                                    │
        ┌─────────────┼─────────────┐                     │
        │             │             │                     │
   ┌────▼───┐   ┌────▼───┐   ┌────▼───┐           ┌─────▼─────┐
   │ Rust   │   │  TS    │   │  E2E   │           │  Build    │
   │Quality │   │ Unit   │   │ Tests  │           │ All       │
   │        │   │Tests   │   │        │           │Platforms  │
   └────┬───┘   └────┬───┘   └────┬───┘           └─────┬─────┘
        │            │            │                      │
        └────────────┴────────────┘                      │
                     │                                   │
              ┌──────▼──────┐                     ┌─────▼─────┐
              │  All Tests  │                     │  Upload   │
              │   Passed?   │                     │ Artifacts │
              └──────┬──────┘                     └─────┬─────┘
                     │                                  │
                     │ YES                              │
                     │                                  │
                     └──────────────┬───────────────────┘
                                    │
                          ┌─────────▼─────────┐
                          │  Ready for        │
                          │  Release          │
                          │  (on version tag) │
                          └───────────────────┘
```

## Workflow: tauri-build.yml

### Purpose
Build production-ready Tauri applications for all supported platforms.

### Triggers
- Push to main branches (master, main, develop)
- Pull requests to main branches
- Manual dispatch
- Changes to relevant files (src-tauri, packages, plugins, configs)

### Build Matrix

| Platform | Architecture | Runner          | Output Format          |
|----------|--------------|-----------------|------------------------|
| macOS    | x64 (Intel)  | macos-latest    | DMG                    |
| macOS    | ARM64 (M1+)  | macos-latest    | DMG                    |
| Linux    | x64          | ubuntu-20.04    | DEB, AppImage          |
| Windows  | x64          | windows-latest  | MSI, NSIS installer    |

### Build Steps

1. **Environment Setup**
   - Checkout code
   - Install Node.js v24
   - Install Rust stable toolchain
   - Cache dependencies (npm + Cargo)

2. **Platform Dependencies**
   - Linux: GTK3, WebKit2GTK, Wayland libraries
   - macOS: Xcode Command Line Tools (pre-installed)
   - Windows: Visual Studio Build Tools (pre-installed)

3. **Compilation**
   - Install npm dependencies (`npm ci`)
   - Build frontend assets (`npm run compile`)
   - Build Tauri binary (`npm run tauri:build`)

4. **Artifact Collection**
   - Collect platform-specific installers
   - Upload to GitHub Actions artifacts
   - Retention: 30 days

5. **Post-Build Testing**
   - Basic smoke tests
   - Browser-based test suite

6. **Release (on tags only)**
   - Create GitHub release draft
   - Attach all platform binaries
   - Auto-generate release notes

### Caching Strategy

- **npm dependencies**: Cached by package-lock.json hash
- **Cargo registry**: Cached by Cargo.lock hash
- **Cargo build artifacts**: Cached per platform
- **Cache hit ratio**: ~80-90% on subsequent runs
- **Build time improvement**: 60-70% faster with cache

### Secrets Required

- `TAURI_PRIVATE_KEY`: Code signing private key
- `TAURI_KEY_PASSWORD`: Password for private key
- `GITHUB_TOKEN`: Auto-provided for releases

## Workflow: tauri-test.yml (NEW)

### Purpose
Comprehensive testing pipeline with quality gates to catch issues early.

### Triggers
- Push to main branches
- Pull requests
- Manual dispatch with test suite selection
- Changes to source files or test files

### Test Suites

#### 1. Rust Quality Checks
**Purpose**: Ensure Rust code quality before running tests

**Checks**:
- `cargo fmt --check`: Code formatting
- `cargo clippy`: Linting with strict warnings
- `cargo audit`: Security vulnerability scanning

**Runs on**: Ubuntu (fastest)

**Duration**: ~2-3 minutes

#### 2. Rust Unit Tests
**Purpose**: Test Rust business logic and Tauri commands

**Coverage**:
- Unit tests (`cargo test --lib --bins`)
- Doc tests (`cargo test --doc`)

**Platforms**: Linux, macOS, Windows

**Duration**: ~5-7 minutes per platform

#### 3. TypeScript Unit Tests
**Purpose**: Test TypeScript/React components and utilities

**Framework**: Jest with ts-jest

**Coverage**: Aims for >80% code coverage

**Duration**: ~3-5 minutes

#### 4. Integration Tests
**Purpose**: Test IPC, window management, and cross-component interactions

**Framework**: Playwright with Tauri

**Tests**:
- IPC communication (renderer ↔ main)
- Window lifecycle (create, close, focus)
- Menu interactions
- Clipboard operations
- File dialogs

**Platforms**: Linux, macOS

**Duration**: ~10-15 minutes per platform

#### 5. E2E Tests
**Purpose**: Full application testing with real user workflows

**Framework**: Playwright

**Tests**:
- Application startup
- REPL command execution
- kubectl integrations
- Theme switching
- Plugin loading
- Multi-window scenarios

**Platforms**: Linux, macOS

**Duration**: ~15-20 minutes per platform

#### 6. Feature Parity Tests
**Purpose**: Ensure Tauri matches expected Electron/browser behavior

**Tests**:
- Core command set
- UI component behavior
- Keyboard shortcuts
- Performance characteristics

**Duration**: ~10-15 minutes

#### 7. Performance Benchmarks
**Purpose**: Track performance metrics over time

**Metrics**:
- Startup time (target: <1s)
- Memory usage (target: <100MB)
- Bundle size (target: <20MB)
- Command execution latency

**Duration**: ~5-10 minutes

### Test Reporting

- **Test artifacts**: Uploaded for 7-30 days
- **Playwright reports**: Visual test results with screenshots/videos
- **Coverage reports**: Code coverage for TypeScript
- **Performance trends**: Historical performance data

### Quality Gates

Tests must pass before merge:
- ✅ Rust Quality (blocking)
- ✅ Rust Unit Tests (blocking)
- ✅ TypeScript Unit Tests (blocking)
- ✅ Integration Tests (blocking)
- ✅ E2E Tests (blocking)
- ⚠️ Feature Parity (non-blocking, advisory)
- ⚠️ Performance (non-blocking, tracking)

## Pre-commit Hooks

### Location
`.husky/pre-commit`

### Checks Performed

1. **TypeScript/JavaScript**
   - Prettier formatting (`npx lint-staged`)
   - ESLint linting (`npx lint-staged`)

2. **Rust** (NEW)
   - `cargo fmt --check`: Formatting validation
   - `cargo clippy -- -D warnings`: Linting with strict mode

### Duration
~10-30 seconds depending on changed files

### Bypassing (NOT RECOMMENDED)
```bash
git commit --no-verify
```

## Local Development Workflow

### Initial Setup
```bash
# Install dependencies
npm ci

# Install Rust toolchain
rustup install stable
rustup default stable

# Install Clippy and rustfmt
rustup component add clippy rustfmt

# Compile TypeScript
npm run compile
```

### Development Cycle
```bash
# Start Tauri in development mode
npm run open:tauri

# In another terminal: watch TypeScript
npm run watch:source
```

### Pre-push Checks
```bash
# Run all tests locally
npm run test:tauri:all

# Run specific test suites
npm run test:tauri:unit          # Jest unit tests
npm run test:tauri:integration   # Playwright integration
npm run test:tauri:e2e          # Playwright E2E
npm run test:tauri:performance   # Performance benchmarks

# Check Rust quality
cd src-tauri
cargo fmt --check
cargo clippy --all-targets --all-features
cargo test
```

### Building Locally
```bash
# Build for current platform
npm run tauri:build

# Build for specific platform (requires setup)
npm run build:tauri:mac:arm64
npm run build:tauri:linux:amd64
npm run build:tauri:win32:amd64
```

## Continuous Integration Best Practices

### 1. Fail Fast
- Run quick tests first (linting, formatting)
- Fail the pipeline immediately on critical errors
- Don't waste CI time on obviously broken builds

### 2. Parallel Execution
- Run platform builds in parallel
- Run independent test suites concurrently
- Use matrix strategies for cross-platform testing

### 3. Caching
- Cache npm dependencies
- Cache Cargo registry and build artifacts
- Use cache keys based on lock file hashes

### 4. Incremental Testing
- Run affected tests only when possible
- Use test result caching
- Skip slow tests on draft PRs (manual trigger)

### 5. Clear Feedback
- Generate readable summaries
- Upload test artifacts for investigation
- Provide actionable error messages

## Monitoring and Metrics

### Key Performance Indicators (KPIs)

| Metric                    | Target       | Current    |
|---------------------------|--------------|------------|
| Build success rate        | >95%         | Track      |
| Average build time        | <15 min      | Track      |
| Test success rate         | >98%         | Track      |
| Cache hit rate            | >80%         | Track      |
| Mean time to feedback     | <5 min       | Track      |

### Monitoring

- **GitHub Actions Dashboard**: Real-time pipeline status
- **Artifact Storage**: Monitor disk usage
- **Build Duration Trends**: Identify slowdowns
- **Flaky Test Detection**: Tests that fail intermittently

## Troubleshooting

### Common Issues

#### Build Fails on Linux
**Symptom**: Missing GTK or WebKit libraries

**Solution**:
```bash
sudo apt-get update
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev
```

#### Build Fails on macOS
**Symptom**: Missing Xcode tools

**Solution**:
```bash
xcode-select --install
rustup target add x86_64-apple-darwin
rustup target add aarch64-apple-darwin
```

#### Build Fails on Windows
**Symptom**: Missing Visual Studio Build Tools

**Solution**: Install Visual Studio 2022 Build Tools with C++ workload

#### Cache Issues
**Symptom**: Builds are slow despite caching

**Solution**:
- Clear cache: Repository Settings → Actions → Caches → Delete
- Verify cache keys in workflow file
- Check cache size limits (10GB per repo)

#### Flaky Tests
**Symptom**: Tests pass locally but fail in CI

**Common Causes**:
- Timing issues (add proper waits)
- Environment differences (check CI environment)
- Resource constraints (reduce parallelism)
- State leakage (ensure test isolation)

**Solution**:
```typescript
// Bad: Fixed timeout
await page.waitForTimeout(1000)

// Good: Wait for condition
await page.waitForSelector('.repl-result')
```

#### Pre-commit Hook Failures
**Symptom**: Commit is rejected

**Solution**:
```bash
# Fix formatting
npm run format
cd src-tauri && cargo fmt

# Fix linting
npm run lint -- --fix
cd src-tauri && cargo clippy --fix

# Re-run tests
npm test
```

## Release Process

### Automatic Release (on version tags)

1. **Tag the release**:
```bash
git tag v13.1.0
git push origin v13.1.0
```

2. **CI Pipeline Executes**:
   - Runs all tests
   - Builds all platforms
   - Creates GitHub release draft

3. **Manual Review**:
   - Review auto-generated release notes
   - Test downloaded binaries
   - Edit release notes if needed
   - Publish release

### Manual Release

```bash
# Trigger build workflow manually
gh workflow run tauri-build.yml

# Download artifacts
gh run download <run-id>

# Create release manually
gh release create v13.1.0 \
  --title "Kui v13.1.0" \
  --notes "Release notes here" \
  artifacts/*
```

## Security Considerations

### Code Signing

- **macOS**: Requires Apple Developer account and certificate
- **Windows**: Requires code signing certificate
- **Linux**: AppImage can be signed (optional)

### Secret Management

- Store secrets in GitHub Secrets
- Never commit secrets to repository
- Rotate secrets regularly
- Use least-privilege access

### Dependency Security

- `npm audit`: Scan npm dependencies
- `cargo audit`: Scan Rust dependencies
- Dependabot: Automated dependency updates
- Security advisories: Monitor GitHub Security tab

## Future Improvements

### Planned Enhancements

1. **Test Coverage Tracking**
   - Integration with Codecov or Coveralls
   - Coverage reports on PRs
   - Enforce minimum coverage thresholds

2. **Performance Tracking**
   - Historical performance database
   - Automated performance regression detection
   - Performance trend visualization

3. **Cross-platform Testing**
   - Windows E2E tests (currently limited)
   - ARM64 Linux testing
   - iOS/Android testing (future)

4. **Deployment Automation**
   - Automatic publishing to package managers
   - Homebrew formula updates
   - Snap/Flatpak automatic releases

5. **Release Automation**
   - Automated changelog generation
   - Semantic versioning validation
   - Release note templates

## Support and Contribution

### Getting Help

- **Issues**: https://github.com/IBM/kui/issues
- **Discussions**: https://github.com/IBM/kui/discussions
- **Documentation**: Check workflow comments and this file

### Contributing to CI/CD

When modifying workflows:

1. **Test locally** using `act` (GitHub Actions locally)
2. **Use draft PRs** to test workflow changes
3. **Document changes** in this file
4. **Get review** from maintainers
5. **Monitor** first runs after merge

### Useful Commands

```bash
# Validate workflow syntax
actionlint .github/workflows/*.yml

# Test workflows locally
act -W .github/workflows/tauri-test.yml

# Check workflow runs
gh run list --workflow=tauri-build.yml

# Watch workflow run
gh run watch

# View workflow logs
gh run view <run-id> --log
```

## Appendix

### Workflow File Locations
- `/Users/elad/PROJ/kui/.github/workflows/tauri-build.yml`
- `/Users/elad/PROJ/kui/.github/workflows/tauri-test.yml`
- `/Users/elad/PROJ/kui/.github/workflows/test.yaml` (legacy)

### Pre-commit Hook Location
- `/Users/elad/PROJ/kui/.husky/pre-commit`

### Configuration Files
- `/Users/elad/PROJ/kui/src-tauri/tauri.conf.json`
- `/Users/elad/PROJ/kui/src-tauri/Cargo.toml`
- `/Users/elad/PROJ/kui/package.json`
- `/Users/elad/PROJ/kui/playwright.config.ts`
- `/Users/elad/PROJ/kui/jest.config.js`

### Related Documentation
- `TAURI_MIGRATION.md`: Tauri migration guide
- `TAURI_NEXT_STEPS.md`: Implementation roadmap
- `CLAUDE.md`: Project overview
- `.github/workflows/CI_CD_README.md`: Quick reference
- `.github/workflows/PIPELINE_ARCHITECTURE.md`: Technical details

---

**Last Updated**: 2025-12-17
**Version**: 1.0
**Maintained By**: DevOps Team
