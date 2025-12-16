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
 * Spectron compatibility stub for Tauri migration
 *
 * Spectron was the Electron testing framework. With Tauri, we use WebDriver directly.
 * These stubs allow existing test code to compile without Spectron dependencies.
 *
 * TODO: Migrate tests to use Tauri's WebDriver testing approach:
 * - https://tauri.app/v1/guides/testing/webdriver/introduction
 */

export interface WebdriverElement {
  getText: () => Promise<string>
  getValue: () => Promise<string>
  getAttribute: (name: string) => Promise<string>
  click: () => Promise<void>
  waitForExist: (options?: any) => Promise<void>
  waitForDisplayed: (options?: any) => Promise<void>
  isFocused: () => Promise<boolean>
  getHTML: () => Promise<string>
  [key: string]: any
}

export type ElementArray = WebdriverElement[]

export interface WebdriverIOAsync {
  execute: (script: string | ((...args: any[]) => any), ...args: any[]) => Promise<any>
  executeAsync: (script: string | ((...args: any[]) => any), ...args: any[]) => Promise<any>
  url: (url?: string) => Promise<string>
  getUrl: () => Promise<string>
  waitUntil: (condition: () => boolean | Promise<boolean>, options?: any) => Promise<void>
  keys: (keys: string | string[]) => Promise<void>
  click: (selector: string) => Promise<void>
  getValue: (selector: string) => Promise<string>
  getAttribute: (selector: string, attributeName: string) => Promise<string>
  getText: (selector: string) => Promise<string>
  isExisting: (selector: string) => Promise<boolean>
  waitForExist: (selector: string, options?: any) => Promise<void>
  waitForVisible: (selector: string, options?: any) => Promise<void>
  pause: (milliseconds: number) => Promise<void>
  $: (selector: string) => Promise<WebdriverElement>
  $$: (selector: string) => Promise<ElementArray>
  [key: string]: any
}

export interface Application {
  client: WebdriverIOAsync
  browserWindow: {
    isVisible: () => Promise<boolean>
    isMinimized: () => Promise<boolean>
    isDevToolsOpened: () => Promise<boolean>
    isFocused: () => Promise<boolean>
    getBounds: () => Promise<{ x: number; y: number; width: number; height: number }>
  }
  electron: {
    remote: {
      app: {
        getPath: (name: string) => Promise<string>
        getAppPath: () => Promise<string>
      }
    }
    clipboard: {
      writeText: (_text: string) => void
      readText: () => string
    }
  }
  start: () => Promise<Application>
  stop: () => Promise<void>
  restart: () => Promise<Application>
  isRunning: () => boolean
}

/**
 * Stub Application instance for Tauri compatibility
 * This allows tests to compile but they will not function correctly
 */
export function createApplicationStub(): Application {
  const stub: any = {
    client: new Proxy({}, {
      get: (target, prop) => {
        return async (...args: any[]) => {
          console.warn(`Spectron stub: ${String(prop)} called but not implemented for Tauri`)
          return null
        }
      }
    }),
    browserWindow: {
      isVisible: async () => true,
      isMinimized: async () => false,
      isDevToolsOpened: async () => false,
      isFocused: async () => true,
      getBounds: async () => ({ x: 0, y: 0, width: 1280, height: 960 })
    },
    electron: {
      remote: {
        app: {
          getPath: async () => process.cwd(),
          getAppPath: async () => process.cwd()
        }
      },
      clipboard: {
        writeText: (_text: string) => {
          console.warn('Spectron stub: clipboard.writeText called but not implemented for Tauri')
        },
        readText: () => {
          console.warn('Spectron stub: clipboard.readText called but not implemented for Tauri')
          return ''
        }
      }
    },
    start: async () => stub,
    stop: async () => {},
    restart: async () => stub,
    isRunning: () => false
  }
  return stub
}
