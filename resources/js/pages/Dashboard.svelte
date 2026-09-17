<script lang="ts">
    import DocumentTitle from '@/components/DocumentTitle.svelte';
    import PlaceholderPattern from '@/components/PlaceholderPattern.svelte';
    import AppLayout from '@/layouts/AppLayout.svelte';
    import type { BreadcrumbItem } from '@/types';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
    ];
</script>

<DocumentTitle title="Dashboard" />

<AppLayout {breadcrumbs}>
    <div class="flex min-h-svh flex-1 flex-col gap-4 overflow-x-auto p-4">
        <div class="grid auto-rows-min gap-4 md:grid-cols-3">
            {#each Array(3) as _, index (index)}
                <div
                    class="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border"
                >
                    <PlaceholderPattern />
                </div>
            {/each}
        </div>
        <div
            class="relative min-h-64 flex-1 rounded-xl border border-sidebar-border/70 dark:border-sidebar-border"
        >
            <PlaceholderPattern />
        </div>
    </div>
</AppLayout>
