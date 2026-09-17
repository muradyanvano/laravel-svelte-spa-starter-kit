<script lang="ts">
    import type { Snippet } from 'svelte';
    import AuthSessionBridge from '@/auth/AuthSessionBridge.svelte';
    import { isLoading } from '@/auth/auth.svelte';
    import AppLoader from '@/components/AppLoader.svelte';

    let { children }: { children: Snippet } = $props();
</script>

{#if isLoading()}
    <AppLoader />
{:else}
    <AuthSessionBridge>
        {@render children()}
    </AuthSessionBridge>
{/if}
