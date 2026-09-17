<script lang="ts">
    import KeyRound from '@lucide/svelte/icons/key-round';
    import Trash2 from '@lucide/svelte/icons/trash-2';
    import { Button } from '@/components/ui/button';
    import {
        Dialog,
        DialogClose,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogTitle,
        DialogTrigger,
    } from '@/components/ui/dialog';
    import type { Passkey } from '@/types/settings';

    let {
        passkey,
        onDelete,
    }: {
        passkey: Passkey;
        onDelete?: (id: number, onError: () => void) => void;
    } = $props();

    let isDeleting = $state(false);

    function handleDelete(): void {
        isDeleting = true;
        onDelete?.(passkey.id, () => {
            isDeleting = false;
        });
    }
</script>

<div class="flex items-center justify-between border-b p-4 last:border-b-0">
    <div class="flex min-w-0 items-center gap-4">
        <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted"
        >
            <KeyRound class="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </div>
        <div class="min-w-0 space-y-1">
            <div class="flex flex-wrap items-center gap-2.5">
                <p class="font-medium tracking-tight break-words">
                    {passkey.name}
                </p>
                {#if passkey.authenticator}
                    <span
                        class="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground ring-1 ring-inset ring-border"
                    >
                        {passkey.authenticator}
                    </span>
                {/if}
            </div>
            <p class="text-sm text-muted-foreground break-words">
                Added {passkey.created_at_diff}
                {#if passkey.last_used_at_diff}
                    <span class="mx-1 text-muted-foreground/50">/</span>
                    Last used {passkey.last_used_at_diff}
                {/if}
            </p>
        </div>
    </div>

    <Dialog>
        <DialogTrigger asChild>
            {#snippet children(props)}
                <Button
                    variant="ghost"
                    size="sm"
                    class="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remove ${passkey.name}`}
                    onclick={props.onClick as () => void}
                >
                    <Trash2 class="h-4 w-4" aria-hidden="true" />
                    <span class="sr-only">Remove</span>
                </Button>
            {/snippet}
        </DialogTrigger>

        <DialogContent>
            <DialogTitle>Remove passkey</DialogTitle>
            <DialogDescription>
                Are you sure you want to remove the "{passkey.name}" passkey?
                You will no longer be able to use it to sign in.
            </DialogDescription>
            <DialogFooter>
                <DialogClose asChild>
                    {#snippet children(props)}
                        <Button
                            variant="secondary"
                            onclick={props.onClick as () => void}
                        >
                            Cancel
                        </Button>
                    {/snippet}
                </DialogClose>
                <Button
                    variant="destructive"
                    disabled={isDeleting}
                    onclick={handleDelete}
                >
                    {isDeleting ? 'Removing...' : 'Remove passkey'}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</div>
