# app/meetings Security

`app/meetings` owns the meetings workspace UI. Authentication, meeting
authorization, recording provider access, and Stream secrets remain in backend
services.

## Session Boundary

- Production login should use `app/app` with parent-domain `HttpOnly` cookies.
- Browser meeting actions must call same-origin `/api/*` routes, not
  authenticated backend services directly.
- Local development login and readable-cookie compatibility may remain behind
  explicit development flags.
- `/logout` and `/login` must never be preserved as post-login destinations.

## Meetings, Stream, And Recordings

- `api/meetings` enforces visibility, invite, edit, delete, end-meeting, and
  recording permissions.
- Stream browser tokens must be short-lived and call-scoped.
- `STREAM_API_SECRET` must never appear in frontend environment variables.
- Recording playback URLs must come from backend access checks or refresh
  routes; the browser must not guess provider URLs.
- Invitation tokens, Stream tokens, recording URLs, and identity payloads must
  never be logged.

## Required Checks

```bash
npm run check:security
npm run lint
npm run build
npm audit --audit-level=high
```

Run deployment env validation with real production env values before release:

```bash
CHECK_DEPLOY_ENV=true npm run check:security
```
