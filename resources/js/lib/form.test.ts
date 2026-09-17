import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import type { FormState } from '@/lib/form.svelte';
import FormHarness from '@/testing/FormHarness.svelte';

type HarnessData = { email: string };

describe('createForm', () => {
    it('maps validation errors to field errors and formError', async () => {
        let form!: FormState<HarnessData>;

        render(FormHarness, {
            props: {
                onForm: (nextForm) => {
                    form = nextForm;
                },
            },
        });

        const validationError = {
            kind: 'validation' as const,
            status: 422,
            message: 'The given data was invalid.',
            errors: {
                email: ['The email field is required.'],
            },
        };

        await expect(
            form.submit(async () => {
                throw validationError;
            }),
        ).rejects.toEqual(validationError);

        expect(form.errors.email).toBe('The email field is required.');
        expect(form.formError).toBe('The given data was invalid.');
        expect(screen.getByTestId('field-error')).toHaveTextContent(
            'The email field is required.',
        );
    });

    it('locks processing while submit is in flight', async () => {
        let form!: FormState<HarnessData>;
        let resolveSubmit!: () => void;
        const action = vi.fn(
            () =>
                new Promise<void>((resolve) => {
                    resolveSubmit = resolve;
                }),
        );

        render(FormHarness, {
            props: {
                onForm: (nextForm) => {
                    form = nextForm;
                },
            },
        });

        const submitPromise = form.submit(action);

        expect(form.processing).toBe(true);

        await form.submit(async () => {
            throw new Error('Should not run');
        });

        expect(action).toHaveBeenCalledTimes(1);

        resolveSubmit();
        await submitPromise;

        expect(form.processing).toBe(false);
    });

    it('stores string results as status', async () => {
        let form!: FormState<HarnessData>;

        render(FormHarness, {
            props: {
                onForm: (nextForm) => {
                    form = nextForm;
                },
            },
        });

        await form.submit(async () => 'Reset link sent.');

        expect(form.status).toBe('Reset link sent.');
        expect(screen.getByTestId('form-status')).toHaveTextContent(
            'Reset link sent.',
        );
    });
});
