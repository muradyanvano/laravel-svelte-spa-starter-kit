<script lang="ts">
    import type { Snippet } from 'svelte';
    import { SidebarProvider } from '@/components/ui/sidebar';
    import type { AppVariant } from '@/types';

    let {
        variant = 'sidebar',
        class: className = '',
        children,
    }: {
        variant?: AppVariant;
        class?: string;
        children?: Snippet;
    } = $props();
</script>

{#if variant === 'header'}
    <div class="flex min-h-screen w-full flex-col {className}">
        {@render children?.()}
    </div>
{:else}
    <!-- SidebarProvider restores the collapsed state from the `sidebar_state` cookie. -->
    <SidebarProvider class={className}>
        {@render children?.()}
    </SidebarProvider>
{/if}
