# Configuration Management System

Kui includes a comprehensive configuration management system that handles loading, validation, and persistence of application settings from multiple sources.

## Overview

The configuration system provides:

- **Multi-source loading**: Environment variables, .env files, user settings, and defaults
- **Precedence handling**: Clear priority order for configuration sources
- **Type safety**: Full TypeScript typing for all configuration values
- **Validation**: JSON schema-based validation with helpful error messages
- **Hot reload**: Watch for configuration file changes at runtime
- **Security**: Automatic sanitization of sensitive data in logs
- **Persistence**: Save user preferences to disk or browser storage

## Quick Start

### Basic Usage

```typescript
import { initializeConfig, getConfigManager } from '@kui-shell/core/config'

// Initialize configuration on app startup
const result = await initializeConfig()

if (result.errors.length > 0) {
  console.error('Configuration errors:', result.errors)
}

// Get configuration manager instance
const config = getConfigManager()

// Read values
const theme = config.get<string>('ui.theme')
const aiEnabled = config.get<boolean>('ai.enabled')

// Update values
await config.set('ui.theme', 'dark')
await config.set('logging.level', 'debug')
```

## Configuration Sources

Configuration is loaded from multiple sources with the following precedence (highest to lowest):

1. **Environment Variables** - Runtime environment variables (e.g., `ANTHROPIC_API_KEY`)
2. **.env File** - Local `.env` file in project root or `~/.kui/`
3. **User Settings** - Persistent configuration file in user data directory
4. **Defaults** - Built-in default values

### Example: Configuration Precedence

```bash
# In .env file
KUI_THEME=light

# Set environment variable (overrides .env)
export KUI_THEME=dark

# The final value will be 'dark' (environment variable wins)
```

## Environment Variables

### Setting Up Your Environment

1. Copy the example file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API keys:

   ```bash
   # Anthropic Configuration
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
   KUI_ANTHROPIC_ENABLED=true

   # Enable AI features
   KUI_AI_ENABLED=true
   KUI_AI_DEFAULT_PROVIDER=anthropic
   ```

### Available Environment Variables

#### AI Configuration

- `KUI_AI_ENABLED` - Enable AI features (boolean)
- `KUI_AI_DEFAULT_PROVIDER` - Default AI provider name (string)

#### OpenAI Provider

- `OPENAI_API_KEY` - OpenAI API key (required if using OpenAI)
- `OPENAI_BASE_URL` - OpenAI API base URL (optional)
- `OPENAI_MODEL` - OpenAI model name (default: gpt-4)
- `KUI_OPENAI_ENABLED` - Enable OpenAI provider (boolean)

#### Anthropic Provider

- `ANTHROPIC_API_KEY` - Anthropic API key (required if using Anthropic)
- `ANTHROPIC_BASE_URL` - Anthropic API base URL (optional)
- `ANTHROPIC_MODEL` - Anthropic model name (default: claude-3-5-sonnet-20241022)
- `KUI_ANTHROPIC_ENABLED` - Enable Anthropic provider (boolean)

#### Logging

- `KUI_LOG_LEVEL` - Log level: debug, info, warn, error (default: info)
- `KUI_LOG_FILE` - Path to log file (optional)
- `KUI_LOG_CONSOLE` - Enable console logging (boolean, default: true)

#### Feature Flags

- `KUI_FEATURE_AI_ASSIST` - Enable AI assistance (boolean)
- `KUI_FEATURE_ANALYTICS` - Enable analytics (boolean)
- `KUI_FEATURE_TELEMETRY` - Enable telemetry (boolean)
- `KUI_FEATURE_EXPERIMENTAL` - Enable experimental commands (boolean)

#### UI Preferences

- `KUI_THEME` - UI theme name (default: default)
- `KUI_FONT_SIZE` - Font size in pixels (8-32, default: 14)
- `KUI_TAB_SIZE` - Tab size in spaces (1-8, default: 2)

#### Performance

- `KUI_CACHE_ENABLED` - Enable caching (boolean, default: true)
- `KUI_CACHE_TTL` - Cache TTL in milliseconds (default: 3600000)
- `KUI_MAX_CONCURRENT_REQUESTS` - Max concurrent requests (1-50, default: 5)

## User Settings File

Configuration is persisted to platform-specific locations:

- **macOS**: `~/Library/Application Support/@kui-shell/settings/kui-ai-config.json`
- **Linux**: `~/.config/@kui-shell/settings/kui-ai-config.json`
- **Windows**: `%APPDATA%/@kui-shell/settings/kui-ai-config.json`
- **Browser**: localStorage under `kui.ai.config`

This file stores user preferences that persist across sessions.

## API Reference

### Initialize Configuration

```typescript
import { initializeConfig } from '@kui-shell/core/config'

const result = await initializeConfig('/path/to/.env')
console.log('Errors:', result.errors)
console.log('Warnings:', result.warnings)
```

### Get Configuration Manager

```typescript
import { getConfigManager } from '@kui-shell/core/config'

const config = getConfigManager()
```

### Read Values

