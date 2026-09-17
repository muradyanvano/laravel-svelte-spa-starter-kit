import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { PasskeyError, UserCancelledError } from '@laravel/passkeys';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshUser, resetAuthStateForTesting } from '@/auth/auth.svelte';
import { fetchCurrentUser } from '@/lib/auth-api';
import { PASSKEY_CONFIRM_ROUTES, preparePasskeyCeremony } from '@/lib/passkeys';
import ConfirmPassword from '@/pages/auth/ConfirmPassword.svelte';
import { navigate } from '@/router';

type PasskeyVerifyMode = 'success' | 'cancel' | 'fail';

const passkeyHarness = vi.hoisted(() => ({
    mode: 'success' as PasskeyVerifyMode,
    isLoading: false,
    error: null as string | null,
    errorInstance: null as PasskeyError | null,
    isSupported: true,
    lastOptions: null as Record<string, unknown> | null,
}));

vi.mock('@/lib/auth-api', () => ({
    fetchCurrentUser: vi.fn(),
    confirmPassword: vi.fn(),
    logout: vi.fn(),
}));

vi.mock('@/auth/auth.svelte', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/auth/auth.svelte')>();

    return {
        ...actual,
        refreshUser: vi.fn(),
    };
});

vi.mock('@/lib/passkeys', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/passkeys')>();

    return {
        ...actual,
        preparePasskeyCeremony: vi.fn().mockResolvedValue(undefined),
        configurePasskeysClient: vi.fn(),
    };
});

vi.mock('@laravel/passkeys/svelte', () => ({
    usePasskeyVerify: (opts: {
        routes?: { options: string; submit: string };
        onSuccess?: () => void | Promise<void>;
    }) => {
        passkeyHarness.lastOptions = opts;

        return {
            verify: vi.fn().mockImplementation(async () => {
                if (passkeyHarness.mode === 'success') {
                    await opts.onSuccess?.();

                    return;
                }

                if (passkeyHarness.mode === 'cancel') {
                    passkeyHarness.error =
                        'The passkey operation was cancelled.';
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
        };
    },
}));

vi.mock('@/router', () => ({
    navigate: vi.fn().mockResolvedValue(undefined),
    p: (path: string) => path,
    route: { params: {}, search: {} },
}));

function isBefore(a: Node, b: Node): boolean {
    return (
        (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
    );
}

describe('ConfirmPassword passkey flow', () => {
    beforeEach(() => {
        resetAuthStateForTesting({ status: 'authenticated' });
        passkeyHarness.mode = 'success';
        passkeyHarness.isLoading = false;
        passkeyHarness.error = null;
        passkeyHarness.errorInstance = null;
        passkeyHarness.isSupported = true;
        passkeyHarness.lastOptions = null;

        vi.mocked(fetchCurrentUser).mockReset();
        vi.mocked(refreshUser).mockClear();
        vi.mocked(preparePasskeyCeremony).mockClear();
        vi.mocked(navigate).mockClear();

        Object.defineProperty(window.history, 'state', {
            configurable: true,
            get: () => ({ from: '/settings/security' }),
        });
    });

    it('renders the passkey confirmation action when supported', () => {
        render(ConfirmPassword);

        expect(
            screen.getByRole('button', { name: 'Confirm with passkey' }),
        ).toBeInTheDocument();
    });

    it('orders passkey confirmation before the password form', () => {
        render(ConfirmPassword);

        const passkeyAction = screen.getByRole('button', {
            name: 'Confirm with passkey',
        });
        const passwordSeparator = screen.getByText('Or confirm with password');
        const passwordField = screen.getByLabelText('Password');
        const confirmButton = screen.getByRole('button', {
            name: 'Confirm password',
        });

        expect(isBefore(passkeyAction, passwordSeparator)).toBe(true);
        expect(isBefore(passwordSeparator, passwordField)).toBe(true);
        expect(isBefore(passwordField, confirmButton)).toBe(true);
    });

    it('uses passkey confirmation route overrides', () => {
        render(ConfirmPassword);

        expect(passkeyHarness.lastOptions?.routes).toEqual(
            PASSKEY_CONFIRM_ROUTES,
        );
    });

    it('navigates to the intended path after passkey confirmation', async () => {
        render(ConfirmPassword);

        const user = userEvent.setup();
        await user.click(
            screen.getByRole('button', { name: 'Confirm with passkey' }),
        );

        await vi.waitFor(() =>
            expect(navigate).toHaveBeenCalledWith('/settings/security'),
        );
    });

    it('does not refresh the current user after passkey confirmation', async () => {
        render(ConfirmPassword);

        const user = userEvent.setup();
        await user.click(
            screen.getByRole('button', { name: 'Confirm with passkey' }),
        );

        await vi.waitFor(() => expect(navigate).toHaveBeenCalledTimes(1));

        expect(refreshUser).not.toHaveBeenCalled();
        expect(fetchCurrentUser).not.toHaveBeenCalled();
    });

    it('rejects external intended destinations after passkey confirmation', async () => {
        Object.defineProperty(window.history, 'state', {
            configurable: true,
            get: () => ({ from: '//evil.test/steal' }),
        });

        render(ConfirmPassword);

        const user = userEvent.setup();
        await user.click(
            screen.getByRole('button', { name: 'Confirm with passkey' }),
        );

        await vi.waitFor(() =>
            expect(navigate).toHaveBeenCalledWith('/settings/security'),
        );
    });

    it('keeps passkey cancellation silent on the confirmation page', async () => {
        passkeyHarness.mode = 'cancel';

        render(ConfirmPassword);

        const user = userEvent.setup();
        await user.click(
            screen.getByRole('button', { name: 'Confirm with passkey' }),
        );

        await vi.waitFor(() =>
            expect(preparePasskeyCeremony).toHaveBeenCalledTimes(1),
        );

        expect(navigate).not.toHaveBeenCalled();
    });

    it('stays on the page when passkey confirmation fails', async () => {
        passkeyHarness.mode = 'fail';

        render(ConfirmPassword);

        const user = userEvent.setup();
        await user.click(
            screen.getByRole('button', { name: 'Confirm with passkey' }),
        );

        await vi.waitFor(() =>
            expect(preparePasskeyCeremony).toHaveBeenCalledTimes(1),
        );

        expect(navigate).not.toHaveBeenCalled();
    });
});
