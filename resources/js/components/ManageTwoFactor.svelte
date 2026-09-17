<script lang="ts">
    import ShieldCheck from '@lucide/svelte/icons/shield-check';
    import { onDestroy } from 'svelte';
    import Heading from '@/components/Heading.svelte';
    import TwoFactorRecoveryCodes from '@/components/TwoFactorRecoveryCodes.svelte';
    import TwoFactorSetupModal from '@/components/TwoFactorSetupModal.svelte';
    import { Button } from '@/components/ui/button';
    import { Spinner } from '@/components/ui/spinner';
    import { normalizeApiError } from '@/lib/http';
    import { navigateToConfirmPasswordIfRequired } from '@/lib/navigation';
    import { disableTwoFactor, enableTwoFactor } from '@/lib/settings-api';
    import { twoFactorAuthState } from '@/lib/twoFactorAuth.svelte';

    export type Props = {
        canManageTwoFactor?: boolean;
        requiresConfirmation?: boolean;
        twoFactorEnabled?: boolean;
        onUpdated?: () => void | Promise<void>;
    };

    let {
        canManageTwoFactor = false,
        requiresConfirmation = false,
        twoFactorEnabled = false,
        onUpdated,
    }: Props = $props();

    const twoFactorAuth = twoFactorAuthState();

    let showSetupModal = $state(false);
    let processing = $state(false);
    let actionError = $state<string | null>(null);

    /** Sensitive 2FA payloads never outlive this component. */
    onDestroy(() => twoFactorAuth.clearTwoFactorAuthData());

    async function handleEnable(): Promise<void> {
        processing = true;
        actionError = null;

        try {
            await enableTwoFactor();
            showSetupModal = true;
        } catch (error) {
            if (
                await navigateToConfirmPasswordIfRequired(
                    error,
                    '/settings/security',
                )
            ) {
                return;
            }

            actionError = normalizeApiError(error).message;
        } finally {
            processing = false;
        }
    }

    async function handleDisable(): Promise<void> {
        processing = true;
        actionError = null;

        try {
            await disableTwoFactor();
            twoFactorAuth.clearTwoFactorAuthData();
            await onUpdated?.();
        } catch (error) {
            if (
                await navigateToConfirmPasswordIfRequired(
                    error,
                    '/settings/security',
                )
            ) {
                return;
            }

            actionError = normalizeApiError(error).message;
        } finally {
            processing = false;
        }
    }
</script>

{#if canManageTwoFactor}
    <div class="space-y-6">
        <Heading
            variant="small"
            title="Two-factor authentication"
            description="Manage your two-factor authentication settings"
        />

        {#if actionError}
            <p class="text-sm text-red-600 dark:text-red-500" role="alert">
                {actionError}
            </p>
        {/if}

        {#if !twoFactorEnabled}
            <div class="flex flex-col items-start justify-start space-y-4">
                <p class="text-sm text-muted-foreground">
                    When you enable two-factor authentication, you will be
                    prompted for a secure pin during login. This pin can be
                    retrieved from a TOTP-supported application on your phone.
                </p>

                <div>
                    {#if twoFactorAuth.hasSetupData()}
                        <Button
                            onclick={() => (showSetupModal = true)}
                            data-test="continue-2fa-setup-button"
                        >
                            <ShieldCheck class="size-4" />Continue setup
                        </Button>
                    {:else}
                        <Button
                            disabled={processing}
                            onclick={handleEnable}
                            data-test="enable-2fa-button"
                        >
                            {#if processing}
                                <Spinner class="size-4" />
                            {/if}
                            Enable 2FA
                        </Button>
                    {/if}
                </div>
            </div>
        {:else}
            <div class="flex flex-col items-start justify-start space-y-4">
                <p class="text-sm text-muted-foreground">
                    You will be prompted for a secure, random pin during login,
                    which you can retrieve from the TOTP-supported application
                    on your phone.
                </p>

                <div class="relative inline">
                    <Button
                        variant="destructive"
                        disabled={processing}
                        onclick={handleDisable}
                        data-test="disable-2fa-button"
                    >
                        {#if processing}
                            <Spinner class="size-4" />
                        {/if}
                        Disable 2FA
                    </Button>
                </div>

                <TwoFactorRecoveryCodes />
            </div>
        {/if}

        <TwoFactorSetupModal
            bind:isOpen={showSetupModal}
            {requiresConfirmation}
            {twoFactorEnabled}
            onConfirmed={onUpdated}
        />
    </div>
{/if}
