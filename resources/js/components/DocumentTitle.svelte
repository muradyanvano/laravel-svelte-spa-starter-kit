<script lang="ts">
    const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

    let { title }: { title?: string } = $props();

    $effect(() => {
        document.title = title ? `${title} - ${appName}` : appName;
    });
</script>
