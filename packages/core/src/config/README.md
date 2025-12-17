# Kui Configuration Management System

A comprehensive configuration management system for Kui with multi-source loading, validation, and hot-reloading capabilities.

## Features

- Multi-source configuration loading with precedence
- Environment variable and .env file support
- Type-safe configuration access
- JSON schema validation
- Persistent user settings
- Hot-reload on configuration changes
- Sanitized logging for sensitive data
- Browser and Node.js support

## Configuration Sources

Configuration is loaded from multiple sources with the following precedence (highest to lowest):

1. **Environment Variables** - Runtime environment variables
2. **.env File** - Local .env file in project or user directory
3. **User Settings** - Persistent user configuration file
4. **Defaults** - Built-in default values

## Quick Start

```typescript
import { initializeConfig, getConfigManager } from '@kui-shell/core/config'

// Initialize configuration
const result = await initializeConfig()

if (result.errors.length > 0) {
  console.error('Configuration errors:', result.errors)
}

// Get configuration manager
const config = getConfigManager()

// Get values
const aiEnabled = config.get<boolean>('ai.enabled')
const theme = config.get<string>('ui.theme')

// Set values
await config.set('ui.theme', 'dark')

// Watch for changes
const unwatch = config.watch(event => {
  console.log('Config changed:', event.key, event.newValue)
})
```

## Environment Variables

### AI Configuration

- `KUI_AI_ENABLED` - Enable AI features (boolean)
- `KUI_AI_DEFAULT_PROVIDER` - Default AI provider (string)

### OpenAI Provider

- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_BASE_URL` - OpenAI API base URL
- `OPENAI_MODEL` - OpenAI model name
- `KUI_OPENAI_ENABLED` - Enable OpenAI provider (boolean)

### Anthropic Provider

- `ANTHROPIC_API_KEY` - Anthropic API key
- `ANTHROPIC_BASE_URL` - Anthropic API base URL
- `ANTHROPIC_MODEL` - Anthropic model name
- `KUI_ANTHROPIC_ENABLED` - Enable Anthropic provider (boolean)

### Logging

- `KUI_LOG_LEVEL` - Logging level (debug|info|warn|error)
- `KUI_LOG_FILE` - Log file path
- `KUI_LOG_CONSOLE` - Enable console logging (boolean)

### Feature Flags

- `KUI_FEATURE_AI_ASSIST` - Enable AI assistance (boolean)
- `KUI_FEATURE_ANALYTICS` - Enable analytics (boolean)
- `KUI_FEATURE_TELEMETRY` - Enable telemetry (boolean)
- `KUI_FEATURE_EXPERIMENTAL` - Enable experimental commands (boolean)

### UI Preferences

- `KUI_THEME` - UI theme name
- `KUI_FONT_SIZE` - Font size (8-32)
- `KUI_TAB_SIZE` - Tab size (1-8)

### Performance

- `KUI_CACHE_ENABLED` - Enable caching (boolean)
- `KUI_CACHE_TTL` - Cache TTL in milliseconds
- `KUI_MAX_CONCURRENT_REQUESTS` - Max concurrent requests (1-50)

## .env File

Create a `.env` file in your project root or `~/.kui/` directory:

```bash
# AI Configuration
KUI_AI_ENABLED=true
KUI_AI_DEFAULT_PROVIDER=anthropic

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-xxx
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
KUI_ANTHROPIC_ENABLED=true

# Logging
KUI_LOG_LEVEL=info
KUI_LOG_CONSOLE=true

# Features
KUI_FEATURE_AI_ASSIST=true
```

Generate a template .env file:

```typescript
import { generateEnvTemplate } from '@kui-shell/core/config'

