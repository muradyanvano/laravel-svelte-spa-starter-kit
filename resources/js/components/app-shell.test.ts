import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAuthStateForTesting, useAuth } from '@/auth/auth.svelte';
import { fetchCurrentUser, logout } from '@/lib/auth-api';
import Dashboard from '@/pages/Dashboard.svelte';
import { navigate } from '@/router';

vi.mock('@/lib/auth-api', () => ({
    fetchCurrentUser: vi.fn(),
    logout: vi.fn(),
}));

vi.mock('@/router', () => ({
    navigate: vi.fn().mockResolvedValue(undefined),
    p: (path: string) => path,
    route: { pathname: '/dashboard', params: {}, search: {} },
}));

const verifiedUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    email_verified_at: '2026-01-01T00:00:00.000000Z',
};

describe('application shell', () => {
    beforeEach(() => {
        resetAuthStateForTesting({
            user: verifiedUser,
            status: 'authenticated',
        });
        vi.mocked(fetchCurrentUser).mockReset();
        vi.mocked(logout).mockReset();
        vi.mocked(navigate).mockClear();
    });

    it('links the sidebar footer to this starter kit repository', () => {
        render(Dashboard);

        expect(
            screen.getByRole('link', { name: 'Repository' }),
        ).toHaveAttribute(
            'href',
            'https://github.com/muradyanvano/laravel-svelte-spa-starter-kit',
        );
        expect(
            screen.getByRole('link', { name: 'Documentation' }),
        ).toHaveAttribute('href', 'https://laravel.com/docs');
    });

    it('logs out from the user menu without refetching the user', async () => {
        vi.mocked(logout).mockResolvedValue(undefined);

        render(Dashboard);

        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: /Test User/ }));
        await user.click(screen.getByRole('button', { name: 'Log out' }));

        await vi.waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
        expect(useAuth().user).toBeNull();
        expect(navigate).toHaveBeenCalledWith('/', { replace: true });
        expect(fetchCurrentUser).not.toHaveBeenCalled();
    });
});
