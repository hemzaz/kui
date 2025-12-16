# Kui Agent Architecture Summary

This document provides a comprehensive overview of Kui's agent-based development architecture.

## What is the Agent Architecture?

Kui's agent architecture divides development responsibilities across specialized agents, each owning specific components or features. This provides:

- **Clear ownership**: Every component has a responsible agent
- **Defined interfaces**: How components interact is explicit
- **Quality standards**: Each agent maintains testing and documentation
- **Scalable development**: Multiple developers can work independently

## Agent Organization

Agents are organized into 5 functional teams:

| Team | Agents | Location | Responsibilities |
|------|--------|----------|------------------|
| **Core Framework** | A01-A06 | `packages/core/` | REPL, commands, plugins, events |
| **UI Components** | A11-A17 | `packages/react/` | React UI, themes, rendering |
| **Kubernetes** | A21-A27 | `plugins/plugin-kubectl/` | kubectl, resources, Helm, odo |
| **Platform** | A51-A64 | `src-tauri/`, `packages/builder/` | Tauri, IPC, build, packaging |
| **Testing & Quality** | A71-A78 | `packages/test/`, `.github/` | Tests, CI/CD, quality gates |

## Quick Agent Reference

### Core Framework Agents (A01-A06)

- **A01 REPL Core**: Command execution pipeline
- **A02 Command Router**: Route matching, command tree
- **A03 Plugin System**: Plugin loading and lifecycle
- **A04 Event System**: Pub/sub event bus
- **A05 Response Type Handler**: Response type dispatch
- **A06 Error Handling**: Error types and formatting

### UI Component Agents (A11-A17)

- **A11 Client Shell**: Main shell, tabs, splits
- **A12 Table Renderer**: Sortable data tables
- **A13 Terminal Renderer**: xterm.js integration
- **A14 Card Renderer**: Card-based views
- **A15 Monaco Editor**: YAML/JSON editing
- **A16 Theme System**: Theme management
- **A17 Layout Management**: Split views, resizing

### Kubernetes Integration Agents (A21-A27)

- **A21 kubectl Core**: kubectl command execution
- **A22 Resource View**: Kubernetes resource views
- **A23 YAML Editor**: Kubernetes YAML editing
- **A24 Pod Logs**: Pod log streaming
- **A25 Helm Integration**: Helm chart management
- **A26 odo Integration**: OpenShift Do support
- **A27 oc Integration**: OpenShift CLI support

### Platform Integration Agents (A51-A64)

- **A51 Tauri Backend**: Rust backend, windows
- **A52 IPC Communication**: JavaScript ↔ Rust IPC
- **A53 Menu Management**: Application menus
- **A54 Window Utilities**: Window positioning, state
- **A61 Settings Management**: App preferences
- **A62 Build System**: Webpack, TypeScript compilation
- **A63 Asset Processing**: Icons, images, fonts
- **A64 Packaging**: Application distribution

### Testing & Quality Agents (A71-A78)

- **A71 Test Infrastructure**: Test framework, utilities
- **A72 Browser Test**: Browser automation, integration tests
- **A73 E2E Test**: End-to-end testing
- **A74 CI/CD**: Continuous integration pipeline
- **A75 Code Quality**: Linting, formatting, type checking
- **A76 Performance Testing**: Benchmarks, profiling
- **A77 Accessibility Testing**: WCAG compliance
- **A78 Security Testing**: Vulnerability scanning

## Common Development Workflows

### 1. Adding a New kubectl Command

**Agents Involved**: A21, A12, A02

1. **A02 Command Router**: Register new command
2. **A21 kubectl Core**: Implement command handler
3. **A21**: Parse kubectl output to Table
4. **A12 Table Renderer**: Render table UI
5. **A72 Browser Test**: Add test coverage

### 2. Adding a New UI Component

**Agents Involved**: A11, A16, A72

1. **A11 Client Shell**: Create React component
2. **A16 Theme System**: Add theme styles
3. **A72 Browser Test**: Add component tests
4. **A77 Accessibility**: Validate accessibility

### 3. Adding a New Platform Feature

