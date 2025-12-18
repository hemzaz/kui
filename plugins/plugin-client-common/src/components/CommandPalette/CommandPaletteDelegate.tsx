/*
 * Copyright 2025 The Kubernetes Authors
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

import React from 'react'
import type { PickerDelegate } from '../Picker/PickerDelegate'
import type { Command } from './commands'
import { getCategoryColor, getCategoryIcon } from './commands'
import {
  recordCommandInvocation,
  getAllCommandHitCounts
} from '@kui-shell/core/src/main/tauri-command-palette'
import { getCommandSuggestions, type AISuggestion } from './ai-suggestions'
import { FuzzyHighlight } from './fuzzy-highlight'

/**
 * Extended command with AI metadata
 */
interface EnhancedCommand extends Command {
  aiSuggestion?: {
    confidence: number
    reason: string
    source: 'ai' | 'pattern' | 'hybrid'
  }
}

/**
 * Command Palette Delegate
 * Implements PickerDelegate for the command palette.
 * Handles command execution, hit counting, AI suggestions, and rendering.
 */
export class CommandPaletteDelegate implements PickerDelegate<EnhancedCommand> {
  private commands: Command[]
  private matches: EnhancedCommand[]
  private _selectedIndex: number = 0
  private hitCounts: Map<string, number> = new Map()
  private recentCommands: string[] = []
  private enableAISuggestions: boolean = true
  private currentQuery: string = ''

  constructor(commands: Command[], recentCommands: string[] = []) {
    this.commands = commands
    this.matches = this.commands as EnhancedCommand[]
    this.recentCommands = recentCommands
    this.loadHitCounts()
  }

  matchCount(): number {
    return this.matches.length
  }

  selectedIndex(): number {
    return this._selectedIndex
  }

  setSelectedIndex(index: number): void {
    this._selectedIndex = Math.max(0, Math.min(index, this.matches.length - 1))
  }

  placeholderText(): string {
    return 'Type a command or search...'
  }

  noMatchesText(): string {
    return 'No commands found'
  }

  async updateMatches(query: string, matches: Command[]): Promise<void> {
    // Store query for highlighting
    this.currentQuery = query

    // Matches are already filtered by Picker's fuzzy search
    let enhancedMatches: EnhancedCommand[] = matches as EnhancedCommand[]

    // If query is empty or very short, add AI suggestions at the top
    if (this.enableAISuggestions && query.length < 3 && this.recentCommands.length > 0) {
      try {
        const suggestions = await getCommandSuggestions(
          {
            recentCommands: this.recentCommands,
            currentInput: query,
            allCommands: this.commands
          },
          5
        )

        // Convert AI suggestions to enhanced commands
        const aiCommands: EnhancedCommand[] = suggestions.map(s => ({
          ...s.command,
          aiSuggestion: {
            confidence: s.confidence,
            reason: s.reason,
            source: s.source
          }
        }))

        // Remove duplicates from regular matches
        const aiCommandIds = new Set(aiCommands.map(c => c.id))
        enhancedMatches = matches.filter(m => !aiCommandIds.has(m.id)) as EnhancedCommand[]

        // Prepend AI suggestions
        enhancedMatches = [...aiCommands, ...enhancedMatches]
      } catch (err) {
        console.warn('Failed to get AI suggestions:', err)
      }
    }

    // Sort by hit counts (AI suggestions are already at top)
    this.matches = this.sortByFrequency(enhancedMatches)
  }

  confirm(command: EnhancedCommand, secondary: boolean): void {
    // Record usage
    this.incrementHitCount(command.id)

    // Add to recent commands for AI suggestions
    this.recentCommands.push(command.id)
    if (this.recentCommands.length > 10) {
      this.recentCommands.shift()
    }

    // Execute command and track execution time
    const startTime = Date.now()
    try {
      const result = command.action()
      if (result instanceof Promise) {
        result
          .then(() => {
            const executionTime = Date.now() - startTime
            recordCommandInvocation(command.id, executionTime, true).catch(err =>
              console.warn('Failed to record command invocation:', err)
            )
          })
          .catch(err => {
            const executionTime = Date.now() - startTime
            console.error('Command execution failed:', err)
            recordCommandInvocation(
              command.id,
              executionTime,
              false,
              err.message || String(err)
            ).catch(e => console.warn('Failed to record command invocation:', e))
          })
      } else {
        const executionTime = Date.now() - startTime
        recordCommandInvocation(command.id, executionTime, true).catch(err =>
          console.warn('Failed to record command invocation:', err)
        )
      }
    } catch (err: any) {
      const executionTime = Date.now() - startTime
      console.error('Command execution failed:', err)
      recordCommandInvocation(command.id, executionTime, false, err.message || String(err)).catch(
        e => console.warn('Failed to record command invocation:', e)
      )
    }
  }

