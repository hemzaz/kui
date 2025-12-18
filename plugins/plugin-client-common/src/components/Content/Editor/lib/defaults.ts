/*
 * Copyright 2018 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { editor } from 'monaco-editor'
import getKuiFontSize from './fonts'

export interface Options extends editor.IEditorConstructionOptions {
  readOnly?: boolean
  simple?: boolean
  fontSize?: number
  language?: string
  showLineNumbers?: boolean
}

/** Once we scroll to the bottom or top, then start scrolling the enclosing scroll region */
const scrollbar = { alwaysConsumeMouseWheel: false }

export default (options: Options): editor.IEditorConstructionOptions => ({
  automaticLayout: true, // respond to window layout changes?
  minimap: {
    enabled: false
  },
  codeLens: false,
  quickSuggestions: false,
  contextmenu: false,
  scrollBeyondLastLine: false,
  scrollBeyondLastColumn: 2,
  cursorStyle: 'block',
  fontFamily: 'var(--font-monospace)',
  fontSize: options.fontSize || getKuiFontSize(),

  // Modern Monaco v0.52 Features
  // Sticky scroll: keeps function/class context visible while scrolling
  stickyScroll: {
    enabled: !options.simple, // Enable in full editor mode
    maxLineCount: 5, // Show up to 5 context lines
    defaultModel: 'outlineModel', // Use outline for best context
    scrollWithEditor: true // Scroll horizontally with editor
  },

  // Bracket pair colorization: color-code matching brackets
  bracketPairColorization: {
    enabled: !options.simple, // Enable in full editor mode
    independentColorPoolPerBracketType: true // Different colors per bracket type
  },

  // Bracket pair guides: visual lines connecting bracket pairs
  guides: {
    bracketPairs: true, // Show vertical guides for bracket pairs
    bracketPairsHorizontal: 'active', // Show horizontal guides for active pair
    highlightActiveBracketPair: true // Highlight the active bracket pair
  },

  // Inlay hints: show parameter names and type hints inline
  inlayHints: {
    enabled: options.simple ? 'off' : 'onUnlessPressed', // Show hints, hide when Alt pressed
    fontSize: Math.floor((options.fontSize || getKuiFontSize()) * 0.9), // 90% of editor font
    fontFamily: 'var(--font-monospace)',
    padding: true // Add padding around hints for better readability
  },

  // Inline suggestions: enhanced autocomplete with ghost text
  inlineSuggest: {
    enabled: !options.simple && !options.readOnly, // Enable in editable full mode
    mode: 'subwordSmart', // Smart subword matching
    showToolbar: 'onHover', // Show toolbar on hover
    suppressSuggestions: false,
    keepOnBlur: false // Clear suggestions when focus lost
  },

  // Smooth scrolling for better UX
  smoothScrolling: true,

  // Multi-cursor enhancements
  multiCursorModifier: 'alt', // Alt+Click for multi-cursor
  multiCursorPaste: 'spread', // Spread paste across cursors

  // Enhanced find/replace
  find: {
    addExtraSpaceOnTop: true, // More space for find widget
    autoFindInSelection: 'multiline', // Auto-scope to selection for multiline
    seedSearchStringFromSelection: 'selection' // Use selection as search seed
  },

  // don't show those little bits and borders in the scrollbar in "simple" mode
  overviewRulerBorder: options.simple,
  overviewRulerLanes: options.simple ? 0 : undefined,
  scrollbar: options.simple
    ? Object.assign(
        {
          vertical: 'hidden'
        },
        scrollbar
      )
    : scrollbar,

  // specifics for readOnly mode
  glyphMargin: !options.readOnly && !options.simple, // needed for error indicators

  // simplify the UI?
  links: !options.simple,
  folding: !options.simple || !/markdown|text|shell/i.test(options.language),
  lineNumbers: !options.showLineNumbers ? 'off' : 'on',
  wordWrap: options.wordWrap || (options.simple ? 'off' : 'on'),
  renderLineHighlight: options.simple ? 'none' : undefined,
  renderFinalNewline: !options.simple ? 'on' : 'off',
  lineDecorationsWidth: !options.showLineNumbers ? 0 : undefined,
  lineNumbersMinChars: options.lineNumbersMinChars || (!options.showLineNumbers ? 0 : undefined)
})
