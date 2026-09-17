import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAuthStateForTesting, useAuth } from '@/auth/auth.svelte';
import { fetchCurrentUser } from '@/lib/auth-api';
import { deleteAccount, updateProfileInformation } from '@/lib/settings-api';
import Profile from '@/pages/settings/Profile.svelte';
import { navigate } from '@/router';

vi.mock('@/lib/auth-api', () => ({
    fetchCurrentUser: vi.fn(),
    logout: vi.fn(),
    resendVerificationEmail: vi.fn(),
}));

vi.mock('@/lib/settings-api', () => ({
    updateProfileInformation: vi.fn(),
    deleteAccount: vi.fn(),
}));

vi.mock('@/router', () => ({
    navigate: vi.fn().mockResolvedValue(undefined),
    p: (path: string) => path,
    route: { pathname: '/settings/profile', params: {}, search: {} },
}));

const verifiedUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    email_verified_at: '2026-01-01T00:00:00.000000Z',
};

describe('Profile settings', () => {
    beforeEach(() => {
        resetAuthStateForTesting({
            user: verifiedUser,
            status: 'authenticated',
        });
        vi.mocked(fetchCurrentUser).mockReset();
        vi.mocked(updateProfileInformation).mockReset();
        vi.mocked(deleteAccount).mockReset();
        vi.mocked(navigate).mockClear();
    });

    it('refreshes the current user once after a successful update', async () => {
        vi.mocked(updateProfileInformation).mockResolvedValue(undefined);
        vi.mocked(fetchCurrentUser).mockResolvedValue({
            ...verifiedUser,
            name: 'Renamed User',
        });

        render(Profile);

        const user = userEvent.setup();
        const nameField = screen.getByLabelText('Name');
        await user.clear(nameField);
        await user.type(nameField, 'Renamed User');
        await user.click(screen.getByRole('button', { name: 'Save' }));

        await vi.waitFor(() =>
            expect(updateProfileInformation).toHaveBeenCalledWith({
                name: 'Renamed User',
                email: 'test@example.com',
            }),
        );
        await vi.waitFor(() =>
            expect(fetchCurrentUser).toHaveBeenCalledTimes(1),
        );
        expect(useAuth().user?.name).toBe('Renamed User');
    });

    it('does not refresh the current user when validation fails', async () => {
        vi.mocked(updateProfileInformation).mockRejectedValue({
            kind: 'validation',
            status: 422,
            message: 'The given data was invalid.',
            errors: { email: ['The email has already been taken.'] },
        });

        render(Profile);

        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: 'Save' }));

        await vi.waitFor(() =>
            expect(screen.getByLabelText('Email address')).toHaveAttribute(
                'aria-invalid',
                'true',
            ),
        );
        expect(
            screen.getByText('The email has already been taken.'),
        ).toHaveAttribute('role', 'alert');
        expect(fetchCurrentUser).not.toHaveBeenCalled();
    });

    it('clears auth state after deleting the account', async () => {
        vi.mocked(deleteAccount).mockResolvedValue(undefined);

        render(Profile);

        const user = userEvent.setup();
        await user.click(
            screen.getByRole('button', { name: 'Delete account' }),
        );
        await user.type(screen.getByLabelText('Password'), 'password');

        const dialog = within(screen.getByRole('dialog'));
        await user.click(
            dialog.getByRole('button', { name: 'Delete account' }),
        );

        await vi.waitFor(() =>
            expect(deleteAccount).toHaveBeenCalledWith({
                password: 'password',
            }),
        );
        expect(useAuth().user).toBeNull();
        expect(useAuth().status).toBe('unauthenticated');
        expect(navigate).toHaveBeenCalledWith('/', { replace: true });
        expect(fetchCurrentUser).not.toHaveBeenCalled();
    });
});
