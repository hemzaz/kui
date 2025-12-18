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

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  usage?: { inputTokens: number; outputTokens: number }
  cost?: number
}

interface MessageListProps {
  messages: Message[]
}

function formatTokens(tokens: number): string {
  return tokens.toLocaleString()
}

function formatCost(cost: number): string {
  return '$' + cost.toFixed(4)
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function parseMarkdown(text: string): string {
  let html = text
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const language = lang || 'text'
    return '<pre><code class="language-' + language + '">' + escapeHtml(code.trim()) + '</code></pre>'
  })
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  html = html.replace(/\n/g, '<br>')
  return html
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  if (messages.length === 0) {
    return (
      <div className="kui-ai-message-list-empty">
        <div className="kui-ai-empty-icon">💬</div>
        <p>No messages yet</p>
        <p className="kui-ai-empty-hint">Ask a question to get started!</p>
      </div>
    )
  }

  return (
    <div className="kui-ai-message-list">
      {messages.map(message => (
        <div key={message.id} className={'kui-ai-message kui-ai-message-' + message.role}>
          <div className="kui-ai-message-header">
            <span className="kui-ai-message-role">
              {message.role === 'user' ? '👤' : '🤖'}
              {message.role === 'user' ? 'You' : 'AI Assistant'}
            </span>
            <span className="kui-ai-message-time">{formatTime(message.timestamp)}</span>
          </div>
          <div
            className="kui-ai-message-content"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(message.content) }}
          />
          {message.usage && (
            <div className="kui-ai-message-meta">
              <span className="kui-ai-message-tokens">
                ⚡ {formatTokens(message.usage.inputTokens + message.usage.outputTokens)} tokens
              </span>
              {message.cost && (
                <span className="kui-ai-message-cost">💰 {formatCost(message.cost)}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
