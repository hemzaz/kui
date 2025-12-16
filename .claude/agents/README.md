# Kui Agent Architecture

This directory contains agent-based architecture documentation for Kui development.

## Overview

Kui's agent architecture divides development responsibilities across specialized agents organized by functional areas:

### Agent Teams

1. **Core Framework Agents** (`core-agents.md`)
   - REPL and command processing
   - Plugin system and lifecycle
   - Event management
   - Response type handling

2. **UI Component Agents** (`ui-agents.md`)
   - React components and renderers
   - Theme system
   - Layout and navigation
   - Terminal integration

3. **Kubernetes Integration Agents** (`kubectl-agents.md`)
   - kubectl command processing
   - Resource views and drilldown
   - YAML/JSON editing
   - Logs and streaming

4. **Platform Integration Agents** (`platform-agents.md`)
   - Tauri backend (Rust)
   - Window and menu management
   - IPC and communication
   - Build and packaging

5. **Quality and Testing Agents** (`testing-agents.md`)
   - Test infrastructure
   - Browser and E2E tests
   - CI/CD integration
   - Quality gates

## Agent Responsibilities

Each agent has:
- **Clear scope**: Specific components or features they own
- **Defined interfaces**: How they interact with other agents
- **Quality standards**: Testing and documentation requirements
- **Communication patterns**: How they coordinate with other agents

## Using This Documentation

When working on a feature:
1. Identify which agents are involved
2. Check agent responsibilities and interfaces
3. Follow the agent's quality standards
4. Use appropriate communication patterns
5. Document agent interactions in your changes

## Quick Reference

| Area | Agent File | Key Responsibilities |
|------|-----------|---------------------|
| REPL | `core-agents.md` | Command execution, routing |
| Plugins | `core-agents.md` | Plugin loading, lifecycle |
| UI | `ui-agents.md` | React components, themes |
| Kubernetes | `kubectl-agents.md` | kubectl integration, resources |
| Platform | `platform-agents.md` | Tauri, window management |
| Testing | `testing-agents.md` | Test infrastructure, CI/CD |

## Communication Patterns

Agents communicate through:
- **Direct calls**: Synchronous function calls
- **Events**: Pub/sub event system
- **Plugin API**: Registrar-based registration
- **IPC**: Inter-process communication (Tauri ↔ Web)

See individual agent files for specific communication examples.
