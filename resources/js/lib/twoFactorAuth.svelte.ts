import {
    fetchRecoveryCodes as fetchRecoveryCodesRequest,
    fetchTwoFactorQrCode,
    fetchTwoFactorSecretKey,
    regenerateRecoveryCodes as regenerateRecoveryCodesRequest,
} from '@/lib/settings-api';

type TwoFactorAuthState = {
    qrCodeSvg: string | null;
    manualSetupKey: string | null;
    recoveryCodesList: string[];
    errors: string[];
};

export type TwoFactorAuthStateApi = {
    state: TwoFactorAuthState;
    hasSetupData: () => boolean;
    clearSetupData: () => void;
    clearErrors: () => void;
    clearTwoFactorAuthData: () => void;
    fetchQrCode: () => Promise<void>;
    fetchSetupKey: () => Promise<void>;
    fetchSetupData: () => Promise<void>;
    fetchRecoveryCodes: () => Promise<void>;
    regenerateRecoveryCodes: () => Promise<void>;
};

/**
 * Two-factor secrets, QR payloads, and recovery codes live in memory only.
 * They are never persisted to browser storage and are cleared when the
 * management UI is destroyed.
 */
const state = $state<TwoFactorAuthState>({
    qrCodeSvg: null,
    manualSetupKey: null,
    recoveryCodesList: [],
    errors: [],
});

const hasSetupData = (): boolean =>
    state.qrCodeSvg !== null && state.manualSetupKey !== null;

const clearErrors = (): void => {
    state.errors = [];
};

const clearSetupData = (): void => {
    state.manualSetupKey = null;
    state.qrCodeSvg = null;
    clearErrors();
};

const clearTwoFactorAuthData = (): void => {
    clearSetupData();
    state.recoveryCodesList = [];
    clearErrors();
};

const fetchQrCode = async (): Promise<void> => {
    try {
        const { svg } = await fetchTwoFactorQrCode();

        state.qrCodeSvg = svg;
    } catch {
        state.errors = [...state.errors, 'Failed to fetch QR code'];
        state.qrCodeSvg = null;
    }
};

const fetchSetupKey = async (): Promise<void> => {
    try {
        const { secretKey } = await fetchTwoFactorSecretKey();

        state.manualSetupKey = secretKey;
    } catch {
        state.errors = [...state.errors, 'Failed to fetch a setup key'];
        state.manualSetupKey = null;
    }
};

const fetchSetupData = async (): Promise<void> => {
    clearErrors();
    await Promise.all([fetchQrCode(), fetchSetupKey()]);
};

const fetchRecoveryCodes = async (): Promise<void> => {
    try {
        clearErrors();
        state.recoveryCodesList = await fetchRecoveryCodesRequest();
    } catch {
        state.errors = [...state.errors, 'Failed to fetch recovery codes'];
        state.recoveryCodesList = [];
    }
};

const regenerateRecoveryCodes = async (): Promise<void> => {
    try {
        clearErrors();
        await regenerateRecoveryCodesRequest();
    } catch {
        state.errors = [...state.errors, 'Failed to regenerate recovery codes'];

        return;
    }

    await fetchRecoveryCodes();
};

export function twoFactorAuthState(): TwoFactorAuthStateApi {
    return {
        state,
        hasSetupData,
        clearSetupData,
        clearErrors,
        clearTwoFactorAuthData,
        fetchQrCode,
        fetchSetupKey,
        fetchSetupData,
        fetchRecoveryCodes,
        regenerateRecoveryCodes,
    };
}
