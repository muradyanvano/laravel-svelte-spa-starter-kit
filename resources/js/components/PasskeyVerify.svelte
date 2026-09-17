<script lang="ts">
    import { usePasskeyVerify } from '@laravel/passkeys/svelte';
    import KeyRound from '@lucide/svelte/icons/key-round';
    import { untrack } from 'svelte';
    import InputError from '@/components/InputError.svelte';
    import { Button } from '@/components/ui/button';
    import { Separator } from '@/components/ui/separator';
    import { Spinner } from '@/components/ui/spinner';
    import {
        passkeyErrorMessage,
        preparePasskeyCeremony,
        shouldDisplayPasskeyError,
        type PasskeyRouteOverrides,
    } from '@/lib/passkeys';

    type Props = {
        routes?: PasskeyRouteOverrides;
        label?: string;
        loadingLabel?: string;
        separator?: string;
        remember?: boolean | (() => boolean);
        onVerified?: () => void | Promise<void>;
        testId?: string;
    };

    let {
        routes,
        label = 'Sign in with a passkey',
        loadingLabel = 'Authenticating...',
        separator = 'Or continue with email',
        remember,
        onVerified,
        testId = 'passkey-verify-button',
    }: Props = $props();

    const initialRoutes = untrack(() => routes);

    const passkeyVerify = usePasskeyVerify({
        ...(initialRoutes ? { routes: initialRoutes } : {}),
        remember: () => {
            if (typeof remember === 'function') {
                return remember();
            }

            return remember ?? false;
        },
        onSuccess: async () => {
            await onVerified?.();
        },
    });

    const displayError = $derived(
        passkeyVerify.error !== null &&
            shouldDisplayPasskeyError(passkeyVerify.errorInstance),
    );

    const errorMessage = $derived(
        passkeyVerify.errorInstance instanceof Error
            ? passkeyErrorMessage(passkeyVerify.errorInstance)
            : passkeyVerify.error,
    );

    async function handleVerify(): Promise<void> {
        await preparePasskeyCeremony();
        await passkeyVerify.verify();
    }
</script>

{#if passkeyVerify.isSupported}
    <div class="grid gap-2">
        <Button
            type="button"
            variant="outline"
            class="w-full"
            disabled={passkeyVerify.isLoading}
            data-test={testId}
            onclick={handleVerify}
        >
            {#if passkeyVerify.isLoading}
                <Spinner class="size-4" />
            {:else}
                <KeyRound class="h-4 w-4" aria-hidden="true" />
            {/if}
            {passkeyVerify.isLoading ? loadingLabel : label}
        </Button>

        {#if displayError && errorMessage}
            <div class="text-center">
                <InputError message={errorMessage} />
            </div>
        {/if}
    </div>

    <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
            <Separator class="w-full" />
        </div>
        <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-background px-2 text-muted-foreground">
                {separator}
            </span>
        </div>
    </div>
{/if}
