<script lang="ts">
    import DocumentTitle from '@/components/DocumentTitle.svelte';
    import InputError from '@/components/InputError.svelte';
    import PasswordInput from '@/components/PasswordInput.svelte';
    import TextLink from '@/components/TextLink.svelte';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Spinner } from '@/components/ui/spinner';
    import { refreshUser } from '@/auth/auth.svelte';
    import { register } from '@/lib/auth-api';
    import {
        createForm,
        fieldDescribedBy,
        fieldErrorId,
    } from '@/lib/form.svelte';
    import AuthLayout from '@/layouts/AuthLayout.svelte';
    import { navigate, p } from '@/router';

    const form = createForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const showFormError = $derived(
        Boolean(form.formError) &&
            !form.errors.name &&
            !form.errors.email &&
            !form.errors.password &&
            !form.errors.password_confirmation,
    );

    async function handleSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();

        try {
            await form.submit(async (data) => {
                await register(data);
                form.reset('password', 'password_confirmation');

                const user = await refreshUser();

                if (user !== null && user.email_verified_at === null) {
                    await navigate('/verify-email');

                    return;
                }

                await navigate('/dashboard');
            });
        } catch {
            // Validation and API errors are mapped by createForm.
        }
    }
</script>

<DocumentTitle title="Register" />

<AuthLayout
    title="Create an account"
    description="Enter your details below to create your account"
>
    <form class="flex flex-col gap-6" novalidate onsubmit={handleSubmit}>
        <div class="grid gap-6">
            {#if showFormError}
                <p class="text-sm text-red-600 dark:text-red-500" role="alert">
                    {form.formError}
                </p>
            {/if}

            <div class="grid gap-2">
                <Label for="name">Name</Label>
                <Input
                    id="name"
                    bind:value={form.data.name}
                    required
                    autocomplete="name"
                    disabled={form.processing}
                    aria-invalid={Boolean(form.errors.name)}
                    aria-describedby={fieldDescribedBy('name', form.errors)}
                />
                <InputError
                    id={fieldErrorId('name')}
                    message={form.errors.name}
                />
            </div>

            <div class="grid gap-2">
                <Label for="email">Email address</Label>
                <Input
                    id="email"
                    type="email"
                    bind:value={form.data.email}
                    required
                    autocomplete="email"
                    placeholder="email@example.com"
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
                data-test="register-user-button"
            >
                {#if form.processing}
                    <Spinner class="size-4" />
                {/if}
                Create account
            </Button>
        </div>

        <p class="text-center text-sm text-muted-foreground">
            Already have an account?
            <TextLink href={p('/login')}>Log in</TextLink>
        </p>
    </form>
</AuthLayout>
