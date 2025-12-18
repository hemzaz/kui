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

// Jest setup file for Tauri tests

// Mock Debug module
jest.mock('debug', () => {
  return () => () => {}
})

// Setup global test environment
global.console = {
  ...console,
  // Keep native behaviour for other methods, use default log level for these
  log: jest.fn(console.log),
  debug: jest.fn(console.debug),
  info: jest.fn(console.info),
  warn: jest.fn(console.warn),
  error: jest.fn(console.error)
}

// Add custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true
      }
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false
      }
    }
  }
})
