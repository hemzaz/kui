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

/**
 * Configuration Management Examples
 *
 * This file demonstrates various usage patterns of the Kui configuration system.
 * These examples can be used as reference or in documentation.
 */

import { initializeConfig, getConfigManager, generateEnvTemplate } from './index'

/**
 * Example 1: Basic initialization and usage
 */
export async function example1_BasicUsage() {
  console.log('=== Example 1: Basic Usage ===\n')

  // Initialize configuration
  const result = await initializeConfig()

  console.log('Configuration loaded successfully!')
  console.log('Errors:', result.errors.length)
  console.log('Warnings:', result.warnings.length)

  // Get the configuration manager
  const config = getConfigManager()

  // Read configuration values
  const aiEnabled = config.get<boolean>('ai.enabled')
  const theme = config.get<string>('ui.theme')
  const logLevel = config.get<string>('logging.level')

  console.log('\nCurrent Configuration:')
  console.log('  AI Enabled:', aiEnabled)
  console.log('  Theme:', theme)
  console.log('  Log Level:', logLevel)
}

/**
 * Example 2: Setting configuration values
 */
export async function example2_SettingValues() {
  console.log('\n=== Example 2: Setting Values ===\n')

  const config = getConfigManager()

  // Set individual values
  await config.set('ui.theme', 'dark')
  await config.set('logging.level', 'debug')

  console.log('Updated theme to:', config.get('ui.theme'))
  console.log('Updated log level to:', config.get('logging.level'))

  // Batch update multiple values
  await config.update({
    ui: {
      theme: 'light',
      fontSize: 16
    },
    performance: {
      cacheEnabled: true,
      cacheTTL: 7200000,
      maxConcurrentRequests: 10
    }
  })

  console.log('\nAfter batch update:')
  console.log('  Theme:', config.get('ui.theme'))
  console.log('  Font Size:', config.get('ui.fontSize'))
}

/**
 * Example 3: AI Provider configuration
 */
export async function example3_AIProviders() {
  console.log('\n=== Example 3: AI Providers ===\n')

  const config = getConfigManager()

  // Configure Anthropic provider
  await config.update({
    ai: {
      enabled: true,
      defaultProvider: 'anthropic',
      providers: {
        anthropic: {
          name: 'Anthropic',
          apiKey: process.env.ANTHROPIC_API_KEY || 'your-api-key-here',
          model: 'claude-3-5-sonnet-20241022',
          enabled: true
        }
      }
    }
  })

  const aiConfig = config.get('ai')
  console.log('AI Configuration:', JSON.stringify(config.getSanitized().ai, null, 2))
}

/**
 * Example 4: Watching for configuration changes
 */
export async function example4_WatchingChanges() {
  console.log('\n=== Example 4: Watching Changes ===\n')

  const config = getConfigManager()

  // Set up a watcher
  const unwatch = config.watch(event => {
    console.log(`Configuration changed:`)
    console.log(`  Key: ${event.key}`)
    console.log(`  Old Value: ${JSON.stringify(event.oldValue)}`)
    console.log(`  New Value: ${JSON.stringify(event.newValue)}`)
    console.log(`  Source: ${event.source}`)
    console.log(`  Timestamp: ${event.timestamp}`)
  })

  // Make some changes
  await config.set('ui.theme', 'dark')
  await config.set('logging.level', 'debug')

  // Clean up
  setTimeout(() => {
    unwatch()
    console.log('\nStopped watching configuration changes')
  }, 1000)
}

/**
 * Example 5: Configuration sources and precedence
 */
export async function example5_ConfigurationSources() {
  console.log('\n=== Example 5: Configuration Sources ===\n')

  const result = await initializeConfig()
  const config = getConfigManager()

  console.log('Configuration Sources:')
  result.sources.forEach((source, path) => {
    const value = config.get(path)
    console.log(`  ${path}: ${source} = ${JSON.stringify(value)}`)
  })

  // Check source of specific values
  const themeSource = config.getSource('ui.theme')
  const aiEnabledSource = config.getSource('ai.enabled')

  console.log('\nSpecific Sources:')
  console.log('  ui.theme:', themeSource)
  console.log('  ai.enabled:', aiEnabledSource)
}

/**
 * Example 6: Generating .env template
 */
export function example6_GenerateEnvTemplate() {
  console.log('\n=== Example 6: Generate .env Template ===\n')

  const template = generateEnvTemplate()
  console.log('Generated .env template:')
  console.log(template)
}

/**
 * Example 7: Export and import configuration
 */
export async function example7_ExportImport() {
  console.log('\n=== Example 7: Export/Import Configuration ===\n')

  const config = getConfigManager()

  // Export current configuration
  const exported = config.export()
  console.log('Exported configuration (first 200 chars):')
  console.log(exported.substring(0, 200) + '...')

  // Modify and re-import
  const parsed = JSON.parse(exported)
  parsed.ui.theme = 'custom-theme'

  await config.import(JSON.stringify(parsed))
  console.log('\nAfter import, theme is:', config.get('ui.theme'))
}

/**
 * Example 8: Error handling and validation
 */
export async function example8_ErrorHandling() {
  console.log('\n=== Example 8: Error Handling ===\n')

  const config = getConfigManager()

  try {
    // Try to set invalid value
    await config.set('ui.fontSize', 100) // Max is 32
  } catch (error) {
    console.log('Validation error caught:', error)
  }

  try {
    // Try to set invalid log level
    await config.set('logging.level', 'invalid')
  } catch (error) {
    console.log('Validation error caught:', error)
  }

  console.log('\nValidation works correctly!')
}

/**
 * Example 9: Feature flags
 */
export async function example9_FeatureFlags() {
  console.log('\n=== Example 9: Feature Flags ===\n')

  const config = getConfigManager()

  // Enable features
  await config.update({
    features: {
      aiAssist: true,
      experimentalCommands: true,
      analytics: false,
      telemetry: false
    }
  })

  // Check feature flags
  const features = config.get('features')
  console.log('Feature Flags:')
  console.log(JSON.stringify(features, null, 2))

  // Use feature flags in code
  if (config.get<boolean>('features.aiAssist')) {
    console.log('\n✓ AI Assist feature is enabled')
  }

  if (config.get<boolean>('features.experimentalCommands')) {
    console.log('✓ Experimental commands are enabled')
  }
}

/**
 * Example 10: Reset configuration
 */
export async function example10_ResetConfiguration() {
  console.log('\n=== Example 10: Reset Configuration ===\n')

  const config = getConfigManager()

  console.log('Current theme:', config.get('ui.theme'))

  // Make some changes
  await config.set('ui.theme', 'custom-dark')
  console.log('Changed theme to:', config.get('ui.theme'))

  // Reset to defaults
  await config.reset()
  console.log('After reset, theme is:', config.get('ui.theme'))
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  try {
    await example1_BasicUsage()
    await example2_SettingValues()
    await example3_AIProviders()
    await example4_WatchingChanges()
    await example5_ConfigurationSources()
    example6_GenerateEnvTemplate()
    await example7_ExportImport()
    await example8_ErrorHandling()
    await example9_FeatureFlags()
    await example10_ResetConfiguration()

    console.log('\n✓ All examples completed successfully!')
  } catch (error) {
    console.error('\n✗ Example failed:', error)
    throw error
  }
}

// Export individual example runner
if (require.main === module) {
  runAllExamples().catch(console.error)
}
