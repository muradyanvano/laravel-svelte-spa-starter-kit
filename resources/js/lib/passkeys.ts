import { Passkeys } from '@laravel/passkeys';
import {
    InvalidDomainError,
    NotSupportedError,
    PasskeyError,
    UserCancelledError,
} from '@laravel/passkeys';
import { ensureCsrfCookie } from '@/lib/http';

export const PASSKEY_CONFIRM_ROUTES = {
    options: '/passkeys/confirm/options',
    submit: '/passkeys/confirm',
} as const;

export type PasskeyRouteOverrides = {
    options: string;
    submit: string;
};

/**
 * Configure the official passkeys client once at application bootstrap.
 */
export function configurePasskeysClient(): void {
    Passkeys.configure({
        fetch: {
            credentials: 'include',
        },
    });
}

/**
 * Ensure Sanctum CSRF protection before a passkey ceremony POST.
 */
export async function preparePasskeyCeremony(): Promise<void> {
    await ensureCsrfCookie();
}

export function isPasskeyCancellation(error: unknown): boolean {
    return error instanceof UserCancelledError;
}

export function shouldDisplayPasskeyError(errorInstance: unknown): boolean {
    return (
        errorInstance !== null &&
        errorInstance !== undefined &&
        !isPasskeyCancellation(errorInstance)
    );
}

/**
 * Map package errors into user-facing copy for auth passkey flows.
 */
export function isPasskeyPasswordConfirmationRequired(error: unknown): boolean {
    return (
        error instanceof PasskeyError &&
        (error.message.includes('status 423') ||
            error.message.toLowerCase().includes('confirm your password'))
    );
}

export function passkeyErrorMessage(error: PasskeyError): string {
    if (error instanceof NotSupportedError) {
        return 'Passkeys are not supported in this browser.';
    }

    if (error instanceof InvalidDomainError) {
        return error.message;
    }

    const message = error.message;

    if (message.includes('status 419')) {
        return 'Your session has expired. Please try again.';
    }

    if (message.includes('status 429')) {
        return 'Too many attempts. Please wait before trying again.';
    }

    if (/status 5\d{2}/.test(message)) {
        return 'Something went wrong on the server. Please try again.';
    }

    return (
        message ||
        'Unable to complete passkey authentication. Please try again.'
    );
}
