import {
    isAuthenticated,
    isVerified,
    waitForAuthReady,
} from '@/auth/auth.svelte';
import { asSpaPath, getPostAuthPath, historyStateFrom } from '@/lib/navigation';
import type { HooksContext, RouterApi, Routes } from 'sv-router';

type Navigate = RouterApi<Routes>['navigate'];

/**
 * Guest-only routes. Awaits auth bootstrap — never cancel with `false`,
 * or a hard refresh of /login leaves a blank page.
 */
export async function requireGuest(
    context: HooksContext,
    navigate: Navigate,
): Promise<void> {
    void context;
    await waitForAuthReady();

    if (!isAuthenticated()) {
        return;
    }

    const destination = isVerified()
        ? getPostAuthPath(historyStateFrom())
        : '/verify-email';

    throw navigate(asSpaPath(destination), { replace: true });
}

export async function requireProtected(
    context: HooksContext,
    navigate: Navigate,
): Promise<void> {
    await waitForAuthReady();

    if (isAuthenticated()) {
        return;
    }

    throw navigate('/login', {
        replace: true,
        state: { from: context.pathname },
    });
}

export async function requireVerified(
    context: HooksContext,
    navigate: Navigate,
): Promise<void> {
    await requireProtected(context, navigate);

    if (isVerified()) {
        return;
    }

    throw navigate('/verify-email', { replace: true });
}
