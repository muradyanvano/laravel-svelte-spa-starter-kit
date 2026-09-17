import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    initializeTheme,
    themeState,
    updateAppearance,
} from '@/lib/theme.svelte';

describe('appearance foundation', () => {
    beforeEach(() => {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = '';
        localStorage.clear();
        document.cookie = 'appearance=; Max-Age=0; path=/';
    });

    afterEach(() => {
        document.documentElement.classList.remove('dark');
        localStorage.clear();
    });

    it('defaults to system and writes cookie + localStorage', () => {
        const cleanup = initializeTheme();

        expect(localStorage.getItem('appearance')).toBe('system');
        expect(document.cookie).toContain('appearance=system');
        expect(themeState().appearance.value).toBe('system');

        cleanup();
    });

    it('applies dark class when appearance is dark', () => {
        const cleanup = initializeTheme();

        updateAppearance('dark');

        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(document.documentElement.style.colorScheme).toBe('dark');
        expect(localStorage.getItem('appearance')).toBe('dark');
        expect(document.cookie).toContain('appearance=dark');

        cleanup();
    });

    it('applies light class when appearance is light', () => {
        const cleanup = initializeTheme();

        updateAppearance('light');

        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(document.documentElement.style.colorScheme).toBe('light');
        expect(localStorage.getItem('appearance')).toBe('light');

        cleanup();
    });

    it('resolves system preference via matchMedia', () => {
        const matchMedia = vi.fn().mockReturnValue({
            matches: true,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        });

        vi.stubGlobal('matchMedia', matchMedia);

        const cleanup = initializeTheme();
        updateAppearance('system');

        expect(document.documentElement.classList.contains('dark')).toBe(true);

        cleanup();
        vi.unstubAllGlobals();
    });
});
