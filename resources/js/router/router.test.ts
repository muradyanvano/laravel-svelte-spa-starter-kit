import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Navigation } from 'sv-router';
import { resetAuthStateForTesting, startBootstrap } from '@/auth/auth.svelte';
import { fetchCurrentUser } from '@/lib/auth-api';
import { p } from '@/router';
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

const verifiedUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    email_verified_at: '2026-01-01T00:00:00.000000Z',
};

function makeContext(pathname: string): HooksContext {
    return {
        meta: {},
        params: {},
        pathname,
        search: {},
    };
}

describe('router guards', () => {
    beforeEach(() => {
        resetAuthStateForTesting({ status: 'unauthenticated' });
        vi.mocked(fetchCurrentUser).mockReset();
    });

    it('exposes typed SPA paths', () => {
        expect(p('/login')).toBe('/login');
        expect(p('/settings/profile')).toBe('/settings/profile');
        expect(p('/reset-password/:token', { params: { token: 'abc' } })).toBe(
            '/reset-password/abc',
        );
    });

    it('awaits auth bootstrap instead of canceling the route', async () => {
        resetAuthStateForTesting({ status: 'loading' });
        vi.mocked(fetchCurrentUser).mockResolvedValue(null);

        const stop = startBootstrap();
        const navigate = vi.fn();

        await expect(
            requireGuest(makeContext('/login'), navigate),
        ).resolves.toBeUndefined();

        stop();

        expect(navigate).not.toHaveBeenCalled();
        expect(fetchCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('redirects guests away from login when authenticated', async () => {
        resetAuthStateForTesting({
            user: verifiedUser,
            status: 'authenticated',
        });

        const navigate = vi.fn().mockReturnValue(new Navigation('/dashboard'));

        await expect(
            requireGuest(makeContext('/login'), navigate),
        ).rejects.toBeInstanceOf(Navigation);

        expect(navigate).toHaveBeenCalledWith('/dashboard', {
            replace: true,
        });
    });

    it('redirects unauthenticated users to login with intended path', async () => {
        resetAuthStateForTesting({ status: 'unauthenticated' });

        const navigate = vi.fn().mockReturnValue(new Navigation('/login'));

        await expect(
            requireProtected(makeContext('/dashboard'), navigate),
        ).rejects.toBeInstanceOf(Navigation);

        expect(navigate).toHaveBeenCalledWith('/login', {
            replace: true,
            state: { from: '/dashboard' },
        });
        expect(fetchCurrentUser).not.toHaveBeenCalled();
    });

    it('redirects unverified users to verify email', async () => {
        resetAuthStateForTesting({
            user: {
                ...verifiedUser,
                email_verified_at: null,
            },
            status: 'authenticated',
        });

        const navigate = vi
            .fn()
            .mockReturnValue(new Navigation('/verify-email'));

        await expect(
            requireVerified(makeContext('/dashboard'), navigate),
        ).rejects.toBeInstanceOf(Navigation);

        expect(navigate).toHaveBeenCalledWith('/verify-email', {
            replace: true,
        });
    });
});
