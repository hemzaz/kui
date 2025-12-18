# CI/CD Quick Reference Guide

> Fast reference for common CI/CD tasks and commands

## Table of Contents
- [Workflows Overview](#workflows-overview)
- [Running Tests Locally](#running-tests-locally)
- [Pre-commit Checks](#pre-commit-checks)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## Workflows Overview

### tauri-build.yml
**Purpose**: Build production artifacts for all platforms

**Triggers**: Push to main branches, PRs, manual dispatch

**Output**: DMG (macOS), DEB/AppImage (Linux), MSI/NSIS (Windows)

**Duration**: ~15-20 minutes

### tauri-test.yml
**Purpose**: Run comprehensive test suite with quality gates

**Triggers**: Push to main branches, PRs, manual dispatch

**Test Suites**:
- Rust quality checks (fmt, clippy, audit)
- Unit tests (Rust + TypeScript)
- Integration tests (IPC, windows)
- E2E tests (Playwright)
- Feature parity tests
- Performance benchmarks

**Duration**: ~30-45 minutes

### test.yaml (legacy)
**Purpose**: Browser-based tests (pre-Tauri)

**Status**: Maintained for browser mode compatibility

## Running Tests Locally

### Validate Everything Before Push
```bash
# Quick validation (2-3 minutes)
./.github/workflows/validate-ci.sh --quick

# Full validation (10-15 minutes)
./.github/workflows/validate-ci.sh --full
```

### Rust Tests
```bash
cd src-tauri

# Format check
cargo fmt --check

# Linting
cargo clippy --all-targets --all-features

# Unit tests
cargo test --lib --bins

# All Rust checks
cargo fmt --check && \
  cargo clippy --all-targets --all-features -- -D warnings && \
  cargo test
```

### TypeScript Tests
```bash
# Format check
npm run format -- --check

# Linting
npm run lint

# Fix formatting and linting
npm run format
npm run lint -- --fix

# Compile TypeScript
npm run compile

# Unit tests
npm run test:tauri:unit
```

### Full Test Suite
```bash
# All Tauri tests
npm run test:tauri:all

# Specific test suites
npm run test:tauri:unit          # Jest unit tests
npm run test:tauri:integration   # Playwright integration tests
npm run test:tauri:e2e          # Playwright E2E tests
npm run test:tauri:performance   # Performance benchmarks
```

## Pre-commit Checks

### What Runs Automatically
The pre-commit hook (`.husky/pre-commit`) runs:
1. Prettier formatting (TypeScript/JavaScript)
2. ESLint linting (TypeScript/JavaScript)
3. `cargo fmt --check` (Rust formatting)
4. `cargo clippy` (Rust linting)

### Manual Pre-commit Test
```bash
# Run pre-commit hook manually
.husky/pre-commit

# Fix all issues before commit
npm run format
npm run lint -- --fix
cd src-tauri && cargo fmt
cd src-tauri && cargo clippy --fix --allow-dirty
```

### Bypass Pre-commit (NOT RECOMMENDED)
```bash
git commit --no-verify -m "message"
```

## Common Tasks

### Build Locally
```bash
# Development build (fast, debug mode)
npm run open:tauri

# Production build (slow, optimized)
npm run tauri:build

# Platform-specific builds
npm run build:tauri:mac:arm64    # macOS Apple Silicon
npm run build:tauri:mac:amd64    # macOS Intel
npm run build:tauri:linux:amd64  # Linux
npm run build:tauri:win32:amd64  # Windows
```

### Watch Mode
```bash
# Start Tauri in development mode
npm run open:tauri

# Watch TypeScript changes (in another terminal)
npm run watch:source

# Watch for browser mode
npm run watch:browser
```

### Clean Build
```bash
# Clean TypeScript build
npm run compile:clean

# Clean Rust build
cd src-tauri && cargo clean

# Full clean and rebuild
npm run clean
npm ci
npm run compile
```

### Manual Workflow Trigger
```bash
# Trigger build workflow
gh workflow run tauri-build.yml

# Trigger test workflow
gh workflow run tauri-test.yml

# Trigger with specific test suite
gh workflow run tauri-test.yml -f test_suite=integration
```

### Check Workflow Status
```bash
# List recent workflow runs
gh run list

# List runs for specific workflow
gh run list --workflow=tauri-build.yml

# Watch active run
gh run watch

# View run details
gh run view <run-id>

# Download artifacts
gh run download <run-id>
```

## Troubleshooting

### Build Fails with Missing Dependencies

**Linux**:
```bash
sudo apt-get update
sudo apt-get install -y \
  libgtk-3-dev \
  libwebkit2gtk-4.0-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libwayland-dev \
  libxkbcommon-dev \
  wayland-protocols
```

**macOS**:
```bash
xcode-select --install
rustup target add x86_64-apple-darwin
rustup target add aarch64-apple-darwin
```

**Windows**:
- Install Visual Studio 2022 Build Tools
- Enable "Desktop development with C++" workload

### Clippy Warnings
```bash
# View all warnings
cd src-tauri
cargo clippy --all-targets --all-features

# Auto-fix some issues
cargo clippy --fix --allow-dirty

# Suppress specific warning in code
#[allow(clippy::warning_name)]
```

### Format Issues
```bash
# Auto-fix TypeScript formatting
npm run format

# Auto-fix Rust formatting
cd src-tauri && cargo fmt
```

### Test Failures
```bash
# Run tests with verbose output
npm run test:tauri:unit -- --verbose

# Run specific test file
npm run test:tauri:unit -- path/to/test.spec.ts

# Run Playwright tests in headed mode
npm run test:tauri:e2e:headed

# Run Playwright tests with UI
npm run test:tauri:e2e:ui
```

### Cache Issues

**GitHub Actions**:
- Go to: Repository → Settings → Actions → Caches
- Delete caches manually
- Re-run workflow

**Local**:
```bash
# Clear npm cache
npm cache clean --force

# Clear Cargo cache
cd src-tauri
cargo clean
rm -rf ~/.cargo/registry/cache
```

### Pre-commit Hook Not Running
```bash
# Reinstall husky
npm run prepare

# Make hook executable
chmod +x .husky/pre-commit

# Test hook
.husky/pre-commit
```

### Workflow Syntax Errors
```bash
# Install actionlint
brew install actionlint  # macOS
# or download from: https://github.com/rhysd/actionlint

# Validate workflows
actionlint .github/workflows/*.yml

# Basic YAML validation
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/tauri-build.yml'))"
```

## Quick Commands Cheat Sheet

```bash
# Validation
./.github/workflows/validate-ci.sh --quick    # Fast checks
./.github/workflows/validate-ci.sh --full     # All checks

# Development
npm run open:tauri                            # Start Tauri
npm run watch:source                          # Watch TypeScript

# Testing
npm run test:tauri:all                        # All tests
npm run test:tauri:unit                       # Unit tests only
npm run test:tauri:e2e                        # E2E tests only

# Quality Checks
npm run format                                # Fix formatting
npm run lint -- --fix                         # Fix linting
cd src-tauri && cargo fmt                     # Fix Rust format
cd src-tauri && cargo clippy --fix            # Fix Rust lint

# Building
npm run tauri:build                           # Production build
npm run compile                               # Build TypeScript

# CI/CD
gh workflow run tauri-build.yml               # Trigger build
gh run list                                   # List runs
gh run watch                                  # Watch current run

# Cleanup
npm run clean                                 # Clean all
cd src-tauri && cargo clean                   # Clean Rust
npm run compile:clean                         # Clean TypeScript
```

## Environment Setup

### Initial Setup
```bash
# Clone repository
git clone https://github.com/IBM/kui.git
cd kui

# Install dependencies
npm ci

# Setup Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup component add clippy rustfmt

# Compile project
npm run compile

# Run validation
./.github/workflows/validate-ci.sh --full
```

### Required Versions
- **Node.js**: >= 24.0.0
- **npm**: >= 10.0.0
- **Rust**: >= 1.70.0 (latest stable recommended)
- **Cargo**: >= 1.70.0

### Check Versions
```bash
node --version
npm --version
rustc --version
cargo --version
```

## Useful Links

- **GitHub Actions Dashboard**: https://github.com/IBM/kui/actions
- **Workflow Files**: `.github/workflows/`
- **Pre-commit Hook**: `.husky/pre-commit`
- **Full Documentation**: `.github/workflows/CI_CD_COMPLETE.md`
- **Tauri Migration Guide**: `TAURI_MIGRATION.md`
- **Next Steps**: `TAURI_NEXT_STEPS.md`

## Getting Help

- **Issues**: https://github.com/IBM/kui/issues
- **Discussions**: https://github.com/IBM/kui/discussions
- **CI/CD Questions**: Tag with `ci-cd` label

---

**Last Updated**: 2025-12-17
