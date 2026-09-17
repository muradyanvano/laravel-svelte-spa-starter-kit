import { mount } from 'svelte';
import App from '@/App.svelte';
import { initializeTheme } from '@/lib/theme.svelte';
import '@/router';

initializeTheme();

const element = document.getElementById('app');

if (element) {
    mount(App, { target: element });
}
