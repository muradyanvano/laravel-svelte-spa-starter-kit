import { createRouter, type Routes } from 'sv-router';
import AppShell from '@/router/AppShell.svelte';
import {
    requireGuest,
    requireProtected,
    requireVerified,
} from '@/router/guards';
import ConfirmPassword from '@/pages/auth/ConfirmPassword.svelte';
import ForgotPassword from '@/pages/auth/ForgotPassword.svelte';
import Login from '@/pages/auth/Login.svelte';
import Register from '@/pages/auth/Register.svelte';
import ResetPassword from '@/pages/auth/ResetPassword.svelte';
import TwoFactorChallenge from '@/pages/auth/TwoFactorChallenge.svelte';
import VerifyEmail from '@/pages/auth/VerifyEmail.svelte';
import Dashboard from '@/pages/Dashboard.svelte';
import NotFound from '@/pages/NotFound.svelte';
import Appearance from '@/pages/settings/Appearance.svelte';
import Profile from '@/pages/settings/Profile.svelte';
import Security from '@/pages/settings/Security.svelte';
import Welcome from '@/pages/Welcome.svelte';

let navigate!: ReturnType<typeof createRouter>['navigate'];

const routes = {
    layout: AppShell,
    '/': Welcome,
    '/login': {
        hooks: {
            beforeLoad: (context) => requireGuest(context, navigate),
        },
        '/': Login,
    },
    '/register': {
        hooks: {
            beforeLoad: (context) => requireGuest(context, navigate),
        },
        '/': Register,
    },
    '/forgot-password': {
        hooks: {
            beforeLoad: (context) => requireGuest(context, navigate),
        },
        '/': ForgotPassword,
    },
    '/reset-password/:token': {
        hooks: {
            beforeLoad: (context) => requireGuest(context, navigate),
        },
        '/': ResetPassword,
    },
    '/two-factor-challenge': {
        hooks: {
            beforeLoad: (context) => requireGuest(context, navigate),
        },
        '/': TwoFactorChallenge,
    },
    '/verify-email': {
        hooks: {
            beforeLoad: (context) => requireProtected(context, navigate),
        },
        '/': VerifyEmail,
    },
    '/confirm-password': {
        hooks: {
            beforeLoad: (context) => requireProtected(context, navigate),
        },
        '/': ConfirmPassword,
    },
    '/dashboard': {
        hooks: {
            beforeLoad: (context) => requireVerified(context, navigate),
        },
        '/': Dashboard,
    },
    '/settings': {
        hooks: {
            beforeLoad: (context) => requireVerified(context, navigate),
        },
        '/': {
            hooks: {
                beforeLoad: () => {
                    throw navigate('/settings/profile', { replace: true });
                },
            },
            '/': Profile,
        },
        '/profile': Profile,
        '/security': Security,
        '/appearance': Appearance,
    },
    '/settings/password': {
        hooks: {
            beforeLoad: async (context) => {
                await requireVerified(context, navigate);
                throw navigate('/settings/security', { replace: true });
            },
        },
        '/': Security,
    },
    '/settings/two-factor': {
        hooks: {
            beforeLoad: async (context) => {
                await requireVerified(context, navigate);
                throw navigate('/settings/security', { replace: true });
            },
        },
        '/': Security,
    },
    '*': NotFound,
} satisfies Routes;

const router = createRouter(routes);

navigate = router.navigate.bind(router) as typeof navigate;

export const p = (...args: Parameters<typeof router.p>) => router.p(...args);
export const isActive = Object.assign(
    (...args: Parameters<typeof router.isActive>) => router.isActive(...args),
    {
        startsWith: (...args: Parameters<typeof router.isActive.startsWith>) =>
            router.isActive.startsWith(...args),
    },
);
export const route = router.route;
export { navigate };
