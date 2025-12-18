#!/bin/bash
# Validation script for Tauri test environment setup
# This script checks that all prerequisites are met for running Tauri tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((CHECKS_WARNING++))
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
}

# Start validation
clear
echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════╗
║   Kui Tauri Test Environment Validator        ║
║   Checking test prerequisites...              ║
╚════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# 1. Node.js and npm
header "1. Node.js and npm"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js installed: $NODE_VERSION"

    # Check minimum version (v20+)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -ge 20 ]; then
        check_pass "Node.js version is sufficient (>= v20)"
    else
        check_warn "Node.js version is old (< v20), consider upgrading"
    fi
else
    check_fail "Node.js not found - install from https://nodejs.org/"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check_pass "npm installed: v$NPM_VERSION"
else
    check_fail "npm not found - should be installed with Node.js"
fi

# 2. Project dependencies
header "2. Project Dependencies"

if [ -f "package.json" ]; then
    check_pass "package.json found"
else
    check_fail "package.json not found - are you in the project root?"
fi

if [ -d "node_modules" ]; then
    check_pass "node_modules directory exists"

    # Check key dependencies
    if [ -d "node_modules/@playwright/test" ]; then
        check_pass "Playwright installed"
    else
        check_fail "Playwright not installed - run 'npm install'"
    fi

    if [ -d "node_modules/@tauri-apps/api" ]; then
        check_pass "Tauri API installed"
    else
        check_warn "Tauri API not found - may need 'npm install'"
    fi
else
    check_fail "node_modules not found - run 'npm install'"
fi

# 3. TypeScript compilation
header "3. TypeScript Compilation"

if [ -d "dist" ] || [ -d "packages/core/dist" ]; then
    check_pass "Compiled output found"
else
    check_warn "No compiled output - run 'npm run compile'"
fi

if command -v tsc &> /dev/null; then
    check_pass "TypeScript compiler available"
else
    check_warn "TypeScript not in PATH - usually ok if installed locally"
fi

# 4. Test files
header "4. Test Files"

TEST_FILES=(
    "tests/tauri-smoke.spec.ts"
    "tests/tauri-integration.spec.ts"
    "tests/tauri-feature-parity.spec.ts"
    "tests/tauri-menu-system.spec.ts"
    "tests/tauri-screenshot.spec.ts"
    "tests/tauri-window-management.spec.ts"
    "tests/utils/tauri-test-helpers.ts"
)

for file in "${TEST_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_pass "$(basename "$file") exists"
    else
        check_fail "$(basename "$file") missing"
    fi
done

# 5. Playwright configuration
header "5. Playwright Configuration"

if [ -f "playwright.config.ts" ]; then
    check_pass "playwright.config.ts found"
else
    check_fail "playwright.config.ts missing"
fi

# Check if Playwright browsers are installed
if command -v npx &> /dev/null; then
    if npx playwright --version &> /dev/null; then
        PLAYWRIGHT_VERSION=$(npx playwright --version | awk '{print $2}')
        check_pass "Playwright CLI available: v$PLAYWRIGHT_VERSION"

        # Check if browsers are installed
        info "Checking Playwright browsers..."
        if [ -d "$HOME/.cache/ms-playwright" ] || [ -d "$HOME/Library/Caches/ms-playwright" ]; then
            check_pass "Playwright browsers installed"
        else
            check_warn "Playwright browsers may not be installed - run 'npx playwright install'"
        fi
    else
        check_warn "Playwright CLI not accessible"
    fi
fi

# 6. Platform-specific checks
header "6. Platform-Specific Requirements"

PLATFORM=$(uname -s)
info "Platform detected: $PLATFORM"

