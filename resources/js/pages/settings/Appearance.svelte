<script lang="ts">
    import AppearanceTabs from '@/components/AppearanceTabs.svelte';
    import DocumentTitle from '@/components/DocumentTitle.svelte';
    import Heading from '@/components/Heading.svelte';
    import AppLayout from '@/layouts/AppLayout.svelte';
    import SettingsLayout from '@/layouts/settings/Layout.svelte';
    import type { BreadcrumbItem } from '@/types';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Settings', href: '/settings/appearance' },
        { title: 'Appearance', href: '/settings/appearance' },
    ];
</script>

<DocumentTitle title="Appearance settings" />

<AppLayout {breadcrumbs}>
    <SettingsLayout>
        <h1 class="sr-only">Appearance settings</h1>

        <div class="space-y-6">
            <Heading
                variant="small"
                title="Appearance settings"
                description="Update the appearance settings for your account"
            />
            <AppearanceTabs />
        </div>
    </SettingsLayout>
</AppLayout>
