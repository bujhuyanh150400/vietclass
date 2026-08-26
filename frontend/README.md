# VietClasses Frontend

Next.js 16 App Router frontend for VietClasses. It renders the browser experience
and talks to the Laravel API only from server code, so the API bearer token never
reaches the browser.

## Requirements

- Node.js 20 or newer, npm
- The Laravel API from `../api` reachable over HTTP
- Docker infrastructure from `../compose.dev.yml` for the API's database and cache

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

### Environment

| Variable       | Required                     | Purpose                                                                 |
| -------------- | ---------------------------- | ----------------------------------------------------------------------- |
| `API_BASE_URL` | Yes in production            | Base URL of the versioned Laravel API, for example `http://127.0.0.1:8000/api/v1`. |

`API_BASE_URL` is read only by server code. Outside production a missing value
falls back to `http://127.0.0.1:8000/api/v1`; in production a missing value makes
requests fail with the generic service-unavailable message instead of calling an
unintended host. There is no `NEXT_PUBLIC_` API variable, because the browser
never calls Laravel directly.

## Running locally

Start the three pieces in separate terminals, from the repository root:

```bash
docker compose --env-file .env.dev -f compose.dev.yml up -d
cd api && php artisan serve
cd frontend && npm run dev
```

Then open <http://localhost:3000>.

Use `localhost`, not `127.0.0.1`. Next.js treats `127.0.0.1` as a cross-origin
host and answers `/_next/*` development resources with `403`, which stops the page
from hydrating. Add `allowedDevOrigins: ['127.0.0.1']` to `next.config.ts` if you
need that host.

Seed the development administrator before signing in:

```bash
cd api && php artisan db:seed --class=IdentitySeeder
```

## Routes

| Route                 | Kind          | Purpose                                                                 |
| --------------------- | ------------- | ----------------------------------------------------------------------- |
| `/`                   | Page          | Redirects to `/dashboard`.                                              |
| `/login`              | Page          | Sign-in screen; recovers an existing session before showing the form.    |
| `/dashboard`          | Page          | Protected landing screen inside the application shell.                   |
| `/api/auth/login`     | Route Handler | `POST` credentials, sets the session cookie, returns the current user.   |
| `/api/auth/session`   | Route Handler | `GET` the current user for the session cookie; `401` clears the cookie.  |
| `/api/auth/logout`    | Route Handler | `POST` to revoke the Laravel token and clear the cookie; returns `204`.  |

`proxy.ts` guards `/dashboard` and its descendants. It only checks whether the
session cookie is present and redirects to `/login` with a `returnTo` value; it
makes no network call. The protected layout performs the authoritative check by
verifying the token against Laravel.

### Why the BFF routes exist

The browser never sees the Laravel bearer token. `/api/auth/*` are thin
same-origin endpoints that hold the token in the `HttpOnly`, host-only
`vietclass_session` cookie and return only user data. They are not a general proxy
for the Laravel API, and they are distinct from Laravel's own
`/api/v1/auth/*` endpoints.

## Directory boundaries

| Path                       | Holds                                                                             |
| -------------------------- | --------------------------------------------------------------------------------- |
| `app/`                     | Routing, layouts, metadata, Next.js request primitives, thin BFF Route Handlers.   |
| `src/modules/<module>/`    | Domain behavior for one feature: types, schemas, api, hooks, containers, and presentational components. |
| `src/components/ui/`       | shadcn/ui primitives.                                                             |
| `src/components/layouts/`  | Application frame: sidebar, header, protected shell.                              |
| `src/components/shared/`   | Cross-feature components that no single module owns.                              |
| `src/lib/`                 | Reusable logic with no React dependency, such as the HTTP and error primitives.    |
| `src/hooks/`               | Application-generic React hooks.                                                  |

The `@/*` alias maps to `src/*`.

### Module entrypoints

A module is reached only through its two public entrypoints. ESLint enforces this
with a `no-restricted-imports` pattern, so a deep path such as
`@/modules/identity/api/identity-server-api` is a lint error.

| Entrypoint                       | Safe for                                     |
| -------------------------------- | -------------------------------------------- |
| `@/modules/<module>`             | Client and server code: types, pure utilities, hooks, containers, and presentational components. |
| `@/modules/<module>/server`      | Server code only. Marked `server-only`; holds token-bearing functions and cookie policy. |

Shared layouts must not import a feature module. `ProtectedShell` takes the
account menu as a `ReactNode` slot so the protected layout, not the shell,
supplies Identity's `CurrentUserMenuContainer`.

### Client and server components

`"use client"` belongs on the smallest component that needs hooks, browser APIs,
or event handlers — plus the single global provider. Everything else stays a
Server Component.

## Verification

```bash
npm run lint
npm run build
```

There is no frontend test runner in this project. Behavior is verified with lint,
a production build, and the manual authentication smoke matrix recorded in
`.tasks/frontend-base-login.md`.

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4,
shadcn/ui (`new-york`), Lucide icons, React Hook Form with Zod, TanStack Query,
nuqs, date-fns, Axios.