const template = generateEnvTemplate()
console.log(template)
```

## User Settings File

Configuration is persisted to:

- **macOS**: `~/Library/Application Support/@kui-shell/settings/kui-ai-config.json`
- **Linux**: `~/.config/@kui-shell/settings/kui-ai-config.json`
- **Windows**: `%APPDATA%/@kui-shell/settings/kui-ai-config.json`
- **Browser**: localStorage under `kui.ai.config`

## API Reference

### ConfigManager

#### Methods

**`load(envFilePath?: string): Promise<ConfigLoadResult>`**

Load configuration from all sources.

```typescript
const result = await config.load('/path/to/.env')
```

**`save(): Promise<void>`**

Save configuration to persistent storage.

```typescript
await config.save()
```

**`getConfig(): AppConfig`**

Get the complete configuration object.

```typescript
const fullConfig = config.getConfig()
```

**`get<T>(path: string): T | undefined`**

Get a configuration value by path.

```typescript
const apiKey = config.get<string>('ai.providers.openai.apiKey')
const enabled = config.get<boolean>('ai.enabled')
```

**`set(path: string, value: unknown, save?: boolean): Promise<void>`**

Set a configuration value by path.

```typescript
await config.set('ui.theme', 'dark')
await config.set('ai.enabled', true, false) // Don't save immediately
```

**`update(updates: Partial<AppConfig>, save?: boolean): Promise<void>`**

Update multiple configuration values.

```typescript
await config.update({
  logging: { level: 'debug', console: true },
  ui: { theme: 'dark' }
})
```

**`reset(save?: boolean): Promise<void>`**

Reset configuration to defaults.

```typescript
await config.reset()
```

**`watch(callback: ConfigWatchCallback): () => void`**

Watch for configuration changes.

```typescript
const unwatch = config.watch(event => {
  console.log(`${event.key} changed from`, event.oldValue, 'to', event.newValue)
})

// Later: stop watching
unwatch()
```

**`getSource(path: string): ConfigSource | undefined`**

Get the source of a configuration value.

```typescript
const source = config.getSource('ai.providers.openai.apiKey')
// Returns: 'environment_variable' | 'env_file' | 'user_settings' | 'default'
```

**`export(): string`**

Export configuration as JSON string.

```typescript
const json = config.export()
```

**`import(json: string, save?: boolean): Promise<void>`**

Import configuration from JSON string.

```typescript
await config.import(jsonString)
```

**`getSanitized(): AppConfig`**

Get sanitized configuration (API keys masked).

```typescript
const safeConfig = config.getSanitized()
console.log(safeConfig) // API keys are masked
```

### Validation

**`validateConfig(config: AppConfig): ValidationResult`**

Validate a complete configuration object.

```typescript
import { validateConfig } from '@kui-shell/core/config'

const result = validateConfig(myConfig)
if (!result.valid) {
  console.error('Validation errors:', result.errors)
}
```

**`validatePartialConfig(config: Partial<AppConfig>): ValidationResult`**

Validate a partial configuration object.

```typescript
import { validatePartialConfig } from '@kui-shell/core/config'

const result = validatePartialConfig({ ui: { fontSize: 100 } })
// Returns error: Font size must be between 8 and 32
```

## Configuration Schema

### AppConfig

```typescript
interface AppConfig {
  version: string

  ai: {
    enabled: boolean
    providers: {
      openai?: AIProviderConfig
      anthropic?: AIProviderConfig
      [key: string]: AIProviderConfig | undefined
    }
    defaultProvider?: string
  }

  logging: {
    level: 'debug' | 'info' | 'warn' | 'error'
    file?: string
    console: boolean
  }

  features: {
    aiAssist?: boolean
    analytics?: boolean
    telemetry?: boolean
    experimentalCommands?: boolean
    [key: string]: boolean | undefined
  }

  ui: {
    theme?: string
    fontSize?: number
    tabSize?: number
  }

  performance: {
    cacheEnabled: boolean
    cacheTTL: number
    maxConcurrentRequests: number
  }
}
```

### AIProviderConfig

```typescript
interface AIProviderConfig {
  name: string
  apiKey?: string
  baseUrl?: string
  model?: string
  enabled: boolean
}
```

## Error Handling

The configuration system provides detailed error reporting:

```typescript
const result = await initializeConfig()

