<script lang="ts">
    import { onMount } from 'svelte';
    import DocumentTitle from '@/components/DocumentTitle.svelte';
    import Heading from '@/components/Heading.svelte';
    import InputError from '@/components/InputError.svelte';
    import ManageTwoFactor from '@/components/ManageTwoFactor.svelte';
    import PasswordInput from '@/components/PasswordInput.svelte';
    import { Button } from '@/components/ui/button';
    import { Label } from '@/components/ui/label';
    import { Skeleton } from '@/components/ui/skeleton';
    import { Spinner } from '@/components/ui/spinner';
    import {
        createForm,
        fieldDescribedBy,
        fieldErrorId,
    } from '@/lib/form.svelte';
    import { normalizeApiError } from '@/lib/http';
    import { navigateToConfirmPasswordIfRequired } from '@/lib/navigation';
    import {
        fetchPasswordConfirmationStatus,
        fetchSecuritySettings,
        updatePassword,
    } from '@/lib/settings-api';
    import AppLayout from '@/layouts/AppLayout.svelte';
    import SettingsLayout from '@/layouts/settings/Layout.svelte';
    import { navigate } from '@/router';
    import type { BreadcrumbItem, SecuritySettings } from '@/types';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Settings', href: '/settings/security' },
        { title: 'Security', href: '/settings/security' },
    ];

    let securityState = $state<SecuritySettings | null>(null);
    let isLoading = $state(true);
    let loadError = $state<string | null>(null);

    const form = createForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    /**
     * Sensitive settings require a confirmed password. Check the status first so
     * the page never renders a form the user cannot submit, then load state.
     */
    onMount(async () => {
        try {
            const { confirmed } = await fetchPasswordConfirmationStatus();

            if (!confirmed) {
                await navigate('/confirm-password', {
                    replace: true,
                    state: { from: '/settings/security' },
                });

                return;
            }

            securityState = await fetchSecuritySettings();
            isLoading = false;
        } catch (error) {
            if (
                await navigateToConfirmPasswordIfRequired(
                    error,
                    '/settings/security',
                )
            ) {
                return;
            }

            loadError = normalizeApiError(error).message;
            isLoading = false;
        }
    });

    async function refreshSecurityState(): Promise<void> {
        try {
            securityState = await fetchSecuritySettings();
        } catch (error) {
            if (
                await navigateToConfirmPasswordIfRequired(
                    error,
                    '/settings/security',
                )
            ) {
                return;
            }

            loadError = normalizeApiError(error).message;
        }
    }

    /** Password updates do not change the current-user resource — no refreshUser(). */
    async function handleSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();

        try {
            await form.submit(async (data) => {
                await updatePassword({
                    current_password: data.current_password,
                    password: data.password,
                    password_confirmation: data.password_confirmation,
                });

                form.reset(
                    'current_password',
                    'password',
                    'password_confirmation',
                );

                return 'Password updated.';
            });
        } catch (error) {
            await navigateToConfirmPasswordIfRequired(
                error,
                '/settings/security',
            );
        }
    }
</script>

<DocumentTitle title="Security settings" />

<AppLayout {breadcrumbs}>
    <SettingsLayout>
        <h1 class="sr-only">Security settings</h1>

        {#if isLoading}
            <div class="space-y-6" data-test="security-settings-skeleton">
                <Skeleton class="h-6 w-48" />
                <Skeleton class="h-10 w-full" />
                <Skeleton class="h-10 w-full" />
                <Skeleton class="h-10 w-full" />
                <Skeleton class="h-9 w-24" />
            </div>
        {:else if loadError}
            <p class="text-sm text-red-600 dark:text-red-500" role="alert">
                {loadError}
            </p>
        {:else if securityState}
            <div class="space-y-6">
                <Heading
                    variant="small"
                    title="Update password"
                    description="Ensure your account is using a long, random password to stay secure"
                />

                <form
                    class="flex flex-col gap-6"
                    novalidate
                    onsubmit={handleSubmit}
                >
                    <div class="grid gap-6">
                        {#if form.formError}
                            <p
                                class="text-sm text-red-600 dark:text-red-500"
                                role="alert"
                            >
                                {form.formError}
                            </p>
                        {/if}

                        <div class="grid gap-2">
                            <Label for="current_password">
                                Current password
                            </Label>
                            <PasswordInput
                                id="current_password"
                                bind:value={form.data.current_password}
                                required
                                autocomplete="current-password"
                                placeholder="Current password"
                                disabled={form.processing}
                                aria-invalid={Boolean(
                                    form.errors.current_password,
                                )}
                                aria-describedby={fieldDescribedBy(
                                    'current_password',
                                    form.errors,
                                )}
                            />
                            <InputError
                                id={fieldErrorId('current_password')}
                                message={form.errors.current_password}
                            />
                        </div>

                        <div class="grid gap-2">
                            <Label for="password">New password</Label>
                            <PasswordInput
                                id="password"
                                bind:value={form.data.password}
                                required
                                autocomplete="new-password"
                                placeholder="New password"
                                passwordrules={securityState.passwordRules}
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

                        <div class="grid gap-2">
                            <Label for="password_confirmation">
                                Confirm password
                            </Label>
                            <PasswordInput
                                id="password_confirmation"
                                bind:value={form.data.password_confirmation}
                                required
                                autocomplete="new-password"
                                placeholder="Confirm password"
                                passwordrules={securityState.passwordRules}
                                disabled={form.processing}
                                aria-invalid={Boolean(
                                    form.errors.password_confirmation,
                                )}
                                aria-describedby={fieldDescribedBy(
                                    'password_confirmation',
                                    form.errors,
                                )}
                            />
                            <InputError
                                id={fieldErrorId('password_confirmation')}
                                message={form.errors.password_confirmation}
                            />
                        </div>

                        <div class="flex items-center gap-4">
                            <Button
                                type="submit"
                                disabled={form.processing}
                                data-test="update-password-button"
                            >
                                {#if form.processing}
                                    <Spinner class="size-4" />
                                {/if}
                                Save
                            </Button>

                            {#if form.status}
                                <p
                                    class="text-sm text-muted-foreground"
                                    role="status"
                                >
                                    {form.status}
                                </p>
                            {/if}
                        </div>
                    </div>
                </form>
            </div>

            <ManageTwoFactor
                canManageTwoFactor={securityState.canManageTwoFactor}
                requiresConfirmation={securityState.requiresConfirmation}
                twoFactorEnabled={securityState.twoFactorEnabled}
                onUpdated={refreshSecurityState}
            />
        {/if}
    </SettingsLayout>
</AppLayout>
