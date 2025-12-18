# Enhanced Model Selection Feature

## 🎯 Overview

The AI Settings UI now includes **automatic model fetching and selection** for all supported providers. Users can easily browse and select from available models without needing to manually type model names.

## ✨ Features

### 1. **Dynamic Model Loading**
- Automatically fetches available models when provider changes
- Shows loading indicator while fetching
- Falls back to curated default lists if API is unavailable

### 2. **Rich Model Information**
Each model displays:
- ⭐ **Recommended** badge for best models
- **Model name** (human-readable)
- **Description** (capabilities, use case)
- **Context window** size (in tokens)

### 3. **Provider-Specific Support**

#### 🤖 Anthropic Claude
**Models Available:**
- ⭐ **Claude 3.5 Sonnet** (claude-3-5-sonnet-20241022)
  - Most capable model
  - Excellent for complex Kubernetes tasks
  - 200K context window

- **Claude 3.5 Haiku** (claude-3-5-haiku-20241022)
  - Fast and efficient
  - Great for quick queries
  - 200K context window

- **Claude 3 Opus** (claude-3-opus-20240229)
  - Powerful reasoning
  - Best for complex analysis
  - 200K context window

**Dynamic Fetching:** No (Anthropic doesn't provide public model list API)
**Source:** Curated list of latest models

#### 🔵 OpenAI GPT-4
**Models Available:**
- ⭐ **GPT-4 Turbo** (gpt-4-turbo)
  - Latest GPT-4, optimized for speed and cost
  - 128K context window

- **GPT-4** (gpt-4)
  - Original GPT-4, most capable
  - 8K context window

- **GPT-4 32K** (gpt-4-32k)
  - Extended context window
  - 32K context window

- **GPT-3.5 Turbo** (gpt-3.5-turbo)
  - Fast and cost-effective
  - 16K context window

**Dynamic Fetching:** ✅ Yes (when API key provided)
**API:** `/v1/models` endpoint
**Fallback:** Curated list if API unavailable

#### ☁️ Azure OpenAI
**Models Available:**
- ⭐ **GPT-4 (Azure)** (gpt-4)
  - Deployed GPT-4 model

- **GPT-3.5 Turbo (Azure)** (gpt-35-turbo)
  - Deployed GPT-3.5 model

**Dynamic Fetching:** No (Azure models depend on deployment)
**Note:** Users must configure their own deployed models
**Recommendation:** Update list based on your Azure deployment

#### 🦙 Ollama (Local)
**Models Available:**
- ⭐ **Llama 2** (llama2)
  - Open-source Llama 2 model

- **Code Llama** (codellama)
  - Specialized for code generation

- **Mistral** (mistral)
  - Fast and capable open-source model

- **Mixtral** (mixtral)
  - Mixture-of-experts model

- **Neural Chat** (neural-chat)
  - Conversational AI model

**Dynamic Fetching:** ✅ Yes (from local Ollama instance)
**API:** `/api/tags` endpoint
**Fallback:** Curated list if Ollama not running

## 🎨 UI Improvements

### Before (Text Input)
```
Model: [claude-3-5-sonnet-20241022________________]
```
User must:
- Know exact model ID
- Type it correctly
- No guidance on available models

### After (Dropdown with Details)
```
Model: [⭐ Claude 3.5 Sonnet - Most capable model, excellent for complex Kubernetes tasks ▼]
       ⟳ Loading models...
```
User gets:
- ✅ List of all available models
- ✅ Recommended models highlighted
- ✅ Descriptions and capabilities
- ✅ Context window information
- ✅ Automatic model updates when provider changes

## 🔄 User Flow

### 1. **Select Provider**
```
AI Provider: [🤖 Anthropic Claude ▼]
             Options:
             - 🤖 Anthropic Claude
             - 🔵 OpenAI GPT-4
             - ☁️ Azure OpenAI
             - 🦙 Ollama (Local)
```

### 2. **Enter API Key** (if required)
```
API Key: [••••••••••••••••••] [👁️]
         Or set: ANTHROPIC_API_KEY or CLAUDE_API_KEY
```

### 3. **Select Model** (automatically loaded)
```
Model: [⭐ Claude 3.5 Sonnet - Most capable... ▼] ⟳
       Options:
       - ⭐ Claude 3.5 Sonnet - Most capable model...
       - Claude 3.5 Haiku - Fast and efficient...
       - Claude 3 Opus - Powerful reasoning...

Context: 200,000 tokens
```

### 4. **Test Connection**
```
[🔌 Test Connection]  →  [⟳ Testing...]  →  [✅ Connected!]
```

## 🛠️ Technical Implementation

### Files Created/Modified

**1. `src/utils/model-fetcher.ts`** (NEW)
```typescript
// Utility functions for fetching models
export async function getAvailableModels(
  provider: 'anthropic' | 'openai' | 'azure' | 'ollama',
  config?: AIConfig
): Promise<ModelInfo[]>

export function getDefaultModel(provider: string): string

export function getModelDisplayName(modelId: string): string
```

**Features:**
- Curated model lists for all providers
- Dynamic fetching for OpenAI and Ollama
- Fallback to defaults if API unavailable
- Model metadata (name, description, context window)

**2. `src/ui/AISettings.tsx`** (UPDATED)
```typescript
// Added state for model loading
const [availableModels, setAvailableModels] = useState<ModelInfo[]>([])
const [loadingModels, setLoadingModels] = useState(false)

// Auto-fetch models when provider changes
useEffect(() => {
  const fetchModels = async () => {
    setLoadingModels(true)
    const models = await getAvailableModels(config.provider, config)
    setAvailableModels(models)
    setLoadingModels(false)
  }
  fetchModels()
}, [config.provider, config.apiKey, config.baseUrl])

// Model dropdown instead of text input
<select value={config.model} onChange={...}>
  {availableModels.map(model => (
    <option key={model.id} value={model.id}>
      {model.recommended && '⭐ '}
      {model.name}
      {model.description && ` - ${model.description}`}
    </option>
  ))}
</select>
```

**Key Changes:**
- Text input → Dropdown select
- Manual typing → Point and click
- No guidance → Rich model information
- Static list → Dynamic fetching

## 📊 Benefits

### For Users
✅ **Easier Configuration** - No need to research model IDs
✅ **Better Decisions** - See capabilities and recommendations
✅ **Fewer Errors** - No typos in model names
✅ **Up-to-date** - Always see latest available models (OpenAI, Ollama)
✅ **Context Aware** - Know token limits before configuring

### For Developers
✅ **Extensible** - Easy to add new providers
✅ **Maintainable** - Centralized model lists
✅ **Flexible** - Supports both static and dynamic fetching
✅ **Robust** - Fallbacks when API unavailable

## 🚀 Usage Examples

### Example 1: First-Time Setup with Claude
```typescript
// 1. User opens AI Settings
// 2. Selects "Anthropic Claude" from provider dropdown
// 3. Sees models automatically loaded (no waiting)
// 4. Sees "⭐ Claude 3.5 Sonnet" is recommended
// 5. Reads description: "Most capable model, excellent for complex Kubernetes tasks"
// 6. Selects it from dropdown
// 7. Enters API key
// 8. Clicks "Test Connection" → ✅ Connected!
```

### Example 2: Switching to OpenAI with Dynamic Fetch
```typescript
// 1. User switches provider to "OpenAI GPT-4"
// 2. Sees "⟳ Loading available models..."
// 3. API fetches latest models from OpenAI
// 4. Dropdown populates with fetched models
// 5. User selects "⭐ GPT-4 Turbo"
// 6. Sees context: "128,000 tokens"
// 7. Continues configuration
```

### Example 3: Local Ollama Discovery
```typescript
// 1. User has Ollama running locally with custom models
// 2. Selects "Ollama (Local)" provider
// 3. System fetches from http://localhost:11434/api/tags
// 4. Shows user's installed models: llama2, codellama, custom-model
// 5. User selects from their actual installed models
// 6. No API key needed!
```

## 🔮 Future Enhancements

### Potential Additions:
1. **Model Filtering**
   - Filter by capability (chat, code, analysis)
   - Filter by cost tier
   - Filter by context window size

2. **Model Details**
   - Click model for full specifications
   - Show pricing information
   - Show performance benchmarks

3. **Custom Models**
   - Allow users to add custom model IDs
   - Support fine-tuned models
   - Azure custom deployments

4. **Model Recommendations**
   - Suggest model based on task type
   - "Best for debugging" badge
   - "Best for cost" badge

5. **Model Health Status**
   - Show API availability
   - Show response times
   - Show rate limit status

## 📝 Configuration

### Environment Variables
```bash
# Provider-specific
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."
AZURE_OPENAI_KEY="..."

# Override model selection
AI_MODEL="claude-3-5-sonnet-20241022"

# Custom endpoints
AI_BASE_URL="http://localhost:11434"  # Ollama
AI_BASE_URL="https://your-resource.openai.azure.com"  # Azure
```

### Config File (~/.kui/ai-config.json)
```json
{
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "apiKey": "sk-ant-...",
  "maxTokens": 4096,
  "temperature": 0.7,
  "streaming": true,
  "caching": true
}
```

## ✅ Testing Checklist

- [x] Model dropdown displays for all providers
- [x] Loading indicator shows while fetching
- [x] Fallback to default list if API fails
- [x] OpenAI models fetch dynamically with API key
- [x] Ollama models fetch from local instance
- [x] Model descriptions display correctly
- [x] Context window information shown
- [x] Recommended models have ⭐ badge
- [x] Switching providers auto-updates model list
- [x] Switching providers auto-selects default model
- [x] No errors when API unavailable

## 📚 Related Files

- `src/utils/model-fetcher.ts` - Model fetching utilities
- `src/ui/AISettings.tsx` - Updated settings component
- `src/types/ai-types.ts` - Type definitions
- `src/services/*-provider.ts` - Provider implementations

---

**Status**: ✅ IMPLEMENTED & READY
**Version**: 1.0
**Last Updated**: December 17, 2025
**Tested**: Yes
**Documentation**: Complete
