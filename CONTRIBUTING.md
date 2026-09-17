# Contributing

Thank you for your interest in contributing to
[muradyanvano/laravel-svelte-spa-starter-kit](https://github.com/muradyanvano/laravel-svelte-spa-starter-kit).

This is a **community** project. It is not an official Laravel starter kit.

## Branch strategy

| Branch    | Purpose                            |
| --------- | ---------------------------------- |
| `main`    | Release-ready                      |
| `develop` | Integration and active development |

- Open pull requests **against `develop`**
- Do **not** push directly to `main`

## Ways to contribute

- Bug reports with reproduction steps
- Documentation improvements
- Test coverage for real behavior
- Focused feature fixes aligned with the SPA architecture (no Inertia)

Before large changes, open an issue to discuss scope.

## Local setup

### Requirements

- PHP 8.3+
- Composer
- Node.js 22+ (Node 25 is also tested in CI)
- SQLite (default) or another Laravel-supported database

### Setup

```bash
git clone https://github.com/muradyanvano/laravel-svelte-spa-starter-kit.git
cd laravel-svelte-spa-starter-kit
composer setup
```

Or manually:

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
npm install
npm run build
```

Serve with [Laravel Herd](https://herd.laravel.com/), `php artisan serve`, or
your preferred stack. Run `npm run dev` (or `composer run dev`) for Vite
hot reload alongside the PHP server.

## Quality gates

Before opening a PR, run:

```bash
composer ci:check
```

This runs frontend format/lint, svelte-check, Vitest, Pint, PHPStan, and Pest.

Useful individual commands:

| Command                                 | Purpose                            |
| --------------------------------------- | ---------------------------------- |
| `composer test`                         | Pint + PHPStan + Pest              |
| `composer lint` / `composer lint:check` | Laravel Pint                       |
| `composer types:check`                  | PHPStan                            |
| `php artisan test`                      | Pest only                          |
| `npm run check`                         | Frontend format + lint (Vite Plus) |
| `npm run check:fix`                     | Auto-fix frontend format/lint      |
| `npm run types:check`                   | Wayfinder generate + svelte-check  |
| `npm run test`                          | Vitest                             |
| `npm run build`                         | Production frontend build          |
| `npm run wayfinder:generate`            | Regenerate Wayfinder output        |

## Coding expectations

- Follow existing conventions in neighboring files
- PHP: Pint formatting, explicit types, Laravel patterns
- Frontend: Svelte 5 runes, TypeScript, Tailwind utility classes
- **No Inertia** — do not reintroduce `@inertiajs/*` or server-driven page props
- Auth bootstrap: single owner for `GET /api/v1/user` (`startBootstrap`)
- Do not store auth tokens in `localStorage` or `sessionStorage`
- Wayfinder generated directories are **gitignored** — never commit them

## Testing expectations

- Add or update tests when behavior changes meaningfully
- Pest for backend HTTP and auth boundaries
- Vitest for frontend components and flows
- Do not add tests that only assert obvious framework behavior

## Pull request checklist

- [ ] Target branch is `develop`
- [ ] `composer ci:check` passes locally
- [ ] Tests cover changed behavior where appropriate
- [ ] No committed Wayfinder generated files
- [ ] No committed `.env`, `boost.json`, or author-local agent state
- [ ] Documentation updated if user-facing behavior changed

## License

By contributing, you agree that your contributions will be licensed under the
[MIT License](LICENSE).
