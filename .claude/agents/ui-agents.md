# UI Component Agents

Agents responsible for React-based UI components and rendering.

## Agent A11: Client Shell Agent

**Scope**: Main shell component, tab management, split views

**Location**: `packages/react/src/`

**Key Responsibilities**:
- Tab creation and management
- Split view layout
- Command prompt UI
- Block (command execution) rendering
- Session state management

**Key Components**:
```typescript
<Client />           // Main shell
<KuiContext />       // React context provider
<TabContainer />     // Tab management
<SplitView />        // Side-by-side views
<CommandLine />      // Prompt input
```

**Communication**:
- Receives responses from **A01 REPL Core**
- Dispatches to **A12-A15** renderers based on response type
- Coordinates with **A51 Tauri Agent** for window state
- Emits UI events via **A04 Event System**

**Quality Standards**:
- Responsive UI (< 16ms per frame)
- Keyboard navigation support
- Accessibility (ARIA labels, screen reader support)
- Theme compatibility

---

## Agent A12: Table Renderer Agent

**Scope**: Sortable, filterable data table rendering

**Location**: `packages/react/src/Content/Table/`

**Key Responsibilities**:
- Table rendering with sorting and filtering
- Virtual scrolling for large datasets
- Cell formatting (badges, icons, timestamps)
- Row selection and actions
- CSV/JSON export

**Key Components**:
```typescript
<KuiTable />         // Main table component
<TableHeader />      // Column headers with sorting
<TableBody />        // Virtual scrolled rows
<TableCell />        // Cell rendering with badges
```

**Communication**:
- Receives Table responses from **A05 Response Type Handler**
- Uses **A16 Theme Agent** for styling
- Emits row-click events to **A21 kubectl Agent** for drilldown

**Quality Standards**:
- Support for 10,000+ rows with virtual scrolling
- Smooth scrolling (60fps)
- Keyboard navigation (arrow keys, tab)
- Responsive design (mobile-friendly)

---

## Agent A13: Terminal Renderer Agent

**Scope**: xterm.js integration for terminal output

**Location**: `packages/react/src/Content/Scalar/`

**Key Responsibilities**:
- Terminal emulator integration (xterm.js)
- PTY process management
- ANSI color and formatting support
- Terminal input and output streaming
- Copy/paste support

**Key Components**:
```typescript
<KuiTerminal />      // xterm.js wrapper
<XtermResponse />    // Terminal response container
```

**Communication**:
- Receives XtermResponse from **A05 Response Type Handler**
- Coordinates with **A14 Bash-like Agent** for shell features
- Uses **A16 Theme Agent** for terminal colors

**Quality Standards**:
- Support for full ANSI escape sequences
- Low latency streaming (< 10ms buffering)
- Memory efficient (bounded scroll buffer)
- Terminal resizing support

---

## Agent A14: Card Renderer Agent

**Scope**: Card-based resource views

**Location**: `packages/react/src/Content/Card/`

**Key Responsibilities**:
- Card layout rendering
- Resource metadata display
- Badge and status indicators
- Expandable sections
- Actions and buttons

**Key Components**:
```typescript
<Card />             // Generic card component
<CardHeader />       // Title and badges
<CardBody />         // Main content
<CardActions />      // Action buttons
```

**Communication**:
- Receives MultiModalResponse from **A05**
- Coordinates with **A21 kubectl Agent** for resource cards
- Uses **A16 Theme Agent** for styling

**Quality Standards**:
- Flexible layout system
- Responsive design
- Smooth transitions and animations
- Accessibility support

---

## Agent A15: Monaco Editor Agent

**Scope**: YAML/JSON editor integration

**Location**: `packages/react/src/Content/Editor/`

**Key Responsibilities**:
- Monaco editor integration
- YAML/JSON syntax highlighting
- Schema validation (Kubernetes resources)
- Autocompletion and IntelliSense
- Diff view for changes

**Key Components**:
```typescript
<Editor />           // Monaco wrapper
<YAMLEditor />       // YAML-specific editor
<DiffEditor />       // Side-by-side diff
```

**Communication**:
- Used by **A21 kubectl Agent** for resource editing
- Validates against **A22 Resource Schema Agent**
- Emits save events to **A21**

**Quality Standards**:
- Syntax highlighting for Kubernetes YAML
- Real-time validation errors
- Keyboard shortcuts (Cmd+S to save)
- Undo/redo support

---

## Agent A16: Theme System Agent

**Scope**: Theme management, CSS variables, styling

**Location**: `plugins/plugin-*-themes/`

**Key Responsibilities**:
- Theme registration and switching
- CSS variable management
- Light/dark mode support
- Custom theme support (Carbon, PatternFly)
- Component styling

**Supported Themes**:
- `plugin-core-themes` - Default Kui themes
- `plugin-carbon-themes` - IBM Carbon Design System
- `plugin-patternfly4-themes` - Red Hat PatternFly

**Communication**:
- Provides theme CSS to all UI agents (A11-A15)
- Responds to theme change events from **A11 Client Shell**
- Persists theme preference via **A61 Settings Agent**

**Quality Standards**:
- Theme switching without page reload
- CSS variable consistency
- High contrast mode support
- Print-friendly styles

---

## Agent A17: Layout Management Agent

**Scope**: Window layout, split views, resizing

**Location**: `packages/react/src/Content/SplitLayout/`

**Key Responsibilities**:
- Split view creation and management
- Resizable panes
- Layout persistence
- Maximize/minimize views

**Key Components**:
```typescript
<SplitLayout />      // Split pane container
<Resizer />          // Draggable divider
```

**Communication**:
- Used by **A11 Client Shell** for layout
- Persists layout via **A61 Settings Agent**
- Coordinates with **A51 Tauri Agent** for window bounds

**Quality Standards**:
- Smooth resize (no jank)
- Layout persistence across sessions
- Keyboard shortcuts for layout changes
- Mobile-responsive breakpoints

---

## Communication Patterns

### Pattern 1: Table Rendering Flow
```
A21 kubectl Agent (execute kubectl)
  ↓
A05 Response Type Handler (return Table)
  ↓
A11 Client Shell (dispatch to renderer)
  ↓
A12 Table Renderer (render table)
  ↓
User clicks row → A21 kubectl Agent (drilldown)
```

### Pattern 2: Theme Switching Flow
```
User clicks theme button
  ↓
A11 Client Shell (emit theme-change event)
  ↓
A16 Theme Agent (switch theme)
  ↓
A16 Theme Agent (apply CSS variables)
  ↓
A11-A15 UI Agents (re-render with new theme)
  ↓
A61 Settings Agent (persist theme choice)
```

### Pattern 3: Terminal Output Flow
```
Command executes (PTY process)
  ↓
A13 Terminal Renderer (stream output)
  ↓
xterm.js (render ANSI)
  ↓
User scrolls → A13 (handle scroll)
  ↓
User copies → A13 (clipboard)
```

## Testing Strategy

UI agents must have:
- **Component tests**: React component rendering
- **Visual regression tests**: Screenshot comparison
- **Accessibility tests**: ARIA, keyboard navigation
- **Performance tests**: Rendering large datasets
- **Browser compatibility**: Chrome, Firefox, Safari

## Development Guidelines

When modifying UI agents:
1. Follow React best practices (hooks, functional components)
2. Use TypeScript strict mode
3. Test in both light and dark themes
4. Verify keyboard navigation
5. Check accessibility with screen readers
6. Test with large datasets (10,000+ rows)
7. Verify in both Electron and browser modes
8. Follow existing component patterns
