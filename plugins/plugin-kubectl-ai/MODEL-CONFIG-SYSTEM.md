# AI Model Configuration System

## 🎯 Overview

The AI Model Configuration System provides a **runtime-configurable** mechanism for managing available AI models. Instead of hardcoding model lists in the source code, models are now stored in a configuration file that can be updated from within the application.

## ✨ Key Features

### 1. **Separation of Concerns**

- **Configuration**: Models stored in `~/.kui/ai-models.json`
- **Code**: Application logic separate from model definitions
- **Updates**: Add/edit/delete models without code changes

### 2. **Model Management UI**

- Visual interface for managing models
- Add, edit, and remove models for any provider
- Mark models as recommended
- Import/export configurations
- Reset to defaults

### 3. **Multi-Provider Support**

- Anthropic Claude
- OpenAI GPT
- Azure OpenAI
- Ollama (Local)

### 4. **Automatic Fallbacks**

- Dynamic fetching for OpenAI and Ollama
- Configuration file as fallback
- Built-in defaults if configuration missing

## 📁 File Structure

```
~/.kui/
  └── ai-models.json          # Model configuration file
```

### Configuration File Format

```json
{
  "anthropic": [
    {
      "id": "claude-sonnet-4-5-20250929",
      "name": "Claude Sonnet 4.5",
      "description": "Latest and most capable model",
      "contextWindow": 200000,
      "recommended": true
    }
  ],
  "openai": [...],
  "azure": [...],
  "ollama": [...],
  "version": "1.0.0",
  "lastUpdated": "2025-12-17T..."
}
```

## 🎨 Using the Model Manager UI

### Access Model Manager

1. Open AI Settings
2. Look for the model dropdown
3. Click **"🔧 Manage Models"** button
4. Model Manager opens in a modal

### Managing Models

#### Add New Model

1. Click **"➕ Add Model"** button
2. Fill in model details:
   - **Model ID** (required): API identifier (e.g., `claude-sonnet-4-5-20250929`)
   - **Display Name** (required): Human-readable name (e.g., `Claude Sonnet 4.5`)
   - **Description**: Brief description of capabilities
   - **Context Window**: Maximum tokens (e.g., `200000`)
   - **Recommended**: Mark with ⭐ badge
3. Click **"💾 Save"**

#### Edit Existing Model

1. Find model in the list
2. Click **"✏️ Edit"** button
3. Update fields as needed
4. Click **"💾 Save"**

#### Delete Model

1. Find model in the list
2. Click **"🗑️ Delete"** button
3. Confirm deletion

#### Reset Provider to Defaults

1. Select provider from dropdown
2. Click **"🔄 Reset Provider"**
3. Confirm reset
4. Default models restored for selected provider

#### Reset All Providers

1. Click **"⚠️ Reset All"** button
2. Confirm (this resets ALL providers!)
3. All providers restored to defaults

### Import/Export Configuration

#### Export Configuration

1. Click **"💾 Export"** button
2. Configuration downloads as JSON file
3. Save for backup or sharing

#### Import Configuration

1. Click **"📂 Import"** button
2. Select JSON configuration file
3. Configuration imported and applied

## 🔧 Technical Details

### Architecture

```
┌─────────────────────────────────────────────┐
│           AISettings.tsx                    │
│  ┌─────────────────────────────────────┐   │
│  │  Model Dropdown                      │   │
│  │  [🔧 Manage Models Button]          │   │
│  └─────────────────────────────────────┘   │
│                    │                        │
│                    ▼                        │
│  ┌─────────────────────────────────────┐   │
│  │  ModelManager.tsx (Modal)           │   │
│  │  • View models by provider          │   │
│  │  • Add/Edit/Delete models           │   │
│  │  • Import/Export config             │   │
│  │  • Reset to defaults                │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│      model-config-manager.ts                │
│  • Load/Save configuration file             │
│  • Add/Remove/Update models                 │
│  • Validate model information               │
│  • Import/Export utilities                  │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│      ~/.kui/ai-models.json                  │
│  Persistent configuration storage           │
└─────────────────────────────────────────────┘
```

### Key Components

#### 1. `model-config-manager.ts`

Configuration management utilities:

```typescript
// Load models for a provider
const models = getModelsForProvider('anthropic')

// Add or update a model
addModel('anthropic', {
  id: 'new-model-id',
  name: 'New Model',
  description: 'Description',
  contextWindow: 100000,
  recommended: false
})

// Remove a model
removeModel('anthropic', 'model-id')

// Reset provider to defaults
resetProviderToDefaults('anthropic')

// Export configuration
const config = exportConfig()

// Import configuration
importConfig(jsonString)
```

#### 2. `model-fetcher.ts`

Model fetching with configuration fallback:

```typescript
// Get available models (uses config + dynamic fetching)
const models = await getAvailableModels('openai', config)

// Get default/recommended model
const defaultModel = getDefaultModel('anthropic')

// Get model display name
const displayName = getModelDisplayName('claude-sonnet-4-5-20250929')
```

#### 3. `ModelManager.tsx`

React component for model management:

- Provider selection dropdown
- Model list table
- Add/Edit/Delete operations
- Import/Export buttons
- Reset functionality

#### 4. `AISettings.tsx`

Enhanced with Model Manager access:

- "🔧 Manage Models" button
- Modal overlay for ModelManager
- Automatic model refresh after changes

### Model Information Interface

```typescript
interface ModelInfo {
  id: string // API identifier (required)
  name: string // Display name (required)
  description?: string // Capability description
  contextWindow?: number // Max tokens
  recommended?: boolean // Show ⭐ badge
}
```

### Validation

