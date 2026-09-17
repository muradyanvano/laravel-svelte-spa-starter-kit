import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAuthStateForTesting } from '@/auth/auth.svelte';
import { fetchCurrentUser, register } from '@/lib/auth-api';
import Register from '@/pages/auth/Register.svelte';
import { navigate } from '@/router';

vi.mock('@/lib/auth-api', () => ({
    fetchCurrentUser: vi.fn(),
    register: vi.fn(),
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

describe('Register', () => {
    beforeEach(() => {
        resetAuthStateForTesting({ status: 'unauthenticated' });
        vi.mocked(fetchCurrentUser).mockReset();
        vi.mocked(register).mockReset();
        vi.mocked(navigate).mockClear();
    });

    it('refreshes the current user once after registration', async () => {
        vi.mocked(register).mockResolvedValue(undefined);
        vi.mocked(fetchCurrentUser).mockResolvedValue(verifiedUser);

        render(Register);

        const user = userEvent.setup();
        await user.type(screen.getByLabelText('Name'), 'Test User');
        await user.type(
            screen.getByLabelText('Email address'),
            'test@example.com',
        );
        await user.type(screen.getByLabelText('Password'), 'password');
        await user.type(screen.getByLabelText('Confirm password'), 'password');
        await user.click(
            screen.getByRole('button', { name: 'Create account' }),
        );

        await vi.waitFor(() => expect(register).toHaveBeenCalledTimes(1));
        await vi.waitFor(() =>
            expect(fetchCurrentUser).toHaveBeenCalledTimes(1),
        );
        expect(navigate).toHaveBeenCalledWith('/dashboard');
    });
});
