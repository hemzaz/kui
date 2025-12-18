#!/bin/bash

# Workflow Validation Script
# This script validates the Tauri build workflow configuration
# Usage: ./.github/workflows/validate-workflow.sh

set -e

echo "🔍 Validating Kui Tauri CI/CD Configuration..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to print colored output
print_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    ((ERRORS++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    ((WARNINGS++))
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo "ℹ️  $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src-tauri" ]; then
    print_error "Must be run from the kui project root directory"
    exit 1
fi

print_info "Checking project structure..."

# Check for required files
echo ""
echo "📁 Checking required files..."

files=(
    ".github/workflows/tauri-build.yml"
    "package.json"
    "package-lock.json"
    "src-tauri/Cargo.toml"
    "src-tauri/Cargo.lock"
    "src-tauri/tauri.conf.json"
    "src-tauri/src/main.rs"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file exists"
    else
        print_error "$file is missing"
    fi
done

# Check Node.js version
echo ""
echo "🔧 Checking development environment..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js: $NODE_VERSION"

    # Check if version meets requirement (>= 24.0.0)
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_MAJOR" -ge 24 ]; then
        print_success "Node.js version meets requirement (>= 24.0.0)"
    else
        print_warning "Node.js version $NODE_VERSION is below recommended 24.0.0"
    fi
else
    print_warning "Node.js not found in PATH"
fi

# Check npm version
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm: v$NPM_VERSION"
else
    print_warning "npm not found in PATH"
fi

# Check Rust installation
if command -v cargo &> /dev/null; then
    RUST_VERSION=$(rustc --version)
    print_success "Rust: $RUST_VERSION"
else
    print_warning "Rust not found in PATH"
fi

# Check if Tauri CLI is installed
if command -v cargo-tauri &> /dev/null || [ -f "src-tauri/target/release/cargo-tauri" ]; then
    print_success "Tauri CLI is available"
else
    print_warning "Tauri CLI not found - install with: cargo install tauri-cli"
fi

# Check GitHub CLI
if command -v gh &> /dev/null; then
    GH_VERSION=$(gh --version | head -n1)
    print_success "GitHub CLI: $GH_VERSION"
else
    print_warning "GitHub CLI not found - useful for managing CI/CD"
fi

# Validate workflow YAML syntax
echo ""
echo "📝 Validating workflow YAML syntax..."

if command -v yamllint &> /dev/null; then
    if yamllint -d relaxed .github/workflows/tauri-build.yml 2>&1 | grep -q "error"; then
        print_error "YAML syntax errors found in tauri-build.yml"
    else
        print_success "Workflow YAML syntax is valid"
    fi
else
    print_warning "yamllint not installed - skipping YAML validation"
    print_info "Install with: pip install yamllint"
fi

# Check workflow file structure
if grep -q "jobs:" .github/workflows/tauri-build.yml && \
   grep -q "build-tauri:" .github/workflows/tauri-build.yml && \
   grep -q "test-tauri:" .github/workflows/tauri-build.yml; then
    print_success "Workflow file has required job structure"
else
    print_error "Workflow file is missing required jobs"
fi

# Check for matrix configuration
if grep -q "strategy:" .github/workflows/tauri-build.yml && \
   grep -q "matrix:" .github/workflows/tauri-build.yml; then
    print_success "Build matrix configuration found"
else
    print_error "Build matrix configuration missing"
fi

# Check for caching configuration
echo ""
echo "💾 Checking cache configuration..."

if grep -q "cache: 'npm'" .github/workflows/tauri-build.yml; then
    print_success "NPM caching enabled"
else
    print_warning "NPM caching not found"
fi

if grep -q "Swatinem/rust-cache" .github/workflows/tauri-build.yml; then
    print_success "Rust caching enabled"
else
    print_warning "Rust caching not found"
fi

# Check package.json scripts
echo ""
echo "📦 Checking package.json scripts..."

required_scripts=(
    "compile"
    "tauri:build"
    "tauri:dev"
    "test"
    "lint"
    "format"
)

for script in "${required_scripts[@]}"; do
    if grep -q "\"$script\":" package.json; then
        print_success "Script '$script' defined"
    else
        print_warning "Script '$script' not found in package.json"
    fi
done

# Check Tauri configuration
echo ""
echo "⚙️  Checking Tauri configuration..."

if [ -f "src-tauri/tauri.conf.json" ]; then
    if command -v jq &> /dev/null; then
        # Check bundle identifier
        IDENTIFIER=$(jq -r '.bundle.identifier' src-tauri/tauri.conf.json)
        if [ "$IDENTIFIER" != "null" ] && [ -n "$IDENTIFIER" ]; then
            print_success "Bundle identifier: $IDENTIFIER"
        else
            print_error "Bundle identifier not set in tauri.conf.json"
        fi

        # Check version
        TAURI_VERSION=$(jq -r '.version' src-tauri/tauri.conf.json)
        PKG_VERSION=$(jq -r '.version' package.json)

        if [ "$TAURI_VERSION" = "$PKG_VERSION" ]; then
            print_success "Version consistency: $TAURI_VERSION"
        else
            print_warning "Version mismatch: tauri.conf.json ($TAURI_VERSION) vs package.json ($PKG_VERSION)"
        fi
    else
        print_warning "jq not installed - skipping JSON validation"
    fi
fi

# Check Rust targets
echo ""
echo "🎯 Checking Rust targets..."

if command -v rustup &> /dev/null; then
    targets=(
        "x86_64-apple-darwin"
        "aarch64-apple-darwin"
        "x86_64-unknown-linux-gnu"
        "x86_64-pc-windows-msvc"
    )

    installed_targets=$(rustup target list --installed)

    for target in "${targets[@]}"; do
        if echo "$installed_targets" | grep -q "$target"; then
            print_success "Target $target is installed"
        else
            print_info "Target $target not installed (only needed for that platform)"
        fi
    done
else
    print_warning "rustup not found - cannot check targets"
fi

# Check Husky pre-commit hooks
echo ""
echo "🪝 Checking pre-commit hooks..."

if [ -f ".husky/pre-commit" ]; then
    print_success "Pre-commit hook exists"

    if grep -q "cargo fmt" .husky/pre-commit; then
        print_success "Rust formatting check enabled in pre-commit"
    else
        print_warning "Rust formatting check not found in pre-commit hook"
    fi

    if grep -q "lint-staged" .husky/pre-commit; then
        print_success "lint-staged enabled in pre-commit"
    else
        print_warning "lint-staged not found in pre-commit hook"
    fi
else
    print_warning "Pre-commit hook not found"
fi

# Check gitignore
echo ""
echo "🚫 Checking .gitignore..."

gitignore_entries=(
    "node_modules"
    "target"
    "dist"
    ".env"
)

if [ -f ".gitignore" ]; then
    for entry in "${gitignore_entries[@]}"; do
        if grep -q "$entry" .gitignore; then
            print_success ".gitignore includes $entry"
        else
            print_warning ".gitignore missing entry: $entry"
        fi
    done
else
    print_error ".gitignore file not found"
fi

# Check for secrets in workflow
echo ""
echo "🔒 Checking for potential secrets exposure..."

if grep -iE "(password|secret|token|key).*:" .github/workflows/tauri-build.yml | grep -v "secrets\." | grep -v "# "; then
    print_warning "Found potential hardcoded secrets in workflow file"
else
    print_success "No hardcoded secrets detected"
fi

# Summary
echo ""
echo "═══════════════════════════════════════════"
echo "📊 VALIDATION SUMMARY"
echo "═══════════════════════════════════════════"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! CI/CD is properly configured.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found. Review recommendations above.${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s) and $WARNINGS warning(s) found.${NC}"
    echo "Please fix the errors before pushing to CI."
    exit 1
fi
