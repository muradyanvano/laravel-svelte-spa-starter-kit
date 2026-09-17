import { normalizeApiError } from '@/lib/http';
import { navigate } from '@/router';

export type SpaPath = `/${string}`;

export function asSpaPath(path: string): SpaPath {
    return path as SpaPath;
}

/**
 * Return a safe same-origin SPA path for post-login redirects.
 * Rejects protocol-relative, absolute, and malformed destinations.
 */
export function getSafeInternalPath(
    candidate: unknown,
    fallback = '/dashboard',
): string {
    if (typeof candidate !== 'string' || candidate.length === 0) {
        return fallback;
    }

    if (
        !candidate.startsWith('/') ||
        candidate.startsWith('//') ||
        candidate.includes('://') ||
        candidate.includes('\\')
    ) {
        return fallback;
    }

    return candidate;
}

/**
 * Post-auth destination after login / 2FA.
 * Never resume password-confirmation or the 2FA challenge itself.
 */
export function getPostAuthPath(
    candidate: unknown,
    fallback = '/dashboard',
): string {
    const path = getSafeInternalPath(candidate, fallback);
    const pathname = path.split('?')[0] ?? path;

    if (
        pathname === '/confirm-password' ||
        pathname === '/two-factor-challenge'
    ) {
        return fallback;
    }

    return path;
}

/**
 * Send the user to password confirmation when a sensitive request answers 423.
 * HTTP 423 is handled contextually by callers — never as a global redirect.
 *
 * @returns `true` when the error was a password-confirmation error and navigation happened.
 */
export async function navigateToConfirmPasswordIfRequired(
    error: unknown,
    intendedPath: string,
): Promise<boolean> {
    const normalized = normalizeApiError(error);

    if (
        normalized.kind !== 'password_confirmation' &&
        normalized.status !== 423
    ) {
        return false;
    }

    await navigate('/confirm-password', {
        replace: true,
        state: {
            from: getSafeInternalPath(intendedPath, '/settings/security'),
        },
    });

    return true;
}

export function locationToPath(location: {
    fullPath?: string;
    path?: string;
    pathname?: string;
    search?: string;
}): string {
    if (typeof location.fullPath === 'string' && location.fullPath.length > 0) {
        return location.fullPath;
    }

    if (typeof location.path === 'string') {
        return location.path;
    }

    return `${location.pathname ?? ''}${location.search ?? ''}`;
}

function historyUserState(): { from?: string; status?: string } | null {
    const state = window.history.state as {
        from?: string;
        status?: string;
        _userState?: unknown;
    } | null;

    if (state && '_userState' in state) {
        return (
            (state._userState as { from?: string; status?: string } | null) ??
            null
        );
    }

    return state;
}

export function historyStateFrom(): string | undefined {
    return historyUserState()?.from;
}

export function historyStateStatus(): string | undefined {
    return historyUserState()?.status;
}
