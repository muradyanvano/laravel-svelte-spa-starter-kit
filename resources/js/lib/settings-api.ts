import { ensureCsrfCookie, http } from '@/lib/http';
import type {
    PasswordConfirmationStatus,
    SecuritySettings,
    TwoFactorQrCode,
} from '@/types/settings';

type SecuritySettingsResponse = {
    data: {
        can_manage_two_factor: boolean;
        two_factor_enabled: boolean;
        requires_confirmation: boolean;
        password_rules: string;
    };
};

export async function updateProfileInformation(payload: {
    name: string;
    email: string;
}): Promise<void> {
    await ensureCsrfCookie();
    await http.put('/user/profile-information', payload);
}

export async function updatePassword(payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
}): Promise<void> {
    await ensureCsrfCookie();
    await http.put('/user/password', payload);
}

/**
 * Deletes the current account. The session is invalidated server-side,
 * so callers must clear SPA auth state afterwards.
 */
export async function deleteAccount(payload: {
    password: string;
}): Promise<void> {
    await ensureCsrfCookie();
    await http.delete('/settings/profile', { data: payload });
}

export async function fetchPasswordConfirmationStatus(options?: {
    signal?: AbortSignal;
}): Promise<PasswordConfirmationStatus> {
    const response = await http.get<Partial<PasswordConfirmationStatus>>(
        '/user/confirmed-password-status',
        { signal: options?.signal },
    );

    return { confirmed: response.data?.confirmed === true };
}

export async function fetchSecuritySettings(options?: {
    signal?: AbortSignal;
}): Promise<SecuritySettings> {
    const response = await http.get<SecuritySettingsResponse>(
        '/api/v1/settings/security',
        { signal: options?.signal },
    );

    const data = response.data.data;

    return {
        canManageTwoFactor: data.can_manage_two_factor,
        twoFactorEnabled: data.two_factor_enabled,
        requiresConfirmation: data.requires_confirmation,
        passwordRules: data.password_rules,
    };
}

export async function enableTwoFactor(): Promise<void> {
    await ensureCsrfCookie();
    await http.post('/user/two-factor-authentication');
}

export async function confirmTwoFactor(payload: {
    code: string;
}): Promise<void> {
    await ensureCsrfCookie();
    await http.post('/user/confirmed-two-factor-authentication', payload);
}

export async function disableTwoFactor(): Promise<void> {
    await ensureCsrfCookie();
    await http.delete('/user/two-factor-authentication');
}

export async function fetchTwoFactorQrCode(): Promise<TwoFactorQrCode> {
    const response = await http.get<TwoFactorQrCode>(
        '/user/two-factor-qr-code',
    );

    return response.data;
}

export async function fetchTwoFactorSecretKey(): Promise<{
    secretKey: string;
}> {
    const response = await http.get<{ secretKey: string }>(
        '/user/two-factor-secret-key',
    );

    return response.data;
}

export async function fetchRecoveryCodes(): Promise<string[]> {
    const response = await http.get<string[]>(
        '/user/two-factor-recovery-codes',
    );

    return response.data;
}

export async function regenerateRecoveryCodes(): Promise<void> {
    await ensureCsrfCookie();
    await http.post('/user/two-factor-recovery-codes');
}
