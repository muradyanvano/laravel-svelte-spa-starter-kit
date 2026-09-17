import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAuthStateForTesting } from '@/auth/auth.svelte';
import { http } from '@/lib/http';
import Appearance from '@/pages/settings/Appearance.svelte';

vi.mock('@/lib/auth-api', () => ({
    fetchCurrentUser: vi.fn(),
    logout: vi.fn(),
}));

vi.mock('@/router', () => ({
    navigate: vi.fn().mockResolvedValue(undefined),
    p: (path: string) => path,
    route: { pathname: '/settings/appearance', params: {}, search: {} },
}));

const verifiedUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    email_verified_at: '2026-01-01T00:00:00.000000Z',
};

describe('Appearance settings', () => {
    beforeEach(() => {
        resetAuthStateForTesting({
            user: verifiedUser,
            status: 'authenticated',
        });
    });

    it('switches appearance without calling the API', async () => {
        const request = vi.spyOn(http, 'request');

        render(Appearance);

        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: 'Dark' }));

        expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute(
            'aria-pressed',
            'true',
        );
        expect(localStorage.getItem('appearance')).toBe('dark');
        expect(request).not.toHaveBeenCalled();
    });
});
