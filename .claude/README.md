# Kui Claude Code Configuration

This directory contains configuration and documentation for working with Kui using Claude Code.

## Directory Structure

```
.claude/
├── README.md              # This file
├── AGENTS_SUMMARY.md      # Agent architecture overview
├── settings.local.json    # Claude Code settings
├── agents/                # Agent documentation
│   ├── README.md          # Agent system overview
│   ├── core-agents.md     # Core framework agents (A01-A06)
│   ├── ui-agents.md       # UI component agents (A11-A17)
│   ├── kubectl-agents.md  # Kubernetes agents (A21-A27)
│   ├── platform-agents.md # Platform agents (A51-A64)
│   └── testing-agents.md  # Testing agents (A71-A78)
└── workflows/             # Workflow documentation (future)
```

## Quick Start

### For AI Assistants (Claude Code)

1. **Start here**: Read `/CLAUDE.md` in the project root for overall Kui architecture
2. **Agent overview**: Read `AGENTS_SUMMARY.md` to understand agent organization
3. **Detailed docs**: Read specific agent docs in `agents/` for deep dives
4. **Settings**: Check `settings.local.json` for MCP server configuration

### For Developers

1. **Project guide**: Read `/CLAUDE.md` for Kui development guidelines
2. **Agent reference**: Use `AGENTS_SUMMARY.md` as a quick reference
3. **Component ownership**: Check `agents/*.md` to find who owns what
4. **Development workflow**: Follow patterns in agent documentation

## Agent Architecture

Kui uses an agent-based architecture with 5 teams:

| Team | Agents | Responsibilities |
|------|--------|------------------|
| Core Framework | A01-A06 | REPL, commands, plugins, events |
| UI Components | A11-A17 | React UI, themes, rendering |
| Kubernetes | A21-A27 | kubectl, resources, Helm, odo |
| Platform | A51-A64 | Tauri, IPC, build, packaging |
| Testing & Quality | A71-A78 | Tests, CI/CD, quality gates |

### Key Agents

- **A01**: REPL Core - Command execution pipeline
- **A11**: Client Shell - Main React shell component
- **A21**: kubectl Core - Kubernetes command processing
- **A51**: Tauri Backend - Rust backend and window management
- **A71**: Test Infrastructure - Test framework and utilities

See `AGENTS_SUMMARY.md` for complete agent reference.

## MCP Server Configuration

The `settings.local.json` file configures Model Context Protocol (MCP) servers:

**Enabled Servers**:
- AWS Labs servers (CDK, EKS, Terraform)
- GitHub integration
- Claude Flow orchestration
- Pulumi infrastructure
- Azure MCP
- Spec Kit
- PostgreSQL

**Permissions**:
- Allowed: `Bash(tar:*)` for extracting archives

## Documentation Hierarchy

```
1. /CLAUDE.md               ← Start here (high-level guide)
   ├─ Core Architecture
   ├─ Command Processing
   ├─ Plugin System
   ├─ Development Workflow
   └─ Key Packages

2. .claude/AGENTS_SUMMARY.md   ← Agent overview
   ├─ Agent Organization
   ├─ Quick Reference
   ├─ Common Workflows
   └─ Communication Patterns

3. .claude/agents/*.md         ← Detailed agent docs
   ├─ Agent Responsibilities
   ├─ Location in Codebase
   ├─ Interfaces and APIs
   ├─ Communication Patterns
   ├─ Quality Standards
   └─ Testing Strategy
```

## Using Agent Documentation

### When Adding a Feature

1. Identify which agents are involved
2. Read those agents' documentation
3. Follow the agent's quality standards
4. Use established communication patterns
5. Document agent interactions

### When Fixing a Bug

1. Find the responsible agent
2. Check the agent's test strategy
3. Follow the agent's error handling patterns
4. Verify the fix with agent-specific tests

### When Refactoring

1. Understand agent boundaries
2. Maintain agent interfaces
3. Update agent documentation
4. Ensure tests still pass

## Communication Patterns

Agents communicate through:

1. **Direct Calls**: Synchronous function calls between agents
2. **Events**: Pub/sub via A04 Event System
3. **Plugin API**: Registrar-based registration
4. **IPC**: Inter-process communication (Tauri ↔ Web)

See individual agent docs for specific examples.

## Quality Standards

All agent modifications must maintain:

- ✅ TypeScript strict mode
- ✅ ESLint compliance (zero warnings)
- ✅ Prettier formatting
- ✅ Unit test coverage
- ✅ Integration tests where applicable
- ✅ Clear documentation
- ✅ Performance standards

## Development Commands

```bash
# Compile TypeScript
npm run compile

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Watch mode (development)
npm run watch

# Build for production
npm run build:tauri:mac:arm64  # Or other platform

# Run Tauri app
npm run tauri:dev
```

## Key Locations

- **Core framework**: `packages/core/`
- **React UI**: `packages/react/`
- **kubectl plugin**: `plugins/plugin-kubectl/`
- **Tauri backend**: `src-tauri/`
- **Build system**: `packages/webpack/`
- **Tests**: `packages/test/`

## Resources

- **Project repository**: https://github.com/IBM/kui
- **Agent documentation**: `.claude/agents/`
- **Main guide**: `/CLAUDE.md`
- **API docs**: `/docs/api/`

## Questions?

1. Check `AGENTS_SUMMARY.md` for agent quick reference
2. Read specific agent docs in `agents/*.md`
3. Review existing code in agent's location
4. Look for examples in test files

---

**Remember**: The agent architecture provides structure and clarity but should not slow down development. Use it as a guide to understand ownership and maintain quality.
