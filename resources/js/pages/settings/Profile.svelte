<script lang="ts">
    import { refreshUser, useAuth } from '@/auth/auth.svelte';
    import DeleteUser from '@/components/DeleteUser.svelte';
    import DocumentTitle from '@/components/DocumentTitle.svelte';
    import Heading from '@/components/Heading.svelte';
    import InputError from '@/components/InputError.svelte';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Spinner } from '@/components/ui/spinner';
    import { resendVerificationEmail } from '@/lib/auth-api';
    import {
        createForm,
        fieldDescribedBy,
        fieldErrorId,
    } from '@/lib/form.svelte';
    import { updateProfileInformation } from '@/lib/settings-api';
    import AppLayout from '@/layouts/AppLayout.svelte';
    import SettingsLayout from '@/layouts/settings/Layout.svelte';
    import type { BreadcrumbItem } from '@/types';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Settings', href: '/settings/profile' },
        { title: 'Profile', href: '/settings/profile' },
    ];

    const auth = useAuth();

    const form = createForm({
        name: auth.user?.name ?? '',
        email: auth.user?.email ?? '',
    });

    const verificationForm = createForm({});

    /** Last values received from the server, so local edits are never overwritten. */
    let syncedProfile = {
        name: auth.user?.name ?? '',
        email: auth.user?.email ?? '',
    };

    $effect(() => {
        const user = auth.user;

        if (
            user === null ||
            (user.name === syncedProfile.name &&
                user.email === syncedProfile.email)
        ) {
            return;
        }

        syncedProfile = { name: user.name, email: user.email };
        form.setField('name', user.name);
        form.setField('email', user.email);
    });

    async function handleSubmit(event: SubmitEvent): Promise<void> {
        event.preventDefault();

        try {
            await form.submit(async (data) => {
                await updateProfileInformation({
                    name: data.name,
                    email: data.email,
                });
                await refreshUser();

                return 'Saved.';
            });
        } catch {
            // Validation and API errors are mapped by createForm.
        }
    }

    async function handleResendVerification(): Promise<void> {
        try {
            await verificationForm.submit(() => resendVerificationEmail());
        } catch {
            // Validation and API errors are mapped by createForm.
        }
    }
</script>

<DocumentTitle title="Profile settings" />

<AppLayout {breadcrumbs}>
    <SettingsLayout>
        <h1 class="sr-only">Profile settings</h1>

        <div class="flex flex-col space-y-6">
            <Heading
                variant="small"
                title="Profile"
                description="Update your name and email address"
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
                        <Label for="name">Name</Label>
                        <Input
                            id="name"
                            bind:value={form.data.name}
                            required
                            autocomplete="name"
                            placeholder="Full name"
                            disabled={form.processing}
                            aria-invalid={Boolean(form.errors.name)}
                            aria-describedby={fieldDescribedBy(
                                'name',
                                form.errors,
                            )}
                        />
                        <InputError
                            id={fieldErrorId('name')}
                            message={form.errors.name}
                        />
                    </div>

                    <div class="grid gap-2">
                        <Label for="email">Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            bind:value={form.data.email}
                            required
                            autocomplete="username"
                            placeholder="Email address"
                            disabled={form.processing}
                            aria-invalid={Boolean(form.errors.email)}
                            aria-describedby={fieldDescribedBy(
                                'email',
                                form.errors,
                            )}
                        />
                        <InputError
                            id={fieldErrorId('email')}
                            message={form.errors.email}
                        />
                    </div>

                    {#if auth.user && auth.user.email_verified_at === null}
                        <!-- Reachable after a verified user changes email: Fortify clears
                             email_verified_at and refreshUser() updates auth in place while
                             the client stays on Profile (requireVerified ran on entry only). -->
                        <div class="grid gap-2">
                            <p class="text-sm text-muted-foreground">
                                Your email address is unverified.
                                <Button
                                    type="button"
                                    variant="link"
                                    class="h-auto p-0 text-sm"
                                    disabled={verificationForm.processing}
                                    onclick={handleResendVerification}
                                >
                                    Click here to re-send the verification
                                    email.
                                </Button>
                            </p>

                            {#if verificationForm.status === 'verification-link-sent'}
                                <div
                                    class="text-sm font-medium text-green-600"
                                    role="status"
                                >
                                    A new verification link has been sent to
                                    your email address.
                                </div>
                            {/if}
                        </div>
                    {/if}

                    <div class="flex items-center gap-4">
                        <Button
                            type="submit"
                            disabled={form.processing}
                            data-test="update-profile-button"
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

        <DeleteUser />
    </SettingsLayout>
</AppLayout>
