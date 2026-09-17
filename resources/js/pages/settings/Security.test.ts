import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { Navigation } from 'sv-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAuthStateForTesting } from '@/auth/auth.svelte';
import {
    fetchPasswordConfirmationStatus,
    fetchRecoveryCodes,
    fetchSecuritySettings,
    regenerateRecoveryCodes,
} from '@/lib/settings-api';
import Security from '@/pages/settings/Security.svelte';
import { navigate } from '@/router';

vi.mock('@/lib/auth-api', () => ({
    fetchCurrentUser: vi.fn(),
    logout: vi.fn(),
}));

vi.mock('@/lib/settings-api', () => ({
    fetchPasswordConfirmationStatus: vi.fn(),
    fetchSecuritySettings: vi.fn(),
    updatePassword: vi.fn(),
    enableTwoFactor: vi.fn(),
    disableTwoFactor: vi.fn(),
    confirmTwoFactor: vi.fn(),
    fetchTwoFactorQrCode: vi.fn(),
    fetchTwoFactorSecretKey: vi.fn(),
    fetchRecoveryCodes: vi.fn(),
    regenerateRecoveryCodes: vi.fn(),
}));

vi.mock('@/router', () => ({
    navigate: vi.fn().mockResolvedValue(undefined),
    p: (path: string) => path,
    route: { pathname: '/settings/security', params: {}, search: {} },
}));

const verifiedUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    email_verified_at: '2026-01-01T00:00:00.000000Z',
};

const securitySettings = {
    canManageTwoFactor: true,
    twoFactorEnabled: true,
    requiresConfirmation: true,
    passwordRules: 'minlength: 8;',
};

describe('Security settings', () => {
    beforeEach(() => {
        resetAuthStateForTesting({
            user: verifiedUser,
            status: 'authenticated',
        });
        vi.mocked(fetchPasswordConfirmationStatus).mockReset();
        vi.mocked(fetchSecuritySettings).mockReset();
        vi.mocked(fetchRecoveryCodes).mockReset();
        vi.mocked(regenerateRecoveryCodes).mockReset();
        vi.mocked(navigate).mockClear();
    });

    it('loads security state once and never fetches recovery codes on mount', async () => {
        vi.mocked(fetchPasswordConfirmationStatus).mockResolvedValue({
            confirmed: true,
        });
        vi.mocked(fetchSecuritySettings).mockResolvedValue(securitySettings);

        render(Security);

        await vi.waitFor(() =>
            expect(
                screen.getByRole('heading', { name: 'Update password' }),
            ).toBeInTheDocument(),
        );

        expect(fetchPasswordConfirmationStatus).toHaveBeenCalledTimes(1);
        expect(fetchSecuritySettings).toHaveBeenCalledTimes(1);
        expect(fetchRecoveryCodes).not.toHaveBeenCalled();
        expect(navigate).not.toHaveBeenCalled();
    });

    it('redirects to password confirmation when the password is unconfirmed', async () => {
        vi.mocked(fetchPasswordConfirmationStatus).mockResolvedValue({
            confirmed: false,
        });

        render(Security);

        await vi.waitFor(() =>
            expect(navigate).toHaveBeenCalledWith('/confirm-password', {
                replace: true,
                state: { from: '/settings/security' },
            }),
        );
        expect(fetchSecuritySettings).not.toHaveBeenCalled();
    });

    it('keeps the skeleton visible until confirm-password navigation completes', async () => {
        vi.mocked(fetchPasswordConfirmationStatus).mockResolvedValue({
            confirmed: false,
        });

        let resolveNavigate: ((value: Navigation) => void) | undefined;
        const navigatePromise = new Promise<Navigation>((resolve) => {
            resolveNavigate = resolve;
        });
        vi.mocked(navigate).mockReturnValue(navigatePromise);

        render(Security);

        await vi.waitFor(() =>
            expect(fetchPasswordConfirmationStatus).toHaveBeenCalledTimes(1),
        );

        expect(
            document.querySelector('[data-test="security-settings-skeleton"]'),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('heading', { name: 'Update password' }),
        ).not.toBeInTheDocument();
        expect(fetchSecuritySettings).not.toHaveBeenCalled();

        resolveNavigate!(new Navigation('/confirm-password'));
        await navigatePromise;

        expect(
            document.querySelector('[data-test="security-settings-skeleton"]'),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('heading', { name: 'Update password' }),
        ).not.toBeInTheDocument();
        expect(fetchSecuritySettings).not.toHaveBeenCalled();
    });

    it('fetches recovery codes only when they are explicitly viewed', async () => {
        vi.mocked(fetchPasswordConfirmationStatus).mockResolvedValue({
            confirmed: true,
        });
        vi.mocked(fetchSecuritySettings).mockResolvedValue(securitySettings);
        vi.mocked(fetchRecoveryCodes).mockResolvedValue([
            'code-one',
            'code-two',
        ]);

        render(Security);

        const toggle = await screen.findByRole('button', {
            name: /recovery codes/i,
        });
        expect(fetchRecoveryCodes).not.toHaveBeenCalled();

        const user = userEvent.setup();
        await user.click(toggle);

        await vi.waitFor(() =>
            expect(screen.getByText('code-one')).toBeVisible(),
        );
        expect(fetchRecoveryCodes).toHaveBeenCalledTimes(1);

        // Hiding and showing again reuses the codes already held in memory.
        await user.click(toggle);
        await user.click(toggle);

        expect(fetchRecoveryCodes).toHaveBeenCalledTimes(1);
    });

    it('regenerates recovery codes with POST then one additional GET', async () => {
        vi.mocked(fetchPasswordConfirmationStatus).mockResolvedValue({
            confirmed: true,
        });
        vi.mocked(fetchSecuritySettings).mockResolvedValue(securitySettings);
        vi.mocked(fetchRecoveryCodes)
            .mockResolvedValueOnce(['code-one', 'code-two'])
            .mockResolvedValueOnce(['new-code-one', 'new-code-two']);
        vi.mocked(regenerateRecoveryCodes).mockResolvedValue(undefined);

        render(Security);

        const user = userEvent.setup();
        const toggle = await screen.findByRole('button', {
            name: /view recovery codes/i,
        });

        expect(fetchRecoveryCodes).not.toHaveBeenCalled();

        await user.click(toggle);

        await vi.waitFor(() =>
            expect(screen.getByText('code-one')).toBeVisible(),
        );
        expect(fetchRecoveryCodes).toHaveBeenCalledTimes(1);
        expect(regenerateRecoveryCodes).not.toHaveBeenCalled();

        await user.click(
            screen.getByRole('button', { name: /regenerate codes/i }),
        );

        await vi.waitFor(() =>
            expect(screen.getByText('new-code-one')).toBeVisible(),
        );
        expect(regenerateRecoveryCodes).toHaveBeenCalledTimes(1);
        expect(fetchRecoveryCodes).toHaveBeenCalledTimes(2);
        expect(screen.queryByText('code-one')).not.toBeInTheDocument();
    });
});
