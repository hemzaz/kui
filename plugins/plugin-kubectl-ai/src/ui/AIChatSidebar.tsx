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

import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { AIResponse, AIChunk } from '../types/ai-types'
import type { ClusterSnapshot } from '../types/cluster-types'
import { MessageList } from './MessageList'
import { ContextPanel } from './ContextPanel'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  usage?: {
    inputTokens: number
    outputTokens: number
  }
  cost?: number
}

interface AIChatSidebarProps {
  /** Initial cluster context */
  clusterData?: ClusterSnapshot
  /** Callback when user sends a message */
  onSendMessage?: (message: string) => Promise<AIResponse | AsyncIterable<AIChunk>>
  /** Whether to show context panel */
  showContext?: boolean
}

/**
 * Main AI Chat Sidebar Component
 * Provides an interactive chat interface for AI-powered Kubernetes assistance
 */
export const AIChatSidebar: React.FC<AIChatSidebarProps> = ({
  clusterData,
  onSendMessage,
  showContext = true
}) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isContextExpanded, setIsContextExpanded] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Handle sending a message
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || !onSendMessage || isStreaming) {
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsStreaming(true)

    try {
      const result = await onSendMessage(inputValue.trim())

      // Check if streaming or complete response
      if (Symbol.asyncIterator in Object(result)) {
        // Streaming response
        let assistantContent = ''
        const assistantId = (Date.now() + 1).toString()

        // Add initial assistant message
        const assistantMessage: Message = {
          id: assistantId,
          role: 'assistant',
          content: '',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])

        // Stream chunks
        for await (const chunk of result as AsyncIterable<AIChunk>) {
          assistantContent += chunk.delta
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantId
                ? {
                    ...msg,
                    content: assistantContent,
                    usage: chunk.usage
                  }
                : msg
            )
          )
        }
      } else {
        // Complete response
        const response = result as AIResponse
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
          usage: response.usage,
          cost: response.cost
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsStreaming(false)
    }
  }, [inputValue, onSendMessage, isStreaming])

  // Handle Enter key (Shift+Enter for new line)
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  return (
    <div className="kui-ai-chat-sidebar">
      {/* Header */}
      <div className="kui-ai-chat-header">
        <div className="kui-ai-chat-title">
          <span className="kui-ai-icon">🤖</span>
          <h3>AI Assistant</h3>
        </div>
        {showContext && clusterData && (
          <button
            className="kui-ai-context-toggle"
            onClick={() => setIsContextExpanded(!isContextExpanded)}
            aria-label={isContextExpanded ? 'Hide context' : 'Show context'}
          >
            {isContextExpanded ? '▼' : '▶'} Context
          </button>
        )}
      </div>

      {/* Context Panel */}
      {showContext && isContextExpanded && clusterData && (
        <ContextPanel clusterData={clusterData} />
      )}

      {/* Messages */}
      <div className="kui-ai-chat-messages">
        <MessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="kui-ai-chat-input-container">
        <textarea
          ref={inputRef}
          className="kui-ai-chat-input"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about Kubernetes..."
          rows={3}
          disabled={isStreaming}
        />
        <button
          className="kui-ai-chat-send"
          onClick={handleSend}
          disabled={!inputValue.trim() || isStreaming}
          aria-label="Send message"
        >
          {isStreaming ? '⏳' : '➤'}
        </button>
      </div>

      {/* Status Bar */}
      {isStreaming && (
        <div className="kui-ai-chat-status">
          <div className="kui-ai-loading-indicator">
            <span className="kui-ai-loading-dot"></span>
            <span className="kui-ai-loading-dot"></span>
            <span className="kui-ai-loading-dot"></span>
          </div>
          <span>AI is thinking...</span>
        </div>
      )}
    </div>
  )
}
