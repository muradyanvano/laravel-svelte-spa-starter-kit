<script lang="ts">
    /**
     * Validation message for a field unit.
     * Place as the last child of a parent `grid gap-2` (Label → Control → InputError).
     * Do not add top margin — the parent gap owns spacing.
     */
    let {
        message = '',
        id = undefined,
        class: className = '',
    }: {
        message?: string;
        id?: string;
        class?: string;
    } = $props();
</script>

{#if message}
    <div class={className}>
        <p {id} class="text-sm text-red-600 dark:text-red-500" role="alert">
            {message}
        </p>
    </div>
{/if}
