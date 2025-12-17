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

// Export types
export * from './types'

// Export defaults and utilities
export { DEFAULT_CONFIG, deepMerge, getNestedValue, setNestedValue } from './defaults'

// Export validation
export { validateConfig, validatePartialConfig, sanitizeConfig } from './validator'

// Export environment loader
export { loadFromEnv, getEnvVarNames, generateEnvTemplate } from './env-loader'

// Export configuration manager
export { ConfigManager, getConfigManager, initializeConfig } from './config-manager'
