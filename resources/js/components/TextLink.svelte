<script lang="ts">
    import type { Snippet } from 'svelte';

    let {
        href,
        children,
        ...rest
    }: {
        href: string;
        children?: Snippet;
        [key: string]: unknown;
    } = $props();
</script>

<a
    {href}
    class="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
    {...rest}
>
    {@render children?.()}
</a>
