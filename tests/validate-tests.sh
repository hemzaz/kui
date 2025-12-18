#!/bin/bash

# Tauri Test Validation Script
# Runs smoke tests and generates a validation report

set -e

echo "========================================"
echo "Tauri Test Suite Validation"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Check prerequisites
echo "Checking prerequisites..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗${NC} Node.js not found"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗${NC} npm not found"
    exit 1
fi
echo -e "${GREEN}✓${NC} npm $(npm --version)"

# Check if playwright is installed
if ! npx playwright --version &> /dev/null; then
    echo -e "${YELLOW}!${NC} Playwright not found, installing..."
    npm install
fi
echo -e "${GREEN}✓${NC} Playwright installed"

# Check if dev server is running
echo ""
echo "Checking if development server is running..."
if curl -s http://localhost:9080 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Development server is running"
else
    echo -e "${YELLOW}!${NC} Development server not running"
    echo "  Starting webpack dev server..."
    npm run watch:webpack > /tmp/kui-webpack.log 2>&1 &
    WEBPACK_PID=$!

    # Wait for server to start
    echo "  Waiting for server to be ready..."
    for i in {1..60}; do
        if curl -s http://localhost:9080 > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} Server started"
            break
        fi
        sleep 1
        echo -n "."
    done
    echo ""
fi

echo ""
echo "========================================"
echo "Running Test Suite"
echo "========================================"
echo ""

# Create test results directory
mkdir -p test-results

# Run smoke tests
echo "Running smoke tests..."
if npm run test:tauri:smoke > test-results/smoke-tests.log 2>&1; then
    echo -e "${GREEN}✓${NC} Smoke tests passed"
    SMOKE_RESULT="PASSED"
else
    echo -e "${RED}✗${NC} Smoke tests failed (see test-results/smoke-tests.log)"
    SMOKE_RESULT="FAILED"
fi

# Run integration tests
echo "Running integration tests..."
if npm run test:tauri:integration > test-results/integration-tests.log 2>&1; then
    echo -e "${GREEN}✓${NC} Integration tests passed"
    INTEGRATION_RESULT="PASSED"
else
    echo -e "${RED}✗${NC} Integration tests failed (see test-results/integration-tests.log)"
    INTEGRATION_RESULT="FAILED"
fi

# Run feature parity tests
echo "Running feature parity tests..."
if npm run test:tauri:feature-parity > test-results/feature-parity-tests.log 2>&1; then
    echo -e "${GREEN}✓${NC} Feature parity tests passed"
    PARITY_RESULT="PASSED"
else
    echo -e "${RED}✗${NC} Feature parity tests failed (see test-results/feature-parity-tests.log)"
    PARITY_RESULT="FAILED"
fi

echo ""
echo "========================================"
echo "Test Results Summary"
echo "========================================"
echo ""

# Generate summary report
cat > test-results/validation-summary.txt << EOF
Tauri Test Validation Report
=============================
Date: $(date)
Platform: $(uname -s)
Node: $(node --version)
npm: $(npm --version)

Test Results:
-------------
Smoke Tests:        $SMOKE_RESULT
Integration Tests:  $INTEGRATION_RESULT
Feature Parity:     $PARITY_RESULT

Test Logs:
----------
- test-results/smoke-tests.log
- test-results/integration-tests.log
- test-results/feature-parity-tests.log

Detailed Report:
----------------
$(cat test-results/html/index.html 2>/dev/null || echo "HTML report not available")

EOF

# Display summary
cat test-results/validation-summary.txt

echo ""
echo "========================================"
echo "Validation Complete"
echo "========================================"
echo ""
echo "View detailed HTML report:"
echo "  npm run test:tauri:report"
echo ""
echo "Or open:"
echo "  test-results/html/index.html"
echo ""

# Cleanup webpack if we started it
if [ ! -z "$WEBPACK_PID" ]; then
    echo "Stopping webpack dev server..."
    kill $WEBPACK_PID 2>/dev/null || true
fi

# Exit with error if any tests failed
if [ "$SMOKE_RESULT" = "FAILED" ] || [ "$INTEGRATION_RESULT" = "FAILED" ] || [ "$PARITY_RESULT" = "FAILED" ]; then
    exit 1
fi

exit 0
