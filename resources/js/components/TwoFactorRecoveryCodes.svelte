<script lang="ts">
    import Eye from '@lucide/svelte/icons/eye';
    import EyeOff from '@lucide/svelte/icons/eye-off';
    import LockKeyhole from '@lucide/svelte/icons/lock-keyhole';
    import RefreshCw from '@lucide/svelte/icons/refresh-cw';
    import { tick } from 'svelte';
    import AlertError from '@/components/AlertError.svelte';
    import { Button } from '@/components/ui/button';
    import {
        Card,
        CardContent,
        CardDescription,
        CardHeader,
        CardTitle,
    } from '@/components/ui/card';
    import { Spinner } from '@/components/ui/spinner';
    import { twoFactorAuthState } from '@/lib/twoFactorAuth.svelte';

    const twoFactorAuth = twoFactorAuthState();

    let isRecoveryCodesVisible = $state(false);
    let isFetching = $state(false);
    let isRegenerating = $state(false);
    let recoveryCodeSectionRef = $state<HTMLDivElement | undefined>();

    /**
     * Recovery codes are fetched only on an explicit "View" click, never on mount.
     * Codes already held in memory are reused when the section is hidden and
     * shown again; they are dropped when the 2FA management UI is destroyed.
     */
    async function toggleRecoveryCodesVisibility(): Promise<void> {
        if (
            !isRecoveryCodesVisible &&
            !twoFactorAuth.state.recoveryCodesList.length
        ) {
            isFetching = true;

            try {
                await twoFactorAuth.fetchRecoveryCodes();
            } finally {
                isFetching = false;
            }
        }

        isRecoveryCodesVisible = !isRecoveryCodesVisible;

        if (isRecoveryCodesVisible) {
            await tick();
            recoveryCodeSectionRef?.scrollIntoView({ behavior: 'smooth' });
        }
    }

    async function handleRegenerate(): Promise<void> {
        isRegenerating = true;

        try {
            await twoFactorAuth.regenerateRecoveryCodes();
        } finally {
            isRegenerating = false;
        }
    }
</script>

<Card class="w-full">
    <CardHeader>
        <CardTitle class="flex gap-3">
            <LockKeyhole class="size-4" />2FA recovery codes
        </CardTitle>
        <CardDescription>
            Recovery codes let you regain access if you lose your 2FA device.
            Store them in a secure password manager.
        </CardDescription>
    </CardHeader>
    <CardContent>
        <div
            class="flex flex-col gap-3 select-none sm:flex-row sm:items-center sm:justify-between"
        >
            <Button
                onclick={toggleRecoveryCodesVisibility}
                disabled={isFetching}
                class="w-fit"
                data-test="toggle-recovery-codes-button"
            >
                {#if isFetching}
                    <Spinner class="size-4" />
                {:else if isRecoveryCodesVisible}
                    <EyeOff class="size-4" />
                {:else}
                    <Eye class="size-4" />
                {/if}
                {isRecoveryCodesVisible ? 'Hide' : 'View'} recovery codes
            </Button>

            {#if isRecoveryCodesVisible && twoFactorAuth.state.recoveryCodesList.length}
                <Button
                    variant="secondary"
                    disabled={isRegenerating}
                    onclick={handleRegenerate}
                    data-test="regenerate-recovery-codes-button"
                >
                    {#if isRegenerating}
                        <Spinner class="size-4" />
                    {:else}
                        <RefreshCw class="size-4" />
                    {/if}
                    Regenerate codes
                </Button>
            {/if}
        </div>
        <div
            class="relative overflow-hidden transition-all duration-300 {isRecoveryCodesVisible
                ? 'h-auto opacity-100'
                : 'h-0 opacity-0'}"
        >
            {#if twoFactorAuth.state.errors.length}
                <div class="mt-6">
                    <AlertError errors={twoFactorAuth.state.errors} />
                </div>
            {:else}
                <div class="mt-3 space-y-3">
                    <div
                        bind:this={recoveryCodeSectionRef}
                        class="grid gap-1 rounded-lg bg-muted p-4 font-mono text-sm"
                    >
                        {#if !twoFactorAuth.state.recoveryCodesList.length}
                            <div class="space-y-2">
                                {#each { length: 8 } as _, index (index)}
                                    <div
                                        class="h-4 animate-pulse rounded bg-muted-foreground/20"
                                    ></div>
                                {/each}
                            </div>
                        {:else}
                            {#each twoFactorAuth.state.recoveryCodesList as code, index (index)}
                                <div>{code}</div>
                            {/each}
                        {/if}
                    </div>
                    <p class="text-xs text-muted-foreground select-none">
                        Each recovery code can be used once to access your
                        account and will be removed after use. If you need more,
                        click <span class="font-bold">Regenerate codes</span> above.
                    </p>
                </div>
            {/if}
        </div>
    </CardContent>
</Card>
