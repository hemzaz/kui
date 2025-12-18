# Zed Terminal & Shell: Architecture Analysis for Kui

**Analysis Date**: 2025-12-17
**Purpose**: Extract useful patterns and features from Zed's terminal implementation to enhance Kui

## Executive Summary

Zed's terminal implementation offers several advanced features built on top of Alacritty that could significantly enhance Kui:

1. **Smart Hyperlinks** - Intelligent URL and path detection with file:line:column parsing
2. **Inline AI Assistant** - Terminal command generation and assistance
3. **Vi Mode** - Vim-style navigation in terminal output
4. **Embedded Terminal Mode** - Terminals with limited line display
5. **Block System** - Rich content blocks within terminal output

## 1. Terminal Core Architecture

### Base Implementation
```rust
// Uses Alacritty as the PTY backend
pub use alacritty_terminal;

pub struct Terminal {
    term: Arc<FairMutex<Term<ZedListener>>>,  // Alacritty terminal
    event_rx: UnboundedReceiver<AlacTermEvent>,
    internal_event_tx: Sender<InternalEvent>,
    internal_event_rx: Receiver<InternalEvent>,
    // ... state management
}
```

**Key Pattern**: Zed wraps Alacritty with event translation layer (`ZedListener`)
- **Benefit for Kui**: Similar pattern could improve pty integration
- **Current Kui**: Uses node-pty directly without sophisticated event handling

### Event System
```rust
pub enum Event {
    TitleChanged,
    BreadcrumbsChanged,
    CloseTerminal,
    Bell,
    Wakeup,
    BlinkChanged(bool),
    SelectionsChanged,
    NewNavigationTarget(Option<MaybeNavigationTarget>),
    Open(MaybeNavigationTarget),
}
```

**Adoption for Kui**:
- Add event-driven navigation target detection
- Implement breadcrumb system for terminal context
- Add bell notification support

## 2. Smart Hyperlink System ⭐⭐⭐⭐⭐

### URL Detection
```rust
const URL_REGEX: &str =
    r#"(ipfs:|ipns:|magnet:|mailto:|gemini://|gopher://|https://|http://|news:|file://|git://|ssh:|ftp://)[^\u{0000}-\u{001F}\u{007F}-\u{009F}<>"\s{-}\^⟨⟩`']+"#;
```

**Features**:
- Detects 13+ protocol types (HTTP, file://, git://, ssh://, etc.)
- Smart punctuation removal (trailing .,;:()  )
- Balanced parenthesis detection (e.g., `https://en.wikipedia.org/wiki/Example_(disambiguation)`)
- Percent-encoded URL support

### Path Hyperlink Detection ⭐⭐⭐⭐⭐

**This is incredibly sophisticated and useful for Kui!**

```rust
pub struct RegexSearches {
    url_regex: RegexSearch,
    path_hyperlink_regexes: Vec<Regex>,
    path_hyperlink_timeout: Duration,
}

// Default regexes detect common patterns:
const CARGO_DIR_REGEX: &str =
    r#"\s+(Compiling|Checking|Documenting) [^(]+\((?<link>(?<path>.+))\)"#;
const RUST_DIAGNOSTIC_REGEX: &str =
    r#"\s+(-->|:::|at) (?<link>(?<path>.+?))(:$|$)"#;

// Generic path patterns:
// /path/to/file.rs:42
// /path/to/file.rs(42)
// /path/to/file.rs:42:10
// /path/to/file.rs(42,10)
// File "/path/to/file.py", line 42
```

**Named Capture Groups**:
```rust
// Example: /path/to/file.rs:42:10
// Captures:
// - path: /path/to/file.rs
// - line: 42
// - column: 10
```

**Path Parsing**:
- Supports line numbers: `file.rs:42`
- Supports line+column: `file.rs:42:10` or `file.rs(42,10)`
- Handles quoted paths: `"file.rs:42"`, `'file.rs:42'`
- Handles brackets: `[file.rs:42]`, `(file.rs:42)`
- Windows paths: `C:\path\file.rs:42`
- UNC paths: `\\server\share\file.rs`
- file:// URLs converted to paths

**Performance**: Timeout protection for regex matching (default 1000ms)

### Recommendation for Kui ⭐⭐⭐⭐⭐

**Immediate value**: Implement this in Kui's kubectl plugin!

```typescript
// Example use cases in Kui:
// 1. kubectl logs output with stack traces
//    at com.example.MyClass.method(MyClass.java:142)
//    → Click to open MyClass.java:142

// 2. Compiler errors in kubectl exec sessions
//    main.go:45:10: undefined variable
//    → Click to open main.go at line 45, column 10

// 3. Python stack traces
//    File "/app/server.py", line 123
//    → Click to open server.py:123

// 4. Git output
//    modified: src/components/Table.tsx
//    → Click to open Table.tsx
```

