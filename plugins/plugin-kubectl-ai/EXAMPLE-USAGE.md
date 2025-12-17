# Example Usage - Runtime Model Configuration

## Quick Start

### 1. Access Model Manager

```bash
# Start Kui
npm run open

# In Kui:
1. Run: kubectl ai config
2. AI Settings opens
3. Look for "Model" dropdown
4. Click "🔧 Manage Models" button
```

### 2. View Current Models

The Model Manager opens showing:

- Provider selector (Anthropic, OpenAI, Azure, Ollama)
- Table of all models for selected provider
- Actions for each model

### 3. Add a New Model

**Scenario**: Add GPT-5 when it releases

```
1. Select "OpenAI GPT" from provider dropdown
2. Click "➕ Add Model" button
3. Fill in the form:
   - Model ID: gpt-5
   - Display Name: GPT-5
   - Description: Fifth generation model
   - Context Window: 500000
   - Recommended: ✓
4. Click "💾 Save"
5. Success! GPT-5 now appears in dropdown
```

### 4. Edit Existing Model

**Scenario**: Update Claude Sonnet description

```
1. Select "Anthropic Claude" provider
2. Find "Claude Sonnet 4.5" in table
3. Click "✏️ Edit" button
4. Update description: "Latest model with vision and function calling"
5. Update context window: 200000 → 500000
6. Click "💾 Save"
7. Changes reflected immediately
```

### 5. Delete Outdated Model

**Scenario**: Remove legacy GPT-3.5

```
1. Select "OpenAI GPT" provider
2. Find "GPT-3.5 Turbo" in table
3. Click "🗑️ Delete" button
4. Confirm deletion
5. Model removed from list
```

### 6. Reset to Defaults

**Scenario**: Configuration got messed up

```
Option A - Reset One Provider:
1. Select problematic provider
2. Click "🔄 Reset Provider"
3. Confirm reset
4. Provider restored to defaults

Option B - Reset Everything:
1. Click "⚠️ Reset All"
2. Confirm (careful!)
3. All providers restored to defaults
```

### 7. Share Configuration with Team

**Scenario**: Standardize team's models

```
Team Lead:
1. Configure models for team
2. Click "💾 Export"
3. Save ai-models-config.json
4. Share via Slack/Email/Git

Team Members:
1. Open Model Manager
2. Click "📂 Import"
3. Select shared config file
4. Configuration applied
5. Everyone has same models!
```

## Code Examples

### Programmatic Access

```typescript
import { getModelsForProvider, addModel, removeModel, resetProviderToDefaults } from './utils/model-config-manager'

// Get all Anthropic models
const claudeModels = getModelsForProvider('anthropic')
console.log(claudeModels)
// [
//   { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', ... },
//   ...
// ]

// Add a new model
addModel('anthropic', {
  id: 'claude-sonnet-5-0-20260101',
  name: 'Claude Sonnet 5.0',
  description: 'Next generation model',
  contextWindow: 1000000,
  recommended: true
})

// Remove a model
removeModel('anthropic', 'claude-3-opus-20240229')

// Reset to defaults
resetProviderToDefaults('anthropic')
```

### Using in React Components

```typescript
import { useState, useEffect } from 'react'
import { getModelsForProvider } from './utils/model-config-manager'
import { getAvailableModels } from './utils/model-fetcher'

function MyComponent() {
  const [models, setModels] = useState([])

  useEffect(() => {
    // Load from config file
    const configModels = getModelsForProvider('anthropic')
    setModels(configModels)

    // Or load with dynamic fetching
    const loadModels = async () => {
      const fetchedModels = await getAvailableModels('openai', config)
      setModels(fetchedModels)
    }
    loadModels()
  }, [])

  return (
    <select>
      {models.map(model => (
        <option key={model.id} value={model.id}>
          {model.recommended && '⭐ '}
          {model.name}
        </option>
      ))}
    </select>
  )
}
```

### Configuration File Manipulation

```typescript
import { loadModelConfig, saveModelConfig, exportConfig, importConfig } from './utils/model-config-manager'

// Load entire configuration
const config = loadModelConfig()
console.log(config)
// {
//   anthropic: [...],
//   openai: [...],
//   azure: [...],
//   ollama: [...],
//   version: '1.0.0',
//   lastUpdated: '2025-12-17T...'
// }

// Modify and save
config.anthropic.push({
  id: 'new-model',
  name: 'New Model',
  recommended: false
})
saveModelConfig(config)

// Export to string
const jsonString = exportConfig()
console.log(jsonString) // JSON string

// Import from string
const newConfig = `{
  "anthropic": [...],
  "openai": [...]
}`
importConfig(newConfig)
```

## Advanced Scenarios

### Scenario 1: Custom Fine-Tuned Model

**Context**: You've fine-tuned a model for Kubernetes troubleshooting

```
1. Train model: openai api fine_tunes.create -m gpt-4 -f dataset.jsonl
2. Get model ID: ft:gpt-4-turbo:org:k8s-specialist:abc123
3. Open Model Manager
4. Select "OpenAI GPT"
5. Click "➕ Add Model"
6. Enter:
   - Model ID: ft:gpt-4-turbo:org:k8s-specialist:abc123
   - Name: GPT-4 K8s Specialist
   - Description: Fine-tuned for Kubernetes troubleshooting
   - Context Window: 128000
   - Recommended: ✓
7. Click "💾 Save"
8. Model ready to use!
```

### Scenario 2: Local Ollama Model

**Context**: Using custom local model

