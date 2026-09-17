import { render, screen } from '@testing-library/svelte';
import { PasskeyError, UserCancelledError } from '@laravel/passkeys';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PasskeyVerify from '@/components/PasskeyVerify.svelte';

const passkeyHarness = vi.hoisted(() => ({
    verify: vi.fn(),
    isLoading: false,
    error: null as string | null,
    errorInstance: null as PasskeyError | null,
    isSupported: true,
}));

vi.mock('@laravel/passkeys/svelte', () => ({
    usePasskeyVerify: () => ({
        verify: passkeyHarness.verify,
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

vi.mock('@/lib/passkeys', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/passkeys')>();

    return {
        ...actual,
        preparePasskeyCeremony: vi.fn().mockResolvedValue(undefined),
    };
});

describe('PasskeyVerify', () => {
    beforeEach(() => {
        passkeyHarness.verify.mockReset();
        passkeyHarness.isLoading = false;
        passkeyHarness.error = null;
        passkeyHarness.errorInstance = null;
        passkeyHarness.isSupported = true;
    });

    it('does not render when passkeys are unsupported', () => {
        passkeyHarness.isSupported = false;

        render(PasskeyVerify);

        expect(
            screen.queryByRole('button', { name: 'Sign in with a passkey' }),
        ).not.toBeInTheDocument();
    });

    it('does not show an alert for user cancellation errors', () => {
        passkeyHarness.error = 'The passkey operation was cancelled.';
        passkeyHarness.errorInstance = new UserCancelledError();

        render(PasskeyVerify);

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('renders the passkey button before the separator', () => {
        render(PasskeyVerify);

        const passkeyAction = screen.getByRole('button', {
            name: 'Sign in with a passkey',
        });
        const separator = screen.getByText('Or continue with email');

        expect(
            (passkeyAction.compareDocumentPosition(separator) &
                Node.DOCUMENT_POSITION_FOLLOWING) !==
                0,
        ).toBe(true);
    });

    it('shows a mapped alert for server-side passkey failures', () => {
        passkeyHarness.error = 'Request failed with status 422';
        passkeyHarness.errorInstance = new PasskeyError(
            'Request failed with status 422',
        );

        render(PasskeyVerify);

        expect(screen.getByRole('alert')).toHaveTextContent(
            'Request failed with status 422',
        );
    });
});
