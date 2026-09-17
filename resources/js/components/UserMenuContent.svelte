<script lang="ts">
    import LogOut from '@lucide/svelte/icons/log-out';
    import Settings from '@lucide/svelte/icons/settings';
    import { logout } from '@/auth/auth.svelte';
    import UserInfo from '@/components/UserInfo.svelte';
    import {
        DropdownMenuGroup,
        DropdownMenuItem,
        DropdownMenuLabel,
        DropdownMenuSeparator,
    } from '@/components/ui/dropdown-menu';
    import { navigate, p } from '@/router';
    import type { User } from '@/types';

    let {
        user,
    }: {
        user: User;
    } = $props();

    /** `logout()` clears auth state — never refetch the current user afterwards. */
    async function handleLogout(closeMenu?: () => void): Promise<void> {
        closeMenu?.();
        await logout();
        await navigate('/', { replace: true });
    }
</script>

<DropdownMenuLabel class="p-0 font-normal">
    <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
        <UserInfo {user} showEmail={true} />
    </div>
</DropdownMenuLabel>
<DropdownMenuSeparator />
<DropdownMenuGroup>
    <DropdownMenuItem asChild>
        {#snippet children(props)}
            <a
                class={props.class}
                href={p('/settings/profile')}
                onclick={props.onClick}
            >
                <Settings class="mr-2 h-4 w-4" />
                Settings
            </a>
        {/snippet}
    </DropdownMenuItem>
</DropdownMenuGroup>
<DropdownMenuSeparator />
<DropdownMenuItem asChild>
    {#snippet children(props)}
        <button
            type="button"
            class={props.class}
            onclick={() => handleLogout(props.onClick)}
            data-test="logout-button"
        >
            <LogOut class="mr-2 h-4 w-4" />
            Log out
        </button>
    {/snippet}
</DropdownMenuItem>
