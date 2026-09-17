<script lang="ts">
    import { clearUser } from '@/auth/auth.svelte';
    import Heading from '@/components/Heading.svelte';
    import InputError from '@/components/InputError.svelte';
    import PasswordInput from '@/components/PasswordInput.svelte';
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
    import { Label } from '@/components/ui/label';
    import { Spinner } from '@/components/ui/spinner';
    import {
        createForm,
        fieldDescribedBy,
        fieldErrorId,
    } from '@/lib/form.svelte';
    import { deleteAccount } from '@/lib/settings-api';
    import { navigate } from '@/router';

    const form = createForm({
        password: '',
    });

    const showFormError = $derived(
        Boolean(form.formError) && !form.errors.password,
    );

    /**
     * Deleting the account invalidates the session server-side, so auth state is
     * cleared locally instead of refetching the current user.
     */
    async function handleSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();

        try {
            await form.submit(async (data) => {
                await deleteAccount({ password: data.password });
                clearUser();
                await navigate('/', { replace: true });
            });
        } catch {
            // Validation and API errors are mapped by createForm.
        }
    }
</script>

<div class="space-y-6">
    <Heading
        variant="small"
        title="Delete account"
        description="Delete your account and all of its resources"
    />
    <div
        class="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10"
    >
        <div class="relative space-y-0.5 text-red-600 dark:text-red-100">
            <p class="font-medium">Warning</p>
            <p class="text-sm">
                Please proceed with caution, this cannot be undone.
            </p>
        </div>
        <Dialog>
            <DialogTrigger asChild>
                {#snippet children(props)}
                    <Button
                        variant="destructive"
                        data-test="delete-user-button"
                        onclick={props.onClick as () => void}
                    >
                        Delete account
                    </Button>
                {/snippet}
            </DialogTrigger>
            <DialogContent>
                <form
                    class="flex flex-col gap-6"
                    novalidate
                    onsubmit={handleSubmit}
                >
                    <div class="space-y-3">
                        <DialogTitle>
                            Are you sure you want to delete your account?
                        </DialogTitle>
                        <DialogDescription>
                            Once your account is deleted, all of its resources
                            and data will also be permanently deleted. Please
                            enter your password to confirm you would like to
                            permanently delete your account.
                        </DialogDescription>
                    </div>

                    {#if showFormError}
                        <p
                            class="text-sm text-red-600 dark:text-red-500"
                            role="alert"
                        >
                            {form.formError}
                        </p>
                    {/if}

                    <div class="grid gap-2">
                        <Label for="delete_user_password">Password</Label>
                        <PasswordInput
                            id="delete_user_password"
                            bind:value={form.data.password}
                            required
                            autocomplete="current-password"
                            placeholder="Password"
                            disabled={form.processing}
                            aria-invalid={Boolean(form.errors.password)}
                            aria-describedby={fieldDescribedBy(
                                'password',
                                form.errors,
                            )}
                        />
                        <InputError
                            id={fieldErrorId('password')}
                            message={form.errors.password}
                        />
                    </div>

                    <DialogFooter class="gap-2">
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
                            type="submit"
                            variant="destructive"
                            disabled={form.processing}
                            data-test="confirm-delete-user-button"
                        >
                            {#if form.processing}
                                <Spinner class="size-4" />
                            {/if}
                            Delete account
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
</div>
