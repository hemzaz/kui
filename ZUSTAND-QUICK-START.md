# Zustand Quick Start Guide

## Overview

Kui now uses Zustand for state management instead of React Context. This provides better performance and a simpler API.

## Quick Start

### Installation

Zustand is already installed. Just import and use:

```typescript
import { useStore } from '@kui-shell/core/store'
```

## Available Stores

### 1. Mutability Store
Controls whether tabs are editable and executable.

```typescript
import { useMutabilityStore } from '@kui-shell/core/store'

function MyComponent() {
  const { mutability, toggleEditable, setEditable } = useMutabilityStore()

  return (
    <button disabled={!mutability.editable} onClick={toggleEditable}>
      Edit
    </button>
  )
}
```

**State:**
- `mutability.editable: boolean` - Can edit tab content
- `mutability.executable: boolean` - Can execute commands

**Actions:**
- `setMutability(state)` - Set entire mutability state
- `toggleEditable()` - Toggle editable flag
- `setEditable(value)` - Set editable flag
- `setExecutable(value)` - Set executable flag
- `resetMutability()` - Reset to default

---

### 2. Kui Config Store
Global UI configuration (product name, components, prompt, etc.).

```typescript
import { useKuiConfigStore } from '@kui-shell/core/store'

function PromptComponent() {
  const { kuiConfig, updateKuiConfig } = useKuiConfigStore()

  return (
    <div>
      <span>{kuiConfig.prompt || '/'}</span>
      <span>{kuiConfig.productName}</span>
    </div>
  )
}
```

**State:**
- `kuiConfig: Record<string, any>` - Configuration object

**Actions:**
- `setKuiConfig(config)` - Replace entire config
- `updateKuiConfig(updates)` - Merge updates
- `resetKuiConfig()` - Reset to default

---

### 3. Split Injector Store
Terminal split management.

```typescript
import { useSplitInjectorStore, SplitPosition } from '@kui-shell/core/store'

function TerminalManager() {
  const { splits, injectSplits, removeSplit } = useSplitInjectorStore()

  const addRightSplit = () => {
    injectSplits([{
      uuid: generateId(),
      node: <MyTerminal />,
      position: SplitPosition.Right,
      count: 1,
      opts: { maximized: false }
    }])
  }

  return (
    <>
      {splits.map(split => (
        <Split key={split.uuid} {...split} onClose={() => removeSplit(split.uuid)} />
      ))}
      <button onClick={addRightSplit}>Add Split</button>
    </>
  )
}
```

**State:**
- `splits: SplitSpec[]` - Array of active splits

**Actions:**
- `injectSplits(splits)` - Add new splits
- `modifySplit(uuid, node, opts)` - Update existing split
- `removeSplit(uuid)` - Remove a split
- `clearSplits()` - Remove all splits

**Types:**
```typescript
enum SplitPosition {
  Left = 'left',
  Right = 'right',
  Top = 'top',
  Bottom = 'bottom'
}

interface InjectorOptions {
  maximized?: boolean
  inverseColors?: boolean
  hasActiveInput?: boolean
}
```

---

### 4. Markdown Tabs Store
Tracks active tabs in markdown documents.

```typescript
import { useMarkdownTabsStore } from '@kui-shell/core/store'

function MarkdownDocument({ documentId }) {
  const { markdownTabs, setMarkdownTab } = useMarkdownTabsStore()
  const tabState = markdownTabs[documentId] || { activeKey: 0, previousActiveKey: undefined }

  return (
    <Tabs
      activeKey={tabState.activeKey}
      onChange={(key) => setMarkdownTab(documentId, key)}
    >
      <Tab key={0}>Content 1</Tab>
      <Tab key={1}>Content 2</Tab>
    </Tabs>
  )
}
```

**State:**
- `markdownTabs: Record<string, MarkdownTabState>` - Tab states by document ID

**Actions:**
- `setMarkdownTab(documentId, activeKey)` - Set active tab
- `getMarkdownTab(documentId)` - Get tab state
- `removeMarkdownTab(documentId)` - Remove state
- `clearMarkdownTabs()` - Clear all states

---

### 5. Existing Stores

Also available (from task 1.3.1):

#### Tabs Store
```typescript
import { useTabsStore } from '@kui-shell/core/store'

const { tabs, activeTabId, addTab, removeTab, setActiveTab } = useTabsStore()
```

#### History Store
```typescript
import { useHistoryStore } from '@kui-shell/core/store'

const { history, addToHistory, clearHistory } = useHistoryStore()
```

#### Settings Store
```typescript
import { useSettingsStore } from '@kui-shell/core/store'

const { settings, updateSettings, resetSettings } = useSettingsStore()
```

#### AI Store
```typescript
import { useAIStore } from '@kui-shell/core/store'

const { aiEnabled, aiProvider, setAIEnabled, updateAISettings } = useAIStore()
```

---

## Advanced Usage

### Direct Store Access

