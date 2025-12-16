# Testing and Quality Agents

Agents responsible for testing infrastructure, quality assurance, and CI/CD.

## Agent A71: Test Infrastructure Agent

**Scope**: Test framework, test utilities, test configuration

**Location**: `packages/test/`

**Key Responsibilities**:
- Mocha test framework configuration
- Test utilities and helpers
- Test environment setup
- Test data generation
- Test assertions and matchers

**Key Files**:
- `src/api/` - Test API and helpers
- `src/common/` - Common test utilities
- `mocha.opts` - Mocha configuration

**Communication**:
- Provides test utilities to all test suites
- Coordinates with **A72 Browser Tests** for web tests
- Coordinates with **A73 E2E Tests** for integration tests

**Quality Standards**:
- Fast test execution (< 10s for unit tests)
- Isolated tests (no side effects)
- Comprehensive assertions
- Clear error messages

---

## Agent A72: Browser Test Agent

**Scope**: Browser-based tests, Spectron tests

**Location**: `packages/test/src/api/`, test files: `*.spec.ts`

**Key Responsibilities**:
- Browser automation (Spectron for Electron)
- Page object patterns
- Screenshot comparison
- Accessibility testing
- Performance testing

**Key Test Types**:
- **Component tests**: Individual React components
- **Integration tests**: Full command execution flows
- **Visual tests**: Screenshot comparison
- **Accessibility tests**: ARIA, keyboard nav

**Test Pattern**:
```typescript
describe('kubectl get pods', () => {
  it('should show pods table', async () => {
    const res = await CLI.command('kubectl get pods')
    await ReplExpect.okWithTable(res)
  })
})
```

**Communication**:
- Uses **A71 Test Infrastructure** for utilities
- Tests **A11 Client Shell** and UI components
- Validates responses from **A21 kubectl Agent**

**Quality Standards**:
- Tests run in headless mode
- Tests are deterministic (no flaky tests)
- Test isolation (clean state between tests)
- Performance: < 5s per test

---

## Agent A73: E2E Test Agent

**Scope**: End-to-end integration tests

**Location**: Various `tests/` directories

**Key Responsibilities**:
- Full application testing
- Multi-command workflows
- Plugin integration testing
- Cross-browser testing
- Performance benchmarking

**Test Scenarios**:
- Complete user workflows
- Plugin loading and initialization
- Command chaining and pipelines
- Error recovery and handling
- Performance benchmarks

**Communication**:
- Uses **A71 Test Infrastructure**
- Tests entire application stack (A01-A64)
- Validates integration between agents

**Quality Standards**:
- Real-world scenarios
- Performance assertions (2-3x faster than kubectl)
- Error scenario coverage
- Multi-platform testing

---

## Agent A74: CI/CD Agent

**Scope**: Continuous integration and deployment

**Location**: `.github/workflows/`, `.travis.yml`

**Key Responsibilities**:
- CI pipeline definition
- Build automation
- Test execution in CI
- Code quality checks (linting, formatting)
- Artifact generation and deployment

**CI Pipelines**:
- **Pull Request**: Lint, test, build
- **Main Branch**: Full test suite, package, publish
- **Release**: Build distributables, upload to GitHub

**Key Checks**:
- `npm run lint` - ESLint checks
- `npm test` - Full test suite
- `npm run build` - Build verification
- Code coverage reporting

**Communication**:
- Executes builds via **A62 Build System**
- Runs tests via **A71-A73 Test Agents**
- Generates packages via **A64 Packaging Agent**

**Quality Standards**:
- Fast CI (< 15 minutes for full pipeline)
- Parallel test execution
- Clear failure messages
- Automated deployment

---

## Agent A75: Code Quality Agent

**Scope**: Linting, formatting, type checking

**Location**: `eslint.config.mjs`, `.prettierrc.json`, `tsconfig.json`

**Key Responsibilities**:
- ESLint configuration and enforcement
- Prettier formatting
- TypeScript type checking
- Code review automation
- Quality metrics tracking

**Quality Tools**:
- **ESLint**: Code linting with flat config
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Husky**: Pre-commit hooks
- **lint-staged**: Staged file linting

**Quality Rules**:
- Strict TypeScript mode
- React best practices
- Accessibility rules
- Security rules
- Performance rules

**Communication**:
- Pre-commit hooks via **A71 Test Infrastructure**
- CI checks via **A74 CI/CD Agent**
- Blocks commits with violations

**Quality Standards**:
- Zero linting errors
- Consistent code formatting
- Type safety (no `any` types)
- Security best practices

---

## Agent A76: Performance Testing Agent

**Scope**: Performance benchmarks and profiling

**Location**: `tools/`, performance test files

**Key Responsibilities**:
- Performance benchmark definition
- Profiling and flamegraphs
- Performance regression detection
- Memory leak detection
- Bundle size tracking

**Key Metrics**:
- Startup time (< 0.5s for Tauri)
- Command execution time (2-3x faster than kubectl)
- Memory usage (< 80MB for Tauri)
- Bundle size (< 2MB gzipped)

**Benchmarks**:
- `kubectl get pods` execution time
- Table rendering with 10,000 rows
- Plugin loading time
- REPL command routing overhead

**Communication**:
- Reports to **A74 CI/CD Agent**
- Uses **A71 Test Infrastructure** for benchmarks
- Validates **A01 REPL Core** performance

