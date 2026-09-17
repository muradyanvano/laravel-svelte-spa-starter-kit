<script lang="ts">
    import type { Snippet } from 'svelte';
    import { onMount } from 'svelte';
    import { clearUser, isAuthenticated } from '@/auth/auth.svelte';
    import { configureAuthSessionHandlers } from '@/lib/http';
    import { getSafeInternalPath } from '@/lib/navigation';
    import { navigate, route } from '@/router';

    let { children }: { children: Snippet } = $props();

    const guestPathPrefixes = [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/two-factor-challenge',
    ] as const;

    function isGuestAuthPath(pathname: string): boolean {
        return guestPathPrefixes.some(
            (prefix) =>
                pathname === prefix || pathname.startsWith(`${prefix}/`),
        );
    }

    onMount(() => {
        configureAuthSessionHandlers({
            onUnauthenticated: () => {
                if (!isAuthenticated()) {
                    return;
                }

                clearUser();

                const pathname = route.pathname;

                if (isGuestAuthPath(pathname)) {
                    return;
                }

                void navigate('/login', {
                    replace: true,
                    state: { from: getSafeInternalPath(pathname) },
                });
            },
        });

        return () => {
            configureAuthSessionHandlers({});
        };
    });
</script>

{@render children()}