For fine-grained control, use the main store with selectors:

```typescript
import { useStore } from '@kui-shell/core/store'

function Component() {
  // Only re-render when this specific value changes
  const editable = useStore(state => state.mutability.editable)
  const promptText = useStore(state => state.kuiConfig.prompt)

  return <div>{editable ? promptText : 'Read-only'}</div>
}
```

### Multiple Values

```typescript
const { editable, executable } = useStore(state => ({
  editable: state.mutability.editable,
  executable: state.mutability.executable
}))
```

### Actions Only

```typescript
const updateConfig = useStore(state => state.updateKuiConfig)
```

---

## Performance Tips

1. **Use selector hooks** for most cases:
   ```typescript
   const { mutability } = useMutabilityStore() // Good
   ```

2. **Use direct selectors** for single values:
   ```typescript
   const editable = useStore(state => state.mutability.editable) // Better
   ```

3. **Avoid selecting entire slices** unless needed:
   ```typescript
   const store = useStore() // Bad - re-renders on any change
   ```

4. **Use shallow equality** for objects:
   ```typescript
   import { shallow } from 'zustand/shallow'

   const { editable, executable } = useStore(
     state => ({
       editable: state.mutability.editable,
       executable: state.mutability.executable
     }),
     shallow
   )
   ```

---

## DevTools

Redux DevTools integration is enabled in development:

1. Install Redux DevTools browser extension
2. Open DevTools → Redux tab
3. See "Kui Store" with all state and actions
4. Time-travel debug state changes

---

## Persistence

Some state is automatically persisted to localStorage:

**Persisted:**
- `kuiConfig` - Configuration
- `history` - Command history
- `settings` - User settings

**NOT Persisted:**
- `tabs` - Resets on page load
- `mutability` - Tab-specific
- `splits` - Runtime-only
- `markdownTabs` - Document-specific
- `ai` - Runtime-only

---

## Migration from Context

If you see `useContext(MutabilityContext)`, replace with:

```typescript
// Before
import { MutabilityContext } from './MutabilityContext'
const mutability = useContext(MutabilityContext)

// After
import { useMutabilityStore } from '@kui-shell/core/store'
const { mutability } = useMutabilityStore()
```

If you see `<Context.Consumer>`, replace with hooks:

```typescript
// Before
<MutabilityContext.Consumer>
  {mutability => <div>{mutability.editable}</div>}
</MutabilityContext.Consumer>

// After
function Component() {
  const { mutability } = useMutabilityStore()
  return <div>{mutability.editable}</div>
}
```

---

## Testing

### With React Testing Library

```typescript
import { renderHook, act } from '@testing-library/react'
import { useMutabilityStore } from '@kui-shell/core/store'

test('mutability store', () => {
  const { result } = renderHook(() => useMutabilityStore())

  expect(result.current.mutability.editable).toBe(true)

  act(() => {
    result.current.toggleEditable()
  })

  expect(result.current.mutability.editable).toBe(false)
})
```

### Reset State Between Tests

```typescript
import { useStore } from '@kui-shell/core/store'

beforeEach(() => {
  useStore.getState().resetMutability()
  useStore.getState().resetKuiConfig()
})
```

---

## Common Patterns

### Conditional Rendering
```typescript
const { mutability } = useMutabilityStore()

return mutability.editable ? <EditMode /> : <ReadOnlyMode />
```

### Disabled States
```typescript
const { mutability } = useMutabilityStore()

<button disabled={!mutability.executable}>Execute</button>
```

### Configuration-Based UI
```typescript
const { kuiConfig } = useKuiConfigStore()

<div className={kuiConfig.components === 'patternfly' ? 'pf-layout' : 'carbon-layout'}>
```

### Dynamic Splits
```typescript
const { injectSplits } = useSplitInjectorStore()

const openHelp = () => {
  injectSplits([{
    uuid: 'help-split',
    node: <HelpPanel />,
    position: SplitPosition.Right,
    count: 1,
    opts: { maximized: false }
  }])
}
```

---

## Troubleshooting

### "Cannot find module '@kui-shell/core/store'"

Run `npm run compile` to build TypeScript files.

### "useStore is not a function"

Check that Zustand is installed:
```bash
npm install zustand
```

### State not persisting

Only `kuiConfig`, `history`, and `settings` persist. Others are runtime-only by design.

### Performance issues

Use selectors to only subscribe to what you need:
```typescript
// Bad - re-renders on any state change
const store = useStore()

// Good - only re-renders when editable changes
const editable = useStore(state => state.mutability.editable)
```

---

## Resources

- **Full Documentation**: `/Users/elad/PROJ/kui/CONTEXT-TO-ZUSTAND-MIGRATION.md`
- **Zustand Docs**: https://github.com/pmndrs/zustand
- **Store Location**: `/Users/elad/PROJ/kui/packages/core/src/store/`
- **Slices**: `/Users/elad/PROJ/kui/packages/core/src/store/slices/`