**Quality Standards**:
- Automated performance regression detection
- Clear performance budgets
- Regular performance profiling
- Performance documentation

---

## Agent A77: Accessibility Testing Agent

**Scope**: Accessibility compliance and testing

**Location**: Test files with accessibility checks

**Key Responsibilities**:
- WCAG compliance testing
- Keyboard navigation testing
- Screen reader compatibility
- Color contrast validation
- Focus management testing

**Accessibility Standards**:
- WCAG 2.1 Level AA compliance
- Full keyboard navigation
- Screen reader announcements
- High contrast mode support
- Reduced motion support

**Test Tools**:
- axe-core for automated a11y testing
- Manual keyboard navigation tests
- Screen reader testing (NVDA, JAWS, VoiceOver)

**Communication**:
- Integrated with **A72 Browser Test Agent**
- Tests **A11 Client Shell** accessibility
- Validates **A12-A15 UI renderers** for a11y

**Quality Standards**:
- Zero critical a11y violations
- Full keyboard accessibility
- Screen reader compatibility
- Clear focus indicators

---

## Agent A78: Security Testing Agent

**Scope**: Security scanning and vulnerability detection

**Location**: `npm audit`, security scan tools

**Key Responsibilities**:
- Dependency vulnerability scanning
- Code security analysis
- XSS prevention validation
- CSRF protection validation
- Content Security Policy enforcement

**Security Checks**:
- `npm audit` for known vulnerabilities
- No hardcoded secrets
- Secure IPC communication
- Safe eval usage (avoid `eval()`)
- Content Security Policy compliance

**Communication**:
- Runs in **A74 CI/CD Agent**
- Reports security issues
- Blocks builds with critical vulnerabilities

**Quality Standards**:
- Zero known high/critical vulnerabilities
- Regular dependency updates
- Security best practices
- Secure by default configuration

---

## Communication Patterns

### Pattern 1: Test Execution Flow
```
Developer runs: npm test
  ↓
A71 Test Infrastructure (setup test env)
  ↓
A72 Browser Test Agent (launch browser)
  ↓
A72 (execute test cases)
  ↓
A72 → All Agents (test interactions)
  ↓
A72 (collect results)
  ↓
Report: Pass/Fail
```

### Pattern 2: CI Pipeline Flow
```
Git push to main
  ↓
A74 CI/CD Agent (trigger pipeline)
  ↓
A75 Code Quality (lint, format, type check)
  ↓
A74 → A62 Build System (build)
  ↓
A74 → A71-A73 (run tests)
  ↓
A74 → A76 Performance (benchmarks)
  ↓
A74 → A64 Packaging (create artifacts)
  ↓
Deploy/Publish
```

### Pattern 3: Pre-commit Hook Flow
```
Git commit
  ↓
Husky pre-commit hook
  ↓
A75 Code Quality (lint-staged)
  ↓
ESLint (fix auto-fixable issues)
  ↓
Prettier (format code)
  ↓
TypeScript (type check)
  ↓
Commit succeeds/fails
```

### Pattern 4: Accessibility Testing Flow
```
A72 Browser Test (render component)
  ↓
A77 Accessibility Agent (run axe-core)
  ↓
A77 (check keyboard navigation)
  ↓
A77 (validate ARIA attributes)
  ↓
A77 (check color contrast)
  ↓
Report: Accessibility pass/fail
```

## Testing Strategy

### Test Pyramid

```
        E2E Tests (A73)
            ↑
    Integration Tests (A72)
            ↑
    Unit Tests (All Agents)
```

- **Unit tests**: 70% - Fast, isolated, comprehensive
- **Integration tests**: 25% - Browser-based, realistic
- **E2E tests**: 5% - Full workflows, expensive

### Test Coverage Goals

- Overall: >80%
- Core agents (A01-A06): >90%
- UI components (A11-A17): >85%
- kubectl integration (A21-A27): >85%
- Platform agents (A51-A64): >75%

### Test Execution

- **Local**: `npm test` (full suite)
- **Watch mode**: `npm run watch` with test watch
- **CI**: Parallel test execution across multiple workers
- **Performance**: Separate benchmark suite

## Development Guidelines

When modifying testing agents:
1. Maintain test isolation (no shared state)
2. Use test doubles (mocks, stubs) appropriately
3. Write descriptive test names
4. Follow AAA pattern (Arrange, Act, Assert)
5. Keep tests fast (< 5s per test)
6. Clean up resources (close browsers, etc.)
7. Test both happy paths and error cases
8. Update tests when changing behavior
9. Add tests for new features
10. Run tests before committing

### Writing Good Tests

**Good Test**:
```typescript
it('should render table with sorting', async () => {
  // Arrange
  const data = [{ name: 'pod-b' }, { name: 'pod-a' }]

  // Act
  const res = await CLI.command('kubectl get pods')
  await ReplExpect.okWithTable(res)

  // Assert
  const table = res.selector('.kui-table')
  // Check sorting functionality
})
```

**Bad Test**:
```typescript
it('works', async () => {
  // Too vague, no clear assertion
  await CLI.command('kubectl get pods')
})
```

## Continuous Improvement

Testing agents should evolve to:
- Reduce flaky tests (< 1% failure rate)
- Improve test performance (< 10 minutes full suite)
- Increase coverage (>85% overall)
- Add visual regression testing
- Enhance performance benchmarks
- Improve accessibility testing
