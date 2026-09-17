<script lang="ts">
    import { Spinner } from '@/components/ui/spinner';
</script>

<div
    class="flex min-h-svh items-center justify-center"
    role="status"
    aria-live="polite"
    aria-busy="true"
    data-testid="app-loader"
>
    <span class="sr-only">Loading</span>
    <Spinner class="size-8 motion-reduce:animate-none" />
</div>
