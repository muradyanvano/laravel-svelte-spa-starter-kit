<script lang="ts">
    import Check from '@lucide/svelte/icons/check';
    import Copy from '@lucide/svelte/icons/copy';
    import ScanLine from '@lucide/svelte/icons/scan-line';
    import { tick } from 'svelte';
    import AlertError from '@/components/AlertError.svelte';
    import InputError from '@/components/InputError.svelte';
    import { Button } from '@/components/ui/button';
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogTitle,
    } from '@/components/ui/dialog';
    import {
        InputOTP,
        InputOTPGroup,
        InputOTPSlot,
    } from '@/components/ui/input-otp';
    import { Spinner } from '@/components/ui/spinner';
    import {
        createForm,
        fieldDescribedBy,
        fieldErrorId,
    } from '@/lib/form.svelte';
    import { navigateToConfirmPasswordIfRequired } from '@/lib/navigation';
    import { confirmTwoFactor } from '@/lib/settings-api';
    import { themeState } from '@/lib/theme.svelte';
    import { twoFactorAuthState } from '@/lib/twoFactorAuth.svelte';
    import type { TwoFactorConfigContent } from '@/types';

    let {
        requiresConfirmation,
        twoFactorEnabled,
        isOpen = $bindable(false),
        onConfirmed,
    }: {
        requiresConfirmation: boolean;
        twoFactorEnabled: boolean;
        isOpen?: boolean;
        onConfirmed?: () => void | Promise<void>;
    } = $props();

    const { resolvedAppearance } = themeState();
    const twoFactorAuth = twoFactorAuthState();

    const form = createForm({ code: '' });

    let showVerificationStep = $state(false);
    let copied = $state(false);
    let pinInputContainerRef = $state<HTMLDivElement>();

    const modalConfig: TwoFactorConfigContent = $derived.by(() => {
        if (twoFactorEnabled) {
            return {
                title: 'Two-factor authentication enabled',
                description:
                    'Two-factor authentication is now enabled. Scan the QR code or enter the setup key in your authenticator app.',
                buttonText: 'Close',
            };
        }

        if (showVerificationStep) {
            return {
                title: 'Verify authentication code',
                description:
                    'Enter the 6-digit code from your authenticator app',
                buttonText: 'Continue',
            };
        }

        return {
            title: 'Enable two-factor authentication',
            description:
                'To finish enabling two-factor authentication, scan the QR code or enter the setup key in your authenticator app',
            buttonText: 'Continue',
        };
    });

    const qrCodeDataUrl = $derived.by(() => {
        const qrCodeSvg = twoFactorAuth.state.qrCodeSvg;

        if (!qrCodeSvg) {
            return '';
        }

        return `data:image/svg+xml;utf8,${encodeURIComponent(qrCodeSvg)}`;
    });

    async function copyToClipboard(text: string): Promise<void> {
        await navigator.clipboard.writeText(text);
        copied = true;
        setTimeout(() => (copied = false), 2000);
    }

    async function handleModalNextStep(): Promise<void> {
        if (requiresConfirmation) {
            showVerificationStep = true;
            await tick();
            pinInputContainerRef?.querySelector('input')?.focus();

            return;
        }

        twoFactorAuth.clearSetupData();
        isOpen = false;
    }

    async function handleConfirm(event: SubmitEvent): Promise<void> {
        event.preventDefault();

        try {
            await form.submit(async (data) => {
                await confirmTwoFactor({ code: data.code });
            });
        } catch (error) {
            form.reset('code');

            if (
                await navigateToConfirmPasswordIfRequired(
                    error,
                    '/settings/security',
                )
            ) {
                isOpen = false;
            }

            return;
        }

        twoFactorAuth.clearSetupData();
        isOpen = false;
        await onConfirmed?.();
    }

    function resetModalState(): void {
        if (twoFactorEnabled) {
            twoFactorAuth.clearSetupData();
        }

        showVerificationStep = false;
        form.reset('code');
        form.clearErrors();
    }

    $effect(() => {
        if (!isOpen) {
            resetModalState();

            return;
        }

        if (!twoFactorAuth.state.qrCodeSvg) {
            void twoFactorAuth.fetchSetupData();
        }
    });
</script>

