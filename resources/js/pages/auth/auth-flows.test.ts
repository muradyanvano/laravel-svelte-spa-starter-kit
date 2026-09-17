import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAuthStateForTesting } from '@/auth/auth.svelte';
import {
    confirmPassword,
    fetchCurrentUser,
    requestPasswordReset,
    submitTwoFactorChallenge,
} from '@/lib/auth-api';
import ConfirmPassword from '@/pages/auth/ConfirmPassword.svelte';
import ForgotPassword from '@/pages/auth/ForgotPassword.svelte';
import TwoFactorChallenge from '@/pages/auth/TwoFactorChallenge.svelte';
import { navigate } from '@/router';

vi.mock('@/lib/auth-api', () => ({
    fetchCurrentUser: vi.fn(),
    requestPasswordReset: vi.fn(),
    confirmPassword: vi.fn(),
    submitTwoFactorChallenge: vi.fn(),
    logout: vi.fn(),
}));

vi.mock('@/router', () => ({
    navigate: vi.fn().mockResolvedValue(undefined),
    p: (path: string) => path,
    route: { params: {}, search: {} },
}));

const verifiedUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    email_verified_at: '2026-01-01T00:00:00.000000Z',
};

describe('auth flows', () => {
    beforeEach(() => {
        resetAuthStateForTesting({ status: 'unauthenticated' });
        vi.mocked(fetchCurrentUser).mockReset();
        vi.mocked(requestPasswordReset).mockReset();
        vi.mocked(confirmPassword).mockReset();
        vi.mocked(submitTwoFactorChallenge).mockReset();
        vi.mocked(navigate).mockClear();

        Object.defineProperty(window.history, 'state', {
            configurable: true,
            get: () => null,
        });
    });

    it('shows a status banner after requesting a password reset link', async () => {
        vi.mocked(requestPasswordReset).mockResolvedValue(
            'We have emailed your password reset link.',
        );

        render(ForgotPassword);

        const user = userEvent.setup();
        await user.type(
            screen.getByLabelText('Email address'),
            'test@example.com',
        );
        await user.click(
            screen.getByRole('button', {
                name: 'Email password reset link',
            }),
        );

        await vi.waitFor(() =>
            expect(screen.getByRole('status')).toHaveTextContent(
                'We have emailed your password reset link.',
            ),
        );
    });

    it('navigates to the intended path after confirming a password', async () => {
        Object.defineProperty(window.history, 'state', {
            configurable: true,
            get: () => ({ from: '/settings/security' }),
        });
        vi.mocked(confirmPassword).mockResolvedValue(undefined);

        render(ConfirmPassword);

        const user = userEvent.setup();
        await user.type(screen.getByLabelText('Password'), 'password');
        await user.click(
            screen.getByRole('button', { name: 'Confirm password' }),
        );

        await vi.waitFor(() =>
            expect(confirmPassword).toHaveBeenCalledWith({
                password: 'password',
            }),
        );
        expect(navigate).toHaveBeenCalledWith('/settings/security');
    });

    it('toggles two-factor challenge modes and refreshes once on success', async () => {
        vi.mocked(submitTwoFactorChallenge).mockResolvedValue(undefined);
        vi.mocked(fetchCurrentUser).mockResolvedValue(verifiedUser);

        render(TwoFactorChallenge);

        expect(
            screen.getByRole('heading', { name: 'Authentication code' }),
        ).toBeInTheDocument();

        const user = userEvent.setup();
        await user.click(
            screen.getByRole('button', {
                name: 'login using a recovery code',
            }),
        );

        expect(
            screen.getByRole('heading', { name: 'Recovery code' }),
        ).toBeInTheDocument();

        await user.type(
            screen.getByLabelText('Recovery code'),
            'recovery-code-1234',
        );
        await user.click(screen.getByRole('button', { name: 'Continue' }));

        await vi.waitFor(() =>
            expect(submitTwoFactorChallenge).toHaveBeenCalledWith({
                recovery_code: 'recovery-code-1234',
            }),
        );
        await vi.waitFor(() =>
            expect(fetchCurrentUser).toHaveBeenCalledTimes(1),
        );
        expect(navigate).toHaveBeenCalledWith('/dashboard');
    });
});
