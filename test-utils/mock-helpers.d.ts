/**
 * Mock helpers for testing
 */
import { vi } from 'vitest';
/**
 * Create a mock module with automatic spies
 */
export declare function createMockModule<T extends Record<string, any>>(exports: (keyof T)[]): Record<keyof T, ReturnType<typeof vi.fn>>;
/**
 * Create a mock Tauri runtime environment
 */
export declare function createMockTauriEnvironment(): {
    mockInvoke: import("vitest").Mock<any, any>;
    mockListen: import("vitest").Mock<any, any>;
    mockEmit: import("vitest").Mock<any, any>;
    cleanup: () => void;
};
/**
 * Create a mock IPC renderer (Electron-style)
 */
export declare function createMockIpcRenderer(): {
    invoke: import("vitest").Mock<any, any>;
    send: import("vitest").Mock<any, any>;
    on: import("vitest").Mock<[channel: string, listener: (...args: any[]) => void], {
        removeListener: () => boolean;
    }>;
    once: import("vitest").Mock<[channel: string, listener: (...args: any[]) => void], void>;
    removeListener: import("vitest").Mock<[channel: string, listener: (...args: any[]) => void], void>;
    removeAllListeners: import("vitest").Mock<[channel: string], void>;
    emit: (channel: string, ...args: any[]) => void;
};
/**
 * Create mock kubectl responses
 */
export declare function createMockKubectlResponse(overrides?: Partial<any>): {
    kind: string;
    apiVersion: string;
    metadata: {
        name: string;
        namespace: string;
    };
    body: {
        name: string;
        status: string;
    }[];
};
/**
 * Create mock command tree
 */
export declare function createMockCommandTree(): any;
/**
 * Create mock exec options
 */
export declare function createMockExecOptions(overrides?: Partial<any>): {
    tab: {
        uuid: string;
    };
    block: {
        uuid: string;
    };
};
/**
 * Sleep utility for async testing
 */
export declare const sleep: (ms: number) => Promise<unknown>;
/**
 * Wait for next tick
 */
export declare const nextTick: () => Promise<unknown>;
