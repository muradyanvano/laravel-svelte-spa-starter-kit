<script lang="ts">
    import DocumentTitle from '@/components/DocumentTitle.svelte';
    import InputError from '@/components/InputError.svelte';
    import PasswordInput from '@/components/PasswordInput.svelte';
    import TextLink from '@/components/TextLink.svelte';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Spinner } from '@/components/ui/spinner';
    import { refreshUser } from '@/auth/auth.svelte';
    import { login } from '@/lib/auth-api';
    import {
        createForm,
        fieldDescribedBy,
        fieldErrorId,
    } from '@/lib/form.svelte';
    import {
        asSpaPath,
        getPostAuthPath,
        historyStateFrom,
        historyStateStatus,
    } from '@/lib/navigation';
    import AuthLayout from '@/layouts/AuthLayout.svelte';
    import { navigate, p } from '@/router';

    const flashStatus = historyStateStatus();
    const intended = getPostAuthPath(historyStateFrom(), '/dashboard');

    const form = createForm({
        email: '',
        password: '',
        remember: false,
    });

    const showFormError = $derived(
        Boolean(form.formError) &&
            !form.errors.email &&
            !form.errors.password,
    );

    async function handleSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();

        try {
            await form.submit(async (data) => {
                const result = await login({
                    email: data.email,
                    password: data.password,
                    remember: data.remember,
                });

                if (result.two_factor) {
                    await navigate('/two-factor-challenge', {
                        replace: true,
                        state: { from: intended },
                    });

                    return;
                }

                form.reset('password');

                const user = await refreshUser();

                if (user !== null && user.email_verified_at === null) {
                    await navigate('/verify-email');

                    return;
                }

                await navigate(asSpaPath(intended));
            });
        } catch {
            // Validation and API errors are mapped by createForm.
        }
    }
</script>

<DocumentTitle title="Log in" />

<AuthLayout
    title="Log in to your account"
    description="Enter your email and password below to log in"
>
    {#if flashStatus}
        <div
            class="mb-4 text-center text-sm font-medium text-green-600"
            role="status"
        >
            {flashStatus}
        </div>
    {/if}

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
                <div class="flex items-center justify-between">
                    <Label for="password">Password</Label>
                    <TextLink href={p('/forgot-password')} class="text-sm">
                        Forgot your password?
                    </TextLink>
                </div>
                <PasswordInput
                    id="password"
                    bind:value={form.data.password}
                    required
                    autocomplete="current-password"
                    placeholder="Password"
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

            <div class="flex items-center gap-2">
                <Checkbox
                    id="remember"
                    bind:checked={form.data.remember}
                    disabled={form.processing}
                />
                <Label for="remember">Remember me</Label>
            </div>

            <Button
                type="submit"
                class="w-full"
                disabled={form.processing}
                data-test="login-button"
            >
                {#if form.processing}
                    <Spinner class="size-4" />
                {/if}
                Log in
            </Button>
        </div>

        <p class="text-center text-sm text-muted-foreground">
            Don't have an account?
            <TextLink href={p('/register')}>Sign up</TextLink>
        </p>
    </form>
</AuthLayout>
