#!/usr/bin/env bash

###############################################################################
# CI/CD Pipeline Validation Script
#
# This script validates the CI/CD pipeline configuration and runs local
# checks to ensure workflows will succeed when pushed.
#
# Usage:
#   ./validate-ci.sh [--quick] [--full]
#
# Options:
#   --quick   Run only fast validation checks (default)
#   --full    Run all checks including full test suite
#   --help    Show this help message
###############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Parse arguments
MODE="${1:-quick}"

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "\n${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

###############################################################################
# Validation Checks
###############################################################################

check_dependencies() {
    print_header "Checking Dependencies"

    local missing=0

    # Essential tools
    check_command "node" || missing=$((missing + 1))
    check_command "npm" || missing=$((missing + 1))
    check_command "rustc" || missing=$((missing + 1))
    check_command "cargo" || missing=$((missing + 1))

    # Nice to have
    check_command "git" || print_warning "git not found (optional)"
    check_command "gh" || print_warning "gh CLI not found (optional, needed for releases)"

    # Check versions
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_info "Node.js version: $NODE_VERSION"

        # Check if version is >= 24
        MAJOR_VERSION=$(echo "$NODE_VERSION" | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -lt 24 ]; then
            print_warning "Node.js version should be >= 24.x (current: $NODE_VERSION)"
        fi
    fi

    if command -v rustc &> /dev/null; then
        RUST_VERSION=$(rustc --version)
        print_info "Rust version: $RUST_VERSION"
    fi

    # Check Rust components
    if command -v rustup &> /dev/null; then
        if rustup component list | grep -q "rustfmt.*installed"; then
            print_success "rustfmt is installed"
        else
            print_error "rustfmt is not installed"
            print_info "Run: rustup component add rustfmt"
            missing=$((missing + 1))
        fi

        if rustup component list | grep -q "clippy.*installed"; then
            print_success "clippy is installed"
        else
            print_error "clippy is not installed"
            print_info "Run: rustup component add clippy"
            missing=$((missing + 1))
        fi
    fi

    if [ $missing -gt 0 ]; then
        print_error "Missing $missing required dependencies"
        return 1
    fi

    print_success "All required dependencies are installed"
    return 0
}