**Implementation Path**:
1. Add `HyperlinkDetector` service to `@kui-shell/core`
2. Create regex library with common patterns (configurable)
3. Integrate into `XtermResponseCell` for clickable links
4. Use Tauri `window.open` or `shell.open` for file opening

## 3. Inline AI Assistant ⭐⭐⭐⭐⭐

**This is a game-changer for Kui's kubectl-ai integration!**

### Architecture
```rust
pub struct TerminalInlineAssistant {
    next_assist_id: TerminalInlineAssistId,
    assists: HashMap<TerminalInlineAssistId, TerminalInlineAssist>,
    prompt_history: VecDeque<String>,
    fs: Arc<dyn Fs>,
    prompt_builder: Arc<PromptBuilder>,
}

pub struct TerminalInlineAssist {
    terminal: Entity<TerminalView>,
    prompt_editor: Option<Entity<PromptEditor<TerminalCodegen>>>,
    codegen: Entity<TerminalCodegen>,
    workspace: WeakEntity<Workspace>,
    _subscriptions: Vec<Subscription>,
}
```

### Block System for Rich Content
```rust
pub struct BlockProperties {
    pub height: u8,
    pub render: Box<dyn Send + Fn(&mut BlockContext) -> AnyElement>,
}

// Renders inline prompt editor below cursor
let block = terminal_view::BlockProperties {
    height: 4,
    render: Box::new(move |_| prompt_editor_render.clone().into_any_element()),
};
terminal_view.set_block_below_cursor(block, window, cx);
```

**Key Features**:
1. **Inline Prompt Editor**: Appears below terminal cursor
2. **Context Awareness**: Default 50 lines of terminal history
3. **Prompt History**: Last 20 prompts cached for quick reuse
4. **Code Generation**: AI generates commands, user confirms before execution
5. **Streaming**: Real-time token streaming to terminal

### Terminal-Specific Events
```rust
pub enum PromptEditorEvent {
    StartRequested,      // User pressed Enter
    StopRequested,       // User pressed Ctrl+C
    ConfirmRequested { execute: bool },  // Accept and run
    CancelRequested,     // Escape pressed
    Resized { height_in_lines: u8 },     // Auto-resize
}
```

### Recommendation for Kui ⭐⭐⭐⭐⭐

**Current Kui kubectl-ai**: Separate sidebar with chat interface

**Zed Pattern Benefits**:
1. **Contextual**: AI prompt appears right where you're working
2. **Fast**: No context switching to sidebar
3. **Visual Feedback**: See command generation in place
4. **Safe**: Confirm before execution

**Implementation for Kui**:
```typescript
// Add to Terminal/Block component
interface InlineAssistantProps {
  terminalOutput: string[]  // Last 50 lines
  onGenerate: (prompt: string) => Promise<string>
  onConfirm: (command: string) => void
  onCancel: () => void
}

// Example use:
// User: Ctrl+Space (trigger AI)
// → Inline prompt appears below cursor
// User types: "create a deployment with nginx"
// → AI generates: kubectl create deployment nginx --image=nginx:latest
// → User sees preview, presses Enter to execute
```

**Integration with kubectl-ai**:
- Keep existing sidebar for long conversations
- Add inline assistant for quick commands
- Share prompt history between both interfaces
- Use same AI provider configuration

## 4. Terminal Modes

### Embedded Mode ⭐⭐⭐
```typescript
pub enum TerminalMode {
    Standalone,
    Embedded {
        max_lines_when_unfocused: Option<usize>,
    },
}

pub enum ContentMode {
    Scrollable,
    Inline {
        displayed_lines: usize,
        total_lines: usize,
    },
}
```

**Use Case**: Display terminal output inline with limited lines
- Expands to full view on focus
- Collapses when unfocused
- Max 1000 lines before falling back to scrollable

**Kui Application**:
- Notebook mode: Show command output inline
- Scratchpad: Collapsible command results
- Resource drilldown: Inline logs/describe output

## 5. Vi Mode ⭐⭐⭐

```rust
actions!(
    terminal,
    [
        ToggleViMode,
        // ... other actions
    ]
);

enum InternalEvent {
    ToggleViMode,
    ViMotion(ViMotion),
    MoveViCursorToAlacPoint(AlacPoint),
    // ...
}
```

**Features**:
- Navigate terminal output with vim keys (hjkl)
- Search with / and ?
- Visual selection with v
- Copy mode

