<script lang="ts">
    import DocumentTitle from '@/components/DocumentTitle.svelte';
    import InputError from '@/components/InputError.svelte';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import {
        InputOTP,
        InputOTPGroup,
        InputOTPSlot,
    } from '@/components/ui/input-otp';
    import { Label } from '@/components/ui/label';
    import { Spinner } from '@/components/ui/spinner';
    import { refreshUser } from '@/auth/auth.svelte';
    import { submitTwoFactorChallenge } from '@/lib/auth-api';
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

    let showRecoveryInput = $state(false);
    let code = $state('');

    const intended = getPostAuthPath(historyStateFrom(), '/dashboard');

    const form = createForm({
        recovery_code: '',
    });

    const authConfigContent = $derived.by(() => {
        if (showRecoveryInput) {
            return {
                title: 'Recovery code',
                description:
                    'Please confirm access to your account by entering one of your emergency recovery codes.',
                buttonText: 'login using an authentication code',
            };
        }

        return {
            title: 'Authentication code',
            description:
                'Enter the authentication code provided by your authenticator application.',
            buttonText: 'login using a recovery code',
        };
    });

    const showFormError = $derived(
        Boolean(form.formError) &&
            !form.errors.code &&
            !form.errors.recovery_code,
    );

    async function completeChallenge(): Promise<void> {
        const user = await refreshUser();

        if (user !== null && user.email_verified_at === null) {
            await navigate('/verify-email');

            return;
        }

        await navigate(asSpaPath(intended));
    }

    async function handleOtpSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();

        try {
            await form.submit(async () => {
                await submitTwoFactorChallenge({ code });
            });

            await completeChallenge();
        } catch {
            if (form.errors.code) {
                code = '';
            }
        }
    }

    async function handleRecoverySubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();

        try {
            await form.submit(async (data) => {
                await submitTwoFactorChallenge({
                    recovery_code: data.recovery_code,
                });
            });

            await completeChallenge();
        } catch {
            // Validation and API errors are mapped by createForm.
        }
    }

    function toggleRecoveryMode(): void {
        showRecoveryInput = !showRecoveryInput;
        form.clearErrors();
        code = '';
        form.reset('recovery_code');
    }
</script>

<DocumentTitle title="Two-factor authentication" />

<AuthLayout
    title={authConfigContent.title}
    description={authConfigContent.description}
>
    {#if !showRecoveryInput}
        <form class="flex flex-col gap-6" novalidate onsubmit={handleOtpSubmit}>
            <div class="grid gap-6">
                {#if showFormError}
                    <p
                        class="text-sm text-red-600 dark:text-red-500"
                        role="alert"
                    >
                        {form.formError}
                    </p>
                {/if}

                <div class="grid gap-2">
                    <Label for="code" class="sr-only">Authentication code</Label>
                    <InputOTP
                        id="code"
                        maxlength={6}
                        bind:value={code}
                        disabled={form.processing}
                        aria-invalid={Boolean(form.errors.code)}
                        aria-describedby={fieldDescribedBy('code', form.errors)}
                    >
                        <InputOTPGroup>
                            {#each { length: 6 } as _, index (index)}
                                <InputOTPSlot {index} />
                            {/each}
                        </InputOTPGroup>
                    </InputOTP>
                    <InputError
                        id={fieldErrorId('code')}
                        message={form.errors.code}
                    />
                </div>

                <Button
                    type="submit"
                    class="w-full"
                    disabled={form.processing || code.length < 6}
                >
                    {#if form.processing}
                        <Spinner class="size-4" />
                    {/if}
                    Continue
                </Button>

                <div class="text-center text-sm text-muted-foreground">
                    or you can
                    <Button
                        type="button"
                        variant="link"
                        class="h-auto p-0 text-sm"
                        onclick={toggleRecoveryMode}
                    >
                        {authConfigContent.buttonText}
                    </Button>
                </div>
            </div>
        </form>
    {:else}
        <form
            class="flex flex-col gap-6"
            novalidate
            onsubmit={handleRecoverySubmit}
        >
            <div class="grid gap-6">
                {#if showFormError}
                    <p
                        class="text-sm text-red-600 dark:text-red-500"
                        role="alert"
                    >
                        {form.formError}
                    </p>
                {/if}

                <div class="grid gap-2">
                    <Label for="recovery_code">Recovery code</Label>
                    <Input
                        id="recovery_code"
                        bind:value={form.data.recovery_code}
                        required
                        autocomplete="one-time-code"
                        disabled={form.processing}
                        aria-invalid={Boolean(form.errors.recovery_code)}
                        aria-describedby={fieldDescribedBy(
                            'recovery_code',
                            form.errors,
                        )}
                    />
                    <InputError
                        id={fieldErrorId('recovery_code')}
                        message={form.errors.recovery_code}
                    />
                </div>

                <Button
                    type="submit"
                    class="w-full"
                    disabled={form.processing}
                >
                    {#if form.processing}
                        <Spinner class="size-4" />
                    {/if}
                    Continue
                </Button>

                <div class="text-center text-sm text-muted-foreground">
                    or you can
                    <Button
                        type="button"
                        variant="link"
                        class="h-auto p-0 text-sm"
                        onclick={toggleRecoveryMode}
                    >
                        {authConfigContent.buttonText}
                    </Button>
                </div>
            </div>
        </form>
    {/if}
</AuthLayout>
