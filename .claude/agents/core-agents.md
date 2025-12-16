# Core Framework Agents

Agents responsible for Kui's core framework functionality.

## Agent A01: REPL Core Agent

**Scope**: REPL implementation, command execution pipeline

**Location**: `packages/core/src/repl/`

**Key Responsibilities**:
- Command parsing and tokenization
- Command execution orchestration
- Response handling and display
- Error management and recovery
- Command history management

**Interfaces**:
```typescript
// Execute a command
function exec(command: string, execOptions?: ExecOptions): Promise<Response>

// Register command handlers
function listen(route: string, handler: CommandHandler, options?: CommandOptions): void
```

**Communication**:
- Calls **A02 Command Router** for command matching
- Calls **A03 Plugin System** for plugin initialization
- Publishes events via **A04 Event System**
- Returns responses to UI via **A11 Client Shell**

**Quality Standards**:
- All execution paths must be tested
- Error handling for invalid commands
- Performance: < 10ms command routing overhead
- Memory: Bounded history buffer

---

## Agent A02: Command Router Agent

**Scope**: Command tree management, route matching

**Location**: `packages/core/src/core/command-tree.ts`

**Key Responsibilities**:
- Command registration and deregistration
- Route matching and parameter extraction
- Command aliasing and synonyms
- Usage documentation generation

**Interfaces**:
```typescript
interface Registrar {
  listen(route: string, handler: CommandHandler, options?: CommandOptions): void
  subtree(route: string, options?: TreeOptions): Registrar
  synonym(route: string, master: CommandHandler): void
}
```

**Communication**:
- Used by **A01 REPL Core** for command routing
- Used by **A03 Plugin System** for command registration
- Provides completion data to **A12 Bash-like Agent**

**Quality Standards**:
- O(log n) route matching performance
- Support for wildcards and regex patterns
- Comprehensive usage documentation
- Test coverage for edge cases (conflicts, wildcards)

---

## Agent A03: Plugin System Agent

**Scope**: Plugin discovery, loading, and lifecycle

**Location**: `packages/core/src/core/plugin.ts`

**Key Responsibilities**:
- Plugin discovery and enumeration
- Lazy plugin loading
- Preload execution and dependency resolution
- Plugin API versioning
- Plugin isolation and sandboxing

**Interfaces**:
```typescript
interface Plugin {
  preload(registrar: Registrar): Promise<void>
}

function loadPlugin(name: string): Promise<Plugin>
```

**Communication**:
- Called by **A01 REPL Core** during initialization
- Provides **A02 Command Router** to plugins
- Coordinates with **A11 Client Shell** for UI plugins
- Emits events via **A04 Event System**

**Quality Standards**:
- Graceful plugin failure handling
- Plugin loading < 100ms per plugin
- Clear error messages for plugin issues
- Support for hot-reloading in development

---

## Agent A04: Event System Agent

**Scope**: Event bus, listeners, and event propagation

**Location**: `packages/core/src/core/events.ts`

**Key Responsibilities**:
- Event registration and subscription
- Event emission and propagation
- Event filtering and routing
- Lifecycle events (tab creation, command execution)

**Interfaces**:
```typescript
interface Events {
  on(event: string, listener: EventListener): Unsubscriber
  once(event: string, listener: EventListener): Unsubscriber
  emit(event: string, data: any): void
}
```

**Communication**:
- Used by all agents for pub/sub communication
- **A01 REPL Core** emits command lifecycle events
- **A11 Client Shell** emits UI lifecycle events
- **A21 kubectl Agent** emits resource update events

**Quality Standards**:
- Event listeners must not block event loop
- Support for typed events
- Memory leak prevention (cleanup unsubscribers)
- Event debugging and tracing in dev mode

---

## Agent A05: Response Type Handler Agent

**Scope**: Response type definitions and rendering dispatch

**Location**: `packages/core/src/models/`

**Key Responsibilities**:
- Response type definitions (Table, MultiModal, Terminal, etc.)
- Response validation and transformation
- Renderer selection and dispatch
- Response streaming support

**Key Types**:
```typescript
type Response =
  | Table
  | MultiModalResponse
  | XtermResponse
  | HTMLResponse
  | NavResponse
  | string
  | boolean
  | number

interface Table {
  header: Header
  body: Row[]
  title?: string
  statusStripe?: StatusStripe
}
```

**Communication**:
- Used by **A01 REPL Core** to type-check responses
- Dispatches to **A11-A15** (UI renderers) based on type
- Coordinates with **A21 kubectl Agent** for Table responses

**Quality Standards**:
- Type safety for all response types
- Backwards compatibility for response formats
- Performance: O(1) renderer dispatch
- Documentation for each response type

---

## Agent A06: Error Handling Agent

**Scope**: Error types, error formatting, user-facing error messages

**Location**: `packages/core/src/core/errors.ts`

**Key Responsibilities**:
- Error type definitions (UsageError, CodedError, etc.)
- Error formatting for user display
- Error logging and reporting
- Error recovery strategies

**Interfaces**:
```typescript
class UsageError extends Error {
  usage: CommandOptions
}

class CodedError extends Error {
  code: number
  body?: string
}
```

**Communication**:
- Used by all agents for error reporting
- **A01 REPL Core** catches and formats errors
- **A11 Client Shell** displays formatted errors
- **A73 Testing Agent** validates error handling

**Quality Standards**:
- User-friendly error messages
- Structured error information (code, message, context)
- Stack traces in development mode
- Error categorization (user error vs system error)

---

## Communication Patterns

### Pattern 1: Command Execution Flow
```
User Input
  ↓
A01 REPL Core (parse command)
  ↓
A02 Command Router (match route)
  ↓
A03 Plugin System (execute handler)
  ↓
A05 Response Type Handler (dispatch response)
  ↓
A11 Client Shell (render UI)
```

### Pattern 2: Plugin Loading Flow
```
A01 REPL Core (initialize)
  ↓
A03 Plugin System (discover plugins)
  ↓
A03 Plugin System (load plugin)
  ↓
Plugin preload() → A02 Command Router (register commands)
  ↓
A04 Event System (emit plugin-loaded event)
```

### Pattern 3: Error Handling Flow
```
Command Handler (throw error)
  ↓
A06 Error Handling (catch and format)
  ↓
A01 REPL Core (wrap in error response)
  ↓
A11 Client Shell (display error UI)
  ↓
A04 Event System (emit error event)
```

## Testing Strategy

Core agents must have:
- **Unit tests**: Each agent's methods tested in isolation
- **Integration tests**: Command execution flow end-to-end
- **Error tests**: All error paths covered
- **Performance tests**: REPL execution overhead < 10ms

## Development Guidelines

When modifying core agents:
1. Maintain backwards compatibility for plugin API
2. Document all breaking changes
3. Update TypeScript types
4. Run full test suite (`npm test`)
5. Test in both Electron and browser modes
6. Verify plugin loading still works
