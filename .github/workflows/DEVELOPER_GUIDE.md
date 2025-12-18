# Developer Guide: Working with Kui CI/CD

Quick reference for developers working with Kui's GitHub Actions CI/CD pipeline.

## Quick Commands

### Local Development

```bash
# Build for your platform
npm run tauri:build

# Development mode with hot reload
npm run tauri:dev

# Run tests
npm test
npm run test:browser

# Format Rust code
cd src-tauri && cargo fmt

# Check Rust formatting
cd src-tauri && cargo fmt --check

# Lint TypeScript
npm run lint

# Format all code
npm run format
```

### Local Builds (All Platforms)

```bash
# macOS
npm run build:tauri:mac:amd64    # Intel
npm run build:tauri:mac:arm64    # Apple Silicon

# Linux
npm run build:tauri:linux:amd64

# Windows
npm run build:tauri:win32:amd64
```

## CI/CD Workflow Triggers

### Automatic Triggers

| Event | Branch | Workflow | Description |
|-------|--------|----------|-------------|
| Push | `master`, `main`, `develop` | Tauri Build | Full multi-platform build |
| Push | Any | Test | Run test suite |
| Pull Request | → `master`, `main` | Tauri Build + Test | Build validation |
| Tag | `v*.*.*` | Tauri Build + Release | Create release |

### Manual Triggers

