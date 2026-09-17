import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { PasskeyError, UserCancelledError } from '@laravel/passkeys';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAuthStateForTesting, startBootstrap } from '@/auth/auth.svelte';
import { fetchCurrentUser } from '@/lib/auth-api';
import { preparePasskeyCeremony } from '@/lib/passkeys';
import Login from '@/pages/auth/Login.svelte';
import { navigate } from '@/router';

type PasskeyVerifyMode = 'success' | 'cancel' | 'fail';

const passkeyHarness = vi.hoisted(() => ({
    mode: 'success' as PasskeyVerifyMode,
    isLoading: false,
    error: null as string | null,
    errorInstance: null as PasskeyError | null,
    isSupported: true,
}));

vi.mock('@/lib/auth-api', () => ({
    fetchCurrentUser: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
}));

vi.mock('@/lib/passkeys', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/passkeys')>();

    return {
        ...actual,
        preparePasskeyCeremony: vi.fn().mockResolvedValue(undefined),
        configurePasskeysClient: vi.fn(),
    };
});

vi.mock('@laravel/passkeys/svelte', () => ({
    usePasskeyVerify: (opts: { onSuccess?: () => void | Promise<void> }) => ({
        verify: vi.fn().mockImplementation(async () => {
            if (passkeyHarness.mode === 'success') {
                await opts.onSuccess?.();

                return;
            }

            if (passkeyHarness.mode === 'cancel') {
                passkeyHarness.error = 'The passkey operation was cancelled.';
                passkeyHarness.errorInstance = new UserCancelledError();

                return;
            }

            passkeyHarness.error = 'Request failed with status 422';
            passkeyHarness.errorInstance = new PasskeyError(
                'Request failed with status 422',
            );
        }),
        get isLoading() {
            return passkeyHarness.isLoading;
        },
        get error() {
            return passkeyHarness.error;
        },
        get errorInstance() {
            return passkeyHarness.errorInstance;
        },
        get isSupported() {
            return passkeyHarness.isSupported;
        },
    }),
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

const unverifiedUser = {
    ...verifiedUser,
    email_verified_at: null,
};

function isBefore(a: Node, b: Node): boolean {
    return (
        (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
    );
}

describe('Login passkey flow', () => {
    beforeEach(() => {
        resetAuthStateForTesting({ status: 'loading' });
        passkeyHarness.mode = 'success';
        passkeyHarness.isLoading = false;
        passkeyHarness.error = null;
        passkeyHarness.errorInstance = null;
        passkeyHarness.isSupported = true;

        vi.mocked(fetchCurrentUser).mockReset();
        vi.mocked(preparePasskeyCeremony).mockClear();
        vi.mocked(navigate).mockClear();

        Object.defineProperty(window.history, 'state', {
            configurable: true,
            get: () => null,
        });
    });

    it('renders the passkey action when supported', async () => {
        vi.mocked(fetchCurrentUser).mockResolvedValue(null);

        const stop = startBootstrap();
        await vi.waitFor(() =>
            expect(fetchCurrentUser).toHaveBeenCalledTimes(1),
        );

        render(Login);

        expect(
            screen.getByRole('button', { name: 'Sign in with a passkey' }),
        ).toBeInTheDocument();

        stop();
    });

    it('orders passkey action before the email and password form', async () => {
        vi.mocked(fetchCurrentUser).mockResolvedValue(null);

        const stop = startBootstrap();
        await vi.waitFor(() =>
            expect(fetchCurrentUser).toHaveBeenCalledTimes(1),
        );

        render(Login);

        const passkeyAction = screen.getByRole('button', {
            name: 'Sign in with a passkey',
        });
        const emailSeparator = screen.getByText('Or continue with email');
        const emailField = screen.getByLabelText('Email address');
        const passwordField = screen.getByLabelText('Password');
        const loginButton = screen.getByRole('button', { name: 'Log in' });
        const signUpLink = screen.getByRole('link', { name: 'Sign up' });

        expect(isBefore(passkeyAction, emailSeparator)).toBe(true);
        expect(isBefore(emailSeparator, emailField)).toBe(true);
        expect(isBefore(emailField, passwordField)).toBe(true);
        expect(isBefore(passwordField, loginButton)).toBe(true);
        expect(isBefore(loginButton, signUpLink)).toBe(true);

        stop();
    });

    it('hides the passkey action when unsupported', async () => {
        passkeyHarness.isSupported = false;
        vi.mocked(fetchCurrentUser).mockResolvedValue(null);

        const stop = startBootstrap();
        await vi.waitFor(() =>
            expect(fetchCurrentUser).toHaveBeenCalledTimes(1),
        );

        render(Login);

        expect(
            screen.queryByRole('button', { name: 'Sign in with a passkey' }),
        ).not.toBeInTheDocument();

        stop();
    });

    it('prepares CSRF before starting passkey verification', async () => {
        vi.mocked(fetchCurrentUser).mockResolvedValue(null);

        const stop = startBootstrap();
        await vi.waitFor(() =>
            expect(fetchCurrentUser).toHaveBeenCalledTimes(1),
        );

        render(Login);

        const user = userEvent.setup();
        await user.click(
            screen.getByRole('button', { name: 'Sign in with a passkey' }),
        );

        await vi.waitFor(() =>
            expect(preparePasskeyCeremony).toHaveBeenCalledTimes(1),
        );

        stop();
    });

    it('refreshes the current user exactly once after passkey login', async () => {
        vi.mocked(fetchCurrentUser)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(verifiedUser);

        const stop = startBootstrap();
        await vi.waitFor(() =>
            expect(fetchCurrentUser).toHaveBeenCalledTimes(1),
        );

        render(Login);

        const user = userEvent.setup();
        await user.click(
            screen.getByRole('button', { name: 'Sign in with a passkey' }),
        );

        await vi.waitFor(() =>
            expect(fetchCurrentUser).toHaveBeenCalledTimes(2),
        );

        stop();
    });

    it('navigates verified users to the safe intended path', async () => {
        Object.defineProperty(window.history, 'state', {
            configurable: true,
            get: () => ({ from: '/settings/profile' }),
        });

        vi.mocked(fetchCurrentUser)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(verifiedUser);

        const stop = startBootstrap();
        await vi.waitFor(() =>
            expect(fetchCurrentUser).toHaveBeenCalledTimes(1),
        );

        render(Login);

        const user = userEvent.setup();
        await user.click(
            screen.getByRole('button', { name: 'Sign in with a passkey' }),
        );

        await vi.waitFor(() =>
            expect(navigate).toHaveBeenCalledWith('/settings/profile'),
        );

        stop();
    });

    it('navigates unverified users to email verification', async () => {
        vi.mocked(fetchCurrentUser)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(unverifiedUser);

        const stop = startBootstrap();
        await vi.waitFor(() =>
            expect(fetchCurrentUser).toHaveBeenCalledTimes(1),
        );

        render(Login);

        const user = userEvent.setup();
        await user.click(
            screen.getByRole('button', { name: 'Sign in with a passkey' }),
        );

        await vi.waitFor(() =>
            expect(navigate).toHaveBeenCalledWith('/verify-email'),
        );

        stop();
    });

    it('rejects external intended destinations', async () => {
        Object.defineProperty(window.history, 'state', {
            configurable: true,
            get: () => ({ from: 'https://evil.test/phish' }),
        });

        vi.mocked(fetchCurrentUser)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(verifiedUser);

        const stop = startBootstrap();
        await vi.waitFor(() =>
            expect(fetchCurrentUser).toHaveBeenCalledTimes(1),
        );

        render(Login);

        const user = userEvent.setup();
        await user.click(
            screen.getByRole('button', { name: 'Sign in with a passkey' }),
        );

        await vi.waitFor(() =>
            expect(navigate).toHaveBeenCalledWith('/dashboard'),
        );

        stop();
    });

    it('rejects confirm-password as a post-auth destination', async () => {
        Object.defineProperty(window.history, 'state', {
            configurable: true,
            get: () => ({ from: '/confirm-password' }),
        });

        vi.mocked(fetchCurrentUser)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(verifiedUser);

        const stop = startBootstrap();
        await vi.waitFor(() =>
            expect(fetchCurrentUser).toHaveBeenCalledTimes(1),
        );

        render(Login);

        const user = userEvent.setup();
        await user.click(
            screen.getByRole('button', { name: 'Sign in with a passkey' }),
        );

        await vi.waitFor(() =>
            expect(navigate).toHaveBeenCalledWith('/dashboard'),
        );

        stop();
    });

    it('rejects two-factor-challenge as a post-auth destination', async () => {
        Object.defineProperty(window.history, 'state', {
            configurable: true,
            get: () => ({ from: '/two-factor-challenge' }),
        });

        vi.mocked(fetchCurrentUser)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(verifiedUser);

        const stop = startBootstrap();
        await vi.waitFor(() =>
            expect(fetchCurrentUser).toHaveBeenCalledTimes(1),
        );

        render(Login);

        const user = userEvent.setup();
        await user.click(
            screen.getByRole('button', { name: 'Sign in with a passkey' }),
        );

        await vi.waitFor(() =>
            expect(navigate).toHaveBeenCalledWith('/dashboard'),
        );

        stop();
    });

    it('keeps cancellation silent', async () => {
        passkeyHarness.mode = 'cancel';
        vi.mocked(fetchCurrentUser).mockResolvedValue(null);

        const stop = startBootstrap();
        await vi.waitFor(() =>
            expect(fetchCurrentUser).toHaveBeenCalledTimes(1),
        );

        render(Login);

        const user = userEvent.setup();
        await user.click(
            screen.getByRole('button', { name: 'Sign in with a passkey' }),
        );

        await vi.waitFor(() =>
            expect(preparePasskeyCeremony).toHaveBeenCalledTimes(1),
        );

        expect(navigate).not.toHaveBeenCalled();
        expect(fetchCurrentUser).toHaveBeenCalledTimes(1);

        stop();
    });

    it('does not navigate or refresh the user when passkey verification fails', async () => {
        passkeyHarness.mode = 'fail';
        vi.mocked(fetchCurrentUser).mockResolvedValue(null);

        const stop = startBootstrap();
        await vi.waitFor(() =>
            expect(fetchCurrentUser).toHaveBeenCalledTimes(1),
        );

        render(Login);

        const user = userEvent.setup();
        await user.click(
            screen.getByRole('button', { name: 'Sign in with a passkey' }),
        );

        await vi.waitFor(() =>
            expect(preparePasskeyCeremony).toHaveBeenCalledTimes(1),
        );

        expect(navigate).not.toHaveBeenCalled();
        expect(fetchCurrentUser).toHaveBeenCalledTimes(1);

        stop();
    });

    it('does not automatically retry after a passkey failure', async () => {
        passkeyHarness.mode = 'fail';
        vi.mocked(fetchCurrentUser).mockResolvedValue(null);

        const stop = startBootstrap();
        await vi.waitFor(() =>
            expect(fetchCurrentUser).toHaveBeenCalledTimes(1),
        );

        render(Login);

        const user = userEvent.setup();
        await user.click(
            screen.getByRole('button', { name: 'Sign in with a passkey' }),
        );

        await vi.waitFor(() =>
            expect(preparePasskeyCeremony).toHaveBeenCalledTimes(1),
        );

        expect(preparePasskeyCeremony).toHaveBeenCalledTimes(1);

        stop();
    });
});
