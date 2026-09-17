import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte';
import { afterEach, vi } from 'vitest';
import '@/testing/passkeys-default-mock';

afterEach(() => {
    cleanup();
});

class ResizeObserverMock {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
}

class IntersectionObserverMock {
    observe(): void {}

    unobserve(): void {}

    disconnect(): void {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

// jsdom does not implement scrolling.
Element.prototype.scrollIntoView = (): void => {};

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
