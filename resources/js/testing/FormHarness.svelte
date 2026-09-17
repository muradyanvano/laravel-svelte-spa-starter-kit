<script lang="ts">
    import { createForm, type FormState } from '@/lib/form.svelte';

    type HarnessData = { email: string };

    let {
        onForm,
    }: {
        onForm: (form: FormState<HarnessData>) => void;
    } = $props();

    const form = createForm({ email: '' });

    $effect(() => {
        onForm(form);
    });
</script>

<div data-testid="form-harness">
    {form.processing ? 'processing' : 'idle'}
    {#if form.status}
        <span data-testid="form-status">{form.status}</span>
    {/if}
    {#if form.formError}
        <span data-testid="form-error" role="alert">{form.formError}</span>
    {/if}
    {#if form.errors.email}
        <span data-testid="field-error">{form.errors.email}</span>
    {/if}
</div>
