/**
 * Custom render helpers for testing React components
 */
import { ReactElement } from 'react';
import { RenderOptions, RenderResult } from '@testing-library/react';
import { vi } from 'vitest';
/**
 * Custom render function that wraps components with common providers
 */
export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    initialState?: any;
    theme?: string;
}
/**
 * Renders a React component with all necessary providers
 */
export declare function renderWithProviders(ui: ReactElement, options?: CustomRenderOptions): RenderResult;
/**
 * Creates mock callbacks with spies
 */
export declare function createMockCallbacks<T extends Record<string, (...args: any[]) => any>>(callbacks: (keyof T)[]): Record<keyof T, ReturnType<typeof vi.fn>>;
/**
 * Wait for a condition to be true
 */
export declare function waitForCondition(condition: () => boolean, timeout?: number, interval?: number): Promise<void>;
/**
 * Flush all pending promises
 */
export declare function flushPromises(): Promise<void>;
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
