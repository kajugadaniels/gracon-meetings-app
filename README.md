# App Meetings

Secure Gracon 360 meetings workspace.

This app will let verified users create, schedule, join, invite participants to,
record, and review meetings. Live media will be powered by Stream Video, while
Gracon owns authentication, meeting permissions, schedules, invites, recordings
metadata, and audit history through `api/meetings`.

## Overview

- Runtime: Next.js 16 + React + TypeScript
- Default port: `4003`
- Styling: scoped CSS modules
- Auth owner: `app/app` + `api/auth`
- Meeting backend: `api/meetings`
- Media SDK: `@stream-io/video-react-sdk`
- Browser titles: use `"{page} | Gracon 360"`

## What This App Owns

- Meetings workspace UI
- Local development login page
- Cross-app session recovery with shared Gracon cookies
- Meeting list, scheduling, invites, join flow, recording library, and live-call screens in later milestones
- User-friendly loading and session recovery states

## Current Foundation

- Local `/login` route matches the `app/documents` developer-login pattern.
- Production can redirect to `app/app/login` by setting `MEETINGS_USE_MAIN_APP_LOGIN=true`.
- Same-origin `/api/session`, `/api/refresh`, and `/api/logout` routes validate shared cookies server-side.
- Protected `/meetings` route is available as the initial authenticated workspace.
- Same-origin `/api/meetings` route handlers proxy meeting actions to `api/meetings` with server-resolved auth tokens, so production HttpOnly cookies keep working.
- The `/meetings` workspace now creates scheduled meetings, lists visible meetings, starts/ends meetings, and requests short-lived Stream call tokens.
- `/meetings/join/:meetingId` opens the live Stream room after requesting a call-scoped token from `api/meetings`.
- If `api/meetings` is offline, same-origin proxy routes now return a clean 503 response instead of crashing the Next.js route.
- The authenticated shell uses a flush top navbar, left meetings sidebar, account avatar dropdown, and `/home` as the post-login landing route.
- The topbar and sidebar live in dedicated `src/components/layout` components; protected layout owns only session recovery and shell placement.
- `/home` currently renders a static light-mode dashboard with quick actions, realistic upcoming meeting cards, and a short skeleton loading state while future meeting actions mature.
- `/home` uses a compact premium dashboard layout with smaller action cards and three meeting cards per desktop row.
- Home quick-action dialogs are split into `NewMeetingDialog`, `JoinMeetingDialog`, and `ScheduleMeetingDialog`, each with its own scoped module CSS.
- Meeting dialogs blur the background, close on outside click, and use short CSS enter/exit animations with reduced-motion fallbacks.
- `/upcoming` renders a static scheduled-meetings dashboard using the reusable `MeetingCard` component.
- `/upcoming` follows the compact dashboard direction with smaller summary cards and three meeting cards per desktop row.
- `/upcoming` opens the reusable `ScheduleMeetingDialog` through `UpcomingScheduleButton` so the page can remain server-rendered.
- `/previous` renders a static completed-meetings dashboard using the reusable `MeetingCard` component.
- `/previous` follows the same compact dashboard direction with smaller summary cards and three meeting cards per desktop row.
- `/recordings` renders a static recordings library using the reusable `RecordingCard` component with Play and Share actions.
- `/recordings` follows the compact dashboard direction with minimal recording cards and three recordings per desktop row.
- `/personal-room` renders a static reusable-room management page with room link, quick actions, settings, and readiness details.
- Route styling uses `.module.css` files rather than growing `globals.css`.

## Environment

```env
NEXT_PUBLIC_MEETINGS_URL=http://localhost:4003
NEXT_PUBLIC_APP_URL=http://localhost:4000
NEXT_PUBLIC_MAIN_APP_URL=http://localhost:4000
NEXT_PUBLIC_MEETINGS_API_URL=http://localhost:3007/api/v1
NEXT_PUBLIC_AUTH_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_STREAM_API_KEY=
AUTH_COOKIE_DOMAIN=
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAME_SITE=lax
AUTH_ACCESS_TOKEN_TTL=15m
AUTH_REFRESH_TOKEN_TTL=1d
AUTH_REFRESH_ROTATION=true
AUTH_REUSE_DETECTION=true
MEETINGS_USE_MAIN_APP_LOGIN=false
NEXT_PUBLIC_MEETINGS_USE_MAIN_APP_LOGIN=false
ALLOW_DEV_READABLE_AUTH_COOKIES=true
NEXT_PUBLIC_ALLOW_DEV_READABLE_AUTH_COOKIES=true
```

## Local Commands

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Auth And Login Rules

- Keep local meetings login available for development.
- Production should use app/app login with parent-domain HttpOnly cookies.
- Localhost development must leave `AUTH_COOKIE_DOMAIN` empty. A production
  value like `.gracon360.com` cannot be written by `localhost`, so the browser
  will reject login cookies and immediately return to `/login`.
- Use hard navigation for cross-app handoff to app/app.
- Do not add new JavaScript-readable auth storage paths.
- Logout must call local `/api/logout` first, then hand off to `app/app/logout`.
- Browser meeting actions must call same-origin `/api/meetings/*` routes, not `api/meetings` directly, so auth token handling stays server-side.
- Middleware must not redirect `/login` back to `/meetings` based on cookies alone. The protected layout owns final session validation, which prevents stale-cookie redirect loops.

## Meeting Workspace Flow

- `src/constants/meetings-nav.tsx` owns the protected meetings sidebar links.
- `src/lib/meetings/api-client.ts` is the typed browser client.
- `src/lib/server/meetings-api-proxy.ts` is the server-side bridge to `api/meetings`.
- `src/components/meetings/MeetingsWorkspace.tsx` owns the current meeting creation, schedule, list, start/end, and token-preparation UI.
- `src/components/meetings/live/MeetingRoom.tsx` owns the Stream room mount/unmount lifecycle.
- Stream tokens returned to the browser are short-lived and call-scoped. `STREAM_API_SECRET` remains only in `api/meetings`.

## Styling Rules

- Use CSS modules for page and component styling.
- Use the same DM Sans variable as `app/documents`: `--font-dm-sans`.
- Keep `globals.css` limited to tokens and base styles.
- Keep Gracon primary purple as the action color, but avoid purple page backgrounds.
- Avoid gradients on cards or layout backgrounds.

## Next Milestones

- Add invite link acceptance and email notification surfaces.
- Add recording library and access checks.
- Add recording controls and transcript surfaces inside the live Stream Video room.
