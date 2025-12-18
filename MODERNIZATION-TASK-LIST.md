# Kui Shell Modernization - Complete Task List

**Target**: 100% Modernization Implementation
**Platform**: macOS Apple Silicon (M1+)
**Estimated Timeline**: 4-6 months
**Status**: 📋 Ready to Execute

---

## Progress Tracking

```
Phase 1: Foundation        [██████████] 100% (12/12 tasks) ✅ COMPLETE
Phase 2: AI Integration    [█████░░░░░]  56% (5/9 tasks)  🚧 IN PROGRESS
Phase 3: Advanced Features [░░░░░░░░░░]   0% (0/11 tasks) 📋 READY
Phase 4: Polish           [░░░░░░░░░░]   0% (0/8 tasks)  📋 PENDING

TOTAL: [█████░░░░░] 40% (17/42 tasks)
```

**Last Updated**: 2025-12-17
**Phase 1 Completion Date**: 2025-12-17
**Phase 2 Partial Completion**: 2025-12-17 (Tasks 2.1.1 - 2.1.5)
**Status**: Phase 2 in progress, Phase 3 ready to start

---

## 🔴 PHASE 1: FOUNDATION (Weeks 1-8)

**Goal**: Modern React architecture, performance optimization, clean codebase

### 1.1 React Hooks Migration (Weeks 1-4)

#### Task 1.1.1: Convert Block Component to Hooks
**Priority**: 🔴 CRITICAL
**Effort**: 2-3 days
**Files**: `plugins/plugin-client-common/src/components/Views/Terminal/Block/index.tsx`

**Subtasks**:
- [ ] Create new `BlockHooks.tsx` with function component
- [ ] Convert state to `useState` hooks
- [ ] Replace lifecycle methods with `useEffect`
- [ ] Convert refs to `useRef`
- [ ] Use `useCallback` for event handlers
- [ ] Use `useMemo` for computed values
- [ ] Add `React.memo` for optimization
- [ ] Update tests
- [ ] Performance benchmark (before/after)
- [ ] Replace old Block.tsx with BlockHooks.tsx

**Success Criteria**:
- ✅ Code reduced by 40-50% (262 lines → ~120 lines)
- ✅ All tests passing
- ✅ No performance regression
- ✅ Component re-render count reduced

**Dependencies**: None

---

#### Task 1.1.2: Convert Input Component to Hooks
**Priority**: 🔴 CRITICAL
**Effort**: 3-4 days
**Files**: `plugins/plugin-client-common/src/components/Views/Terminal/Block/Input.tsx`

**Subtasks**:
- [ ] Analyze current Input component (800+ lines)
- [ ] Extract custom hooks:
  - [ ] `useTabCompletion` - tab completion logic
  - [ ] `useCommandHistory` - history navigation
  - [ ] `useKeyboardHandlers` - keyboard event handling
  - [ ] `useAutoFocus` - focus management
- [ ] Convert class component to function component
- [ ] Replace state with hooks
- [ ] Use `useImperativeHandle` for parent communication
- [ ] Optimize re-renders with `useMemo`/`useCallback`
- [ ] Update tests
- [ ] Performance benchmark

**Success Criteria**:
- ✅ Code reduced by 30-40% (~800 lines → ~500 lines)
- ✅ Custom hooks are reusable
- ✅ All keyboard shortcuts working
- ✅ Tab completion functional

**Dependencies**: Task 1.1.1

---

#### Task 1.1.3: Convert Output Component to Hooks
**Priority**: 🔴 CRITICAL
**Effort**: 2-3 days
**Files**: `plugins/plugin-client-common/src/components/Views/Terminal/Block/Output.tsx`

**Subtasks**:
- [ ] Analyze streaming output logic
- [ ] Create `useStreamingConsumer` hook
- [ ] Convert class to function component
- [ ] Use `useEffect` for stream subscriptions
- [ ] Handle cleanup properly
- [ ] Test streaming with large outputs
- [ ] Performance benchmark

**Success Criteria**:
- ✅ Streaming works correctly
- ✅ No memory leaks
- ✅ Cleanup on unmount
- ✅ Performance maintained

**Dependencies**: Task 1.1.1

---

#### Task 1.1.4: Convert Editor Component to Hooks
**Priority**: 🟡 HIGH
**Effort**: 2-3 days
**Files**: `plugins/plugin-client-common/src/components/Content/Editor/index.tsx`

**Subtasks**:
- [ ] Analyze Monaco integration
- [ ] Create `useMonacoEditor` hook
- [ ] Convert class to function component
- [ ] Handle editor lifecycle with `useEffect`
- [ ] Use `useRef` for editor instance
- [ ] Test all editor features
- [ ] Performance benchmark

**Success Criteria**:
- ✅ Monaco integration working
- ✅ All editor features functional
- ✅ Proper cleanup

**Dependencies**: None

---

### 1.2 Virtual Scrolling Implementation (Weeks 3-4)

#### Task 1.2.1: Add Virtual Scrolling to Table Component
**Priority**: 🔴 CRITICAL
**Effort**: 3-4 days
**Files**: `plugins/plugin-client-common/src/components/Content/Table/`

