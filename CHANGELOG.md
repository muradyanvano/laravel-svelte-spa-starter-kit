# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-09-17

### Added

- Passkey sign-in on the login page (`Sign in with a passkey`).
- Passkey password confirmation on the confirm-password page.
- Passkey management under Security settings (list, register, delete) with official Laravel-style UI.
- Safe passkey metadata API (`GET /api/v1/settings/passkeys`) and `can_manage_passkeys` capability flag.
- `@laravel/passkeys` frontend integration for WebAuthn ceremonies in the true SPA architecture.

## [1.0.0] - 2026-09-17

### Added

- Initial community Laravel Svelte SPA starter kit.
- Svelte 5 true SPA architecture with sv-router client-side routing (no Inertia).
- Fortify headless authentication and Sanctum cookie/session SPA authentication.
- Official-style Laravel application shell and auth UI.
- Authentication: login, registration, password reset, email verification, password confirmation, logout.
- Two-factor authentication (TOTP challenge, setup, management, lazy-loaded recovery codes).
- Settings: profile (name, email, account deletion), security (password, two-factor), appearance (Light / Dark / System).
- Axios HTTP layer with normalized errors and CSRF handling.
- Laravel Wayfinder integration for typed route helpers.
- Quality tooling: Pest, Vitest, PHPStan (Larastan), Pint, svelte-check, and `composer ci:check`.

[Unreleased]: https://github.com/muradyanvano/laravel-svelte-spa-starter-kit/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/muradyanvano/laravel-svelte-spa-starter-kit/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/muradyanvano/laravel-svelte-spa-starter-kit/releases/tag/v1.0.0