case "$PLATFORM" in
    Darwin)
        check_pass "macOS detected - full screenshot support"
        check_pass "No additional dependencies needed"
        ;;
    Linux)
        check_pass "Linux detected"

        # Check for xclip
        if command -v xclip &> /dev/null; then
            check_pass "xclip installed (required for clipboard)"
        else
            check_warn "xclip not found - screenshot clipboard tests will fail"
            info "Install with: sudo apt-get install xclip (Debian/Ubuntu)"
        fi

        # Check for display
        if [ -n "$DISPLAY" ]; then
            check_pass "DISPLAY variable set: $DISPLAY"
        else
            check_warn "No DISPLAY set - may need xvfb for headless testing"
            info "Run with: xvfb-run npm run test:tauri:smoke"
        fi
        ;;
    MINGW*|MSYS*|CYGWIN*)
        check_pass "Windows detected"
        check_warn "Screenshot clipboard tests will skip (known limitation)"
        ;;
    *)
        check_warn "Unknown platform: $PLATFORM"
        ;;
esac

# 7. Port availability
header "7. Port Availability"

TEST_PORT=9080
if command -v lsof &> /dev/null; then
    if lsof -i :$TEST_PORT &> /dev/null; then
        check_warn "Port $TEST_PORT is in use - may need to use different port"
        info "Set TEST_URL=http://localhost:9081 to use different port"
    else
        check_pass "Port $TEST_PORT is available"
    fi
else
    info "lsof not available - cannot check port"
fi

# 8. Environment variables
header "8. Environment Variables"

if [ -n "$TEST_URL" ]; then
    info "TEST_URL set to: $TEST_URL"
else
    info "TEST_URL not set (will use default: http://localhost:9080)"
fi

if [ -n "$TEST_TIMEOUT" ]; then
    info "TEST_TIMEOUT set to: $TEST_TIMEOUT ms"
else
    info "TEST_TIMEOUT not set (will use default: 30000 ms)"
fi

if [ -n "$CI" ]; then
    info "CI environment detected"
    check_pass "Running in CI mode"
else
    info "Local environment (not CI)"
fi

# 9. Documentation
header "9. Documentation"

DOCS=(
    "tests/README.md"
    "tests/TAURI-TESTING-GUIDE.md"
    "tests/TAURI-TEST-SUMMARY.md"
    "tests/QUICK-REFERENCE.md"
    "tests/KNOWN-ISSUES.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        check_pass "$(basename "$doc") available"
    else
        check_warn "$(basename "$doc") missing"
    fi
done

# 10. Quick test run
header "10. Quick Test Validation"

info "Attempting to run a single smoke test..."
if npx playwright test tests/tauri-smoke.spec.ts --grep "app launches successfully" --timeout=30000 &> /dev/null; then
    check_pass "Sample test executed successfully"
else
    check_warn "Sample test failed or timed out - check test environment"
    info "Run 'npm run test:tauri:smoke' to see detailed errors"
fi

# Summary
header "Validation Summary"

echo ""
echo -e "Results:"
echo -e "  ${GREEN}Passed:${NC}    $CHECKS_PASSED"
echo -e "  ${RED}Failed:${NC}    $CHECKS_FAILED"
echo -e "  ${YELLOW}Warnings:${NC}  $CHECKS_WARNING"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    if [ $CHECKS_WARNING -eq 0 ]; then
        echo -e "${GREEN}✓ All checks passed! Environment is ready for testing.${NC}"
        echo ""
        echo "Quick start commands:"
        echo "  npm run test:tauri:smoke           # Run smoke tests"
        echo "  npm run test:tauri:all              # Run all tests"
        echo "  npx playwright test --ui            # Interactive test UI"
        exit 0
    else
        echo -e "${YELLOW}⚠ Environment is mostly ready with $CHECKS_WARNING warning(s).${NC}"
        echo "Review warnings above and address if needed."
        echo ""
        echo "You can still run tests:"
        echo "  npm run test:tauri:smoke"
        exit 0
    fi
else
    echo -e "${RED}✗ Environment has $CHECKS_FAILED critical issue(s).${NC}"
    echo "Please resolve failed checks before running tests."
    echo ""
    echo "Common fixes:"
    echo "  npm install                         # Install dependencies"
    echo "  npm run compile                     # Compile TypeScript"
    echo "  npx playwright install              # Install browsers"
    exit 1
fi
