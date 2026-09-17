import { vi } from 'vitest';

/**
 * Default passkey doubles for tests that render auth pages without exercising WebAuthn.
 * Passkey-focused test files should define their own vi.mock overrides.
 */
vi.mock('@laravel/passkeys/svelte', () => ({
    usePasskeyVerify: () => ({
        verify: vi.fn().mockResolvedValue(undefined),
        isLoading: false,
        error: null,
        errorInstance: null,
        isSupported: true,
    }),
    usePasskeyRegister: () => ({
        register: vi.fn().mockResolvedValue(undefined),
        isLoading: false,
        error: null,
        errorInstance: null,
        isSupported: true,
    }),
}));

vi.mock('@/lib/passkeys', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/lib/passkeys')>();

    return {
        ...actual,
        preparePasskeyCeremony: vi.fn().mockResolvedValue(undefined),
        configurePasskeysClient: vi.fn(),
    };
});
