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

import type { Registrar } from '@kui-shell/core'

/**
 * This is the plugin preload entry point
 * Register all /ai commands with the command tree
 */
export default async function (registrar: Registrar) {
  // Register /ai ask command
  await import('./commands/ai-ask').then(_ => _.default(registrar))

  // Register /ai debug command
  await import('./commands/ai-debug').then(_ => _.default(registrar))

  // Register /ai create command
  await import('./commands/ai-create').then(_ => _.default(registrar))

  // Register /ai config command
  await import('./commands/ai-config').then(_ => _.default(registrar))
}
