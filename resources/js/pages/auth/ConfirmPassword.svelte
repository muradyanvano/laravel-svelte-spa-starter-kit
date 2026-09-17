<script lang="ts">
    import DocumentTitle from '@/components/DocumentTitle.svelte';
    import InputError from '@/components/InputError.svelte';
    import PasswordInput from '@/components/PasswordInput.svelte';
    import { Button } from '@/components/ui/button';
    import { Label } from '@/components/ui/label';
    import { Spinner } from '@/components/ui/spinner';
    import { confirmPassword } from '@/lib/auth-api';
    import {
        createForm,
        fieldDescribedBy,
        fieldErrorId,
    } from '@/lib/form.svelte';
    import {
        asSpaPath,
        getPostAuthPath,
        historyStateFrom,
    } from '@/lib/navigation';
    import AuthLayout from '@/layouts/AuthLayout.svelte';
    import { navigate } from '@/router';

    const intended = getPostAuthPath(
        historyStateFrom(),
        '/settings/security',
    );

    const form = createForm({
        password: '',
    });

    const showFormError = $derived(
        Boolean(form.formError) && !form.errors.password,
    );

    async function handleSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();

        try {
            await form.submit(async (data) => {
                await confirmPassword({ password: data.password });
                await navigate(asSpaPath(intended));
            });
        } catch {
            // Validation and API errors are mapped by createForm.
        }
    }
</script>

<DocumentTitle title="Confirm password" />

<AuthLayout
    title="Confirm your password"
    description="This is a secure area of the application. Please confirm your password before continuing."
>
    <form class="flex flex-col gap-6" novalidate onsubmit={handleSubmit}>
        <div class="grid gap-6">
            {#if showFormError}
                <p class="text-sm text-red-600 dark:text-red-500" role="alert">
                    {form.formError}
                </p>
            {/if}

            <div class="grid gap-2">
                <Label for="password">Password</Label>
                <PasswordInput
                    id="password"
                    bind:value={form.data.password}
                    required
                    autocomplete="current-password"
                    disabled={form.processing}
                    aria-invalid={Boolean(form.errors.password)}
                    aria-describedby={fieldDescribedBy(
                        'password',
                        form.errors,
                    )}
                />
                <InputError
                    id={fieldErrorId('password')}
                    message={form.errors.password}
                />
            </div>

            <Button
                type="submit"
                class="w-full"
                disabled={form.processing}
                data-test="confirm-password-button"
            >
                {#if form.processing}
                    <Spinner class="size-4" />
                {/if}
                Confirm password
            </Button>
        </div>
    </form>
</AuthLayout>
