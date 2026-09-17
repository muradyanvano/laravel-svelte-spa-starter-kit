<script lang="ts">
    import DocumentTitle from '@/components/DocumentTitle.svelte';
    import InputError from '@/components/InputError.svelte';
    import PasswordInput from '@/components/PasswordInput.svelte';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Spinner } from '@/components/ui/spinner';
    import { resetPassword } from '@/lib/auth-api';
    import {
        createForm,
        fieldDescribedBy,
        fieldErrorId,
    } from '@/lib/form.svelte';
    import AuthLayout from '@/layouts/AuthLayout.svelte';
    import { navigate, route } from '@/router';

    const token = $derived(route.params.token ?? '');
    const emailFromSearch = $derived(
        String((route.search as Record<string, string>).email ?? ''),
    );

    const form = createForm({
        email: '',
        password: '',
        password_confirmation: '',
    });

    $effect(() => {
        form.setField('email', emailFromSearch);
    });

    const showFormError = $derived(
        Boolean(form.formError) &&
            !form.errors.email &&
            !form.errors.password &&
            !form.errors.password_confirmation,
    );

    async function handleSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();

        try {
            await form.submit(async (data) => {
                const message = await resetPassword({
                    token,
                    email: data.email,
                    password: data.password,
                    password_confirmation: data.password_confirmation,
                });

                await navigate('/login', {
                    replace: true,
                    state: { status: message },
                });
            });
        } catch {
            // Validation and API errors are mapped by createForm.
        }
    }
</script>

<DocumentTitle title="Reset password" />

<AuthLayout
    title="Reset password"
    description="Please enter your new password below"
>
    <form class="flex flex-col gap-6" novalidate onsubmit={handleSubmit}>
        <div class="grid gap-6">
            {#if showFormError}
                <p class="text-sm text-red-600 dark:text-red-500" role="alert">
                    {form.formError}
                </p>
            {/if}

            <div class="grid gap-2">
                <Label for="email">Email address</Label>
                <Input
                    id="email"
                    type="email"
                    bind:value={form.data.email}
                    required
                    readonly
                    autocomplete="email"
                    disabled={form.processing}
                    aria-invalid={Boolean(form.errors.email)}
                    aria-describedby={fieldDescribedBy('email', form.errors)}
                />
                <InputError
                    id={fieldErrorId('email')}
                    message={form.errors.email}
                />
            </div>

            <div class="grid gap-2">
                <Label for="password">Password</Label>
                <PasswordInput
                    id="password"
                    bind:value={form.data.password}
                    required
                    autocomplete="new-password"
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

            <div class="grid gap-2">
                <Label for="password_confirmation">Confirm password</Label>
                <PasswordInput
                    id="password_confirmation"
                    bind:value={form.data.password_confirmation}
                    required
                    autocomplete="new-password"
                    disabled={form.processing}
                    aria-invalid={Boolean(form.errors.password_confirmation)}
                    aria-describedby={fieldDescribedBy(
                        'password_confirmation',
                        form.errors,
                    )}
                />
                <InputError
                    id={fieldErrorId('password_confirmation')}
                    message={form.errors.password_confirmation}
                />
            </div>

            <Button
                type="submit"
                class="w-full"
                disabled={form.processing}
                data-test="reset-password-button"
            >
                {#if form.processing}
                    <Spinner class="size-4" />
                {/if}
                Reset password
            </Button>
        </div>
    </form>
</AuthLayout>
