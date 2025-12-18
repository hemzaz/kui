# Kui CI/CD Pipeline Documentation

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipelines for Kui's Tauri builds.

## Overview

Kui uses GitHub Actions for automated building, testing, and releasing across multiple platforms. The CI/CD pipeline ensures that every code change is validated and that production-ready binaries are automatically generated.

## Workflows

### 1. Tauri Build Workflow (`tauri-build.yml`)

**Purpose:** Build Tauri applications for all supported platforms with automated testing and artifact generation.

**Triggers:**
- Push to `master`, `main`, or `develop` branches
- Pull requests to `master` or `main`
- Manual workflow dispatch
- Changes to relevant paths:
  - `src-tauri/**`
  - `packages/**`
  - `plugins/**`
  - `package.json`
  - Workflow file itself

**Platforms:**
- macOS Intel (x86_64-apple-darwin)
- macOS Apple Silicon (aarch64-apple-darwin)
- Linux x64 (x86_64-unknown-linux-gnu)
- Windows x64 (x86_64-pc-windows-msvc)

**Build Artifacts:**
- **macOS:** `.dmg` installer files
- **Linux:** `.deb` packages and `.AppImage` files
- **Windows:** `.msi` and `.exe` (NSIS) installers

**Pipeline Stages:**

1. **Build Stage** (Parallel across platforms)
   - Checkout code
   - Setup Node.js 24 with npm caching
   - Setup Rust toolchain with cargo caching
   - Install platform-specific dependencies
   - Install npm dependencies
   - Compile TypeScript and build frontend
   - Build Tauri application
   - Upload artifacts

2. **Test Stage** (Sequential after builds)
   - Run browser-based test suite
   - Validate core functionality
   - Generate test reports

3. **Release Stage** (Conditional on tags)
   - Download all artifacts
   - Create draft GitHub release
   - Attach all platform binaries
   - Generate release notes

### 2. Test Workflow (`test.yaml`)

**Purpose:** Comprehensive testing of browser-based functionality and Kubernetes integrations.

**Coverage:**
- API tests (browser mode)
- Bash-like shell features
- Kubernetes kubectl integration
- S3 plugin functionality
- Bottom input mode
- Chaos testing

## Performance Optimizations

### Caching Strategy

The pipeline implements multi-layer caching for optimal build performance:

1. **NPM Dependencies Cache**
   ```yaml
   uses: actions/setup-node@v4
   with:
     cache: 'npm'
   ```
   - Caches `node_modules` based on `package-lock.json` hash
   - Reduces npm install time from ~5 minutes to ~30 seconds

2. **Rust Dependencies Cache**
   ```yaml
   uses: Swatinem/rust-cache@v2
   ```
   - Caches Cargo registry, git checkouts, and build artifacts
   - Platform-specific cache keys prevent cross-contamination
   - Reduces Rust compilation time by 70-80%

3. **Cargo Build Cache**
   - Incremental compilation enabled
   - Shared cache across workflow runs
   - Separate cache per platform/architecture combination

### Build Time Estimates

Without caching (first run):
- macOS: ~15-20 minutes
- Linux: ~10-15 minutes
- Windows: ~12-18 minutes

With caching (subsequent runs):
- macOS: ~5-8 minutes
- Linux: ~3-5 minutes
- Windows: ~4-6 minutes

## Secrets Management

The following secrets should be configured in GitHub repository settings:

### Required Secrets

None required for basic builds.

### Optional Secrets (for code signing and updates)

- `TAURI_PRIVATE_KEY`: Private key for Tauri updater (auto-update feature)
- `TAURI_KEY_PASSWORD`: Password for the private key
- `APPLE_CERTIFICATE`: macOS code signing certificate (P12)
- `APPLE_CERTIFICATE_PASSWORD`: Certificate password
- `APPLE_SIGNING_IDENTITY`: Certificate identity
- `APPLE_ID`: Apple ID for notarization
- `APPLE_PASSWORD`: App-specific password
- `WINDOWS_CERTIFICATE`: Windows code signing certificate
- `WINDOWS_CERTIFICATE_PASSWORD`: Certificate password

## Manual Workflow Execution

