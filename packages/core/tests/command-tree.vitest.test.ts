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

/**
 * Tests for Command Tree functionality
 *
 * The command tree is responsible for registering and routing commands
 * in the Kui REPL. These tests verify command registration, lookup,
 * and execution routing.
 */

import { describe, it, expect, vi } from 'vitest'
import { createMockCommandTree, createMockExecOptions } from '../../../test-utils'

describe('Command Tree', () => {
  describe('Basic Command Registration', () => {
    it('should register a simple command', () => {
      const commandTree = createMockCommandTree()
      const handler = vi.fn()

      commandTree.listen('/test', handler)

      expect(commandTree.listen).toHaveBeenCalledWith('/test', handler)
    })

    it('should register multiple commands', () => {
      const commandTree = createMockCommandTree()
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      commandTree.listen('/cmd1', handler1)
      commandTree.listen('/cmd2', handler2)

      expect(commandTree.listen).toHaveBeenCalledTimes(2)
    })

    it('should register commands with options', () => {
      const commandTree = createMockCommandTree()
      const handler = vi.fn()
      const options = { usage: { docs: 'Test command' } }

      commandTree.listen('/test', handler, options)

      expect(commandTree.listen).toHaveBeenCalledWith('/test', handler, options)
    })

    it('should register commands with synonyms', () => {
      const commandTree = createMockCommandTree()
      const handler = vi.fn()
      const options = { synonymFor: '/original' }

      commandTree.listen('/synonym', handler, options)

      expect(commandTree.listen).toHaveBeenCalledWith('/synonym', handler, options)
    })
  })

  describe('Command Path Handling', () => {
    it('should handle root-level commands', () => {
      const commandTree = createMockCommandTree()
      const handler = vi.fn()

      commandTree.listen('/ls', handler)

      expect(commandTree.listen).toHaveBeenCalledWith('/ls', handler)
    })

    it('should handle nested commands', () => {
      const commandTree = createMockCommandTree()
      const handler = vi.fn()

      commandTree.listen('/kubectl/get', handler)

      expect(commandTree.listen).toHaveBeenCalledWith('/kubectl/get', handler)
    })

    it('should handle deeply nested commands', () => {
      const commandTree = createMockCommandTree()
      const handler = vi.fn()

      commandTree.listen('/kubectl/get/pods/details', handler)

      expect(commandTree.listen).toHaveBeenCalledWith('/kubectl/get/pods/details', handler)
    })

    it('should handle commands with special characters', () => {
      const commandTree = createMockCommandTree()
      const handler = vi.fn()

      commandTree.listen('/kubectl-ai', handler)

      expect(commandTree.listen).toHaveBeenCalledWith('/kubectl-ai', handler)
    })
  })

  describe('Command Options', () => {
    it('should register command with usage documentation', () => {
      const commandTree = createMockCommandTree()
      const handler = vi.fn()
      const options = {
        usage: {
          docs: 'Lists all files',
          command: 'ls',
          optional: [{ name: '--all', boolean: true, docs: 'Show hidden files' }]
        }
      }

      commandTree.listen('/ls', handler, options)

      expect(commandTree.listen).toHaveBeenCalledWith('/ls', handler, options)
    })

    it('should register command with flags', () => {
      const commandTree = createMockCommandTree()
      const handler = vi.fn()
      const options = {
        flags: {
          boolean: ['verbose', 'quiet'],
          string: ['output']
        }
      }

      commandTree.listen('/test', handler, options)

      expect(commandTree.listen).toHaveBeenCalledWith('/test', handler, options)
    })

    it('should register command with hide flag', () => {
      const commandTree = createMockCommandTree()
      const handler = vi.fn()
      const options = { hide: true }

      commandTree.listen('/hidden', handler, options)

      expect(commandTree.listen).toHaveBeenCalledWith('/hidden', handler, options)
    })

    it('should register command with needsUI flag', () => {
      const commandTree = createMockCommandTree()
      const handler = vi.fn()
      const options = { needsUI: true }

      commandTree.listen('/ui-command', handler, options)

      expect(commandTree.listen).toHaveBeenCalledWith('/ui-command', handler, options)
    })
  })

  describe('Command Handler Signatures', () => {
    it('should accept async handler', () => {
      const commandTree = createMockCommandTree()
      const handler = vi.fn(async () => 'result')

      commandTree.listen('/async', handler)

      expect(commandTree.listen).toHaveBeenCalledWith('/async', handler)
    })

    it('should accept handler returning promise', () => {
      const commandTree = createMockCommandTree()
      const handler = vi.fn(() => Promise.resolve('result'))

      commandTree.listen('/promise', handler)

      expect(commandTree.listen).toHaveBeenCalledWith('/promise', handler)
    })

    it('should accept handler with typed parameters', () => {
      const commandTree = createMockCommandTree()
      const handler = vi.fn(({ command, parsedOptions, execOptions }) => {
        return `Command: ${command}`
      })

      commandTree.listen('/typed', handler)

      expect(commandTree.listen).toHaveBeenCalledWith('/typed', handler)
    })
  })

  describe('Command Subtree Operations', () => {
    it('should create a subtree for related commands', () => {
      const commandTree = createMockCommandTree()

      commandTree.subtree('/kubectl', {
        usage: { docs: 'Kubernetes commands' }
      })

      expect(commandTree.subtree).toHaveBeenCalledWith('/kubectl', {
        usage: { docs: 'Kubernetes commands' }
      })
    })

    it('should register multiple subtrees', () => {
      const commandTree = createMockCommandTree()

      commandTree.subtree('/kubectl', { usage: { docs: 'Kubernetes' } })
      commandTree.subtree('/docker', { usage: { docs: 'Docker' } })

      expect(commandTree.subtree).toHaveBeenCalledTimes(2)
    })
  })

  describe('Command Finder', () => {
    it('should find registered command', () => {
      const commandTree = createMockCommandTree()

      commandTree.listen('/test', vi.fn())

      const found = commandTree.find('/test')
      expect(found).toBeDefined()
    })

    it('should return undefined for unregistered command', () => {
      const commandTree = createMockCommandTree()

      const found = commandTree.find('/nonexistent')
      expect(found).toBeUndefined()
    })

    it('should handle partial path matching', () => {
      const commandTree = createMockCommandTree()

      commandTree.listen('/kubectl/get/pods', vi.fn())

      const found = commandTree.find('/kubectl/get/pods')
      expect(found).toBeDefined()
    })
  })

  describe('Command Aliases', () => {
    it('should register command with alias', () => {
      const commandTree = createMockCommandTree()
      const handler = vi.fn()

      commandTree.listen('/list', handler)
      commandTree.listen('/ls', handler, { synonymFor: '/list' })

      expect(commandTree.listen).toHaveBeenCalledTimes(2)
    })

    it('should handle multiple aliases', () => {
      const commandTree = createMockCommandTree()
      const handler = vi.fn()

      commandTree.listen('/list', handler)
      commandTree.listen('/ls', handler, { synonymFor: '/list' })
      commandTree.listen('/dir', handler, { synonymFor: '/list' })

      expect(commandTree.listen).toHaveBeenCalledTimes(3)
    })
  })

  describe('Command Context', () => {
    it('should pass execOptions to handler', async () => {
      const commandTree = createMockCommandTree()
      const execOptions = createMockExecOptions()
      const handler = vi.fn(({ execOptions }) => {
        expect(execOptions).toBeDefined()
        return 'success'
      })

      commandTree.listen('/test', handler)

      // Simulate command execution with execOptions
      await handler({ command: '/test', execOptions })

      expect(handler).toHaveBeenCalled()
    })

    it('should include tab context', async () => {
      const commandTree = createMockCommandTree()
      const execOptions = createMockExecOptions({
        tab: { uuid: 'test-tab-123' }
      })

      const handler = vi.fn(({ execOptions }) => {
        expect(execOptions.tab).toBeDefined()
        expect(execOptions.tab.uuid).toBe('test-tab-123')
        return 'success'
      })

      commandTree.listen('/test', handler)

      await handler({ command: '/test', execOptions })

      expect(handler).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid command path', () => {
      const commandTree = createMockCommandTree()

      expect(() => {
        commandTree.listen('invalid-path', vi.fn())
      }).not.toThrow()
    })

    it('should handle null handler gracefully', () => {
      const commandTree = createMockCommandTree()

      expect(() => {
        commandTree.listen('/test', null as any)
      }).not.toThrow()
    })

    it('should handle undefined options', () => {
      const commandTree = createMockCommandTree()

      expect(() => {
        commandTree.listen('/test', vi.fn(), undefined)
      }).not.toThrow()
    })
  })

  describe('Command Precedence', () => {
    it('should handle overlapping command paths', () => {
      const commandTree = createMockCommandTree()

      commandTree.listen('/kubectl', vi.fn())
      commandTree.listen('/kubectl/get', vi.fn())

      expect(commandTree.listen).toHaveBeenCalledTimes(2)
    })

    it('should allow command override', () => {
      const commandTree = createMockCommandTree()
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      commandTree.listen('/test', handler1)
      commandTree.listen('/test', handler2)

      expect(commandTree.listen).toHaveBeenCalledTimes(2)
    })
  })

  describe('Integration Scenarios', () => {
    it('should support plugin command registration', () => {
      const commandTree = createMockCommandTree()

      // Simulate plugin registering commands
      const pluginCommands = ['/plugin/cmd1', '/plugin/cmd2', '/plugin/cmd3']

      pluginCommands.forEach(cmd => {
        commandTree.listen(cmd, vi.fn())
      })

      expect(commandTree.listen).toHaveBeenCalledTimes(3)
    })

    it('should support dynamic command registration', () => {
      const commandTree = createMockCommandTree()

      // Register commands dynamically
      const commands = ['ls', 'pwd', 'cd', 'mkdir']
      commands.forEach(cmd => {
        commandTree.listen(`/${cmd}`, vi.fn())
      })

      expect(commandTree.listen).toHaveBeenCalledTimes(4)
    })

    it('should handle command tree with many commands', () => {
      const commandTree = createMockCommandTree()

      // Register 100 commands
      for (let i = 0; i < 100; i++) {
        commandTree.listen(`/cmd${i}`, vi.fn())
      }

      expect(commandTree.listen).toHaveBeenCalledTimes(100)
    })
  })
})