**Kui Benefit**:
- Many Kubernetes users are vim users
- Enhances productivity for reviewing logs/output
- Better than mouse scrolling for large outputs

## 6. Advanced Scrolling

```rust
pub struct TerminalScrollHandle {
    scroll_position: f32,
    visible_rows: usize,
    total_rows: usize,
}

actions!(
    terminal,
    [
        ScrollLineUp,
        ScrollLineDown,
        ScrollPageUp,
        ScrollPageDown,
        ScrollHalfPageUp,
        ScrollHalfPageDown,
        ScrollToTop,
        ScrollToBottom,
    ]
);
```

**Kui Current**: Basic xterm.js scrolling
**Zed Enhancement**: Fine-grained scroll control with keyboard shortcuts

## 7. Search Functionality ⭐⭐⭐⭐

```rust
impl SearchableItem for TerminalView {
    fn search(&mut self, query: &SearchQuery, cx: &mut Context<Self>) -> Task<()> {
        // Regex search in terminal buffer
        // Highlight matches
        // Navigate between matches with n/N
    }
}
```

**Features**:
- Regex search in terminal history
- Case sensitivity toggle
- Whole word matching
- Navigate matches with keyboard

**Kui Application**:
- Search kubectl logs for errors
- Find specific events in describe output
- Search for pod names in get output

## 8. Selection & Copy Improvements

```rust
pub struct Selection {
    region: SelectionRange,
    ty: SelectionType,  // Simple, Block, Semantic
}

// Semantic selection: double-click on path selects entire path
// Block selection: column selection with Alt+drag
```

**Kui Benefit**:
- Better log copying
- Path selection for quick opening
- Column selection for tabular data (like kubectl get)

## 9. Breadcrumbs System ⭐⭐⭐

```rust
pub enum Event {
    BreadcrumbsChanged,
    // ...
}

impl Item for TerminalView {
    fn breadcrumb_text(&self, cx: &App) -> Option<BreadcrumbText> {
        // Show current directory or task name
        self.terminal.read(cx).cwd()
    }
}
```

**Kui Application**:
- Show current namespace in kubectl context
- Display current cluster
- Show working directory in bash-like plugin

## 10. Performance Optimizations

### Lazy Rendering
```rust
// Only render visible lines
let visible_range = scroll_position..(scroll_position + viewport_height);
for line in visible_range {
    render_line(line);
}
```

### Efficient Updates
```rust
// Delta updates instead of full redraws
pub enum TerminalUpdate {
    AddedLines(Vec<Line>),
    ModifiedLines(Vec<(usize, Line)>),
    Scrolled(isize),
}
```

**Kui Benefit**:
- Better performance for large log outputs
- Smoother scrolling
- Lower memory usage

## Implementation Roadmap for Kui

### Phase 1: Quick Wins (1-2 weeks)
1. ✅ **Smart Hyperlinks** - Add URL and path detection
   - Implement `HyperlinkDetector` service
   - Add configurable regex patterns
   - Integrate with xterm.js link detection
   - Enable click-to-open for paths with line numbers

2. ⭐ **Inline AI Assistant** - Add below-cursor prompt editor
   - Create `InlineAssistant` component
   - Integrate with existing kubectl-ai
   - Add keyboard shortcut (Ctrl+Space)
   - Share prompt history

### Phase 2: Enhanced UX (2-3 weeks)
3. **Vi Mode** - Add vim navigation to terminal
   - Integrate alacritty vi-mode concepts
   - Add keyboard shortcuts
   - Add visual mode for selection

4. **Advanced Search** - Regex search in terminal
   - Add search UI overlay
   - Implement match navigation
   - Add search history

### Phase 3: Advanced Features (3-4 weeks)
5. **Embedded Terminal Mode** - Collapsible terminals
   - Add inline/scrollable modes
   - Implement auto-expand on focus
   - Use in notebook mode

6. **Breadcrumbs** - Context display
   - Show kubectl context
   - Display namespace
   - Current directory indicator

### Phase 4: Polish (1-2 weeks)
7. **Performance** - Lazy rendering and delta updates
8. **Semantic Selection** - Smart double-click selection
9. **Block System** - Rich content blocks in terminal

## Code Reuse Opportunities

### 1. Hyperlink Detection (Direct Port)

Zed's hyperlink detection is pure Rust with no Zed-specific dependencies. Could create:

```rust
// src-tauri/src/hyperlinks.rs
pub struct HyperlinkDetector {
    url_regex: Regex,
    path_regexes: Vec<Regex>,
}

#[tauri::command]
pub async fn detect_hyperlinks(
    text: String,
    cursor_pos: usize,
) -> Result<Option<Hyperlink>, String> {
    // Port Zed's find_from_grid_point logic
}

pub struct Hyperlink {
    pub text: String,
    pub is_url: bool,
    pub line: Option<u32>,
    pub column: Option<u32>,
    pub range: (usize, usize),
}
```

