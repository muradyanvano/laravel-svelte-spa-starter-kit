<script lang="ts">
    import { onDestroy } from 'svelte';
    import { Router } from 'sv-router';
    import { startBootstrap } from '@/auth/auth.svelte';
    import { Toaster } from '@/components/ui/sonner';

    // Start before <Router> mounts so hard-refresh guards can await a live bootstrap.
    const stopBootstrap = startBootstrap();

    onDestroy(() => {
        stopBootstrap();
    });
</script>

<Router />
<Toaster />
