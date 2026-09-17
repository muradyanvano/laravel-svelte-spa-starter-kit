/**
 * Non-sensitive security settings state from `GET /api/v1/settings/security`.
 * Secrets, QR payloads, and recovery codes stay on Fortify's own endpoints.
 */
export type SecuritySettings = {
    canManageTwoFactor: boolean;
    twoFactorEnabled: boolean;
    requiresConfirmation: boolean;
    passwordRules: string;
};

export type PasswordConfirmationStatus = {
    confirmed: boolean;
};

export type TwoFactorQrCode = {
    svg: string;
    url: string;
};
