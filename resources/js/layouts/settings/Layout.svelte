<script lang="ts">
    import type { Snippet } from 'svelte';
    import Heading from '@/components/Heading.svelte';
    import { Button } from '@/components/ui/button';
    import { Separator } from '@/components/ui/separator';
    import { p, route } from '@/router';
    import type { NavItem } from '@/types';

    let {
        children,
    }: {
        children?: Snippet;
    } = $props();

    const sidebarNavItems: NavItem[] = [
        {
            title: 'Profile',
            href: p('/settings/profile'),
        },
        {
            title: 'Security',
            href: p('/settings/security'),
        },
        {
            title: 'Appearance',
            href: p('/settings/appearance'),
        },
    ];
</script>

<div class="px-4 py-6">
    <Heading
        title="Settings"
        description="Manage your profile and account settings"
    />

    <div class="flex flex-col lg:flex-row lg:space-x-12">
        <aside class="w-full max-w-xl lg:w-48">
            <nav
                class="flex flex-col space-y-1 space-x-0"
                aria-label="Settings"
            >
                {#each sidebarNavItems as item (item.href)}
                    <Button
                        variant="ghost"
                        class="w-full justify-start {route.pathname ===
                        item.href
                            ? 'bg-muted'
                            : ''}"
                        asChild
                    >
                        {#snippet children(props)}
                            <a
                                href={item.href}
                                class={props.class}
                                aria-current={route.pathname === item.href
                                    ? 'page'
                                    : undefined}
                            >
                                {item.title}
                            </a>
                        {/snippet}
                    </Button>
                {/each}
            </nav>
        </aside>

        <Separator class="my-6 lg:hidden" />

        <div class="flex-1 md:max-w-2xl">
            <section class="max-w-xl space-y-12">
                {@render children?.()}
            </section>
        </div>
    </div>
</div>