You can manually trigger the Tauri build workflow:

1. Navigate to **Actions** tab in GitHub
2. Select **Tauri Build** workflow
3. Click **Run workflow**
4. Select branch
5. Click **Run workflow** button

## Artifact Download

Build artifacts are available for 30 days after each workflow run:

1. Navigate to the workflow run
2. Scroll to **Artifacts** section
3. Download platform-specific artifacts:
   - `kui-tauri-macos-x64`
   - `kui-tauri-macos-arm64`
   - `kui-tauri-linux-x64`
   - `kui-tauri-windows-x64`

## Release Process

### Automated Release (Recommended)

1. Update version in `package.json` and `src-tauri/Cargo.toml`
2. Commit changes: `git commit -am "chore: bump version to X.Y.Z"`
3. Create and push tag: `git tag vX.Y.Z && git push origin vX.Y.Z`
4. CI automatically builds and creates draft release
5. Review release notes and artifacts
6. Publish release when ready

### Manual Release

```bash
# Build locally for current platform
npm run build:tauri:mac:arm64     # macOS ARM
npm run build:tauri:mac:amd64     # macOS Intel
npm run build:tauri:linux:amd64   # Linux
npm run build:tauri:win32:amd64   # Windows

# Artifacts located in:
# src-tauri/target/release/bundle/
```

## Troubleshooting

### Build Failures

**Issue:** "Rust target not found"
```bash
# Solution: Install the target
rustup target add <target-triple>
```

**Issue:** "GTK/WebKit libraries not found" (Linux)
```bash
# Solution: Install system dependencies
sudo apt-get update
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev
```

**Issue:** Cache corruption
```bash
# Solution: Clear caches in GitHub Actions
# Settings > Actions > Caches > Delete all caches
```

### Test Failures

**Issue:** Wayland-related errors
```bash
# Ensure Wayland dependencies are installed
sudo apt-get install -y libwayland-dev weston xwayland
```

**Issue:** Port conflicts
```bash
# Tests use PORT_OFFSET environment variable
# Each test suite uses different offset (0-4)
```

### Cache Issues

**Issue:** Build times not improving
- Check cache key matches between runs
- Verify `package-lock.json` is committed
- Ensure `Cargo.lock` exists in `src-tauri/`

**Issue:** Out of disk space
- Caches have 10GB limit per repository
- Old caches are automatically evicted
- Manually delete unused caches if needed

## Monitoring and Metrics

### Build Success Rate

Monitor in GitHub Actions dashboard:
- Overall success rate should be >95%
- Platform-specific success rates
- Average build duration trends

### Key Metrics to Track

1. **Build Duration:** Target <10 minutes with caching
2. **Cache Hit Rate:** Target >80%
3. **Test Pass Rate:** Target 100%
4. **Artifact Size:** Monitor for unexpected bloat
5. **Dependency Update Frequency:** Monthly reviews

## Continuous Improvement

### Regular Maintenance Tasks

**Weekly:**
- Review failed builds and flaky tests
- Monitor build duration trends

**Monthly:**
- Update dependencies (`npm update`, `cargo update`)
- Review and update GitHub Actions versions
- Clean up old artifacts and caches

**Quarterly:**
- Audit secrets and rotate if needed
- Review caching strategy effectiveness
- Update documentation

## Integration with Development Workflow

### Pre-commit Hooks

The repository uses Husky for pre-commit checks:

```bash
# .husky/pre-commit
npx lint-staged              # Lint and format
cd src-tauri && cargo fmt    # Format Rust code
npm test                     # Run quick tests (optional)
```

### Pull Request Checks

All PRs must pass:
- TypeScript compilation
- ESLint checks
- Prettier formatting
- All test suites
- At least one platform build

## Resources

- [Tauri Documentation](https://tauri.app)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Rust CI Best Practices](https://matklad.github.io/2021/09/04/fast-rust-builds.html)
- [Swatinem/rust-cache](https://github.com/Swatinem/rust-cache)

## Support

For CI/CD issues:
1. Check this documentation
2. Review GitHub Actions logs
3. Search existing issues
4. Open new issue with `ci` label