```typescript
// Type-safe reading
const theme = config.get<string>('ui.theme')
const fontSize = config.get<number>('ui.fontSize')
const aiEnabled = config.get<boolean>('ai.enabled')

// Get complete config
const fullConfig = config.getConfig()
```

### Update Values

```typescript
// Set single value
await config.set('ui.theme', 'dark')

// Batch update
await config.update({
  ui: { theme: 'dark', fontSize: 16 },
  logging: { level: 'debug' }
})
```

### Watch for Changes

```typescript
const unwatch = config.watch(event => {
  console.log('Changed:', event.key)
  console.log('Old:', event.oldValue)
  console.log('New:', event.newValue)
})

// Stop watching
unwatch()
```

### Configuration Sources

```typescript
// Check where a value came from
const source = config.getSource('ai.providers.openai.apiKey')
// Returns: 'environment_variable' | 'env_file' | 'user_settings' | 'default'
```

### Export/Import

```typescript
// Export as JSON
const json = config.export()

// Import from JSON
await config.import(jsonString)
```

### Reset to Defaults

```typescript
await config.reset()
```

## Advanced Usage

### Conditional Features

```typescript
import { getConfigManager } from '@kui-shell/core/config'

const config = getConfigManager()

// Check feature flags
if (config.get<boolean>('features.aiAssist')) {
  // Enable AI assistance features
}

if (config.get<boolean>('features.experimentalCommands')) {
  // Register experimental commands
}
```

### Dynamic AI Provider Configuration

```typescript
const config = getConfigManager()

// Configure providers at runtime
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

// Get provider configuration
const provider = config.get('ai.providers.anthropic')
console.log('Model:', provider.model)
```

### Hot Reload in Development

```typescript
const config = getConfigManager()

// Watch for file changes
const unwatch = config.watch(event => {
  if (event.key === 'ui.theme') {
    // Reload theme
    applyTheme(event.newValue as string)
  }
})

// File watching is automatic in Node.js
// Changes to kui-ai-config.json will trigger callbacks
```

### Sanitized Logging

```typescript
const config = getConfigManager()

// Get sanitized config (API keys masked)
const safe = config.getSanitized()
console.log(JSON.stringify(safe, null, 2))

// Output:
// {
//   "ai": {
//     "providers": {
//       "anthropic": {
//         "apiKey": "sk-a...xyz"  // Masked!
//       }
//     }
//   }
// }
```

## Validation

The system validates configuration against JSON schemas:

```typescript
import { validateConfig } from '@kui-shell/core/config'

const result = validateConfig(myConfig)

if (!result.valid) {
  console.error('Validation errors:')
  result.errors.forEach(err => console.error('  -', err))
}

if (result.warnings.length > 0) {
  console.warn('Warnings:')
  result.warnings.forEach(warn => console.warn('  -', warn))
}
```

### Common Validation Rules

- API keys must be at least 10 characters
- Font size must be between 8 and 32
- Tab size must be between 1 and 8
- Log level must be: debug, info, warn, or error
- Cache TTL must be non-negative
- Max concurrent requests must be 1-50

## Security Best Practices

1. **Never commit .env files**: Added to `.gitignore`
2. **Use environment variables in production**: Not files
3. **Rotate API keys regularly**: Update in environment
4. **Use sanitized logging**: Call `getSanitized()` before logging
5. **Validate user input**: Automatic validation on all updates
6. **Secure file permissions**: User settings file has restricted access

## Troubleshooting

### Configuration Not Loading

```bash
# Enable debug logging
DEBUG=core/config/* npm start
```

### Check Configuration Sources

```typescript
const result = await initializeConfig()
result.sources.forEach((source, path) => {
  console.log(`${path}: ${source}`)
})
```

### Validation Errors

```typescript
const result = await initializeConfig()
if (result.errors.length > 0) {
  console.error('Configuration errors:')
  result.errors.forEach(err => console.error('  -', err))
}
```

### List All Environment Variables

```typescript
import { getEnvVarNames } from '@kui-shell/core/config'

console.log('Supported environment variables:')
getEnvVarNames().forEach(name => console.log('  -', name))
```

## Migration Guide

### From Old Configuration System

```typescript
import { getConfigManager } from '@kui-shell/core/config'

// Load old configuration
const oldConfig = loadOldConfigFile()

// Migrate to new system
const config = getConfigManager()
await config.update({
  ai: {
    enabled: oldConfig.features.ai,
    providers: {
      openai: {
        apiKey: oldConfig.openai.key,
        enabled: true
      }
    }
  }
})

await config.save()
```

## Examples

See `packages/core/src/config/example.ts` for comprehensive usage examples including:

- Basic initialization and usage
- Setting configuration values
- AI provider configuration
- Watching for changes
- Configuration sources and precedence
- Generating .env templates
- Export/import configuration
- Error handling
- Feature flags
- Resetting configuration

## Further Reading

- [Full API Documentation](../packages/core/src/config/README.md)
- [Type Definitions](../packages/core/src/config/types.ts)
- [Example Code](../packages/core/src/config/example.ts)

## License

Apache-2.0