1. Go to [Actions tab](https://github.com/IBM/kui/actions)
2. Select **Tauri Build** workflow
3. Click **Run workflow**
4. Choose branch and click **Run workflow**

## Understanding Build Status

### Status Badges

| Badge | Meaning |
|-------|---------|
| ✅ Green checkmark | All checks passed |
| ❌ Red X | Build or test failed |
| 🟡 Yellow dot | Build in progress |
| ⚪ Gray circle | Build queued |
| ⊝ Gray dash | Build skipped |

### Viewing Build Logs

1. Click on the workflow run
2. Expand job (e.g., "Build Tauri - macos (x64)")
3. Click on failed step to see logs
4. Use search to find errors

## Common CI/CD Tasks

### 1. Fix Failing Build

```bash
# 1. Identify the failure
# View logs in GitHub Actions

# 2. Reproduce locally
npm ci
npm run compile
npm run tauri:build

# 3. Fix and test
# Make changes...
npm run lint
npm run format
npm test

# 4. Commit and push
git add .
git commit -m "fix: resolve build issue"
git push
```

### 2. Debug Test Failures

```bash
# Run specific test suite
npm run test1 api1

# Run with verbose output
DEBUG=* npm test

# Run single test file
cd packages/test
npm test -- --grep "test name"

# Check test in browser mode
npm run test:browser
```

### 3. Update Dependencies

```bash
# Update npm dependencies
npm update
npm audit fix

# Update Rust dependencies
cd src-tauri
cargo update

# Rebuild lock files
rm package-lock.json
npm install

cd src-tauri
rm Cargo.lock
cargo build

# Test locally before pushing
npm test
npm run tauri:build
```

### 4. Create a Release

```bash
# 1. Update version numbers
# Edit package.json
# Edit src-tauri/Cargo.toml
# Edit src-tauri/tauri.conf.json

# 2. Commit version bump
git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
git commit -m "chore: bump version to 13.2.0"

# 3. Create and push tag
git tag v13.2.0
git push origin v13.2.0

# 4. CI automatically creates draft release
# 5. Review and publish in GitHub UI
```

### 5. Download Build Artifacts

**Via GitHub UI:**
1. Navigate to workflow run
2. Scroll to **Artifacts** section
3. Click artifact name to download

**Via GitHub CLI:**
```bash
# List artifacts
gh run list --workflow=tauri-build.yml

# Download artifacts from latest run
gh run download $(gh run list --workflow=tauri-build.yml --limit 1 --json databaseId --jq '.[0].databaseId')

# Download specific artifact
gh run download RUN_ID --name kui-tauri-macos-arm64
```

## Pre-commit Checks

When you commit code, Husky automatically runs:

1. **Lint-staged** - Format and lint changed files
2. **Rust format check** - Verify Rust code formatting

If checks fail:

```bash
# Fix TypeScript/JavaScript formatting
npm run format

# Fix Rust formatting
cd src-tauri && cargo fmt

# Retry commit
git commit
```

To skip pre-commit hooks (not recommended):
```bash
git commit --no-verify
```

## Working with Caches

### View Cache Status

```bash
# List all caches
gh cache list

# Delete specific cache
gh cache delete CACHE_ID

# Delete all caches
gh cache delete --all
```

### Force Cache Rebuild

**Method 1: Manual deletion**
1. Settings → Actions → Caches
2. Delete relevant caches

**Method 2: Update workflow**
```yaml
# Add version suffix to cache key
key: ${{ matrix.platform }}-v2
```

## Platform-Specific Notes

### macOS

**Building for both architectures:**
```bash
# Install targets
rustup target add x86_64-apple-darwin
rustup target add aarch64-apple-darwin

# Build
npm run build:tauri:mac:amd64
npm run build:tauri:mac:arm64
```

**Testing on Apple Silicon:**
- x64 builds run via Rosetta 2
- Native ARM builds recommended for testing

### Linux

**Required system dependencies:**
```bash
sudo apt-get install -y \
  libgtk-3-dev \
  libwebkit2gtk-4.0-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf \
  libwayland-dev \
  libxkbcommon-dev
```

**Distribution formats:**
- `.deb` - Debian/Ubuntu packages
- `.AppImage` - Universal Linux binary

### Windows

**Prerequisites:**
- Visual Studio Build Tools
- WebView2 (automatically bundled)

**Build on Windows:**
```powershell
npm run build:tauri:win32:amd64
```

## Troubleshooting

### Build Fails: "Rust target not found"

```bash
# Install missing target
rustup target add x86_64-apple-darwin  # macOS Intel
rustup target add aarch64-apple-darwin # macOS ARM
rustup target add x86_64-unknown-linux-gnu # Linux
rustup target add x86_64-pc-windows-msvc # Windows
```

### Build Fails: "Cannot find module"

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
npm run compile
```

### Build Fails: Rust compilation error

```bash
# Clean Rust build
cd src-tauri
cargo clean
cd ..

# Rebuild
npm run tauri:build
```

### Tests Fail: Port already in use

```bash
# Kill processes on test ports
lsof -ti:9080 | xargs kill -9
lsof -ti:9081 | xargs kill -9

# Use different port offset
PORT_OFFSET=5 npm test
```

### CI Cache Issues

```bash
# View cache size
gh api repos/IBM/kui/actions/caches | jq '.total_count, .actions_caches[].size_in_bytes'

# Clear all caches
gh cache delete --all
```

## Workflow File Locations

```
.github/
├── workflows/
│   ├── tauri-build.yml         # Main Tauri build pipeline
│   ├── test.yaml               # Test suite
│   ├── CI_CD_README.md         # This guide
│   ├── CACHE_OPTIMIZATION.md   # Cache configuration details
│   └── DEVELOPER_GUIDE.md      # Quick reference (you are here)
└── ISSUE_TEMPLATE/             # Issue templates
```

## Best Practices

### DO

✅ Test locally before pushing
✅ Run `npm run lint` before committing
✅ Format Rust code with `cargo fmt`
✅ Keep dependencies up to date
✅ Write descriptive commit messages
✅ Test on multiple platforms when possible
✅ Check CI logs when builds fail

### DON'T

❌ Skip pre-commit hooks
❌ Commit `node_modules` or `target/`
❌ Push broken builds to main branches
❌ Ignore test failures
❌ Commit secrets or credentials
❌ Force push to protected branches
❌ Modify workflows without testing

## Performance Tips

### Speed Up Local Builds

```bash
# Use incremental compilation
export CARGO_INCREMENTAL=1

# Parallel npm operations
npm ci --prefer-offline --no-audit

# Use local cache
npm config set cache ~/.npm-cache
```

### Speed Up CI Builds

- Ensure `package-lock.json` is committed
- Ensure `Cargo.lock` is committed
- Use cache-friendly dependencies
- Avoid unnecessary rebuilds

## Getting Help

### Documentation

- [CI/CD README](CI_CD_README.md) - Comprehensive CI/CD documentation
- [Cache Optimization](CACHE_OPTIMIZATION.md) - Cache configuration details
- [Tauri Docs](https://tauri.app/v1/guides/) - Official Tauri documentation
- [GitHub Actions Docs](https://docs.github.com/actions) - GitHub Actions reference

### Support Channels

1. Check existing issues: https://github.com/IBM/kui/issues
2. Review GitHub Actions logs
3. Search discussions: https://github.com/IBM/kui/discussions
4. Create new issue with `ci` label

### Useful GitHub CLI Commands

```bash
# View workflow runs
gh run list --workflow=tauri-build.yml --limit 10

# View specific run details
gh run view RUN_ID

# Re-run failed jobs
gh run rerun RUN_ID --failed

# Watch workflow in real-time
gh run watch

# Cancel running workflow
gh run cancel RUN_ID
```

## Cheat Sheet

```bash
# Common local commands
npm ci                              # Install dependencies
npm run compile                     # Build TypeScript
npm run tauri:dev                   # Development mode
npm run tauri:build                 # Production build
npm test                            # Run tests
npm run lint                        # Lint code
npm run format                      # Format code
cd src-tauri && cargo fmt           # Format Rust

# Common CI commands
gh run list                         # List workflow runs
gh run watch                        # Watch current workflow
gh cache list                       # List caches
gh run download                     # Download artifacts

# Local testing
npm run test:browser                # Browser tests
npm run test1 api1                  # Specific test suite
PORT_OFFSET=0 npm run test          # Tests with specific port

# Release process
git tag v13.2.0                     # Create tag
git push origin v13.2.0             # Push tag (triggers release)

# Troubleshooting
cargo clean                         # Clean Rust build
rm -rf node_modules                 # Clean npm
gh cache delete --all               # Clear all caches
```

## Quick Links

- [Actions Dashboard](https://github.com/IBM/kui/actions)
- [Releases](https://github.com/IBM/kui/releases)
- [Repository Settings](https://github.com/IBM/kui/settings)
- [Workflow Files](https://github.com/IBM/kui/tree/master/.github/workflows)

---

**Last Updated:** 2025-12-17
**Version:** 1.0.0
