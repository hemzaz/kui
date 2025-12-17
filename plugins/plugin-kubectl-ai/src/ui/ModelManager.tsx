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

import React, { useState, useEffect } from 'react'
import type { ModelInfo } from '../types/ai-types'
import {
  getModelsForProvider,
  addModel,
  removeModel,
  resetProviderToDefaults,
  resetAllToDefaults,
  validateModel,
  exportConfig,
  importConfig
} from '../utils/model-config-manager'

interface ModelManagerProps {
  onClose?: () => void
}

export const ModelManager: React.FC<ModelManagerProps> = ({ onClose }) => {
  const [selectedProvider, setSelectedProvider] = useState<'anthropic' | 'openai' | 'azure' | 'ollama'>('anthropic')
  const [models, setModels] = useState<ModelInfo[]>([])
  const [editingModel, setEditingModel] = useState<ModelInfo | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState<string>()

  // Load models when provider changes
  useEffect(() => {
    loadModels()
  }, [selectedProvider])

  const loadModels = () => {
    try {
      const providerModels = getModelsForProvider(selectedProvider)
      setModels(providerModels)
      setError(undefined)
    } catch (err) {
      setError('Failed to load models: ' + (err as Error).message)
    }
  }

  const handleSaveModel = (model: ModelInfo) => {
    try {
      // Validate model
      const validation = validateModel(model)
      if (!validation.valid) {
        setError(validation.errors.join(', '))
        return
      }

      // Save model
      addModel(selectedProvider, model)

      // Reload models
      loadModels()

      // Clear editing state
      setEditingModel(null)
      setIsAddingNew(false)
      setSuccess('Model saved successfully')
      setTimeout(() => setSuccess(undefined), 3000)
    } catch (err) {
      setError('Failed to save model: ' + (err as Error).message)
    }
  }

  const handleDeleteModel = (modelId: string) => {
    if (!confirm(`Are you sure you want to delete model "${modelId}"?`)) {
      return
    }

    try {
      removeModel(selectedProvider, modelId)
      loadModels()
      setSuccess('Model deleted successfully')
      setTimeout(() => setSuccess(undefined), 3000)
    } catch (err) {
      setError('Failed to delete model: ' + (err as Error).message)
    }
  }

  const handleResetProvider = () => {
    if (!confirm(`Reset ${selectedProvider} models to defaults?`)) {
      return
    }

    try {
      resetProviderToDefaults(selectedProvider)
      loadModels()
      setSuccess('Provider reset to defaults')
      setTimeout(() => setSuccess(undefined), 3000)
    } catch (err) {
      setError('Failed to reset provider: ' + (err as Error).message)
    }
  }

  const handleResetAll = () => {
    if (!confirm('Reset ALL providers to defaults? This cannot be undone.')) {
      return
    }

    try {
      resetAllToDefaults()
      loadModels()
      setSuccess('All providers reset to defaults')
      setTimeout(() => setSuccess(undefined), 3000)
    } catch (err) {
      setError('Failed to reset all: ' + (err as Error).message)
    }
  }

  const handleExport = () => {
    try {
      const config = exportConfig()
      const blob = new Blob([config], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ai-models-config.json'
      a.click()
      URL.revokeObjectURL(url)
      setSuccess('Configuration exported successfully')
      setTimeout(() => setSuccess(undefined), 3000)
    } catch (err) {
      setError('Failed to export: ' + (err as Error).message)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const content = await file.text()
      importConfig(content)
      loadModels()
      setSuccess('Configuration imported successfully')
      setTimeout(() => setSuccess(undefined), 3000)
    } catch (err) {
      setError('Failed to import: ' + (err as Error).message)
    }
  }

  return (
    <div className="kui-model-manager">
      <div className="kui-model-manager-header">
        <h2>🔧 AI Model Configuration</h2>
        <button className="kui-button-icon" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      {error && <div className="kui-model-manager-error">❌ {error}</div>}
      {success && <div className="kui-model-manager-success">✅ {success}</div>}

      <div className="kui-model-manager-toolbar">
        <div className="kui-model-manager-provider-selector">
          <label>Provider:</label>
          <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value as any)}>
            <option value="anthropic">🤖 Anthropic Claude</option>
            <option value="openai">🔵 OpenAI GPT</option>
            <option value="azure">☁️ Azure OpenAI</option>
            <option value="ollama">🦙 Ollama (Local)</option>
          </select>
        </div>

        <div className="kui-model-manager-actions">
          <button
            className="kui-button kui-button-primary"
            onClick={() => {
              setIsAddingNew(true)
              setEditingModel({
                id: '',
                name: '',
                description: '',
                contextWindow: undefined,
                recommended: false
              })
            }}
          >
            ➕ Add Model
          </button>
          <button className="kui-button" onClick={handleResetProvider}>
            🔄 Reset Provider
          </button>
          <button className="kui-button" onClick={handleExport}>
            💾 Export
          </button>
          <label className="kui-button">
            📂 Import
            <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
          </label>
          <button className="kui-button kui-button-danger" onClick={handleResetAll}>
            ⚠️ Reset All
          </button>
        </div>
      </div>

      {(editingModel || isAddingNew) && (
        <ModelEditor
          model={editingModel!}
          onSave={handleSaveModel}
          onCancel={() => {
            setEditingModel(null)
            setIsAddingNew(false)
          }}
        />
      )}

      <div className="kui-model-manager-list">
        <table>
          <thead>
            <tr>
              <th>Model ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Context Window</th>
              <th>Recommended</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {models.map(model => (
              <tr key={model.id}>
                <td>
                  <code>{model.id}</code>
                </td>
                <td>{model.name}</td>
                <td>{model.description}</td>
                <td>{model.contextWindow?.toLocaleString() || 'N/A'}</td>
                <td>{model.recommended ? '⭐' : ''}</td>
                <td>
                  <button
                    className="kui-button-small"
                    onClick={() => {
                      setEditingModel(model)
                      setIsAddingNew(false)
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button className="kui-button-small kui-button-danger" onClick={() => handleDeleteModel(model.id)}>
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {models.length === 0 && (
          <div className="kui-model-manager-empty">
            <p>No models configured for {selectedProvider}</p>
            <button className="kui-button" onClick={() => handleResetProvider()}>
              Load Defaults
            </button>
          </div>
        )}
      </div>

      <div className="kui-model-manager-footer">
        <p>
          <strong>Configuration file:</strong> <code>~/.kui/ai-models.json</code>
        </p>
        <p>Models are loaded from this file at startup. Changes take effect immediately.</p>
      </div>
    </div>
  )
}

interface ModelEditorProps {
  model: ModelInfo
  onSave: (model: ModelInfo) => void
  onCancel: () => void
}

const ModelEditor: React.FC<ModelEditorProps> = ({ model, onSave, onCancel }) => {
  const [editedModel, setEditedModel] = useState<ModelInfo>(model)

  const handleChange = (field: keyof ModelInfo, value: any) => {
    setEditedModel(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="kui-model-editor">
      <h3>{model.id ? 'Edit Model' : 'Add New Model'}</h3>

      <div className="kui-model-editor-form">
        <div className="kui-form-field">
          <label>Model ID *</label>
          <input
            type="text"
            value={editedModel.id}
            onChange={e => handleChange('id', e.target.value)}
            placeholder="e.g., claude-sonnet-4-5-20250929"
            required
          />
          <small>Unique identifier used by the API</small>
        </div>

        <div className="kui-form-field">
          <label>Display Name *</label>
          <input
            type="text"
            value={editedModel.name}
            onChange={e => handleChange('name', e.target.value)}
            placeholder="e.g., Claude Sonnet 4.5"
            required
          />
          <small>Human-readable name shown in UI</small>
        </div>

        <div className="kui-form-field">
          <label>Description</label>
          <textarea
            value={editedModel.description || ''}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="Brief description of model capabilities"
            rows={2}
          />
        </div>

        <div className="kui-form-field">
          <label>Context Window (tokens)</label>
          <input
            type="number"
            value={editedModel.contextWindow || ''}
            onChange={e => handleChange('contextWindow', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="e.g., 200000"
            min={0}
          />
          <small>Maximum number of tokens the model can process</small>
        </div>

        <div className="kui-form-field">
          <label>
            <input
              type="checkbox"
              checked={editedModel.recommended || false}
              onChange={e => handleChange('recommended', e.target.checked)}
            />
            <span>Mark as recommended (shows ⭐ badge)</span>
          </label>
        </div>

        <div className="kui-model-editor-actions">
          <button className="kui-button kui-button-primary" onClick={() => onSave(editedModel)}>
            💾 Save
          </button>
          <button className="kui-button" onClick={onCancel}>
            ✕ Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
