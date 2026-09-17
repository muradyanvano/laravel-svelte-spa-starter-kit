import { mount } from 'svelte';
import App from '@/App.svelte';
import { configurePasskeysClient } from '@/lib/passkeys';
import { initializeTheme } from '@/lib/theme.svelte';
import '@/router';

configurePasskeysClient();
initializeTheme();

const element = document.getElementById('app');

if (element) {
    mount(App, { target: element });
}
