import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAuthStateForTesting, startBootstrap } from '@/auth/auth.svelte';
import { fetchCurrentUser, login } from '@/lib/auth-api';
import Login from '@/pages/auth/Login.svelte';
import { navigate } from '@/router';

vi.mock('@/lib/auth-api', () => ({
    fetchCurrentUser: vi.fn(),
    login: vi.fn(),
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

describe('Login', () => {
    beforeEach(() => {
        resetAuthStateForTesting({ status: 'loading' });
        vi.mocked(fetchCurrentUser).mockReset();
        vi.mocked(login).mockReset();
        vi.mocked(navigate).mockClear();

        Object.defineProperty(window.history, 'state', {
            configurable: true,
            get: () => null,
        });
    });

    it('fetches the current user on bootstrap and again after login', async () => {
        vi.mocked(fetchCurrentUser)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(verifiedUser);
        vi.mocked(login).mockResolvedValue({ two_factor: false });

        const stop = startBootstrap();
        await vi.waitFor(() =>
            expect(fetchCurrentUser).toHaveBeenCalledTimes(1),
        );

        render(Login);

        const user = userEvent.setup();
        await user.type(
            screen.getByLabelText('Email address'),
            'test@example.com',
        );
        await user.type(screen.getByLabelText('Password'), 'password');
        await user.click(screen.getByRole('button', { name: 'Log in' }));

        await vi.waitFor(() => expect(login).toHaveBeenCalledTimes(1));
        await vi.waitFor(() =>
            expect(fetchCurrentUser).toHaveBeenCalledTimes(2),
        );
        expect(navigate).toHaveBeenCalledWith('/dashboard');

        stop();
    });

    it('does not refresh the user when two-factor authentication is required', async () => {
        vi.mocked(fetchCurrentUser).mockResolvedValue(null);
        vi.mocked(login).mockResolvedValue({ two_factor: true });

        const stop = startBootstrap();
        await vi.waitFor(() =>
            expect(fetchCurrentUser).toHaveBeenCalledTimes(1),
        );

        render(Login);

        const user = userEvent.setup();
        await user.type(
            screen.getByLabelText('Email address'),
            'test@example.com',
        );
        await user.type(screen.getByLabelText('Password'), 'password');
        await user.click(screen.getByRole('button', { name: 'Log in' }));

        await vi.waitFor(() => expect(login).toHaveBeenCalledTimes(1));
        expect(fetchCurrentUser).toHaveBeenCalledTimes(1);
        expect(navigate).toHaveBeenCalledWith('/two-factor-challenge', {
            replace: true,
            state: { from: '/dashboard' },
        });

        stop();
    });

    it('exposes validation state on the email field', async () => {
        vi.mocked(fetchCurrentUser).mockResolvedValue(null);

        const stop = startBootstrap();
        await vi.waitFor(() =>
            expect(fetchCurrentUser).toHaveBeenCalledTimes(1),
        );

        vi.mocked(login).mockRejectedValue({
            kind: 'validation',
            status: 422,
            message: 'The given data was invalid.',
            errors: {
                email: ['The email field is required.'],
            },
        });

        render(Login);

        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: 'Log in' }));

        await vi.waitFor(() =>
            expect(screen.getByLabelText('Email address')).toHaveAttribute(
                'aria-invalid',
                'true',
            ),
        );
        expect(screen.getByLabelText('Email address')).toHaveAttribute(
            'aria-describedby',
            'email-error',
        );
        expect(screen.getByRole('alert')).toHaveTextContent(
            'The email field is required.',
        );

        stop();
    });
});