### 2. Terminal Events (Adapt Pattern)

```typescript
// packages/core/src/terminal/events.ts
export enum TerminalEvent {
  TitleChanged = 'title-changed',
  NavigationTarget = 'navigation-target',
  ContextChanged = 'context-changed',
  Bell = 'bell',
}

export type NavigationTarget =
  | { type: 'url', url: string }
  | { type: 'path', path: string, line?: number, column?: number }
  | { type: 'kubernetes', kind: string, name: string }
```

### 3. AI Assistant Component

```typescript
// plugins/plugin-client-common/src/components/Terminal/InlineAssistant.tsx
export const InlineAssistant: React.FC<{
  onGenerate: (prompt: string) => Promise<string>
  onConfirm: (command: string) => void
  onCancel: () => void
  history: string[]
}> = ({ onGenerate, onConfirm, onCancel, history }) => {
  // Floating prompt editor below cursor
  // Auto-resize based on content
  // Show generated command with preview
  // Keyboard shortcuts: Enter (confirm), Escape (cancel), Ctrl+C (stop)
}
```

## Testing Strategy

1. **Hyperlink Detection**:
   - Test suite with 100+ path/URL patterns (port from Zed)
   - Edge cases: balanced parens, trailing punctuation, wide chars
   - Performance: timeout protection for complex regexes

2. **AI Assistant**:
   - User flow: trigger → prompt → generate → confirm → execute
   - Error handling: network failures, invalid commands
   - Context passing: verify terminal history included

3. **Vi Mode**:
   - Keyboard navigation: hjkl, gg, G, w, b, etc.
   - Search: /, ?, n, N
   - Visual mode: v, V, y (yank)

## Security Considerations

1. **Hyperlink Validation**:
   - Sanitize file paths before opening
   - Validate URLs before browser launch
   - Prevent directory traversal attacks

2. **AI Command Generation**:
   - Always require user confirmation
   - Show full command before execution
   - Warn on destructive operations (delete, remove, etc.)
   - Rate limiting on AI requests

3. **Regex Performance**:
   - Timeout protection (max 1000ms per search)
   - Limit number of custom regexes
   - Validate regex patterns before use

## Performance Benchmarks (from Zed)

```rust
// Path hyperlink detection benchmarks:
// cargo_hyperlink_benchmark: ~50μs per line (500 lines)
// rust_hyperlink_benchmark: ~75μs per line
// ls_hyperlink_benchmark: ~40μs per line

// Total: ~25-37ms for 500-line output
// Impact: Negligible, but timeout protection essential
```

**Recommendation**: Adopt timeout pattern for Kui regex searches

## Conclusion

### Must-Have Features ⭐⭐⭐⭐⭐
1. **Smart Hyperlinks** - Immediate productivity boost for developers
2. **Inline AI Assistant** - Natural enhancement to kubectl-ai
3. **Path Detection with line:column** - Essential for error navigation

### Nice-to-Have Features ⭐⭐⭐
4. Vi Mode - Power user feature
5. Advanced Search - Quality of life improvement
6. Breadcrumbs - Better context awareness

### Future Considerations ⭐⭐
7. Embedded Terminal Mode - Depends on notebook roadmap
8. Block System - Complex, evaluate ROI
9. Semantic Selection - Polish feature

## Next Steps

1. **Create PoC**: Smart hyperlink detection in Tauri
2. **Design**: Inline AI assistant UI mockup
3. **Prototype**: Path detection with regex library
4. **Integrate**: Add to kubectl-ai plugin
5. **Test**: User feedback on inline assistant vs sidebar

## References

- Zed Terminal: `/Users/elad/PROJ/zed/crates/terminal/`
- Zed Terminal View: `/Users/elad/PROJ/zed/crates/terminal_view/`
- Zed AI Integration: `/Users/elad/PROJ/zed/crates/agent_ui/src/terminal_inline_assistant.rs`
- Alacritty Terminal: https://github.com/alacritty/alacritty
- Kui Terminal: `/Users/elad/PROJ/kui/plugins/plugin-client-common/src/components/Views/Terminal/`
- Kui kubectl-ai: `/Users/elad/PROJ/kui/plugins/plugin-kubectl-ai/`

---

**Analysis by**: Claude Code (Sonnet 4.5)
**Date**: 2025-12-17
**Kui Version**: v13.x (Tauri-based)
**Zed Version**: Latest main branch
