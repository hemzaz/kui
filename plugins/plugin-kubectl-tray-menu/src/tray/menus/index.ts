/*
 * Copyright 2022 The Kubernetes Authors
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

import { CreateWindowFunction } from '@kui-shell/core'
import UpdateFunction from '../update'

/**
 * Stubbed out for Tauri migration.
 * Tray menu functionality is not currently supported in Tauri.
 * Tauri has different APIs for system tray menus that would need separate implementation.
 */
export default async function buildContextMenu(
  _createWindow as __createWindow: CreateWindowFunction,
  _updateFn as __updateFn: UpdateFunction
): Promise<any> {
  // No-op: Electron Menu removed for Tauri
  console.warn('Tray menu buildContextMenu called but not implemented for Tauri')
  return null
}
