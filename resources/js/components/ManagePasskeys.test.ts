import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { PasskeyError, UserCancelledError } from '@laravel/passkeys';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshUser } from '@/auth/auth.svelte';
import { fetchCurrentUser } from '@/lib/auth-api';
import { preparePasskeyCeremony } from '@/lib/passkeys';
import {
    deletePasskey,
    fetchPasskeys,
    fetchRecoveryCodes,
    fetchSecuritySettings,
} from '@/lib/settings-api';
import ManagePasskeys from '@/components/ManagePasskeys.svelte';
import { navigate } from '@/router';

type RegisterMode = 'success' | 'cancel' | 'fail' | '423';

const registerHarness = vi.hoisted(() => ({
    mode: 'success' as RegisterMode,
    isLoading: false,
    error: null as string | null,
    errorInstance: null as PasskeyError | null,
    isSupported: true,
    registerCalls: 0,
}));

vi.mock('@/lib/auth-api', () => ({
    fetchCurrentUser: vi.fn(),
    logout: vi.fn(),
}));

vi.mock('@/auth/auth.svelte', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/auth/auth.svelte')>();

    return {
        ...actual,
        refreshUser: vi.fn(),
    };
});

vi.mock('@/lib/settings-api', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/settings-api')>();

    return {
        ...actual,
        fetchPasskeys: vi.fn(),
        deletePasskey: vi.fn(),
        fetchSecuritySettings: vi.fn(),
        fetchRecoveryCodes: vi.fn(),
    };
});

vi.mock('@/lib/passkeys', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/passkeys')>();

    return {
        ...actual,
        preparePasskeyCeremony: vi.fn().mockResolvedValue(undefined),
    };
});

vi.mock('@laravel/passkeys/svelte', () => ({
    usePasskeyRegister: (opts: {
        onSuccess?: () => void | Promise<void>;
        onError?: (error: PasskeyError) => void | Promise<void>;
    }) => ({
        register: vi.fn().mockImplementation(async () => {
            registerHarness.registerCalls += 1;

            if (registerHarness.mode === 'success') {
                await opts.onSuccess?.();

                return;
            }

            if (registerHarness.mode === '423') {
                const error = new PasskeyError(
                    'Request failed with status 423',
                );
                registerHarness.error = error.message;
                registerHarness.errorInstance = error;
                await opts.onError?.(error);

                return;
            }

            if (registerHarness.mode === 'cancel') {
                registerHarness.error = 'The passkey operation was cancelled.';
                registerHarness.errorInstance = new UserCancelledError();

                return;
            }

            registerHarness.error = 'Request failed with status 422';
            registerHarness.errorInstance = new PasskeyError(
                'Request failed with status 422',
            );
        }),
        get isLoading() {
            return registerHarness.isLoading;
        },
        get error() {
            return registerHarness.error;
        },
        get errorInstance() {
            return registerHarness.errorInstance;
        },
        get isSupported() {
            return registerHarness.isSupported;
        },
    }),
}));

vi.mock('@/router', () => ({
    navigate: vi.fn().mockResolvedValue(undefined),
    p: (path: string) => path,
    route: { pathname: '/settings/security', params: {}, search: {} },
}));

const samplePasskeys = [
    {
        id: 1,
        name: 'Chrome on Windows',
        authenticator: 'Windows Hello',
        created_at_diff: '2 days ago',
        last_used_at_diff: '1 hour ago',
    },
    {
        id: 2,
        name: 'Safari on iPhone',
        authenticator: 'Touch ID',
        created_at_diff: '1 week ago',
        last_used_at_diff: null,
    },
];