**Agents Involved**: A51, A52, A11

1. **A51 Tauri Backend**: Implement Rust command
2. **A52 IPC**: Add IPC command definition
3. **A11 Client Shell**: Call IPC from JavaScript
4. **A73 E2E Test**: Add integration test

### 4. Fixing a Performance Issue

**Agents Involved**: A76, affected agents

1. **A76 Performance**: Profile and identify bottleneck
2. **Affected Agent**: Implement optimization
3. **A76**: Verify performance improvement
4. **A72/A73**: Ensure tests still pass

## Communication Patterns

### Pattern 1: Synchronous Function Calls
```
Agent A calls Agent B's function
  ↓
Agent B processes and returns result
  ↓
Agent A continues with result
```

### Pattern 2: Event-Driven Communication
```
Agent A emits event via A04 Event System
  ↓
A04 propagates to all subscribers
  ↓
Agent B listens and responds to event
  ↓
Agent C also listens independently
```

### Pattern 3: IPC Communication
```
Agent A (JavaScript) invokes IPC command
  ↓
A52 IPC Agent serializes and sends
  ↓
A51 Tauri Backend (Rust) executes
  ↓
A52 IPC Agent deserializes and returns
  ↓
Agent A (JavaScript) receives result
```

## Quality Standards

All agents must maintain:

### Code Quality
- TypeScript strict mode
- ESLint compliance (zero warnings)
- Prettier formatting
- Meaningful variable names
- Clear function signatures

### Testing
- Unit tests for all functions
- Integration tests for workflows
- Error case coverage
- Performance assertions where applicable

### Documentation
- Clear agent responsibilities
- Interface documentation
- Example usage
- Communication patterns

### Performance
- REPL overhead < 10ms
- UI rendering < 16ms (60fps)
- IPC calls < 1ms overhead
- Startup time < 0.5s (Tauri)

## Development Process

### Before Coding
1. Identify which agents are involved
2. Read agent documentation (`agents/*.md`)
3. Understand existing interfaces
4. Plan test scenarios

### During Coding
1. Follow agent's quality standards
2. Maintain clear agent boundaries
3. Document agent interactions
4. Write tests alongside implementation

### After Coding
1. Run `npm run lint` (fix all issues)
2. Run `npm test` (ensure all pass)
3. Run `npm run build` (verify build)
4. Update agent documentation if needed
5. Self-review changes

## Agent Documentation Files

- `agents/README.md` - This overview
- `agents/core-agents.md` - Core framework agents (A01-A06)
- `agents/ui-agents.md` - UI component agents (A11-A17)
- `agents/kubectl-agents.md` - Kubernetes agents (A21-A27)
- `agents/platform-agents.md` - Platform agents (A51-A64)
- `agents/testing-agents.md` - Testing agents (A71-A78)

## Integration with Existing Documentation

The agent architecture complements existing Kui documentation:

- **CLAUDE.md**: High-level development guide (read first)
- **Agent docs**: Detailed agent responsibilities and interfaces
- **packages/*/README.md**: Package-specific documentation
- **docs/**: API documentation

## Benefits of Agent Architecture

### For Developers
- Clear ownership and boundaries
- Easier onboarding (understand one agent at a time)
- Parallel development (work on different agents)
- Focused testing (test agent in isolation)

### For AI Assistants (Claude Code)
- Contextual understanding of responsibilities
- Know which agents to modify for a feature
- Follow established communication patterns
- Maintain quality standards automatically

### For Code Quality
- Modular architecture
- Clear interfaces between components
- Testable components
- Maintainable codebase

## Getting Started

1. **Read CLAUDE.md**: Understand Kui's overall architecture
2. **Read this summary**: Understand agent organization
3. **Read relevant agent docs**: Deep dive into specific agents
4. **Start coding**: Follow agent standards and patterns

## Questions?

- Check agent documentation in `agents/*.md`
- Review existing code in agent's location
- Look for examples in test files
- Consult CLAUDE.md for development guidelines

---

**Remember**: The agent architecture is a guide, not a strict requirement. Use it to understand responsibilities and maintain code quality, but don't let it slow down development.
