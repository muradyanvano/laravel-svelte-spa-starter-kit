<script lang="ts">
    import DocumentTitle from '@/components/DocumentTitle.svelte';
    import InputError from '@/components/InputError.svelte';
    import TextLink from '@/components/TextLink.svelte';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Spinner } from '@/components/ui/spinner';
    import { requestPasswordReset } from '@/lib/auth-api';
    import {
        createForm,
        fieldDescribedBy,
        fieldErrorId,
    } from '@/lib/form.svelte';
    import AuthLayout from '@/layouts/AuthLayout.svelte';
    import { p } from '@/router';

    const form = createForm({
        email: '',
    });

    const showFormError = $derived(
        Boolean(form.formError) && !form.errors.email,
    );

    async function handleSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();

        try {
            await form.submit(async (data) =>
                requestPasswordReset(data.email),
            );
        } catch {
            // Validation and API errors are mapped by createForm.
        }
    }
</script>

<DocumentTitle title="Forgot password" />

<AuthLayout
    title="Forgot password"
    description="Enter your email to receive a password reset link"
>
    {#if form.status}
        <div
            class="mb-4 text-center text-sm font-medium text-green-600"
            role="status"
        >
            {form.status}
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
                    autocomplete="off"
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

            <Button
                type="submit"
                class="w-full"
                disabled={form.processing}
                data-test="email-password-reset-link-button"
            >
                {#if form.processing}
                    <Spinner class="size-4" />
                {/if}
                Email password reset link
            </Button>
        </div>

        <p class="text-center text-sm text-muted-foreground">
            Or, return to
            <TextLink href={p('/login')}>log in</TextLink>
        </p>
    </form>
</AuthLayout>
