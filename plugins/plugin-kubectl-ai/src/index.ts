/*
 * Copyright 2024 The Kubernetes Authors
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
 * Plugin entry point for kubectl-ai
 * This file exports the preload function for command registration
 */
export { default as preload } from './preload'

// Export types for use by other plugins
export * from './types/ai-types'

// TODO: Export services and collectors once implemented
// export * from './services/provider-factory'
// export { CacheManager } from './cache/cache-manager'
// export { ClusterDataCollector } from './context/cluster-data-collector'
