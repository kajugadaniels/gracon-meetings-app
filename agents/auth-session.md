# Auth And Session Rules

Purpose: keep local development login and production shared-login behavior predictable.

## Ownership

- `app/app` and `api/auth` own platform authentication.
- `app/meetings` may provide local login for development.
- Production should use `app/app` login and parent-domain `HttpOnly` cookies.

## Login

- Keep `/login` aligned with the `app/documents` developer-login experience.
- `MEETINGS_USE_MAIN_APP_LOGIN=true` should hand users to the main identity app.
- After login, default users to `/home`, not legacy `/meetings`.

## Session Recovery

- Protected layout owns final session validation.
- Middleware must not redirect `/login` based on cookies alone.
- Same-origin `/api/session`, `/api/refresh`, and `/api/logout` route handlers must stay the browser-safe session boundary.

## Logout

- Logout must call local `/api/logout` first.
- After local cleanup, hand off to `app/app/logout` where appropriate so shared cookies are cleared.
- Never preserve `/logout` as a login `next` destination.

## Environment

- Localhost development must leave `AUTH_COOKIE_DOMAIN` empty.
- Production should use a parent domain such as `.gracon360.com`.
- Keep `.env.example` updated when auth, login, cookie, public URL, or API URL variables change.
