import { render, screen } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { resetAuthStateForTesting } from '@/auth/auth.svelte';
import Welcome from '@/pages/Welcome.svelte';

describe('Welcome', () => {
    beforeEach(() => {
        resetAuthStateForTesting({ status: 'unauthenticated' });
    });

    it('shows guest auth links when unauthenticated', () => {
        render(Welcome);

        expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute(
            'href',
            '/login',
        );
        expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute(
            'href',
            '/register',
        );
    });

    it('shows a dashboard link when authenticated', () => {
        resetAuthStateForTesting({
            status: 'authenticated',
            user: {
                id: 1,
                name: 'Test User',
                email: 'test@example.com',
                email_verified_at: '2026-01-01T00:00:00.000000Z',
            },
        });

        render(Welcome);

        expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
            'href',
            '/dashboard',
        );
        expect(
            screen.queryByRole('link', { name: 'Log in' }),
        ).not.toBeInTheDocument();
    });
});