// Check for errors
if (result.errors.length > 0) {
  console.error('Configuration errors:')
  result.errors.forEach(err => console.error('  -', err))
}

// Check for warnings
if (result.warnings.length > 0) {
  console.warn('Configuration warnings:')
  result.warnings.forEach(warn => console.warn('  -', warn))
}

// Get source information
result.sources.forEach((source, path) => {
  console.log(`${path}: loaded from ${source}`)
})
```

## Security

- API keys are validated for format and placeholder values
- Sensitive data is sanitized in logs via `sanitizeConfig()`
- Configuration files use restrictive permissions
- Environment variables take precedence over files

## Testing

```typescript
import { ConfigManager, DEFAULT_CONFIG } from '@kui-shell/core/config'

describe('ConfigManager', () => {
  let config: ConfigManager

  beforeEach(() => {
    config = new ConfigManager()
  })

  it('should load default configuration', async () => {
    const result = await config.load()
    expect(result.config.version).toBe(DEFAULT_CONFIG.version)
  })

  it('should validate API keys', async () => {
    await config.set('ai.providers.openai.apiKey', 'sk-xxx')
    expect(config.get('ai.providers.openai.apiKey')).toBe('sk-xxx')
  })
})
```

## Migration

If you're migrating from an older configuration system:

```typescript
import { getConfigManager } from '@kui-shell/core/config'

// Import from old format
const oldConfig = loadOldConfig()
const config = getConfigManager()

await config.update({
  ai: {
    enabled: oldConfig.aiEnabled,
    providers: {
      openai: {
        apiKey: oldConfig.openaiKey,
        enabled: true
      }
    }
  }
})

await config.save()
```

## Best Practices

1. **Initialize early**: Load configuration during app startup
2. **Use environment variables**: For deployment-specific settings
3. **Watch for changes**: In development for hot-reload
4. **Validate early**: Check configuration on load, not on use
5. **Use type-safe getters**: Always specify generic type in `get<T>()`
6. **Sanitize logs**: Use `getSanitized()` when logging configuration
7. **Handle errors gracefully**: Always check validation results

## Examples

### Basic Usage

```typescript
import { initializeConfig, getConfigManager } from '@kui-shell/core/config'

// Initialize
await initializeConfig()

// Get manager
const config = getConfigManager()

// Check if AI is enabled
if (config.get<boolean>('ai.enabled')) {
  const provider = config.get<string>('ai.defaultProvider')
  console.log('AI enabled with provider:', provider)
}
```

### Dynamic Updates

```typescript
// Update configuration at runtime
await config.set('logging.level', 'debug')

// Batch updates
await config.update({
  logging: { level: 'info' },
  performance: { cacheEnabled: false }
})
```

### Configuration Watching

```typescript
// Watch for theme changes
const unwatch = config.watch(event => {
  if (event.key === 'ui.theme') {
    applyTheme(event.newValue as string)
  }
})

// Clean up
process.on('exit', unwatch)
```

### Provider Configuration

```typescript
// Configure AI providers
await config.update({
  ai: {
    enabled: true,
    defaultProvider: 'anthropic',
    providers: {
      anthropic: {
        name: 'Anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-5-sonnet-20241022',
        enabled: true
      }
    }
  }
})
```

## Troubleshooting

### Configuration not loading

Check file permissions and paths:

```typescript
const config = getConfigManager()
console.log('Config file path:', config['configFilePath'])
```

### Validation errors

Enable debug logging:

```bash
DEBUG=core/config/* npm start
```

### Environment variables not applied

Verify variable names and check precedence:

```typescript
import { getEnvVarNames } from '@kui-shell/core/config'

console.log('Supported env vars:', getEnvVarNames())
```

## License

Apache-2.0
