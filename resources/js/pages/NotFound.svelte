<script lang="ts">
    import DocumentTitle from '@/components/DocumentTitle.svelte';
    import { p } from '@/router';
</script>

<DocumentTitle title="Page not found" />

<div class="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
    <h1 class="text-2xl font-semibold">404</h1>
    <p class="text-muted-foreground">This page could not be found.</p>
    <a href={p('/')} class="text-sm underline underline-offset-4">Go home</a>
</div>
