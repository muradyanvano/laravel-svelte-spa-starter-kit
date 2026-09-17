/**
 * Non-sensitive security settings state from `GET /api/v1/settings/security`.
 * Secrets, QR payloads, and recovery codes stay on Fortify's own endpoints.
 */
export type SecuritySettings = {
    canManageTwoFactor: boolean;
    canManagePasskeys: boolean;
    twoFactorEnabled: boolean;
    requiresConfirmation: boolean;
    passwordRules: string;
};

/**
 * Safe passkey metadata from `GET /api/v1/settings/passkeys`.
 */
export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};

export type PasswordConfirmationStatus = {
    confirmed: boolean;
};

export type TwoFactorQrCode = {
    svg: string;
    url: string;
};