  dismissed(): void {
    // Cleanup if needed
  }

  renderItem(command: EnhancedCommand, index: number, isSelected: boolean): React.ReactElement {
    const categoryColor = getCategoryColor(command.category)
    const categoryIcon = getCategoryIcon(command.category)
    const hitCount = this.hitCounts.get(command.id) || 0
    const aiSuggestion = command.aiSuggestion

    return (
      <div className={`kui-command-palette-item ${aiSuggestion ? 'ai-suggested' : ''}`}>
        <div className="item-icon-wrapper">
          {command.icon ? (
            <span className="item-icon">{command.icon}</span>
          ) : (
            <span className="item-icon category-icon">{categoryIcon}</span>
          )}
        </div>
        <div className="item-content">
          <div className="item-name-row">
            <div className="item-name">
              {this.currentQuery ? (
                <FuzzyHighlight text={command.name} query={this.currentQuery} />
              ) : (
                command.name
              )}
            </div>
            {aiSuggestion && (
              <div className={`ai-badge ${aiSuggestion.source}`} title={aiSuggestion.reason}>
                {aiSuggestion.source === 'ai' && '✨ AI'}
                {aiSuggestion.source === 'pattern' && '📊 Pattern'}
                {aiSuggestion.source === 'hybrid' && '🎯 Smart'}
                <span className="confidence">{Math.round(aiSuggestion.confidence * 100)}%</span>
              </div>
            )}
          </div>
          {command.description && (
            <div className="item-description">
              {this.currentQuery ? (
                <FuzzyHighlight text={command.description} query={this.currentQuery} />
              ) : (
                command.description
              )}
            </div>
          )}
          {aiSuggestion && (
            <div className="ai-reason">{aiSuggestion.reason}</div>
          )}
        </div>
        <div className="item-metadata">
          {command.keyBinding && (
            <div className="item-keybinding">
              <KeyBinding binding={command.keyBinding} />
            </div>
          )}
          <div
            className="item-category"
            style={{ backgroundColor: categoryColor }}
          >
            {command.category}
          </div>
          {hitCount > 0 && (
            <div className="item-hit-count" title={`Used ${hitCount} times`}>
              {hitCount > 999 ? '999+' : hitCount}
            </div>
          )}
        </div>
      </div>
    )
  }

  /**
   * Sort commands by usage frequency (preserving AI suggestions at top)
   */
  private sortByFrequency(commands: EnhancedCommand[]): EnhancedCommand[] {
    // Separate AI suggestions from regular commands
    const aiSuggestions = commands.filter(c => c.aiSuggestion)
    const regularCommands = commands.filter(c => !c.aiSuggestion)

    // Sort regular commands by hit count
    const sortedRegular = regularCommands.sort((a, b) => {
      const aCount = this.hitCounts.get(a.id) || 0
      const bCount = this.hitCounts.get(b.id) || 0
      return bCount - aCount
    })

    // AI suggestions stay at top, already sorted by confidence
    return [...aiSuggestions, ...sortedRegular]
  }

  /**
   * Load hit counts from persistent storage
   */
  private loadHitCounts(): void {
    // Load asynchronously from Tauri backend
    getAllCommandHitCounts()
      .then(counts => {
        this.hitCounts = counts
        // Re-sort commands after loading hit counts
        this.commands = this.sortByFrequency(this.commands)
        this.matches = this.sortByFrequency(this.matches)
      })
      .catch(err => {
        console.warn('Failed to load command hit counts:', err)
      })
  }

  /**
   * Increment hit count for a command (in-memory only)
   * Actual persistence is handled by recordCommandInvocation
   */
  private incrementHitCount(commandId: string): void {
    const current = this.hitCounts.get(commandId) || 0
    this.hitCounts.set(commandId, current + 1)
  }
}

/**
 * KeyBinding component - renders keyboard shortcut
 */
function KeyBinding({ binding }: { binding: string }) {
  const keys = binding.split('+').map(k => k.trim())

  return (
    <div className="key-binding">
      {keys.map((key, i) => (
        <React.Fragment key={i}>
          <kbd className="key">{key}</kbd>
          {i < keys.length - 1 && <span className="key-separator">+</span>}
        </React.Fragment>
      ))}
    </div>
  )
}
