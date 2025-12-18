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
 * Mock helpers for testing
 */
import { vi } from 'vitest';
/**
 * Create a mock module with automatic spies
 */
export function createMockModule(exports) {
    const mocks = {};
    exports.forEach(exportName => {
        mocks[exportName] = vi.fn();
    });
    return mocks;
}
/**
 * Create a mock Tauri runtime environment
 */
export function createMockTauriEnvironment() {
    const mockInvoke = vi.fn().mockResolvedValue({ success: true });
    const mockListen = vi.fn().mockResolvedValue(() => { });
    const mockEmit = vi.fn().mockResolvedValue(undefined);
    const mockTauri = {
        core: {
            invoke: mockInvoke
        },
        event: {
            listen: mockListen,
            emit: mockEmit
        }
    };
    // Setup global window.__TAURI__
    if (typeof window !== 'undefined') {
        ;
        window.__TAURI__ = mockTauri;
    }
    return {
        mockInvoke,
        mockListen,
        mockEmit,
        cleanup: () => {
            if (typeof window !== 'undefined') {
                delete window.__TAURI__;
            }
        }
    };
}
/**
 * Create a mock IPC renderer (Electron-style)
 */
export function createMockIpcRenderer() {
    const listeners = new Map();
    return {
        invoke: vi.fn().mockResolvedValue({ success: true }),
        send: vi.fn(),
        on: vi.fn((channel, listener) => {
            if (!listeners.has(channel)) {
                listeners.set(channel, new Set());
            }
            listeners.get(channel).add(listener);
            return { removeListener: () => listeners.get(channel)?.delete(listener) };
        }),
        once: vi.fn((channel, listener) => {
            const onceListener = (...args) => {
                listener(...args);
                listeners.get(channel)?.delete(onceListener);
            };
            if (!listeners.has(channel)) {
                listeners.set(channel, new Set());
            }
            listeners.get(channel).add(onceListener);
        }),
        removeListener: vi.fn((channel, listener) => {
            listeners.get(channel)?.delete(listener);
        }),
        removeAllListeners: vi.fn((channel) => {
            listeners.get(channel)?.clear();
        }),
        emit: (channel, ...args) => {
            listeners.get(channel)?.forEach(listener => listener(...args));
        }
    };
}
/**
 * Create mock kubectl responses
 */
export function createMockKubectlResponse(overrides) {
    return {
        kind: 'Table',
        apiVersion: 'kui-shell/v1',
        metadata: {
            name: 'pods',
            namespace: 'default'
        },
        body: [
            {
                name: 'test-pod',
                status: 'Running',
                ...overrides
            }
        ]
    };
}
/**
 * Create mock command tree
 */
export function createMockCommandTree() {
    const listeners = new Map();
    return {
        listen: vi.fn((route, handler, options) => {
            listeners.set(route, { handler, options });
        }),
        find: vi.fn((command) => {
            return listeners.get(command);
        }),
        subtree: vi.fn((path) => {
            return createMockCommandTree();
        }),
        clearListeners: () => {
            listeners.clear();
        }
    };
}
/**
 * Create mock exec options
 */
export function createMockExecOptions(overrides) {
    return {
        tab: {
            uuid: 'test-tab-uuid'
        },
        block: {
            uuid: 'test-block-uuid'
        },
        ...overrides
    };
}
/**
 * Sleep utility for async testing
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
/**
 * Wait for next tick
 */
export const nextTick = () => new Promise(resolve => process.nextTick(resolve));
// Note: flushPromises is exported from render-helpers.tsx to avoid duplication
//# sourceMappingURL=mock-helpers.js.map