<Dialog bind:open={isOpen}>
    <DialogContent class="sm:max-w-md">
        <div class="flex flex-col items-center justify-center">
            <div
                class="mb-3 w-auto rounded-full border border-border bg-card p-0.5 shadow-sm"
            >
                <div
                    class="relative overflow-hidden rounded-full border border-border bg-muted p-2.5"
                >
                    <div class="absolute inset-0 grid grid-cols-5 opacity-50">
                        {#each { length: 5 } as _, index (index)}
                            <div
                                class="border-r border-border last:border-r-0"
                            ></div>
                        {/each}
                    </div>
                    <div class="absolute inset-0 grid grid-rows-5 opacity-50">
                        {#each { length: 5 } as _, index (index)}
                            <div
                                class="border-b border-border last:border-b-0"
                            ></div>
                        {/each}
                    </div>
                    <ScanLine class="relative z-20 size-6 text-foreground" />
                </div>
            </div>
            <div class="my-3 space-y-1 text-center">
                <DialogTitle>{modalConfig.title}</DialogTitle>
                <DialogDescription>
                    {modalConfig.description}
                </DialogDescription>
            </div>
        </div>

        <div
            class="relative flex w-auto flex-col items-center justify-center space-y-5"
        >
            {#if !showVerificationStep}
                {#if twoFactorAuth.state.errors.length}
                    <AlertError errors={twoFactorAuth.state.errors} />
                {:else}
                    <div
                        class="relative mx-auto flex max-w-md items-center overflow-hidden"
                    >
                        <div
                            class="relative mx-auto aspect-square w-64 overflow-hidden rounded-lg border border-border"
                        >
                            {#if !twoFactorAuth.state.qrCodeSvg}
                                <div
                                    class="absolute inset-0 z-10 flex aspect-square h-auto w-full animate-pulse items-center justify-center bg-background"
                                >
                                    <Spinner class="size-6" />
                                </div>
                            {:else}
                                <div
                                    class="relative z-10 overflow-hidden border p-5"
                                >
                                    <div
                                        class="flex aspect-square size-full items-center justify-center [&>svg]:size-full"
                                        style={resolvedAppearance() === 'dark'
                                            ? 'filter: invert(1) brightness(1.5)'
                                            : undefined}
                                    >
                                        <img
                                            src={qrCodeDataUrl}
                                            alt="Two-factor authentication QR code"
                                            class="size-full"
                                        />
                                    </div>
                                </div>
                            {/if}
                        </div>
                    </div>

                    <div class="flex w-full items-center space-x-5">
                        <Button class="w-full" onclick={handleModalNextStep}>
                            {modalConfig.buttonText}
                        </Button>
                    </div>

                    <div
                        class="relative flex w-full items-center justify-center"
                    >
                        <div
                            class="absolute inset-0 top-1/2 h-px w-full bg-border"
                        ></div>
                        <span class="relative bg-card px-2 py-1">
                            or, enter the code manually
                        </span>
                    </div>

                    <div
                        class="flex w-full items-center justify-center space-x-2"
                    >
                        <div
                            class="flex w-full items-stretch overflow-hidden rounded-xl border border-border"
                        >
                            {#if !twoFactorAuth.state.manualSetupKey}
                                <div
                                    class="flex h-full w-full items-center justify-center bg-muted p-3"
                                >
                                    <Spinner />
                                </div>
                            {:else}
                                <input
                                    type="text"
                                    readonly
                                    aria-label="Setup key"
                                    value={twoFactorAuth.state.manualSetupKey}
                                    class="h-full w-full bg-background p-3 text-foreground"
                                />
                                <button
                                    type="button"
                                    onclick={() =>
                                        copyToClipboard(
                                            twoFactorAuth.state
                                                .manualSetupKey || '',
                                        )}
                                    aria-label="Copy setup key"
                                    class="relative block h-auto border-l border-border px-3 hover:bg-muted"
                                >
                                    {#if copied}
                                        <Check class="w-4 text-green-500" />
                                    {:else}
                                        <Copy class="w-4" />
                                    {/if}
                                </button>
                            {/if}
                        </div>
                    </div>
                {/if}
            {:else}
                <form class="w-full" novalidate onsubmit={handleConfirm}>
                    <div
                        bind:this={pinInputContainerRef}
                        class="relative w-full space-y-3"
                    >
                        <div
                            class="flex w-full flex-col items-center justify-center space-y-3 py-2"
                        >
                            <div class="grid gap-2">
                                <InputOTP
                                    id="otp"
                                    bind:value={form.data.code}
                                    maxlength={6}
                                    disabled={form.processing}
                                    aria-label="Authentication code"
                                    aria-invalid={Boolean(form.errors.code)}
                                    aria-describedby={fieldDescribedBy(
                                        'code',
                                        form.errors,
                                    )}
                                >
                                    <InputOTPGroup>
                                        {#each { length: 6 } as _, index (index)}
                                            <InputOTPSlot {index} />
                                        {/each}
                                    </InputOTPGroup>
                                </InputOTP>
                                <InputError
                                    id={fieldErrorId('code')}
                                    message={form.errors.code ??
                                        form.errors[
                                            'confirmTwoFactorAuthentication.code'
                                        ]}
                                />
                            </div>
                        </div>

                        <div class="flex w-full items-center space-x-5">
                            <Button
                                type="button"
                                variant="outline"
                                class="w-auto flex-1"
                                onclick={() => (showVerificationStep = false)}
                                disabled={form.processing}
                            >
                                Back
                            </Button>
                            <Button
                                type="submit"
                                class="w-auto flex-1"
                                disabled={form.processing ||
                                    form.data.code.length < 6}
                            >
                                {#if form.processing}
                                    <Spinner class="size-4" />
                                {/if}
                                Confirm
                            </Button>
                        </div>
                    </div>
                </form>
            {/if}
        </div>
    </DialogContent>
</Dialog>
