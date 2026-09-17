import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Navigation } from 'sv-router';
import {
    isAuthenticated,
    isLoading,
    refreshUser,
    resetAuthStateForTesting,
    startBootstrap,
} from '@/auth/auth.svelte';
import { fetchCurrentUser } from '@/lib/auth-api';
import {
    requireGuest,
    requireProtected,
    requireVerified,
} from '@/router/guards';
import type { HooksContext } from 'sv-router';

vi.mock('@/lib/auth-api', () => ({
    fetchCurrentUser: vi.fn(),
    logout: vi.fn(),
}));

const testUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    email_verified_at: '2026-01-01T00:00:00.000000Z',
};

const context: HooksContext = {
    meta: {},
    params: {},
    pathname: '/dashboard',
    search: {},
};

describe('auth bootstrap', () => {
    beforeEach(() => {
        resetAuthStateForTesting({ status: 'loading' });
        vi.mocked(fetchCurrentUser).mockReset();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('fetches the current user once during bootstrap', async () => {
        vi.mocked(fetchCurrentUser).mockResolvedValue(testUser);

        const stop = startBootstrap();

        await vi.waitFor(() => expect(isLoading()).toBe(false));

        stop();

        expect(fetchCurrentUser).toHaveBeenCalledTimes(1);
        expect(isAuthenticated()).toBe(true);
    });

    it('refreshes the user only when refreshUser is called', async () => {
        vi.mocked(fetchCurrentUser).mockResolvedValue(null);

        await refreshUser();

        expect(fetchCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('does not fetch the user from route guards', async () => {
        resetAuthStateForTesting({ status: 'unauthenticated' });

        const navigate = vi.fn().mockReturnValue(new Navigation('/login'));

        await expect(
            requireProtected(context, navigate),
        ).rejects.toBeInstanceOf(Navigation);
        await expect(requireVerified(context, navigate)).rejects.toBeInstanceOf(
            Navigation,
        );

        resetAuthStateForTesting({
            user: testUser,
            status: 'authenticated',
        });

        const guestNavigate = vi
            .fn()
            .mockReturnValue(new Navigation('/dashboard'));

        await expect(
            requireGuest({ ...context, pathname: '/login' }, guestNavigate),
        ).rejects.toBeInstanceOf(Navigation);

        expect(fetchCurrentUser).not.toHaveBeenCalled();
    });

    it('does not refetch the current user when a guest visits auth pages', async () => {
        vi.mocked(fetchCurrentUser).mockResolvedValue(null);

        const stop = startBootstrap();
        await vi.waitFor(() => expect(isLoading()).toBe(false));
        expect(fetchCurrentUser).toHaveBeenCalledTimes(1);

        const guestNavigate = vi.fn();

        await requireGuest({ ...context, pathname: '/login' }, guestNavigate);
        await requireGuest(
            { ...context, pathname: '/register' },
            guestNavigate,
        );
        await requireGuest(
            { ...context, pathname: '/forgot-password' },
            guestNavigate,
        );

        expect(fetchCurrentUser).toHaveBeenCalledTimes(1);
        expect(guestNavigate).not.toHaveBeenCalled();

        stop();
    });
});
