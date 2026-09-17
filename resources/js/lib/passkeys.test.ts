import { PasskeyError, UserCancelledError } from '@laravel/passkeys';
import { describe, expect, it } from 'vitest';
import {
    isPasskeyCancellation,
    passkeyErrorMessage,
    shouldDisplayPasskeyError,
} from '@/lib/passkeys';

describe('passkeys adapter', () => {
    it('maps session expiry messages', () => {
        expect(
            passkeyErrorMessage(
                new PasskeyError('Request failed with status 419'),
            ),
        ).toBe('Your session has expired. Please try again.');
    });

    it('maps throttling messages', () => {
        expect(
            passkeyErrorMessage(
                new PasskeyError('Request failed with status 429'),
            ),
        ).toBe('Too many attempts. Please wait before trying again.');
    });

    it('treats user cancellation as silent', () => {
        const cancelled = new UserCancelledError();

        expect(isPasskeyCancellation(cancelled)).toBe(true);
        expect(shouldDisplayPasskeyError(cancelled)).toBe(false);
    });
});
