<script lang="ts">
    import { usePasskeyRegister } from '@laravel/passkeys/svelte';
    import InputError from '@/components/InputError.svelte';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import {
        isPasskeyPasswordConfirmationRequired,
        passkeyErrorMessage,
        preparePasskeyCeremony,
        shouldDisplayPasskeyError,
    } from '@/lib/passkeys';
    import { navigate } from '@/router';

    let {
        onSuccess,
    }: {
        onSuccess?: () => void | Promise<void>;
    } = $props();

    function getDefaultPasskeyName(): string {
        const ua = navigator.userAgent;

        const browser = [
            { pattern: /Edg|Edge/, name: 'Edge' },
            { pattern: /OPR|Opera|OPiOS/, name: 'Opera' },
            { pattern: /Firefox|FxiOS/, name: 'Firefox' },
            { pattern: /Chrome|CriOS/, name: 'Chrome' },
            { pattern: /Safari/, name: 'Safari' },
        ].find(({ pattern }) => pattern.test(ua))?.name;

        const os = [
            { pattern: /iPhone/, name: 'iPhone' },
            { pattern: /iPad|Macintosh(?=.*Mobile)/, name: 'iPad' },
            { pattern: /Android/, name: 'Android' },
            { pattern: /Mac/, name: 'Mac' },
            { pattern: /Windows/, name: 'Windows' },
        ].find(({ pattern }) => pattern.test(ua))?.name;

        return [browser, os].filter(Boolean).join(' on ') || '';
    }

    let name = $state(getDefaultPasskeyName());
    let showForm = $state(false);

    const passkeyRegister = usePasskeyRegister({
        onSuccess: async () => {
            name = getDefaultPasskeyName();
            showForm = false;
            await onSuccess?.();
        },
        onError: async (error) => {
            if (isPasskeyPasswordConfirmationRequired(error)) {
                await navigate('/confirm-password', {
                    replace: true,
                    state: { from: '/settings/security' },
                });
            }
        },
    });

    const displayError = $derived(
        passkeyRegister.error !== null &&
            shouldDisplayPasskeyError(passkeyRegister.errorInstance),
    );

    const errorMessage = $derived(
        passkeyRegister.errorInstance instanceof Error
            ? passkeyErrorMessage(passkeyRegister.errorInstance)
            : passkeyRegister.error,
    );

    async function handleSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();

        if (!name.trim() || passkeyRegister.isLoading) {
            return;
        }

        await preparePasskeyCeremony();
        await passkeyRegister.register(name.trim());
    }

    function handleCancel(): void {
        showForm = false;
        name = getDefaultPasskeyName();
    }
</script>

{#if !passkeyRegister.isSupported}
    <div class="text-sm text-muted-foreground">
        Passkeys are not supported in this browser.
    </div>
{:else if !showForm}
    <Button
        variant="outline"
        data-test="add-passkey-button"
        onclick={() => (showForm = true)}
    >
        Add passkey
    </Button>
{:else}
    <form
        onsubmit={handleSubmit}
        class="space-y-4 rounded-lg border border-border bg-muted/50 p-4"
    >
        <div class="grid gap-2">
            <Label for="passkey-name">Passkey name</Label>
            <Input
                id="passkey-name"
                type="text"
                bind:value={name}
                placeholder="e.g., MacBook Pro, iPhone"
                class="mt-1 block w-full border-foreground/20"
                autofocus
                aria-invalid={Boolean(displayError && errorMessage)}
                aria-describedby={displayError && errorMessage
                    ? 'passkey-name-error'
                    : undefined}
            />
            <p class="text-xs text-muted-foreground">
                A name helps you identify this passkey later.
            </p>
        </div>

        {#if displayError && errorMessage}
            <InputError id="passkey-name-error" message={errorMessage} />
        {/if}

        <div class="flex gap-2">
            <Button
                type="submit"
                disabled={passkeyRegister.isLoading || !name.trim()}
                data-test="register-passkey-button"
            >
                {passkeyRegister.isLoading
                    ? 'Registering...'
                    : 'Register passkey'}
            </Button>
            <Button type="button" variant="ghost" onclick={handleCancel}>
                Cancel
            </Button>
        </div>
    </form>
{/if}