describe('ManagePasskeys', () => {
    beforeEach(() => {
        registerHarness.mode = 'success';
        registerHarness.isLoading = false;
        registerHarness.error = null;
        registerHarness.errorInstance = null;
        registerHarness.isSupported = true;
        registerHarness.registerCalls = 0;

        vi.mocked(fetchPasskeys).mockReset();
        vi.mocked(deletePasskey).mockReset();
        vi.mocked(fetchSecuritySettings).mockReset();
        vi.mocked(fetchRecoveryCodes).mockReset();
        vi.mocked(fetchCurrentUser).mockReset();
        vi.mocked(refreshUser).mockClear();
        vi.mocked(preparePasskeyCeremony).mockClear();
        vi.mocked(navigate).mockClear();
    });

    it('fetches the passkey list exactly once when management is enabled', async () => {
        vi.mocked(fetchPasskeys).mockResolvedValue(samplePasskeys);

        render(ManagePasskeys, { canManagePasskeys: true });

        await vi.waitFor(() =>
            expect(screen.getByText('Chrome on Windows')).toBeInTheDocument(),
        );
        expect(fetchPasskeys).toHaveBeenCalledTimes(1);
    });

    it('does not fetch passkeys when management is disabled', async () => {
        render(ManagePasskeys, { canManagePasskeys: false });

        await vi.waitFor(() =>
            expect(
                document.querySelector('[data-test="manage-passkeys"]'),
            ).toBeNull(),
        );

        expect(fetchPasskeys).not.toHaveBeenCalled();
    });

    it('renders the official empty state when no passkeys exist', async () => {
        vi.mocked(fetchPasskeys).mockResolvedValue([]);

        render(ManagePasskeys, { canManagePasskeys: true });

        expect(await screen.findByText('No passkeys yet')).toBeInTheDocument();
        expect(
            document.querySelector('[data-test="passkeys-empty-state"]'),
        ).toBeInTheDocument();
        expect(screen.getByText('No passkeys yet')).toBeInTheDocument();
        expect(
            screen.getByText('Add a passkey to sign in without a password'),
        ).toBeInTheDocument();
    });

    it('renders only safe passkey metadata', async () => {
        vi.mocked(fetchPasskeys).mockResolvedValue(samplePasskeys);

        render(ManagePasskeys, { canManagePasskeys: true });

        await screen.findByText('Chrome on Windows');

        expect(screen.getByText('Windows Hello')).toBeInTheDocument();
        expect(screen.getByText(/Added 2 days ago/)).toBeInTheDocument();
        expect(screen.getByText(/Last used 1 hour ago/)).toBeInTheDocument();
        expect(screen.queryByText(/credential/i)).not.toBeInTheDocument();
    });

    it('never refreshes the current user from passkey management', async () => {
        vi.mocked(fetchPasskeys).mockResolvedValue(samplePasskeys);

        render(ManagePasskeys, { canManagePasskeys: true });

        await screen.findByText('Chrome on Windows');

        expect(refreshUser).not.toHaveBeenCalled();
        expect(fetchCurrentUser).not.toHaveBeenCalled();
    });

    it('never fetches recovery codes from passkey management', async () => {
        vi.mocked(fetchPasskeys).mockResolvedValue(samplePasskeys);

        render(ManagePasskeys, { canManagePasskeys: true });

        await screen.findByText('Chrome on Windows');

        expect(fetchRecoveryCodes).not.toHaveBeenCalled();
    });

    it('shows the Add passkey action when supported', async () => {
        vi.mocked(fetchPasskeys).mockResolvedValue([]);

        render(ManagePasskeys, { canManagePasskeys: true });

        expect(
            await screen.findByRole('button', { name: 'Add passkey' }),
        ).toBeInTheDocument();
    });

    it('shows unsupported messaging instead of a broken registration action', async () => {
        registerHarness.isSupported = false;
        vi.mocked(fetchPasskeys).mockResolvedValue(samplePasskeys);

        render(ManagePasskeys, { canManagePasskeys: true });

        await screen.findByText('Chrome on Windows');

        expect(
            screen.getByText('Passkeys are not supported in this browser.'),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Add passkey' }),
        ).not.toBeInTheDocument();
    });

    it('prepares CSRF and registers a passkey exactly once', async () => {
        vi.mocked(fetchPasskeys)
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce(samplePasskeys.slice(0, 1));

        render(ManagePasskeys, { canManagePasskeys: true });

        const user = userEvent.setup();
        await user.click(
            await screen.findByRole('button', { name: 'Add passkey' }),
        );
        await user.type(screen.getByLabelText('Passkey name'), 'Windows Hello');
        await user.click(
            screen.getByRole('button', { name: 'Register passkey' }),
        );

        await vi.waitFor(() =>
            expect(preparePasskeyCeremony).toHaveBeenCalledTimes(1),
        );
        expect(registerHarness.registerCalls).toBe(1);
        await vi.waitFor(() => expect(fetchPasskeys).toHaveBeenCalledTimes(2));
        expect(refreshUser).not.toHaveBeenCalled();
        expect(fetchSecuritySettings).not.toHaveBeenCalled();
    });

    it('keeps registration cancellation silent', async () => {
        registerHarness.mode = 'cancel';
        vi.mocked(fetchPasskeys).mockResolvedValue([]);

        render(ManagePasskeys, { canManagePasskeys: true });

        const user = userEvent.setup();
        await user.click(
            await screen.findByRole('button', { name: 'Add passkey' }),
        );
        await user.type(screen.getByLabelText('Passkey name'), 'Windows Hello');
        await user.click(
            screen.getByRole('button', { name: 'Register passkey' }),
        );

        await vi.waitFor(() => expect(registerHarness.registerCalls).toBe(1));

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(fetchPasskeys).toHaveBeenCalledTimes(1);
        expect(navigate).not.toHaveBeenCalled();
    });

    it('navigates to confirm-password on registration 423 without replaying', async () => {
        registerHarness.mode = '423';
        vi.mocked(fetchPasskeys).mockResolvedValue([]);

        render(ManagePasskeys, { canManagePasskeys: true });

        const user = userEvent.setup();
        await user.click(
            await screen.findByRole('button', { name: 'Add passkey' }),
        );
        await user.type(screen.getByLabelText('Passkey name'), 'Windows Hello');
        await user.click(
            screen.getByRole('button', { name: 'Register passkey' }),
        );

        await vi.waitFor(() =>
            expect(navigate).toHaveBeenCalledWith('/confirm-password', {
                replace: true,
                state: { from: '/settings/security' },
            }),
        );

        expect(registerHarness.registerCalls).toBe(1);
        expect(fetchPasskeys).toHaveBeenCalledTimes(1);
    });

    it('shows a local registration error without automatic retry', async () => {
        registerHarness.mode = 'fail';
        vi.mocked(fetchPasskeys).mockResolvedValue([]);

        render(ManagePasskeys, { canManagePasskeys: true });

        const user = userEvent.setup();
        await user.click(
            await screen.findByRole('button', { name: 'Add passkey' }),
        );
        await user.type(screen.getByLabelText('Passkey name'), 'Windows Hello');
        await user.click(
            screen.getByRole('button', { name: 'Register passkey' }),
        );

        await vi.waitFor(() => expect(registerHarness.registerCalls).toBe(1));

        expect(preparePasskeyCeremony).toHaveBeenCalledTimes(1);
        expect(fetchPasskeys).toHaveBeenCalledTimes(1);
    });

    it('requires explicit confirmation before deleting a passkey', async () => {
        vi.mocked(fetchPasskeys).mockResolvedValue(samplePasskeys);
        vi.mocked(deletePasskey).mockResolvedValue(undefined);

        render(ManagePasskeys, { canManagePasskeys: true });

        const user = userEvent.setup();
        await user.click(
            await screen.findByRole('button', {
                name: 'Remove Chrome on Windows',
            }),
        );

        expect(deletePasskey).not.toHaveBeenCalled();
    });

    it('deletes a passkey exactly once after confirmation', async () => {
        vi.mocked(fetchPasskeys).mockResolvedValue(samplePasskeys);
        vi.mocked(deletePasskey).mockResolvedValue(undefined);

        render(ManagePasskeys, { canManagePasskeys: true });

        const user = userEvent.setup();
        await user.click(
            await screen.findByRole('button', {
                name: 'Remove Chrome on Windows',
            }),
        );
        await user.click(
            screen.getByRole('button', { name: 'Remove passkey' }),
        );

        await vi.waitFor(() => expect(deletePasskey).toHaveBeenCalledWith(1));
        expect(deletePasskey).toHaveBeenCalledTimes(1);
        expect(fetchPasskeys).toHaveBeenCalledTimes(1);
        expect(refreshUser).not.toHaveBeenCalled();
        expect(fetchSecuritySettings).not.toHaveBeenCalled();
        expect(screen.queryByText('Chrome on Windows')).not.toBeInTheDocument();
        expect(screen.getByText('Safari on iPhone')).toBeInTheDocument();
    });

    it('does not delete when the confirmation dialog is cancelled', async () => {
        vi.mocked(fetchPasskeys).mockResolvedValue(samplePasskeys);

        render(ManagePasskeys, { canManagePasskeys: true });

        const user = userEvent.setup();
        await user.click(
            await screen.findByRole('button', {
                name: 'Remove Chrome on Windows',
            }),
        );
        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(deletePasskey).not.toHaveBeenCalled();
        expect(screen.getByText('Chrome on Windows')).toBeInTheDocument();
    });

    it('navigates to confirm-password on delete 423 without replaying', async () => {
        vi.mocked(fetchPasskeys).mockResolvedValue(samplePasskeys);
        vi.mocked(deletePasskey).mockRejectedValue({
            kind: 'password_confirmation',
            status: 423,
            message: 'Please confirm your password before continuing.',
            errors: {},
        });

        render(ManagePasskeys, { canManagePasskeys: true });

        const user = userEvent.setup();
        await user.click(
            await screen.findByRole('button', {
                name: 'Remove Chrome on Windows',
            }),
        );
        await user.click(
            screen.getByRole('button', { name: 'Remove passkey' }),
        );

        await vi.waitFor(() =>
            expect(navigate).toHaveBeenCalledWith('/confirm-password', {
                replace: true,
                state: { from: '/settings/security' },
            }),
        );

        expect(deletePasskey).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Chrome on Windows')).toBeInTheDocument();
    });
});
