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

import React, { useState, useCallback, useEffect } from 'react'
import type { AIConfig, ModelInfo } from '../types/ai-types'
import { getAvailableModels, getDefaultModel } from '../utils/model-fetcher'
import { ModelManager } from './ModelManager'

interface AISettingsProps {
  config: AIConfig
  onConfigChange?: (config: Partial<AIConfig>) => void
  onTestConnection?: () => Promise<{ success: boolean; error?: string }>
}

export const AISettings: React.FC<AISettingsProps> = ({ config, onConfigChange, onTestConnection }) => {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testError, setTestError] = useState<string>()
  const [showApiKey, setShowApiKey] = useState(false)
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [showModelManager, setShowModelManager] = useState(false)

  const handleChange = useCallback(
    (field: keyof AIConfig, value: unknown) => {
      onConfigChange?.({ [field]: value })
    },
    [onConfigChange]
  )

  const handlePrivacyChange = useCallback(
    (field: keyof AIConfig['privacy'], value: boolean) => {
      onConfigChange?.({ privacy: { ...config.privacy, [field]: value } })
    },
    [config.privacy, onConfigChange]
  )

  const handleProviderChange = useCallback(
    (newProvider: string) => {
      handleChange('provider', newProvider)
      // Automatically update to default model for new provider
      const defaultModel = getDefaultModel(newProvider as any)
      handleChange('model', defaultModel)
    },
    [handleChange]
  )

  const handleTest = useCallback(async () => {
    if (!onTestConnection) return
    setTestStatus('testing')
    setTestError(undefined)
    try {
      const result = await onTestConnection()
      if (result.success) {
        setTestStatus('success')
        setTimeout(() => setTestStatus('idle'), 3000)
      } else {
        setTestStatus('error')
        setTestError(result.error || 'Connection test failed')
      }
    } catch (error) {
      setTestStatus('error')
      setTestError(error instanceof Error ? error.message : 'Unknown error')
    }
  }, [onTestConnection])

  // Fetch available models when provider changes
  useEffect(() => {
    const fetchModels = async () => {
      setLoadingModels(true)
      try {
        const models = await getAvailableModels(config.provider as any, config)
        setAvailableModels(models)
      } catch (error) {
        console.error('Error fetching models:', error)
        setAvailableModels([])
      } finally {
        setLoadingModels(false)
      }
    }

    fetchModels()
  }, [config.provider, config.apiKey, config.baseUrl])

  return (
    <div className="kui-ai-settings">
      <div className="kui-ai-settings-header">
        <h3>⚙️ AI Assistant Settings</h3>
      </div>

      <div className="kui-ai-settings-section">
        <label className="kui-ai-settings-label">AI Provider</label>
        <select
          className="kui-ai-settings-select"
          value={config.provider}
          onChange={e => handleProviderChange(e.target.value)}
        >
          <option value="anthropic">🤖 Anthropic Claude</option>
          <option value="openai">🔵 OpenAI GPT-4</option>
          <option value="azure">☁️ Azure OpenAI</option>
          <option value="ollama">🦙 Ollama (Local)</option>
        </select>
      </div>

      <div className="kui-ai-settings-section">
        <label className="kui-ai-settings-label">API Key</label>
        <div className="kui-ai-settings-input-group">
          <input
            type={showApiKey ? 'text' : 'password'}
            className="kui-ai-settings-input"
            value={config.apiKey || ''}
            onChange={e => handleChange('apiKey', e.target.value)}
            placeholder={config.provider === 'ollama' ? 'Not required for local Ollama' : 'Enter your API key...'}
            disabled={config.provider === 'ollama'}
          />
          <button
            className="kui-ai-settings-button-icon"
            onClick={() => setShowApiKey(!showApiKey)}
            aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
          >
            {showApiKey ? '🙈' : '👁️'}
          </button>
        </div>
        <p className="kui-ai-settings-hint">
          {config.provider === 'anthropic' && (
            <>
              Or set: <code>ANTHROPIC_API_KEY</code> or <code>CLAUDE_API_KEY</code>
            </>
          )}
          {config.provider === 'openai' && (
            <>
              Or set: <code>OPENAI_API_KEY</code>
            </>
          )}
          {config.provider === 'azure' && (
            <>
              Or set: <code>AZURE_OPENAI_KEY</code>
            </>
          )}
          {config.provider === 'ollama' && <>No API key needed for local Ollama</>}
        </p>
      </div>

      <div className="kui-ai-settings-section">
        <div className="kui-ai-settings-label-with-action">
          <label className="kui-ai-settings-label">
            Model {loadingModels && <span className="kui-ai-settings-spinner">⟳</span>}
          </label>
          <button
            className="kui-ai-settings-button-link"
            onClick={() => setShowModelManager(true)}
            title="Manage available models"
          >
            🔧 Manage Models
          </button>
        </div>
        {loadingModels ? (
          <div className="kui-ai-settings-loading">Loading available models...</div>
        ) : (
          <select
            className="kui-ai-settings-select"
            value={config.model}
            onChange={e => handleChange('model', e.target.value)}
          >
            {availableModels.map(model => (
              <option key={model.id} value={model.id}>
                {model.recommended && '⭐ '}
                {model.name}
                {model.description && ` - ${model.description}`}
              </option>
            ))}
          </select>
        )}
        <p className="kui-ai-settings-hint">
          {availableModels.find(m => m.id === config.model)?.contextWindow &&
            `Context: ${availableModels.find(m => m.id === config.model)?.contextWindow?.toLocaleString()} tokens`}
        </p>
      </div>

      {config.provider === 'ollama' && (
        <div className="kui-ai-settings-section">
          <label className="kui-ai-settings-label">Ollama URL</label>
          <input
            type="text"
            className="kui-ai-settings-input"
            value={config.baseUrl || 'http://localhost:11434'}
            onChange={e => handleChange('baseUrl', e.target.value)}
            placeholder="http://localhost:11434"
          />
          <p className="kui-ai-settings-hint">
            Local Ollama server URL. Make sure Ollama is running: <code>ollama serve</code>
          </p>
        </div>
      )}

      {config.provider === 'azure' && (
        <div className="kui-ai-settings-section">
          <label className="kui-ai-settings-label">Azure Endpoint</label>
          <input
            type="text"
            className="kui-ai-settings-input"
            value={config.baseUrl || ''}
            onChange={e => handleChange('baseUrl', e.target.value)}
            placeholder="https://YOUR_RESOURCE.openai.azure.com"
          />
          <p className="kui-ai-settings-hint">Your Azure OpenAI resource endpoint</p>
        </div>
      )}

      <div className="kui-ai-settings-section">
        <button
          className={`kui-ai-settings-button ${testStatus}`}
          onClick={handleTest}
          disabled={testStatus === 'testing' || !config.apiKey}
        >
          {testStatus === 'idle' && '🔌 Test Connection'}
          {testStatus === 'testing' && '⟳ Testing...'}
          {testStatus === 'success' && '✅ Connected!'}
          {testStatus === 'error' && '❌ Failed'}
        </button>
        {testError && <p className="kui-ai-settings-error">{testError}</p>}
      </div>

      <details className="kui-ai-settings-details">
        <summary className="kui-ai-settings-summary">⚙️ Advanced Settings</summary>
        <div className="kui-ai-settings-section">
          <label className="kui-ai-settings-label">Max Tokens</label>
          <input
            type="number"
            className="kui-ai-settings-input"
            value={config.maxTokens}
            onChange={e => handleChange('maxTokens', parseInt(e.target.value))}
            min={100}
            max={200000}
          />
          <p className="kui-ai-settings-hint">Maximum tokens to generate in response</p>
        </div>
        <div className="kui-ai-settings-section">
          <label className="kui-ai-settings-label">Temperature: {config.temperature.toFixed(1)}</label>
          <input
            type="range"
            className="kui-ai-settings-range"
            value={config.temperature}
            onChange={e => handleChange('temperature', parseFloat(e.target.value))}
            min={0}
            max={1}
            step={0.1}
          />
          <p className="kui-ai-settings-hint">Lower = more focused, Higher = more creative (0-1)</p>
        </div>
        <div className="kui-ai-settings-section">
          <label className="kui-ai-settings-label">Timeout (seconds)</label>
          <input
            type="number"
            className="kui-ai-settings-input"
            value={config.timeout}
            onChange={e => handleChange('timeout', parseInt(e.target.value))}
            min={10}
            max={300}
          />
        </div>
      </details>

      <details className="kui-ai-settings-details">
        <summary className="kui-ai-settings-summary">🔒 Privacy Settings</summary>
        <div className="kui-ai-settings-checkbox-group">
          <label className="kui-ai-settings-checkbox">
            <input
              type="checkbox"
              checked={config.privacy.sendClusterMetadata}
              onChange={e => handlePrivacyChange('sendClusterMetadata', e.target.checked)}
            />
            <span>Send cluster metadata (name, version)</span>
          </label>
          <label className="kui-ai-settings-checkbox">
            <input
              type="checkbox"
              checked={config.privacy.sendResourceNames}
              onChange={e => handlePrivacyChange('sendResourceNames', e.target.checked)}
            />
            <span>Send resource names</span>
          </label>
          <label className="kui-ai-settings-checkbox">
            <input
              type="checkbox"
              checked={config.privacy.sendLogs}
              onChange={e => handlePrivacyChange('sendLogs', e.target.checked)}
            />
            <span>Send pod logs</span>
          </label>
          <label className="kui-ai-settings-checkbox">
            <input
              type="checkbox"
              checked={config.privacy.sendPodNames}
              onChange={e => handlePrivacyChange('sendPodNames', e.target.checked)}
            />
            <span>Send pod names</span>
          </label>
        </div>
      </details>

      <details className="kui-ai-settings-details">
        <summary className="kui-ai-settings-summary">⚡ Performance</summary>
        <div className="kui-ai-settings-checkbox-group">
          <label className="kui-ai-settings-checkbox">
            <input
              type="checkbox"
              checked={config.streaming}
              onChange={e => handleChange('streaming', e.target.checked)}
            />
            <span>Enable streaming responses (real-time updates)</span>
          </label>
          <label className="kui-ai-settings-checkbox">
            <input type="checkbox" checked={config.caching} onChange={e => handleChange('caching', e.target.checked)} />
            <span>Enable response caching (faster repeat queries)</span>
          </label>
        </div>
        {config.caching && (
          <div className="kui-ai-settings-section">
            <label className="kui-ai-settings-label">Cache TTL (seconds)</label>
            <input
              type="number"
              className="kui-ai-settings-input"
              value={config.cacheTTL}
              onChange={e => handleChange('cacheTTL', parseInt(e.target.value))}
              min={60}
              max={3600}
            />
          </div>
        )}
      </details>

      <details className="kui-ai-settings-details">
        <summary className="kui-ai-settings-summary">💰 Cost Management</summary>
        <div className="kui-ai-settings-section">
          <label className="kui-ai-settings-label">Monthly Budget (USD)</label>
          <input
            type="number"
            className="kui-ai-settings-input"
            value={config.monthlyLimit || ''}
            onChange={e => handleChange('monthlyLimit', parseFloat(e.target.value) || undefined)}
            placeholder="No limit"
            min={0}
          />
        </div>
        <div className="kui-ai-settings-checkbox-group">
          <label className="kui-ai-settings-checkbox">
            <input
              type="checkbox"
              checked={config.costAlerts}
              onChange={e => handleChange('costAlerts', e.target.checked)}
            />
            <span>Enable cost alerts (notify when approaching limit)</span>
          </label>
        </div>
        <p className="kui-ai-settings-hint">
          {config.provider === 'ollama'
            ? '✨ Free! Ollama runs locally with no API costs'
            : 'Track your API usage and set spending limits'}
        </p>
      </details>

      {showModelManager && (
        <div className="kui-modal-overlay" onClick={() => setShowModelManager(false)}>
          <div className="kui-modal-content" onClick={e => e.stopPropagation()}>
            <ModelManager
              onClose={() => {
                setShowModelManager(false)
                // Reload models after closing manager
                const fetchModels = async () => {
                  setLoadingModels(true)
                  try {
                    const models = await getAvailableModels(config.provider as any, config)
                    setAvailableModels(models)
                  } catch (error) {
                    console.error('Error fetching models:', error)
                  } finally {
                    setLoadingModels(false)
                  }
                }
                fetchModels()
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
