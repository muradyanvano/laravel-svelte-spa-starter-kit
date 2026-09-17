<script lang="ts">
    import DocumentTitle from '@/components/DocumentTitle.svelte';
    import { Button } from '@/components/ui/button';
    import { Spinner } from '@/components/ui/spinner';
    import { logout, useAuth } from '@/auth/auth.svelte';
    import { resendVerificationEmail } from '@/lib/auth-api';
    import { createForm } from '@/lib/form.svelte';
    import AuthLayout from '@/layouts/AuthLayout.svelte';
    import { navigate } from '@/router';

    const auth = useAuth();
    const form = createForm({});

    $effect(() => {
        if (auth.isVerified()) {
            void navigate('/dashboard');
        }
    });

    async function handleResend(): Promise<void> {
        try {
            await form.submit(() => resendVerificationEmail());
        } catch {
            // Validation and API errors are mapped by createForm.
        }
    }

    async function handleLogout(): Promise<void> {
        await logout();
        await navigate('/login');
    }
</script>

<DocumentTitle title="Email verification" />

<AuthLayout
    title="Verify your email"
    description="Please verify your email address by clicking on the link we just emailed to you."
>
    {#if form.status === 'verification-link-sent'}
        <div
            class="mb-4 text-center text-sm font-medium text-green-600"
            role="status"
        >
            A new verification link has been sent to the email address you
            provided during registration.
        </div>
    {/if}

    <div class="flex flex-col gap-6">
        {#if form.formError}
            <p class="text-sm text-red-600 dark:text-red-500" role="alert">
                {form.formError}
            </p>
        {/if}

        <Button
            type="button"
            class="w-full"
            disabled={form.processing}
            onclick={handleResend}
        >
            {#if form.processing}
                <Spinner class="size-4" />
            {/if}
            Resend verification email
        </Button>

        <button
            type="button"
            class="text-foreground mx-auto text-sm underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current dark:decoration-neutral-500"
            onclick={handleLogout}
        >
            Log out
        </button>
    </div>
</AuthLayout>