**Subtasks**:
- [ ] Install `@tanstack/react-virtual`
- [ ] Create `VirtualTableBody` component
- [ ] Implement virtualizer with `useVirtualizer`
- [ ] Calculate row heights (fixed or dynamic)
- [ ] Add overscan configuration
- [ ] Handle selection with virtual rows
- [ ] Test with large datasets (1K, 5K, 10K, 50K rows)
- [ ] Performance benchmarks
- [ ] Update documentation

**Success Criteria**:
- ✅ 5000 rows render in <100ms (currently 3-5s)
- ✅ Smooth scrolling at 60 FPS
- ✅ Memory usage reduced by 70%+
- ✅ Selection works correctly

**Dependencies**: None

**Code Example**:
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualTableBody({ rows }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10
  })

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => {
          const row = rows[virtualRow.index]
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '48px',
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              <TableRow row={row} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

**Dependencies**: None

---

#### Task 1.2.2: Add Virtual Scrolling to Terminal Scrollback
**Priority**: 🟡 HIGH
**Effort**: 2-3 days
**Files**: `plugins/plugin-client-common/src/components/Views/Terminal/ScrollableTerminal.tsx`

**Subtasks**:
- [ ] Analyze current scrollback implementation
- [ ] Implement virtual scrolling for blocks
- [ ] Handle variable-height blocks
- [ ] Maintain scroll position on new output
- [ ] Test with 1000+ commands in history
- [ ] Performance benchmark

**Success Criteria**:
- ✅ Smooth scrolling with large history
- ✅ Memory usage reduced
- ✅ Scroll position maintained

**Dependencies**: Task 1.2.1

---

### 1.3 State Management with Zustand (Weeks 5-6)

#### Task 1.3.1: Setup Zustand Store
**Priority**: 🟡 HIGH
**Effort**: 2 days

**Subtasks**:
- [ ] Install `zustand` and middleware
- [ ] Create main store structure
- [ ] Define state slices:
  - [ ] `tabsSlice` - tab management
  - [ ] `historySlice` - command history
  - [ ] `settingsSlice` - user settings
  - [ ] `aiSlice` - AI provider state
- [ ] Add persistence middleware
- [ ] Add devtools middleware
- [ ] Write unit tests

**Success Criteria**:
- ✅ Store structure defined
- ✅ DevTools working
- ✅ Persistence working

**Dependencies**: None

**Code Example**:
```typescript
// store.ts
import create from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface ShellStore {
  // State
  tabs: Tab[]
  activeTabId: string
  history: Command[]
  settings: Settings
  aiProvider: AIProvider | null

  // Computed
  activeTab: () => Tab | undefined
  recentCommands: () => Command[]

  // Actions
  createTab: () => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  executeCommand: (cmd: string) => Promise<void>
  updateSettings: (settings: Partial<Settings>) => void
  setAIProvider: (provider: AIProvider) => void
}

export const useShellStore = create<ShellStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        tabs: [createDefaultTab()],
        activeTabId: '',
        history: [],
        settings: loadSettings(),
        aiProvider: null,

        // Computed
        activeTab: () => {
          const state = get()
          return state.tabs.find(t => t.id === state.activeTabId)
        },

        recentCommands: () => {
          return get().history.slice(-50)
        },

        // Actions
        createTab: () => set(state => ({
          tabs: [...state.tabs, createNewTab()]
        })),

        closeTab: (id) => set(state => {
          const newTabs = state.tabs.filter(t => t.id !== id)
          return {
            tabs: newTabs,
            activeTabId: state.activeTabId === id
              ? newTabs[0]?.id
              : state.activeTabId
          }
        }),

        setActiveTab: (id) => set({ activeTabId: id }),

        executeCommand: async (cmd) => {
          const tab = get().activeTab()
          const result = await exec(cmd, { tab })

          set(state => ({
            history: [...state.history, {
              command: cmd,
              result,
              timestamp: Date.now(),
              tabId: tab.id
            }]
          }))
        },

        updateSettings: (newSettings) => set(state => ({
          settings: { ...state.settings, ...newSettings }
        })),

        setAIProvider: (provider) => set({ aiProvider: provider })
      }),
      { name: 'kui-shell' }
    )
  )
)
```

**Dependencies**: None

---

#### Task 1.3.2: Migrate Context to Zustand
**Priority**: 🟡 HIGH
**Effort**: 3-4 days

**Subtasks**:
- [ ] Identify all Context usage
- [ ] Migrate TabContext to store
- [ ] Migrate HistoryContext to store
- [ ] Migrate SettingsContext to store
- [ ] Update all components to use hooks
- [ ] Remove old Context providers
- [ ] Test thoroughly

**Success Criteria**:
- ✅ All Context removed
- ✅ Components use store hooks
- ✅ No breaking changes
- ✅ Performance improved

**Dependencies**: Task 1.3.1

---

### 1.4 Monaco Editor Upgrade (Week 7)

#### Task 1.4.1: Upgrade Monaco to v0.52
**Priority**: 🟡 HIGH
**Effort**: 2-3 days

**Subtasks**:
- [ ] Update package.json dependencies
- [ ] Update Monaco imports
- [ ] Update webpack configuration
- [ ] Test YAML/JSON editing
- [ ] Test syntax highlighting
- [ ] Test auto-completion
- [ ] Update documentation

**Success Criteria**:
- ✅ Monaco v0.52 working
- ✅ All features functional
- ✅ New features available

**Dependencies**: Task 1.1.4

---

#### Task 1.4.2: Add Modern Monaco Features
**Priority**: 🟢 MEDIUM
**Effort**: 2-3 days

**Subtasks**:
- [ ] Enable sticky scroll
- [ ] Enable inline diff view
- [ ] Improve YAML schema validation
- [ ] Add bracket pair colorization
- [ ] Configure semantic highlighting
- [ ] Test all features

**Success Criteria**:
- ✅ New features working
- ✅ Better editing experience

**Dependencies**: Task 1.4.1

---

### 1.5 Testing Infrastructure (Week 8)

#### Task 1.5.1: Setup Vitest
**Priority**: 🟡 HIGH
**Effort**: 1-2 days

**Subtasks**:
- [ ] Install Vitest
- [ ] Configure vitest.config.ts
- [ ] Setup test utilities
- [ ] Migrate Jest tests to Vitest
- [ ] Add coverage reporting
- [ ] Integrate with CI

**Success Criteria**:
- ✅ Vitest running
- ✅ Tests faster than Jest
- ✅ Coverage reports

**Dependencies**: None

---

#### Task 1.5.2: Add Component Tests
**Priority**: 🟡 HIGH
**Effort**: 3-4 days

**Subtasks**:
- [ ] Install Testing Library
- [ ] Write tests for Block components
- [ ] Write tests for Input components
- [ ] Write tests for Table components
- [ ] Achieve 80% coverage
- [ ] Add snapshot tests

**Success Criteria**:
- ✅ 80%+ code coverage
- ✅ All critical paths tested

**Dependencies**: Task 1.5.1

---

## 🟡 PHASE 2: AI INTEGRATION (Weeks 9-16)

**Goal**: Intelligent command assistance, smart history, AI-powered features

### 2.1 Command Palette (Weeks 9-10) 🆕 FEATURED TASK

#### Task 2.1.1: Create Picker Infrastructure
**Priority**: 🔴 CRITICAL
**Effort**: 3-4 days
**Inspired by**: Zed's picker architecture

**Subtasks**:
- [ ] Create generic Picker component
- [ ] Implement PickerDelegate interface
- [ ] Add fuzzy search with `fuse.js`
- [ ] Implement keyboard navigation (↑↓ Enter Esc)
- [ ] Add selection highlight
- [ ] Style picker UI
- [ ] Write unit tests

**Files to Create**:
```
packages/core/src/components/Picker/
├── Picker.tsx                 # Main picker component
├── PickerDelegate.ts          # Delegate interface
├── PickerInput.tsx            # Search input
├── PickerList.tsx             # Results list
└── styles.scss                # Picker styles
```

**Code Structure** (Based on Zed):
```typescript
// Picker.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react'
import Fuse from 'fuse.js'

export interface PickerDelegate<T> {
  // Required methods
  matchCount(): number
  selectedIndex(): number
  setSelectedIndex(index: number): void

  // Data methods
  placeholderText(): string
  noMatchesText(): string
  updateMatches(query: string): Promise<void>

  // Action methods
  confirm(item: T, secondary: boolean): void
  dismissed(): void

  // Rendering
  renderItem(item: T, index: number): React.ReactElement
}

interface PickerProps<T> {
  delegate: PickerDelegate<T>
  items: T[]
  width?: number
  maxHeight?: number
  onDismiss?: () => void
}

export function Picker<T>({ delegate, items, ...props }: PickerProps<T>) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [matches, setMatches] = useState<T[]>(items)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fuzzy search
  const fuse = useRef(new Fuse(items, {
    keys: ['name', 'description'],
    threshold: 0.3,
    includeMatches: true
  }))

  const updateMatches = useCallback(async (query: string) => {
    if (!query) {
      setMatches(items)
      return
    }

    const results = fuse.current.search(query)
    const matchedItems = results.map(r => r.item)
    setMatches(matchedItems)
    setSelectedIndex(0)

    await delegate.updateMatches(query)
  }, [items, delegate])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, matches.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (matches[selectedIndex]) {
          delegate.confirm(matches[selectedIndex], e.shiftKey)
        }
        break
      case 'Escape':
        e.preventDefault()
        delegate.dismissed()
        break
    }
  }, [matches, selectedIndex, delegate])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    updateMatches(query)
  }, [query, updateMatches])

  return (
    <div className="kui-picker" style={{ width: props.width || 544 }}>
      <div className="kui-picker-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={delegate.placeholderText()}
          className="kui-picker-input"
        />
      </div>
      <div className="kui-picker-results" style={{ maxHeight: props.maxHeight || 400 }}>
        {matches.length === 0 ? (
          <div className="kui-picker-no-matches">
            {delegate.noMatchesText()}
          </div>
        ) : (
          <ul className="kui-picker-list">
            {matches.map((item, index) => (
              <li
                key={index}
                className={`kui-picker-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedIndex(index)
                  delegate.confirm(item, false)
                }}
              >
                {delegate.renderItem(item, index)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
```

**Success Criteria**:
- ✅ Picker component reusable
- ✅ Keyboard navigation working
- ✅ Fuzzy search functional
- ✅ Clean, maintainable code

**Dependencies**: None

---

#### Task 2.1.2: Implement Command Palette Delegate
**Priority**: 🔴 CRITICAL
**Effort**: 3-4 days

**Subtasks**:
- [ ] Create CommandPaletteDelegate class
- [ ] Collect all available commands
- [ ] Implement command categorization:
  - [ ] kubectl commands
  - [ ] AI commands
  - [ ] Navigation commands
  - [ ] Settings commands
  - [ ] Recent resources
- [ ] Add command icons
- [ ] Implement command execution
- [ ] Add keyboard shortcuts display

**Files to Create**:
```
packages/core/src/components/CommandPalette/
├── CommandPalette.tsx            # Main component
├── CommandPaletteDelegate.ts     # Delegate implementation
├── commands.ts                   # Command registry
└── styles.scss
```

**Code Structure**:
```typescript
// CommandPaletteDelegate.ts
import { PickerDelegate } from '../Picker/PickerDelegate'
import { exec } from '../../repl/exec'

export interface Command {
  id: string
  name: string
  description?: string
  category: CommandCategory
  icon?: string
  keyBinding?: string
  action: () => void | Promise<void>
}

export enum CommandCategory {
  Navigation = 'navigation',
  Kubectl = 'kubectl',
  AI = 'ai',
  Settings = 'settings',
  Recent = 'recent'
}

export class CommandPaletteDelegate implements PickerDelegate<Command> {
  private commands: Command[]
  private matches: Command[]
  private selectedIndex: number = 0
  private hitCounts: Map<string, number> = new Map()

  constructor(commands: Command[]) {
    this.commands = this.sortByFrequency(commands)
    this.matches = this.commands
    this.loadHitCounts()
  }

  matchCount(): number {
    return this.matches.length
  }

  selectedIndex(): number {
    return this.selectedIndex
  }

  setSelectedIndex(index: number): void {
    this.selectedIndex = Math.max(0, Math.min(index, this.matches.length - 1))
  }

  placeholderText(): string {
    return 'Type a command or search...'
  }

  noMatchesText(): string {
    return 'No commands found'
  }

  async updateMatches(query: string): Promise<void> {
    // Matches are already filtered by Picker's fuzzy search
    // Here we can do additional ranking based on hit counts
    this.matches = this.sortByFrequency(this.matches)
  }

  confirm(command: Command, secondary: boolean): void {
    // Record usage
    this.incrementHitCount(command.id)

    // Execute command
    command.action()
  }

  dismissed(): void {
    // Cleanup if needed
  }

  renderItem(command: Command, index: number): React.ReactElement {
    return (
      <div className="kui-command-palette-item">
        {command.icon && <span className="item-icon">{command.icon}</span>}
        <div className="item-content">
          <div className="item-name">{command.name}</div>
          {command.description && (
            <div className="item-description">{command.description}</div>
          )}
        </div>
        {command.keyBinding && (
          <div className="item-keybinding">
            <KeyBinding binding={command.keyBinding} />
          </div>
        )}
        <div className="item-category">{command.category}</div>
      </div>
    )
  }

  private sortByFrequency(commands: Command[]): Command[] {
    return commands.sort((a, b) => {
      const aCount = this.hitCounts.get(a.id) || 0
      const bCount = this.hitCounts.get(b.id) || 0
      return bCount - aCount
    })
  }

  private loadHitCounts(): void {
    // Load from persistent storage (Tauri)
    const stored = localStorage.getItem('kui-command-hit-counts')
    if (stored) {
      this.hitCounts = new Map(JSON.parse(stored))
    }
  }

  private incrementHitCount(commandId: string): void {
    const current = this.hitCounts.get(commandId) || 0
    this.hitCounts.set(commandId, current + 1)

    // Persist
    localStorage.setItem(
      'kui-command-hit-counts',
      JSON.stringify(Array.from(this.hitCounts.entries()))
    )
  }
}
```

**Success Criteria**:
- ✅ All commands registered
- ✅ Commands categorized
- ✅ Execution working
- ✅ Hit counting working

**Dependencies**: Task 2.1.1

---

#### Task 2.1.3: Add Command Palette Persistence (Tauri SQLite)
**Priority**: 🟡 HIGH
**Effort**: 2-3 days
**Inspired by**: Zed's persistence layer

**Subtasks**:
- [ ] Create Tauri command for SQLite operations
- [ ] Create schema for command history
- [ ] Implement write_command_invocation
- [ ] Implement get_command_usage
- [ ] Implement list_recent_queries
- [ ] Add cleanup for old entries (max 1000)

**Files to Create**:
```
src-tauri/src/
├── command_palette.rs          # Command palette backend
└── db.rs                       # SQLite utilities
```

**Rust Code** (Based on Zed):
```rust
// src-tauri/src/command_palette.rs
use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandInvocation {
    pub command_name: String,
    pub user_query: String,
    pub timestamp: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CommandUsage {
    pub command_name: String,
    pub invocations: u32,
    pub last_invoked: i64,
}

pub struct CommandPaletteDB {
    conn: Connection,
}

impl CommandPaletteDB {
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let conn = Connection::open(db_path)?;

        // Create table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS command_invocations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                command_name TEXT NOT NULL,
                user_query TEXT NOT NULL,
                timestamp INTEGER NOT NULL DEFAULT (unixepoch())
            )",
            [],
        )?;

        // Create index for performance
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_command_name
             ON command_invocations(command_name)",
            [],
        )?;

        Ok(Self { conn })
    }

    pub fn write_command_invocation(
        &self,
        command_name: &str,
        user_query: &str,
    ) -> Result<()> {
        self.conn.execute(
            "INSERT INTO command_invocations (command_name, user_query) VALUES (?1, ?2)",
            params![command_name, user_query],
        )?;

        // Keep only last 1000 entries
        self.conn.execute(
            "DELETE FROM command_invocations WHERE id IN (
                SELECT MIN(id) FROM command_invocations HAVING COUNT(1) > 1000
            )",
            [],
        )?;

        Ok(())
    }

    pub fn get_command_usage(&self, command_name: &str) -> Result<Option<CommandUsage>> {
        let mut stmt = self.conn.prepare(
            "SELECT command_name, COUNT(1), MAX(timestamp)
             FROM command_invocations
             WHERE command_name = ?1
             GROUP BY command_name"
        )?;

        let mut rows = stmt.query(params![command_name])?;

        if let Some(row) = rows.next()? {
            Ok(Some(CommandUsage {
                command_name: row.get(0)?,
                invocations: row.get(1)?,
                last_invoked: row.get(2)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn list_commands_used(&self) -> Result<Vec<CommandUsage>> {
        let mut stmt = self.conn.prepare(
            "SELECT command_name, COUNT(1), MAX(timestamp)
             FROM command_invocations
             GROUP BY command_name
             ORDER BY COUNT(1) DESC"
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(CommandUsage {
                command_name: row.get(0)?,
                invocations: row.get(1)?,
                last_invoked: row.get(2)?,
            })
        })?;

        rows.collect()
    }

    pub fn list_recent_queries(&self) -> Result<Vec<String>> {
        let mut stmt = self.conn.prepare(
            "SELECT DISTINCT user_query
             FROM command_invocations
             WHERE user_query != ''
             ORDER BY MAX(timestamp) DESC
             LIMIT 50"
        )?;

        let rows = stmt.query_map([], |row| row.get(0))?;
        rows.collect()
    }
}

// Tauri commands
#[tauri::command]
pub async fn record_command_invocation(
    command_name: String,
    user_query: String,
) -> Result<(), String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let db = CommandPaletteDB::new(db_path).map_err(|e| e.to_string())?;
    db.write_command_invocation(&command_name, &user_query)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_command_stats() -> Result<Vec<CommandUsage>, String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let db = CommandPaletteDB::new(db_path).map_err(|e| e.to_string())?;
    db.list_commands_used().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_recent_queries() -> Result<Vec<String>, String> {
    let db_path = get_db_path().map_err(|e| e.to_string())?;
    let db = CommandPaletteDB::new(db_path).map_err(|e| e.to_string())?;
    db.list_recent_queries().map_err(|e| e.to_string())
}

fn get_db_path() -> Result<PathBuf, Box<dyn std::error::Error>> {
    let mut path = dirs::data_local_dir()
        .ok_or("Could not find data directory")?;
    path.push("kui");
    path.push("command-palette.db");

    // Ensure directory exists
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    Ok(path)
}
```

**Register in `src-tauri/src/main.rs`**:
```rust
mod command_palette;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            command_palette::record_command_invocation,
            command_palette::get_command_stats,
            command_palette::get_recent_queries,
            // ... other commands
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**TypeScript Integration**:
```typescript
// packages/core/src/main/tauri-command-palette.ts
import { invoke } from '@tauri-apps/api/core'

export interface CommandUsage {
  command_name: string
  invocations: number
  last_invoked: number
}

export async function recordCommandInvocation(
  commandName: string,
  userQuery: string
): Promise<void> {
  await invoke('record_command_invocation', {
    commandName,
    userQuery
  })
}

export async function getCommandStats(): Promise<CommandUsage[]> {
  return await invoke('get_command_stats')
}

export async function getRecentQueries(): Promise<string[]> {
  return await invoke('get_recent_queries')
}
```

**Success Criteria**:
- ✅ SQLite database created
- ✅ Commands persisted correctly
- ✅ Usage statistics accurate
- ✅ Recent queries retrieved

**Dependencies**: Task 2.1.2

---

#### Task 2.1.4: Add Recent Resources to Command Palette
**Priority**: 🟡 HIGH
**Effort**: 2 days

**Subtasks**:
- [ ] Track recently viewed resources
- [ ] Add to command palette as "Recent" category
- [ ] Show resource type and namespace
- [ ] Implement quick navigation
- [ ] Add keyboard shortcut (Cmd+E)

**Success Criteria**:
- ✅ Recent resources shown
- ✅ Navigation working
- ✅ MRU (most recently used) sorting

**Dependencies**: Task 2.1.2

---

#### Task 2.1.5: Integrate with Keyboard Shortcuts
**Priority**: 🟡 HIGH
**Effort**: 1-2 days

**Subtasks**:
- [ ] Add global Cmd+K shortcut
- [ ] Add category-specific shortcuts:
  - [ ] Cmd+Shift+P - Go to Pod
  - [ ] Cmd+Shift+D - Go to Deployment
  - [ ] Cmd+Shift+S - Go to Service
  - [ ] Cmd+Shift+N - Switch Namespace
  - [ ] Cmd+Shift+A - Ask AI
- [ ] Update documentation
- [ ] Add shortcut hints to UI

**Success Criteria**:
- ✅ All shortcuts working
- ✅ No conflicts with existing shortcuts
- ✅ Documentation updated

**Dependencies**: Task 2.1.2

---

### 2.2 Smart Command History (Weeks 11-12)

#### Task 2.2.1: Implement Pattern Detection
**Priority**: 🟡 HIGH
**Effort**: 3-4 days

**Subtasks**:
- [ ] Create history analysis engine
- [ ] Detect command sequences
- [ ] Calculate pattern confidence
- [ ] Store patterns in SQLite
- [ ] Test with real usage data

**Success Criteria**:
- ✅ Patterns detected accurately
- ✅ Confidence scores reasonable
- ✅ Patterns persisted

**Dependencies**: Task 2.1.3

---

#### Task 2.2.2: AI-Powered Suggestions
**Priority**: 🟡 HIGH
**Effort**: 2-3 days

**Subtasks**:
- [ ] Integrate with kubectl-ai provider
- [ ] Generate suggestions based on:
  - [ ] Last command
  - [ ] Detected patterns
  - [ ] Current context (namespace, cluster)
  - [ ] AI analysis
- [ ] Show suggestions in UI
- [ ] Add confidence indicators

**Success Criteria**:
- ✅ Suggestions relevant
- ✅ AI integration working
- ✅ Good UX

**Dependencies**: Task 2.2.1

---

#### Task 2.2.3: Fuzzy History Search (fzf-style)
**Priority**: 🟡 HIGH
**Effort**: 2 days

**Subtasks**:
- [ ] Install fuse.js for fuzzy matching
- [ ] Create search UI (Ctrl+R)
- [ ] Implement real-time filtering
- [ ] Show match highlights
- [ ] Test with large history

**Success Criteria**:
- ✅ Fast fuzzy search
- ✅ Match highlighting working
- ✅ Good keyboard UX

**Dependencies**: Task 2.2.1

---

### 2.3 AI-Enhanced Monaco Editor (Weeks 13-14)

#### Task 2.3.1: Implement AI Completion Provider
**Priority**: 🟡 HIGH
**Effort**: 3-4 days

**Subtasks**:
- [ ] Register Monaco completion provider
- [ ] Integrate with kubectl-ai
- [ ] Handle YAML/JSON completions
- [ ] Add trigger characters
- [ ] Show AI-generated suggestions
- [ ] Test with various scenarios

**Code Example**:
```typescript
// packages/core/src/components/Editor/ai-completion.ts
import * as monaco from 'monaco-editor'
import { getAIProvider } from '../kubectl-ai'

export function registerAICompletionProvider() {
  monaco.languages.registerCompletionItemProvider('yaml', {
    triggerCharacters: [' ', '.', ':', '-'],

    async provideCompletionItems(model, position, context, token) {
      const lineContent = model.getLineContent(position.lineNumber)
      const word = model.getWordUntilPosition(position)
      const range = new monaco.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn
      )

      // Get context (previous lines)
      const contextLines = Math.min(position.lineNumber - 1, 10)
      const context = model.getValueInRange(
        new monaco.Range(
          Math.max(1, position.lineNumber - contextLines),
          1,
          position.lineNumber,
          position.column
        )
      )

      // Ask AI for completions
      const aiProvider = getAIProvider()
      const suggestions = await aiProvider.complete({
        language: 'yaml',
        context,
        line: lineContent,
        position: { line: position.lineNumber, column: position.column }
      })

      return {
        suggestions: suggestions.map(s => ({
          label: s.label,
          kind: monaco.languages.CompletionItemKind.Snippet,
          documentation: s.documentation,
          insertText: s.text,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          sortText: s.sortText || s.label
        }))
      }
    }
  })
}
```

**Success Criteria**:
- ✅ AI completions working
- ✅ Suggestions relevant
- ✅ Fast response time (<500ms)

**Dependencies**: Task 1.4.1

---

#### Task 2.3.2: Implement AI Quick Fixes
**Priority**: 🟢 MEDIUM
**Effort**: 2-3 days

**Subtasks**:
- [ ] Register Monaco code action provider
- [ ] Detect YAML/JSON errors
- [ ] Generate AI-powered fixes
- [ ] Show quick fix UI (💡 icon)
- [ ] Apply fixes on selection

**Success Criteria**:
- ✅ Quick fixes working
- ✅ Errors fixed correctly
- ✅ Good UX

**Dependencies**: Task 2.3.1

---

#### Task 2.3.3: Natural Language to YAML
**Priority**: 🟢 MEDIUM
**Effort**: 2 days

**Subtasks**:
- [ ] Add "Generate from description" command
- [ ] Parse natural language input
- [ ] Generate YAML using AI
- [ ] Insert into editor
- [ ] Format and validate

**Success Criteria**:
- ✅ Generation working
- ✅ Output valid YAML
- ✅ Good prompts

**Dependencies**: Task 2.3.1

---

### 2.4 AI Navigation & Insights (Weeks 15-16)

#### Task 2.4.1: Natural Language Resource Query
**Priority**: 🟢 MEDIUM
**Effort**: 3 days

**Subtasks**:
- [ ] Add "Ask AI" to command palette
- [ ] Parse natural language queries
- [ ] Execute kubectl commands
- [ ] Show results
- [ ] Handle errors gracefully

**Examples**:
```
"Show me failing pods in production"
→ kubectl get pods -n production --field-selector=status.phase!=Running

"Find deployments using old nginx image"
→ kubectl get deployments -A -o json | jq '...'

"Which services are not load balanced?"
→ kubectl get services -A --field-selector=spec.type!=LoadBalancer
```

**Success Criteria**:
- ✅ Queries understood
- ✅ Commands executed correctly
- ✅ Results useful

**Dependencies**: Task 2.1.2

---

#### Task 2.4.2: Intelligent Resource Grouping
**Priority**: 🟢 MEDIUM
**Effort**: 2 days

**Subtasks**:
- [ ] Group related resources (Pod → ReplicaSet → Deployment)
- [ ] Show resource relationships
- [ ] Add "Show related" action
- [ ] Visual indicators

**Success Criteria**:
- ✅ Grouping accurate
- ✅ Relationships clear
- ✅ Useful for debugging

**Dependencies**: None

---

## 🟢 PHASE 3: ADVANCED FEATURES (Weeks 17-24)

**Goal**: Modern CLI experience, productivity features

### 3.1 Notebook Mode (Weeks 17-19)

#### Task 3.1.1: Design Notebook Architecture
**Priority**: 🟢 MEDIUM
**Effort**: 2 days

**Subtasks**:
- [ ] Define notebook data model
- [ ] Design cell types (code, markdown, output)
- [ ] Plan persistence format (.kui.json)
- [ ] Design UI mockups

**Success Criteria**:
- ✅ Architecture documented
- ✅ Data model defined
- ✅ UI designed

**Dependencies**: None

---

#### Task 3.1.2: Implement Notebook Cells
**Priority**: 🟢 MEDIUM
**Effort**: 4-5 days

**Subtasks**:
- [ ] Create Cell component
- [ ] Implement CodeCell (with Monaco)
- [ ] Implement MarkdownCell (with preview)
- [ ] Implement OutputCell (renders results)
- [ ] Add cell toolbar (run, delete, move)
- [ ] Keyboard shortcuts

**Success Criteria**:
- ✅ All cell types working
- ✅ Editing functional
- ✅ Execution working

**Dependencies**: Task 3.1.1

---

#### Task 3.1.3: Add Notebook Persistence
**Priority**: 🟢 MEDIUM
**Effort**: 2 days

**Subtasks**:
- [ ] Implement save/load
- [ ] Auto-save support
- [ ] Version history
- [ ] Export formats (PDF, HTML, Markdown)

**Success Criteria**:
- ✅ Save/load working
- ✅ Export functional
- ✅ No data loss

**Dependencies**: Task 3.1.2

---

#### Task 3.1.4: Notebook Execution Engine
**Priority**: 🟢 MEDIUM
**Effort**: 3 days

**Subtasks**:
- [ ] Execute cells sequentially
- [ ] Support cell dependencies
- [ ] Show execution count
- [ ] Handle errors
- [ ] Add "Run all" command

**Success Criteria**:
- ✅ Execution working
- ✅ Dependencies handled
- ✅ Errors displayed

**Dependencies**: Task 3.1.2

---

### 3.2 Scratchpad (Weeks 20-21)

#### Task 3.2.1: Create Scratchpad Component
**Priority**: 🟢 MEDIUM
**Effort**: 3 days

**Subtasks**:
- [ ] Design scratchpad UI
- [ ] Add Monaco editor
- [ ] Multi-line editing support
- [ ] Syntax highlighting
- [ ] Keyboard shortcuts (Cmd+Enter to run)

**Success Criteria**:
- ✅ Editing working
- ✅ Execution working
- ✅ Good UX

**Dependencies**: Task 1.4.1

---

#### Task 3.2.2: Add Snippet Library
**Priority**: 🟢 MEDIUM
**Effort**: 2 days

**Subtasks**:
- [ ] Create snippet storage
- [ ] Add snippet manager UI
- [ ] Implement snippet insertion
- [ ] Add common kubectl snippets
- [ ] Support variables in snippets

**Success Criteria**:
- ✅ Snippets working
- ✅ Library useful
- ✅ Easy to add new snippets

**Dependencies**: Task 3.2.1

---

### 3.3 Visual Topology (Weeks 22-24)

#### Task 3.3.1: Design Topology View
**Priority**: 🟢 LOW
**Effort**: 2 days

**Subtasks**:
- [ ] Research topology libraries (react-flow, cytoscape)
- [ ] Design node types
- [ ] Design edge types
- [ ] Plan interactions (click, hover, zoom)

**Success Criteria**:
- ✅ Design documented
- ✅ Library selected

**Dependencies**: None

---

#### Task 3.3.2: Implement Resource Graph
**Priority**: 🟢 LOW
**Effort**: 5-6 days

**Subtasks**:
- [ ] Install react-flow
- [ ] Create node components
- [ ] Create edge components
- [ ] Layout algorithm (hierarchical)
- [ ] Fetch resource relationships
- [ ] Render graph

**Success Criteria**:
- ✅ Graph rendered
- ✅ Relationships accurate
- ✅ Interactive

**Dependencies**: Task 3.3.1

---

#### Task 3.3.3: Add Network Topology
**Priority**: 🟢 LOW
**Effort**: 3-4 days

**Subtasks**:
- [ ] Fetch network policies
- [ ] Fetch services
- [ ] Show connections
- [ ] Color-code by status
- [ ] Add filters

**Success Criteria**:
- ✅ Network topology shown
- ✅ Connections clear
- ✅ Useful for debugging

**Dependencies**: Task 3.3.2

---

## ⚡ PHASE 4: POLISH (Weeks 25-28)

**Goal**: Production-ready, polished experience

### 4.1 Performance Optimization (Weeks 25-26)

#### Task 4.1.1: Comprehensive Performance Audit
**Priority**: 🟡 HIGH
**Effort**: 2-3 days

**Subtasks**:
- [ ] Run React Profiler on all components
- [ ] Identify slow renders
- [ ] Check for memory leaks
- [ ] Analyze bundle size
- [ ] Test with large datasets

**Success Criteria**:
- ✅ Performance baseline established
- ✅ Bottlenecks identified

**Dependencies**: None

---

#### Task 4.1.2: Optimize Rendering Performance
**Priority**: 🟡 HIGH
**Effort**: 3-4 days

**Subtasks**:
- [ ] Add React.memo where needed
- [ ] Optimize useCallback/useMemo usage
- [ ] Reduce unnecessary re-renders
- [ ] Lazy load heavy components
- [ ] Code splitting

**Success Criteria**:
- ✅ 60 FPS maintained
- ✅ Re-renders minimized

**Dependencies**: Task 4.1.1

---

#### Task 4.1.3: Memory Leak Fixes
**Priority**: 🟡 HIGH
**Effort**: 2 days

**Subtasks**:
- [ ] Use Chrome DevTools Memory Profiler
- [ ] Identify leaks
- [ ] Fix cleanup in useEffect
- [ ] Unsubscribe from event listeners
- [ ] Test thoroughly

**Success Criteria**:
- ✅ No memory leaks
- ✅ Memory stable over time

**Dependencies**: Task 4.1.1

---

### 4.2 Accessibility (Week 27)

#### Task 4.2.1: WCAG Audit
**Priority**: 🟡 HIGH
**Effort**: 2 days

**Subtasks**:
- [ ] Run axe DevTools
- [ ] Check keyboard navigation
- [ ] Test with screen reader (VoiceOver)
- [ ] Verify color contrast
- [ ] Document issues

**Success Criteria**:
- ✅ WCAG 2.1 AA compliance
- ✅ All issues documented

**Dependencies**: None

---

#### Task 4.2.2: Fix Accessibility Issues
**Priority**: 🟡 HIGH
**Effort**: 3-4 days

**Subtasks**:
- [ ] Add ARIA labels
- [ ] Fix focus management
- [ ] Improve keyboard navigation
- [ ] Add skip links
- [ ] Update color contrast

**Success Criteria**:
- ✅ All issues fixed
- ✅ Screen reader compatible

**Dependencies**: Task 4.2.1

---

### 4.3 Testing & Documentation (Week 28)

#### Task 4.3.1: Comprehensive Test Suite
**Priority**: 🟡 HIGH
**Effort**: 4-5 days

**Subtasks**:
- [ ] Write unit tests (80% coverage)
- [ ] Write integration tests
- [ ] Write E2E tests (Playwright)
- [ ] Test accessibility
- [ ] Test performance

**Success Criteria**:
- ✅ 80%+ test coverage
- ✅ All critical paths tested
- ✅ CI passing

**Dependencies**: None

---

#### Task 4.3.2: Update Documentation
**Priority**: 🟡 HIGH
**Effort**: 2-3 days

**Subtasks**:
- [ ] Update TAURI_USER_GUIDE.md
- [ ] Update TAURI_DEVELOPER_GUIDE.md
- [ ] Document command palette
- [ ] Document notebook mode
- [ ] Document AI features
- [ ] Add screenshots/demos
- [ ] Update CHANGELOG.md

**Success Criteria**:
- ✅ All docs updated
- ✅ Clear and accurate
- ✅ Screenshots included

**Dependencies**: All previous tasks

---

## 📊 Success Metrics

### Performance Targets
- [ ] Initial load time: <800ms (currently ~2s)
- [ ] Large table render (5K rows): <100ms (currently 3-5s)
- [ ] Memory usage: <80 MB (currently ~150 MB)
- [ ] Terminal FPS: 120 (currently 60)
- [ ] Bundle size: <12 MB (currently 15 MB)

### Quality Targets
- [ ] Test coverage: 80%+
- [ ] Zero memory leaks
- [ ] WCAG 2.1 AA compliance
- [ ] Zero critical bugs

### User Experience Targets
- [ ] Command palette response: <100ms
- [ ] AI suggestions: <500ms
- [ ] Smooth 60 FPS in all animations
- [ ] Zero UI freezes

---

## 🚀 Getting Started

### Prerequisites
```bash
# Install dependencies
npm ci

# Install Rust (for Tauri)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install SQLite (for persistence)
# macOS: already included
```

### Start Development
```bash
# Start with Phase 1, Task 1.1.1
git checkout -b feat/hooks-migration-block

# Make changes, test, commit
npm run test
npm run open  # Test in Tauri

# Create PR when done
```

---

## 📝 Notes

### Task Prioritization
- 🔴 CRITICAL: Must complete, blocks other work
- 🟡 HIGH: Important, should complete soon
- 🟢 MEDIUM: Nice to have, can defer
- 🔵 LOW: Optional, do if time permits

### Task Dependencies
Check "Dependencies" section of each task. Some tasks must be completed in order.

### Parallel Work
Tasks with no dependencies can be worked on in parallel by multiple developers.

---

**Status**: 📋 Ready to Execute
**Last Updated**: 2025-12-17
**Next Action**: Start Phase 1, Task 1.1.1 (Convert Block Component to Hooks)