```
1. Create Ollama model:
   ollama create my-k8s-model -f Modelfile

2. Verify: ollama list
   NAME              ID            SIZE      MODIFIED
   my-k8s-model     abc123def     4.1 GB    1 minute ago

3. Open Model Manager
4. Select "Ollama (Local)"
5. Click "➕ Add Model"
6. Enter:
   - Model ID: my-k8s-model
   - Name: My K8s Expert Model
   - Description: Custom trained for our cluster
   - Context Window: 32000
   - Recommended: ✓
7. Click "💾 Save"
8. Model available!
```

### Scenario 3: Azure Deployment

**Context**: Company has Azure OpenAI deployment

```
1. Azure Portal: Create GPT-4 deployment named "production-gpt4"
2. Open Model Manager
3. Select "Azure OpenAI"
4. Click "➕ Add Model"
5. Enter:
   - Model ID: production-gpt4  (deployment name)
   - Name: Production GPT-4
   - Description: Our company deployment
   - Recommended: ✓
6. Click "💾 Save"
7. Update AI Settings:
   - Azure Endpoint: https://yourcompany.openai.azure.com
   - API Key: your-azure-key
8. Test connection
9. Ready to use!
```

### Scenario 4: Version Control

**Context**: Store configuration in dotfiles repo

```bash
# Add to dotfiles
mkdir -p ~/dotfiles/kui
cp ~/.kui/ai-models.json ~/dotfiles/kui/

cd ~/dotfiles
git add kui/ai-models.json
git commit -m "Add Kui AI model configuration"
git push

# On new machine
cd ~/dotfiles
git pull
mkdir -p ~/.kui
ln -s ~/dotfiles/kui/ai-models.json ~/.kui/ai-models.json

# Configuration synced!
```

### Scenario 5: Multiple Profiles

**Context**: Different models for different projects

```bash
# Create profiles
cp ~/.kui/ai-models.json ~/.kui/ai-models-development.json
cp ~/.kui/ai-models.json ~/.kui/ai-models-production.json

# Edit each profile with different models
# Development: Use faster, cheaper models
# Production: Use powerful, expensive models

# Switch profiles
alias kui-dev="cp ~/.kui/ai-models-development.json ~/.kui/ai-models.json && kui"
alias kui-prod="cp ~/.kui/ai-models-production.json ~/.kui/ai-models.json && kui"

# Use
kui-dev   # Loads development models
kui-prod  # Loads production models
```

## Troubleshooting Examples

### Example 1: Configuration File Missing

```bash
# Symptom: No models showing up

# Check if file exists
ls ~/.kui/ai-models.json
# If missing, Kui will auto-create it with defaults

# Or manually create
kui  # Start Kui, file created automatically
# Or open Model Manager and click "Reset All"
```

### Example 2: Invalid JSON

```bash
# Symptom: Error loading configuration

# Validate JSON
cat ~/.kui/ai-models.json | jq
# If error, fix JSON or reset

# Option 1: Fix manually
vim ~/.kui/ai-models.json

# Option 2: Reset to defaults
# Open Model Manager → "⚠️ Reset All"
```

### Example 3: Model ID Wrong

```bash
# Symptom: "Model not found" when using AI

# Check correct model ID from provider
# Anthropic: https://docs.anthropic.com/en/docs/models-overview
# OpenAI: https://platform.openai.com/docs/models

# Update in Model Manager
# 1. Select provider
# 2. Find model
# 3. Click "✏️ Edit"
# 4. Fix model ID
# 5. Click "💾 Save"
```

### Example 4: Changes Not Showing

```bash
# Symptom: Updated models not appearing

# Solution 1: Refresh provider
# Switch to different provider and back

# Solution 2: Close and reopen settings
# Close AI Settings modal
# Reopen: kubectl ai config

# Solution 3: Check file was saved
cat ~/.kui/ai-models.json | jq '.anthropic[0]'
# Verify changes are in file
```

## Best Practices

### 1. Backup Before Major Changes

```bash
# Before editing
cp ~/.kui/ai-models.json ~/.kui/ai-models.backup.json

# If something goes wrong
cp ~/.kui/ai-models.backup.json ~/.kui/ai-models.json
```

### 2. Use Export/Import for Team

```
Don't: Share ~/.kui/ai-models.json file directly
Do: Use Export button → share JSON → Import button
Why: Export formats consistently
```

### 3. Mark Recommended Models

```
Do: Mark 1-2 models as recommended per provider
Why: Helps users choose best model
```

### 4. Add Descriptions

```
Do: Add clear descriptions
Example: "Fast and cheap for simple queries"
Example: "Powerful reasoning for complex problems"
Why: Helps users make informed choices
```

### 5. Keep Model IDs Current

```
Do: Update model IDs when providers release new versions
Example: claude-3-opus → claude-opus-4-5-20251101
Why: Ensures latest models are available
```

## Quick Reference

### Keyboard Shortcuts (in Model Manager)

- `Esc` - Close modal
- `Enter` - Save when editing (in form fields)

### File Locations

```
Configuration: ~/.kui/ai-models.json
Exports: ~/Downloads/ai-models-config.json (default)
```

### API Reference

```typescript
// Get models for provider
getModelsForProvider('anthropic' | 'openai' | 'azure' | 'ollama'): ModelInfo[]

// Add or update model
addModel(provider, model: ModelInfo): void

// Remove model
removeModel(provider, modelId: string): void

// Reset provider
resetProviderToDefaults(provider): void

// Reset all
resetAllToDefaults(): void

// Export configuration
exportConfig(): string

// Import configuration
importConfig(jsonString: string): void

// Validate model
validateModel(model: ModelInfo): { valid: boolean; errors: string[] }
```

---

**For complete documentation**, see [MODEL-CONFIG-SYSTEM.md](MODEL-CONFIG-SYSTEM.md)
