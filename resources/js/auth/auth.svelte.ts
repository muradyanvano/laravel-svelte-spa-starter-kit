import { fetchCurrentUser, logout as logoutRequest } from '@/lib/auth-api';
import { isRequestAborted, setAuthSessionHandlersSuppressed } from '@/lib/http';
import type { User } from '@/types/auth';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

let user = $state<User | null>(null);
let status = $state<AuthStatus>('loading');

let authReadyResolve: (() => void) | null = null;
let authReadyPromise: Promise<void> | null = null;

function ensureAuthReadyPromise(): Promise<void> {
    if (status !== 'loading') {
        return Promise.resolve();
    }

    if (!authReadyPromise) {
        authReadyPromise = new Promise<void>((resolve) => {
            authReadyResolve = resolve;
        });
    }

    return authReadyPromise;
}

function settleAuthReady(): void {
    authReadyResolve?.();
    authReadyResolve = null;
    authReadyPromise = null;
}

/**
 * Resolves once cold bootstrap has finished.
 * Route guards await this instead of canceling navigation with `false`,
 * which would leave a blank page on hard refresh of guarded routes.
 */
export function waitForAuthReady(): Promise<void> {
    return ensureAuthReadyPromise();
}

export function isAuthenticated(): boolean {
    return status === 'authenticated';
}

export function isLoading(): boolean {
    return status === 'loading';
}

export function isVerified(): boolean {
    return user !== null && user.email_verified_at !== null;
}

export function setUser(nextUser: User): void {
    user = nextUser;
    status = 'authenticated';
    settleAuthReady();
}

export function clearUser(): void {
    user = null;
    status = 'unauthenticated';
    settleAuthReady();
}

export async function refreshUser(options?: {
    signal?: AbortSignal;
}): Promise<User | null> {
    const nextUser = await fetchCurrentUser(options);

    if (nextUser === null) {
        clearUser();

        return null;
    }

    setUser(nextUser);

    return nextUser;
}

export async function logout(): Promise<void> {
    await logoutRequest();
    clearUser();
}

export function startBootstrap(): () => void {
    const controller = new AbortController();
    let active = true;

    status = 'loading';
    // Do not replace an in-flight ready promise — guards may already be awaiting it.
    void ensureAuthReadyPromise();
    setAuthSessionHandlersSuppressed(true);

    void fetchCurrentUser({ signal: controller.signal })
        .then((nextUser) => {
            if (!active) {
                return;
            }

            if (nextUser === null) {
                clearUser();

                return;
            }

            setUser(nextUser);
        })
        .catch((error: unknown) => {
            if (!active || isRequestAborted(error)) {
                return;
            }

            clearUser();
        })
        .finally(() => {
            if (active) {
                setAuthSessionHandlersSuppressed(false);

                if (status === 'loading') {
                    clearUser();
                }
            }
        });

    return () => {
        active = false;
        controller.abort();
        setAuthSessionHandlersSuppressed(false);
    };
}

export type AuthState = {
    readonly user: User | null;
    readonly status: AuthStatus;
    isAuthenticated: typeof isAuthenticated;
    isLoading: typeof isLoading;
    isVerified: typeof isVerified;
    setUser: typeof setUser;
    clearUser: typeof clearUser;
    refreshUser: typeof refreshUser;
    logout: typeof logout;
};

export function useAuth(): AuthState {
    return {
        get user() {
            return user;
        },
        get status() {
            return status;
        },
        isAuthenticated,
        isLoading,
        isVerified,
        setUser,
        clearUser,
        refreshUser,
        logout,
    };
}

/** @internal Test helper */
export function resetAuthStateForTesting(
    next: { user?: User | null; status?: AuthStatus } = {},
): void {
    user = next.user ?? null;
    status = next.status ?? 'unauthenticated';

    if (status === 'loading') {
        authReadyPromise = null;
        authReadyResolve = null;
        void ensureAuthReadyPromise();
    } else {
        settleAuthReady();
    }
}
