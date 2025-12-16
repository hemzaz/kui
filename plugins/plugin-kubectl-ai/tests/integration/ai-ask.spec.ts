/*
 * Copyright 2024 The Kubernetes Authors
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

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import type { Arguments } from '@kui-shell/core'

/**
 * Integration tests for /ai ask command
 *
 * These tests verify the end-to-end behavior of the AI ask command,
 * including argument parsing, validation, and response formatting.
 */

describe('AI Ask Command Integration', () => {
  let aiAskModule: any

  beforeEach(async () => {
    jest.clearAllMocks()
    // Dynamically import the command module
    aiAskModule = await import('../../src/commands/ai-ask')
  })

  describe('command registration', () => {
    it('should register with PreloadRegistrar', async () => {
      const mockRegistrar = {
        listen: jest.fn()
      }

      await aiAskModule.default(mockRegistrar)

      expect(mockRegistrar.listen).toHaveBeenCalledTimes(1)
      expect(mockRegistrar.listen).toHaveBeenCalledWith(
        '/ai/ask',
        expect.any(Function),
        expect.objectContaining({
          usage: expect.objectContaining({
            command: 'ask',
            docs: expect.any(String)
          })
        })
      )
    })

    it('should register with correct usage metadata', async () => {
      const mockRegistrar = {
        listen: jest.fn()
      }

      await aiAskModule.default(mockRegistrar)

      const callArgs = mockRegistrar.listen.mock.calls[0]
      const options = callArgs[2]

      expect(options.usage).toHaveProperty('command', 'ask')
      expect(options.usage).toHaveProperty('docs')
      expect(options.usage).toHaveProperty('example')
      expect(options.usage).toHaveProperty('required')
      expect(options.usage).toHaveProperty('optional')
    })
  })

  describe('argument parsing', () => {
    let commandHandler: Function

    beforeEach(async () => {
      const mockRegistrar = {
        listen: jest.fn()
      }
      await aiAskModule.default(mockRegistrar)
      commandHandler = mockRegistrar.listen.mock.calls[0][1]
    })

    it('should parse simple question', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'why', 'is', 'my', 'pod', 'crashing?'],
        parsedOptions: {}
      }

      const response = await commandHandler(args)

      expect(response).toContain('why is my pod crashing?')
      expect(typeof response).toBe('string')
    })

    it('should parse question with quotes', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'why is my pod crashing?'],
        parsedOptions: {}
      }

      const response = await commandHandler(args)

      expect(response).toContain('why is my pod crashing?')
    })

    it('should handle --context flag', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'what', 'is', 'wrong?'],
        parsedOptions: { context: true }
      }

      const response = await commandHandler(args)

      expect(response).toContain('Include context: true')
    })

    it('should handle --streaming flag', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'help', 'me', 'debug'],
        parsedOptions: { streaming: true }
      }

      const response = await commandHandler(args)

      expect(response).toContain('Streaming: true')
    })

    it('should handle --namespace flag', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'show', 'resources'],
        parsedOptions: { namespace: 'production' }
      }

      const response = await commandHandler(args)

      expect(response).toContain('Namespace: production')
    })

    it('should handle -n alias for namespace', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'show', 'resources'],
        parsedOptions: { n: 'production' }
      }

      const response = await commandHandler(args)

      expect(response).toContain('Namespace: production')
    })

    it('should handle --resource flag', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'debug', 'this'],
        parsedOptions: { resource: 'pod/nginx-123' }
      }

      const response = await commandHandler(args)

      expect(response).toContain('Resource: pod/nginx-123')
    })

    it('should handle multiple flags together', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'help'],
        parsedOptions: {
          context: true,
          streaming: true,
          namespace: 'production',
          resource: 'pod/nginx-123'
        }
      }

      const response = await commandHandler(args)

      expect(response).toContain('Include context: true')
      expect(response).toContain('Streaming: true')
      expect(response).toContain('Namespace: production')
      expect(response).toContain('Resource: pod/nginx-123')
    })
  })

  describe('error handling', () => {
    let commandHandler: Function

    beforeEach(async () => {
      const mockRegistrar = {
        listen: jest.fn()
      }
      await aiAskModule.default(mockRegistrar)
      commandHandler = mockRegistrar.listen.mock.calls[0][1]
    })

    it('should throw UsageError when no question provided', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask'],
        parsedOptions: {}
      }

      await expect(commandHandler(args)).rejects.toThrow()
    })

    it('should throw UsageError when question is empty', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', ''],
        parsedOptions: {}
      }

      await expect(commandHandler(args)).rejects.toThrow()
    })

    it('should throw UsageError when question is only whitespace', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', '   '],
        parsedOptions: {}
      }

      await expect(commandHandler(args)).rejects.toThrow()
    })

    it('should throw UsageError when "ask" keyword is missing', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'why', 'is', 'my', 'pod', 'crashing?'],
        parsedOptions: {}
      }

      await expect(commandHandler(args)).rejects.toThrow()
    })
  })

  describe('question formatting', () => {
    let commandHandler: Function

    beforeEach(async () => {
      const mockRegistrar = {
        listen: jest.fn()
      }
      await aiAskModule.default(mockRegistrar)
      commandHandler = mockRegistrar.listen.mock.calls[0][1]
    })

    it('should trim whitespace from question', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', '  ', 'why', 'is', 'this', 'failing?', '  '],
        parsedOptions: {}
      }

      const response = await commandHandler(args)

      expect(response).toContain('why is this failing?')
      expect(response).not.toContain('  why')
      expect(response).not.toContain('failing?  ')
    })

    it('should join multi-word questions with spaces', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'how', 'do', 'I', 'debug', 'this?'],
        parsedOptions: {}
      }

      const response = await commandHandler(args)

      expect(response).toContain('how do I debug this?')
    })

    it('should preserve question marks and punctuation', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'what', 'is', 'wrong?', 'help!'],
        parsedOptions: {}
      }

      const response = await commandHandler(args)

      expect(response).toContain('what is wrong? help!')
    })

    it('should handle questions with special characters', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'why', 'does', 'nginx@1.21', 'fail?'],
        parsedOptions: {}
      }

      const response = await commandHandler(args)

      expect(response).toContain('nginx@1.21')
    })
  })

  describe('response structure', () => {
    let commandHandler: Function

    beforeEach(async () => {
      const mockRegistrar = {
        listen: jest.fn()
      }
      await aiAskModule.default(mockRegistrar)
      commandHandler = mockRegistrar.listen.mock.calls[0][1]
    })

    it('should return string response', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'test', 'question'],
        parsedOptions: {}
      }

      const response = await commandHandler(args)

      expect(typeof response).toBe('string')
    })

    it('should include question in response', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'test', 'question'],
        parsedOptions: {}
      }

      const response = await commandHandler(args)

      expect(response).toContain('Question:')
      expect(response).toContain('test question')
    })

    it('should include AI response section', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'test', 'question'],
        parsedOptions: {}
      }

      const response = await commandHandler(args)

      expect(response).toContain('AI Response:')
    })

    it('should include options section when flags provided', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'test'],
        parsedOptions: {
          context: true,
          namespace: 'default'
        }
      }

      const response = await commandHandler(args)

      expect(response).toContain('Options:')
      expect(response).toContain('Include context:')
      expect(response).toContain('Namespace:')
    })

    it('should include placeholder message', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'test'],
        parsedOptions: {}
      }

      const response = await commandHandler(args)

      expect(response).toContain('placeholder')
      expect(response).toContain('not yet implemented')
    })
  })

  describe('real-world scenarios', () => {
    let commandHandler: Function

    beforeEach(async () => {
      const mockRegistrar = {
        listen: jest.fn()
      }
      await aiAskModule.default(mockRegistrar)
      commandHandler = mockRegistrar.listen.mock.calls[0][1]
    })

    it('should handle debugging scenario', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'why', 'is', 'my', 'pod', 'in', 'CrashLoopBackOff?'],
        parsedOptions: {
          context: true,
          resource: 'pod/nginx-deployment-abc123'
        }
      }

      const response = await commandHandler(args)

      expect(response).toBeDefined()
      expect(response).toContain('CrashLoopBackOff')
    })

    it('should handle creation scenario', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'create', 'a', 'deployment', 'for', 'nginx'],
        parsedOptions: {
          namespace: 'production'
        }
      }

      const response = await commandHandler(args)

      expect(response).toBeDefined()
      expect(response).toContain('deployment')
    })

    it('should handle optimization scenario', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'how', 'can', 'I', 'optimize', 'my', 'cluster', 'resources?'],
        parsedOptions: {
          context: true,
          namespace: 'production'
        }
      }

      const response = await commandHandler(args)

      expect(response).toBeDefined()
      expect(response).toContain('optimize')
    })

    it('should handle explanation scenario', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'explain', 'Kubernetes', 'Services'],
        parsedOptions: {}
      }

      const response = await commandHandler(args)

      expect(response).toBeDefined()
      expect(response).toContain('Services')
    })

    it('should handle streaming request', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'help', 'me', 'debug', 'this', 'issue'],
        parsedOptions: {
          streaming: true,
          context: true,
          namespace: 'default',
          resource: 'pod/failing-pod-xyz789'
        }
      }

      const response = await commandHandler(args)

      expect(response).toBeDefined()
      expect(response).toContain('Streaming: true')
      expect(response).toContain('failing-pod-xyz789')
    })
  })

  describe('edge cases', () => {
    let commandHandler: Function

    beforeEach(async () => {
      const mockRegistrar = {
        listen: jest.fn()
      }
      await aiAskModule.default(mockRegistrar)
      commandHandler = mockRegistrar.listen.mock.calls[0][1]
    })

    it('should handle very long questions', async () => {
      const longQuestion = Array(100).fill('word').join(' ')
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', ...longQuestion.split(' ')],
        parsedOptions: {}
      }

      const response = await commandHandler(args)

      expect(response).toBeDefined()
      expect(response).toContain(longQuestion)
    })

    it('should handle questions with newlines', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'line1\nline2\nline3'],
        parsedOptions: {}
      }

      const response = await commandHandler(args)

      expect(response).toBeDefined()
    })

    it('should handle unicode characters', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', '为什么', 'pod', '崩溃了？'],
        parsedOptions: {}
      }

      const response = await commandHandler(args)

      expect(response).toBeDefined()
      expect(response).toContain('为什么')
    })

    it('should handle emoji in questions', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'why', 'is', 'my', 'pod', '💥', 'crashing?'],
        parsedOptions: {}
      }

      const response = await commandHandler(args)

      expect(response).toBeDefined()
      expect(response).toContain('💥')
    })

    it('should handle resource format variations', async () => {
      const args: Partial<Arguments> = {
        argvNoOptions: ['ai', 'ask', 'debug'],
        parsedOptions: { resource: 'deployment/nginx' }
      }

      const response = await commandHandler(args)

      expect(response).toContain('deployment/nginx')
    })
  })
})