validate_workflow_syntax() {
    print_header "Validating Workflow Syntax"

    cd "$PROJECT_ROOT"

    local workflow_dir=".github/workflows"
    local failed=0

    if [ ! -d "$workflow_dir" ]; then
        print_error "Workflow directory not found: $workflow_dir"
        return 1
    fi

    for workflow in "$workflow_dir"/*.yml "$workflow_dir"/*.yaml; do
        if [ -f "$workflow" ]; then
            filename=$(basename "$workflow")

            # Check if actionlint is installed
            if command -v actionlint &> /dev/null; then
                if actionlint "$workflow" 2>&1; then
                    print_success "Syntax valid: $filename"
                else
                    print_error "Syntax error in: $filename"
                    failed=$((failed + 1))
                fi
            else
                # Basic YAML validation with yq or python
                if command -v yq &> /dev/null; then
                    if yq eval '.' "$workflow" > /dev/null 2>&1; then
                        print_success "Basic YAML valid: $filename"
                    else
                        print_error "Invalid YAML: $filename"
                        failed=$((failed + 1))
                    fi
                elif command -v python3 &> /dev/null; then
                    if python3 -c "import yaml; yaml.safe_load(open('$workflow'))" 2>&1; then
                        print_success "Basic YAML valid: $filename"
                    else
                        print_error "Invalid YAML: $filename"
                        failed=$((failed + 1))
                    fi
                else
                    print_warning "Cannot validate $filename (install actionlint, yq, or python3+pyyaml)"
                fi
            fi
        fi
    done

    if [ $failed -gt 0 ]; then
        print_error "Found $failed workflow(s) with syntax errors"
        return 1
    fi

    print_success "All workflows have valid syntax"
    return 0
}

check_rust_formatting() {
    print_header "Checking Rust Formatting"

    cd "$PROJECT_ROOT/src-tauri"

    if cargo fmt --check --quiet 2>&1; then
        print_success "Rust code is properly formatted"
        return 0
    else
        print_error "Rust code formatting issues found"
        print_info "Run: cd src-tauri && cargo fmt"
        return 1
    fi
}

check_rust_linting() {
    print_header "Checking Rust Linting (Clippy)"

    cd "$PROJECT_ROOT/src-tauri"

    if cargo clippy --all-targets --all-features -- -D warnings 2>&1; then
        print_success "Clippy checks passed"
        return 0
    else
        print_error "Clippy found issues"
        print_info "Fix issues shown above"
        return 1
    fi
}

check_typescript_formatting() {
    print_header "Checking TypeScript/JavaScript Formatting"

    cd "$PROJECT_ROOT"

    if npm run format -- --check 2>&1; then
        print_success "TypeScript code is properly formatted"
        return 0
    else
        print_error "TypeScript formatting issues found"
        print_info "Run: npm run format"
        return 1
    fi
}

check_typescript_linting() {
    print_header "Checking TypeScript/JavaScript Linting"

    cd "$PROJECT_ROOT"

    if npm run lint 2>&1; then
        print_success "ESLint checks passed"
        return 0
    else
        print_error "ESLint found issues"
        print_info "Run: npm run lint -- --fix"
        return 1
    fi
}

check_rust_compilation() {
    print_header "Checking Rust Compilation"

    cd "$PROJECT_ROOT/src-tauri"

    print_info "Running cargo check..."
    if cargo check --all-targets --all-features 2>&1; then
        print_success "Rust code compiles successfully"
        return 0
    else
        print_error "Rust compilation failed"
        return 1
    fi
}

check_typescript_compilation() {
    print_header "Checking TypeScript Compilation"

    cd "$PROJECT_ROOT"

    print_info "Running TypeScript compiler..."
    if npm run compile 2>&1; then
        print_success "TypeScript compiles successfully"
        return 0
    else
        print_error "TypeScript compilation failed"
        return 1
    fi
}

run_unit_tests() {
    print_header "Running Unit Tests"

    cd "$PROJECT_ROOT"

    # Rust unit tests
    print_info "Running Rust unit tests..."
    cd "$PROJECT_ROOT/src-tauri"
    if cargo test --lib --bins 2>&1; then
        print_success "Rust unit tests passed"
    else
        print_error "Rust unit tests failed"
        return 1
    fi

    # TypeScript unit tests
    cd "$PROJECT_ROOT"
    print_info "Running TypeScript unit tests..."
    if npm run test:tauri:unit 2>&1; then
        print_success "TypeScript unit tests passed"
    else
        print_warning "TypeScript unit tests failed or not configured"
    fi

    return 0
}

check_pre_commit_hook() {
    print_header "Checking Pre-commit Hook"

    cd "$PROJECT_ROOT"

    if [ -f ".husky/pre-commit" ]; then
        print_success "Pre-commit hook exists"

        if [ -x ".husky/pre-commit" ]; then
            print_success "Pre-commit hook is executable"
        else
            print_warning "Pre-commit hook is not executable"
            print_info "Run: chmod +x .husky/pre-commit"
        fi
    else
        print_error "Pre-commit hook not found"
        print_info "Run: npm run prepare"
        return 1
    fi

    return 0
}

check_secrets() {
    print_header "Checking for Secrets"

    cd "$PROJECT_ROOT"

    # Check for common secret patterns
    local found_secrets=0

    print_info "Scanning for potential secrets..."

    # Common patterns to check
    local patterns=(
        "password.*=.*['\"].*['\"]"
        "api[_-]?key.*=.*['\"].*['\"]"
        "secret.*=.*['\"].*['\"]"
        "token.*=.*['\"].*['\"]"
    )

    for pattern in "${patterns[@]}"; do
        if git ls-files | xargs grep -i -E "$pattern" 2>/dev/null | grep -v -E '(example|test|mock)'; then
            print_warning "Potential secret found matching pattern: $pattern"
            found_secrets=$((found_secrets + 1))
        fi
    done

    if [ $found_secrets -gt 0 ]; then
        print_warning "Found $found_secrets potential secrets. Please review."
        print_info "Make sure sensitive data is in .gitignore or use environment variables"
    else
        print_success "No obvious secrets found"
    fi

    return 0
}

###############################################################################
# Main Execution
###############################################################################

main() {
    local start_time=$(date +%s)
    local failed_checks=0

    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║        Kui CI/CD Pipeline Validation Script               ║"
    echo "║                                                            ║"
    echo "║  This script validates your local environment before      ║"
    echo "║  pushing changes to ensure CI/CD workflows will succeed   ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    print_info "Running in $MODE mode"
    print_info "Project root: $PROJECT_ROOT"
    echo ""

    # Always run these checks
    check_dependencies || failed_checks=$((failed_checks + 1))
    validate_workflow_syntax || failed_checks=$((failed_checks + 1))
    check_pre_commit_hook || failed_checks=$((failed_checks + 1))
    check_secrets || true  # Non-blocking

    if [ "$MODE" == "--quick" ] || [ "$MODE" == "quick" ]; then
        print_info "Quick mode: Running fast checks only"
        check_rust_formatting || failed_checks=$((failed_checks + 1))
        check_typescript_formatting || failed_checks=$((failed_checks + 1))

    elif [ "$MODE" == "--full" ] || [ "$MODE" == "full" ]; then
        print_info "Full mode: Running all checks"
        check_rust_formatting || failed_checks=$((failed_checks + 1))
        check_rust_linting || failed_checks=$((failed_checks + 1))
        check_rust_compilation || failed_checks=$((failed_checks + 1))
        check_typescript_formatting || failed_checks=$((failed_checks + 1))
        check_typescript_linting || failed_checks=$((failed_checks + 1))
        check_typescript_compilation || failed_checks=$((failed_checks + 1))
        run_unit_tests || failed_checks=$((failed_checks + 1))

    elif [ "$MODE" == "--help" ] || [ "$MODE" == "help" ]; then
        cat << EOF

Usage: $0 [MODE]

Modes:
  --quick   Run only fast validation checks (default)
  --full    Run all checks including compilation and tests
  --help    Show this help message

Examples:
  $0              # Run quick checks
  $0 --quick      # Run quick checks
  $0 --full       # Run all checks

EOF
        exit 0
    else
        print_error "Unknown mode: $MODE"
        print_info "Use --help for usage information"
        exit 1
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Summary
    print_header "Validation Summary"

    echo "Duration: ${duration}s"
    echo ""

    if [ $failed_checks -eq 0 ]; then
        print_success "All checks passed! ✨"
        echo ""
        print_info "Your code is ready to be pushed to CI/CD"
        echo ""
        exit 0
    else
        print_error "Failed $failed_checks check(s)"
        echo ""
        print_info "Please fix the issues above before pushing"
        echo ""
        exit 1
    fi
}

# Show help if requested
if [ "${1:-}" == "--help" ] || [ "${1:-}" == "-h" ]; then
    MODE="--help"
fi

main
