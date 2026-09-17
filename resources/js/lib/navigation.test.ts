import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    getPostAuthPath,
    getSafeInternalPath,
    navigateToConfirmPasswordIfRequired,
} from '@/lib/navigation';
import { navigate } from '@/router';

vi.mock('@/router', () => ({
    navigate: vi.fn().mockResolvedValue(undefined),
    p: (path: string) => path,
    route: { pathname: '/', params: {}, search: {} },
}));

describe('getSafeInternalPath', () => {
    it('accepts internal spa paths', () => {
        expect(getSafeInternalPath('/settings/profile')).toBe(
            '/settings/profile',
        );
        expect(getSafeInternalPath('/dashboard?tab=1')).toBe(
            '/dashboard?tab=1',
        );
    });

    it('rejects open redirect candidates', () => {
        expect(getSafeInternalPath('https://evil.test')).toBe('/dashboard');
        expect(getSafeInternalPath('//evil.test')).toBe('/dashboard');
        expect(getSafeInternalPath('\\evil')).toBe('/dashboard');
        expect(getSafeInternalPath('javascript:alert(1)')).toBe('/dashboard');
        expect(getSafeInternalPath('http://evil.test/path')).toBe('/dashboard');
        expect(getSafeInternalPath(null)).toBe('/dashboard');
        expect(getSafeInternalPath('')).toBe('/dashboard');
    });
});

describe('getPostAuthPath', () => {
    it('avoids resuming confirm-password after login', () => {
        expect(getPostAuthPath('/confirm-password')).toBe('/dashboard');
        expect(getPostAuthPath('/confirm-password?x=1')).toBe('/dashboard');
    });

    it('avoids resuming two-factor-challenge after login', () => {
        expect(getPostAuthPath('/two-factor-challenge')).toBe('/dashboard');
    });

    it('preserves other safe intended paths', () => {
        expect(getPostAuthPath('/settings/profile')).toBe('/settings/profile');
        expect(getPostAuthPath('/dashboard')).toBe('/dashboard');
    });
});

describe('navigateToConfirmPasswordIfRequired', () => {
    beforeEach(() => {
        vi.mocked(navigate).mockClear();
    });

    it('redirects to confirm password for a 423 response', async () => {
        const redirected = await navigateToConfirmPasswordIfRequired(
            {
                kind: 'password_confirmation',
                status: 423,
                message: 'Password confirmation required.',
                errors: {},
            },
            '/settings/security',
        );

        expect(redirected).toBe(true);
        expect(navigate).toHaveBeenCalledWith('/confirm-password', {
            replace: true,
            state: { from: '/settings/security' },
        });
    });

    it('falls back to the security page for unsafe intended paths', async () => {
        await navigateToConfirmPasswordIfRequired(
            {
                kind: 'password_confirmation',
                status: 423,
                message: 'Password confirmation required.',
                errors: {},
            },
            'https://evil.test',
        );

        expect(navigate).toHaveBeenCalledWith('/confirm-password', {
            replace: true,
            state: { from: '/settings/security' },
        });
    });

    it('ignores errors that are not password confirmation failures', async () => {
        const redirected = await navigateToConfirmPasswordIfRequired(
            {
                kind: 'validation',
                status: 422,
                message: 'The given data was invalid.',
                errors: { password: ['The password field is required.'] },
            },
            '/settings/security',
        );

        expect(redirected).toBe(false);
        expect(navigate).not.toHaveBeenCalled();
    });
});
