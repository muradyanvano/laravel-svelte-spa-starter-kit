<script lang="ts">
    import { onMount } from 'svelte';
    import KeyRound from '@lucide/svelte/icons/key-round';
    import Heading from '@/components/Heading.svelte';
    import PasskeyItem from '@/components/PasskeyItem.svelte';
    import PasskeyRegister from '@/components/PasskeyRegister.svelte';
    import { Skeleton } from '@/components/ui/skeleton';
    import { normalizeApiError } from '@/lib/http';
    import { navigateToConfirmPasswordIfRequired } from '@/lib/navigation';
    import { deletePasskey, fetchPasskeys } from '@/lib/settings-api';
    import type { Passkey } from '@/types/settings';

    export type Props = {
        canManagePasskeys?: boolean;
    };

    let { canManagePasskeys = false }: Props = $props();

    let passkeys = $state<Passkey[]>([]);
    let isLoading = $state(true);
    let loadError = $state<string | null>(null);
    let deleteError = $state<string | null>(null);

    async function refreshPasskeys(): Promise<void> {
        loadError = null;

        try {
            passkeys = await fetchPasskeys();
        } catch (error) {
            if (
                await navigateToConfirmPasswordIfRequired(
                    error,
                    '/settings/security',
                )
            ) {
                return;
            }

            loadError = normalizeApiError(error).message;
        }
    }

    onMount(() => {
        if (!canManagePasskeys) {
            isLoading = false;

            return;
        }

        void (async () => {
            try {
                await refreshPasskeys();
            } finally {
                isLoading = false;
            }
        })();
    });

    async function handleRegisterSuccess(): Promise<void> {
        deleteError = null;
        await refreshPasskeys();
    }

    async function handleDelete(id: number, onError: () => void): Promise<void> {
        deleteError = null;

        try {
            await deletePasskey(id);
            passkeys = passkeys.filter((passkey) => passkey.id !== id);
        } catch (error) {
            onError();

            if (
                await navigateToConfirmPasswordIfRequired(
                    error,
                    '/settings/security',
                )
            ) {
                return;
            }

            deleteError = normalizeApiError(error).message;
        }
    }
</script>

{#if canManagePasskeys}
    <div class="space-y-6" data-test="manage-passkeys">
        <Heading
            variant="small"
            title="Passkeys"
            description="Manage your passkeys for passwordless sign-in"
        />

        {#if loadError}
            <p class="text-sm text-red-600 dark:text-red-500" role="alert">
                {loadError}
            </p>
        {/if}

        {#if deleteError}
            <p class="text-sm text-red-600 dark:text-red-500" role="alert">
                {deleteError}
            </p>
        {/if}

        <div class="overflow-hidden rounded-lg border border-border">
            {#if isLoading}
                <div class="space-y-4 p-4" data-test="passkeys-list-skeleton">
                    <Skeleton class="h-16 w-full" />
                    <Skeleton class="h-16 w-full" />
                </div>
            {:else if passkeys.length > 0}
                <div role="list" data-test="passkeys-list">
                    {#each passkeys as passkey (passkey.id)}
                        <div role="listitem">
                            <PasskeyItem {passkey} onDelete={handleDelete} />
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="p-8 text-center" data-test="passkeys-empty-state">
                    <div
                        class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted"
                    >
                        <KeyRound
                            class="h-7 w-7 text-muted-foreground"
                            aria-hidden="true"
                        />
                    </div>
                    <p class="font-medium">No passkeys yet</p>
                    <p class="mt-1 text-sm text-muted-foreground">
                        Add a passkey to sign in without a password
                    </p>
                </div>
            {/if}
        </div>

        <PasskeyRegister onSuccess={handleRegisterSuccess} />
    </div>
{/if}
