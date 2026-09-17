<script lang="ts">
    import {
        SidebarGroup,
        SidebarGroupLabel,
        SidebarMenu,
        SidebarMenuButton,
        SidebarMenuItem,
        useSidebar,
    } from '@/components/ui/sidebar';
    import { toUrl } from '@/lib/utils';
    import { route } from '@/router';
    import type { NavItem } from '@/types';

    let {
        items = [],
    }: {
        items: NavItem[];
    } = $props();

    const { setOpenMobile } = useSidebar();

    function isCurrent(href: string): boolean {
        const pathname = route.pathname;

        return pathname === href || pathname.startsWith(`${href}/`);
    }
</script>

<SidebarGroup class="px-2 py-0">
    <SidebarGroupLabel>Platform</SidebarGroupLabel>
    <SidebarMenu>
        {#each items as item (toUrl(item.href))}
            <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    isActive={isCurrent(toUrl(item.href))}
                    tooltip={item.title}
                >
                    {#snippet children(props)}
                        <a
                            {...props}
                            href={toUrl(item.href)}
                            class={props.class}
                            onclick={() => setOpenMobile(false)}
                        >
                            {#if item.icon}
                                <item.icon class="size-4 shrink-0" />
                            {/if}
                            <span>{item.title}</span>
                        </a>
                    {/snippet}
                </SidebarMenuButton>
            </SidebarMenuItem>
        {/each}
    </SidebarMenu>
</SidebarGroup>
