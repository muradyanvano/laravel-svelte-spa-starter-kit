export type User = {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
};

export type Auth = {
    user: User;
};

export type TwoFactorConfigContent = {
    title: string;
    description: string;
    buttonText: string;
};
