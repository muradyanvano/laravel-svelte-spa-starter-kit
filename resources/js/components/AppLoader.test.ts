import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import AppLoader from '@/components/AppLoader.svelte';

describe('AppLoader', () => {
    it('renders an accessible loading state', () => {
        render(AppLoader);

        expect(screen.getByTestId('app-loader')).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
        expect(screen.getByText('Loading')).toBeInTheDocument();
    });
});