Models are validated before saving:

- ✅ Model ID must not be empty
- ✅ Model name must not be empty
- ✅ Context window must be positive (if provided)

## 🚀 Usage Examples

### Example 1: Add Latest GPT Model

When OpenAI releases GPT-6:

1. Open Model Manager
2. Select "OpenAI GPT" provider
3. Click "➕ Add Model"
4. Enter details:
   ```
   Model ID: gpt-6
   Name: GPT-6
   Description: Latest generation, unprecedented capabilities
   Context Window: 500000
   Recommended: ✓
   ```
5. Click "💾 Save"
6. Model immediately available in dropdown!

### Example 2: Add Custom Ollama Model

After installing a custom local model:

1. Open Model Manager
2. Select "Ollama (Local)" provider
3. Click "➕ Add Model"
4. Enter details:
   ```
   Model ID: my-custom-model
   Name: My Custom Fine-Tuned Model
   Description: Fine-tuned for Kubernetes troubleshooting
   Context Window: 32000
   Recommended: ✓
   ```
5. Click "💾 Save"
6. Model ready to use!

### Example 3: Update Model Metadata

Update model description with new information:

1. Open Model Manager
2. Find model in list
3. Click "✏️ Edit"
4. Update description: "Now supports function calling and vision"
5. Update context window: 200000 → 500000
6. Click "💾 Save"
7. Changes reflected immediately

### Example 4: Share Configuration with Team

Export configuration for team:

1. Click "💾 Export"
2. Save `ai-models-config.json`
3. Share file with team via Slack/Email
4. Team members click "📂 Import"
5. Select shared file
6. Everyone has same models configured!

### Example 5: Fix Broken Configuration

If configuration becomes corrupted:

1. Open Model Manager
2. Click "⚠️ Reset All"
3. Confirm reset
4. All providers restored to working defaults
5. Reconfigure as needed

## 💾 Configuration Management

### Backup Configuration

```bash
# Configuration location
~/.kui/ai-models.json

# Backup command
cp ~/.kui/ai-models.json ~/.kui/ai-models.backup.json

# Or use Export button in UI
```

### Restore Configuration

```bash
# Restore from backup
cp ~/.kui/ai-models.backup.json ~/.kui/ai-models.json

# Or use Import button in UI
```

### Version Control

```bash
# Add to git (if desired)
git add ~/.kui/ai-models.json
git commit -m "Update AI model configuration"

# Share across machines
git clone your-dotfiles-repo
ln -s ~/dotfiles/kui/ai-models.json ~/.kui/ai-models.json
```

## 🔍 Troubleshooting

### Configuration Not Loading

**Symptom**: Models not appearing in dropdown

**Solution**:

1. Check file exists: `ls ~/.kui/ai-models.json`
2. Check file format: `cat ~/.kui/ai-models.json | jq`
3. Reset to defaults via Model Manager
4. Check browser console for errors

### Model IDs Not Working

**Symptom**: "Model not found" error when using AI

**Solution**:

1. Verify model ID matches provider's API
2. Check Anthropic/OpenAI docs for correct IDs
3. For Ollama, run `ollama list` to see installed models
4. Edit model in Manager to fix ID

### Changes Not Taking Effect

**Symptom**: Updated models not showing

**Solution**:

1. Close and reopen AI Settings
2. Switch to different provider and back
3. Refresh browser page
4. Check file was actually saved: `cat ~/.kui/ai-models.json`

### Import Fails

**Symptom**: "Failed to import configuration"

**Solution**:

1. Validate JSON syntax: `cat config.json | jq`
2. Check required fields present
3. Ensure file format matches expected structure
4. Try resetting to defaults first

## 📊 Benefits

### For Users

✅ **No Code Changes Required** - Update models from UI
✅ **Instant Updates** - Changes take effect immediately
✅ **Easy Sharing** - Export/import configurations
✅ **Safe Experimentation** - Reset to defaults anytime
✅ **Custom Models** - Add fine-tuned or local models
✅ **Team Consistency** - Share configurations across team

### For Developers

✅ **Separation of Concerns** - Config separate from code
✅ **No Recompilation** - Update models without rebuilding
✅ **Maintainability** - Model lists in one place
✅ **Extensibility** - Easy to add new providers
✅ **Testability** - Mock configurations for testing
✅ **Backwards Compatible** - Built-in defaults always work

## 🔮 Future Enhancements

Potential additions:

1. **Model Auto-Discovery**
   - Fetch latest models from provider APIs
   - Suggest new models when available
   - One-click update to latest

2. **Model Performance Tracking**
   - Track response times by model
   - Track costs by model
   - Recommend optimal model for task

3. **Model Presets**
   - "Fast & Cheap" preset (Haiku, GPT-3.5)
   - "Powerful" preset (Opus, GPT-4)
   - Custom user-defined presets

4. **Cloud Sync**
   - Sync configuration across machines
   - Team shared configurations
   - Version history and rollback

5. **Model Compatibility Checks**
   - Validate model IDs against APIs
   - Warn about deprecated models
   - Suggest alternatives

## 📚 Related Documentation

- [AI Integration Summary](AI-INTEGRATION-SUMMARY.md)
- [Model Selection Feature](MODEL-SELECTION-FEATURE.md)
- [AI Settings UI](src/ui/AISettings.tsx)
- [Model Configuration Manager](src/utils/model-config-manager.ts)

---

**Status**: ✅ IMPLEMENTED & READY
**Version**: 1.0.0
**Last Updated**: December 17, 2025
**Configuration File**: `~/.kui/ai-models.json`
**UI Access**: AI Settings → "🔧 Manage Models"
