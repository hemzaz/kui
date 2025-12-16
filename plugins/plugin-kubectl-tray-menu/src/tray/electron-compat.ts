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
 * Tauri compatibility types for Electron menu APIs
 * In Tauri, menus are handled differently (via Rust backend)
 * These types provide compatibility for TypeScript code
 */

export interface MenuItemConstructorOptions {
  label?: string
  sublabel?: string
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio'
  click?: () => void
  role?: string
  accelerator?: string
  icon?: string
  enabled?: boolean
  visible?: boolean
  checked?: boolean
  submenu?: MenuItemConstructorOptions[]
  id?: string
  position?: string
}
