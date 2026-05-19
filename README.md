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
- Loading states now use `MeetingsLoadingState` for session recovery, route transitions, and Stream room preparation.
- Protected `/meetings` route is available as the initial authenticated workspace.
- Same-origin `/api/meetings` route handlers proxy meeting actions to `api/meetings` with server-resolved auth tokens, so production HttpOnly cookies keep working.
- Same-origin recording proxy routes live under `/api/meetings/:id/recordings/*`; browser components never call `api/meetings` directly for recording control.
- The `/meetings` workspace now creates scheduled meetings, lists visible meetings, starts/ends meetings, and requests short-lived Stream call tokens.
- `/meetings/:id` is the active meeting-room experience. Newly created instant meetings are routed here so users see the custom Gracon room instead of the raw Stream SDK surface.
- `/meetings/:id` renders a static in-meeting room UI for design validation with mute, video, recording, share, members, chat, and invite controls.
- `/meetings/:id` now uses a full-screen participant stage, a fixed bottom `MeetingControlDock`, and a Framer Motion-powered collaboration panel that opens Members or Chat as tabs only when requested.
- `/meetings/:id` now includes an ended-room state so static workflow validation matches the real meeting lifecycle.
- `/meetings/:id` now connects API-backed UUID meetings to Stream behind the custom Gracon room surface, so participant presence, microphone publishing, camera publishing, remote audio, and remote video tiles are live while seeded rooms keep the local fallback.
- `/meetings/:id` collapses duplicate Stream browser sessions for the same visible participant and keeps the richest media tile, so a single local camera feed fills the stage instead of showing an avatar duplicate.
- `/meetings/:id` overrides Stream's tall-camera containment inside the custom stage, so camera video always covers its tile while screen sharing still preserves its full aspect ratio.
- `/meetings/:id` now supports Stream-backed screen sharing from the custom Gracon control dock; seeded rooms use browser `getDisplayMedia` as a local fallback.
- `/meetings/:id` starts and stops recordings through same-origin audited backend routes instead of flipping UI state only.
- `/meetings/:id` keeps recording off by default, starts recording only after the user clicks Record, and shows an elapsed recording timer while active.
- `/meetings/:id` now has active raised-hand controls in the custom room chrome, with visible room and tile feedback.
- `/meetings/:id` now has a dedicated `MeetingRoomHeader` status surface for secure-room state, participant count, media state, recording timer, hand raise, and invite access.
- `/meetings/:id` supports room keyboard shortcuts outside editable fields: `M` mute, `V` video, `S` screen share, `R` recording, `H` hand raise, and `Esc` close room panels/dialogs.
- `/meetings/:id` now confirms the destructive end-meeting action with participant and recording context before closing the room.
- `/meetings/:id` exposes a small keyboard-shortcuts guide from the control dock so power controls are discoverable without adding permanent page copy.
- `/meetings/:id` keeps chat messages in room-level state, so switching between Members and Chat does not reset local messages.
- Stream rooms start with microphone and camera disabled by default so joining a call never publishes media before the user explicitly chooses it.
- The custom Gracon room is the only active in-meeting surface. The old isolated Stream SDK validation route has been removed to prevent users from seeing two different room designs.
- If `api/meetings` is offline, same-origin proxy routes now return a clean 503 response instead of crashing the Next.js route.
- The authenticated shell uses a flush top navbar, left meetings sidebar, account avatar dropdown, and `/home` as the post-login landing route.
- The topbar and sidebar live in dedicated `src/components/layout` components; protected layout owns only session recovery and shell placement.
- `/home` currently renders a static light-mode dashboard with quick actions, realistic upcoming meeting cards, and a short skeleton loading state while future meeting actions mature.
- `/home` uses a compact premium dashboard layout with smaller action cards and three meeting cards per desktop row.
- `/home` now reads the shared meetings seed dataset through typed adapters and only renders the first 6 upcoming meetings.
- Home quick-action dialogs are split into `NewMeetingDialog`, `JoinMeetingDialog`, and `ScheduleMeetingDialog`, each with its own scoped module CSS.
- `NewMeetingDialog` starts instant meetings dynamically by creating a meeting, starting it through `api/meetings`, and navigating to the live room.
- Meeting dialogs blur the background, close on outside click, and use short CSS enter/exit animations with reduced-motion fallbacks.
- `/invitations/:token` renders the secure meeting invitation acceptance flow. It previews the invite, sends/verifies email OTP when required, completes the identity gate for verified users, and accepts only through `api/meetings`.
- `/upcoming` renders a static scheduled-meetings dashboard using the reusable `MeetingCard` component.
- `/upcoming` follows the compact dashboard direction with smaller summary cards and three meeting cards per desktop row.
- `/upcoming` paginates the shared seed dataset at 18 meeting cards per page.
- `/upcoming` uses `UpcomingMeetingsExplorer` for title search, active filters, custom date ranges, and paginated results.
- `/upcoming` keeps search, filters, custom dates, and scheduling on one compact desktop row with reduced-motion-safe filter feedback.
- `/upcoming` opens the reusable `ScheduleMeetingDialog` through `UpcomingScheduleButton` so the page can remain server-rendered.
- `/previous` renders a static completed-meetings dashboard using the reusable `MeetingCard` component.
- `/previous` follows the same compact dashboard direction with smaller summary cards and three meeting cards per desktop row.
- `/previous` paginates the shared seed dataset at 18 meeting cards per page.
- `/previous` uses `PreviousMeetingsExplorer` for title search, recorded/this-month/follow-up filters, custom date ranges, and one-row desktop controls.
- `/recordings` renders a static recordings library using the reusable `RecordingCard` component with Play and Share actions.
- `/recordings` follows the compact dashboard direction with minimal recording cards and three recordings per desktop row.
- `/recordings` paginates 40 ready recorded meetings at 18 recording cards per page.
- `/recordings` uses `RecordingsExplorer` for title search, ready/shared/this-month filters, custom date ranges, and one-row desktop controls.
- `/personal-room` renders a static reusable-room management page with room link, quick actions, settings, and readiness details.
- `/personal-room` follows the compact dashboard direction with four room setting cards in one desktop row.
- `src/data/meetings.json` contains 1000 deterministic meeting records, including 40 ready recordings, and `src/lib/meetings/static-meetings.ts` is the only adapter pages should use directly.
- Route styling uses `.module.css` files rather than growing `globals.css`.

## Environment

```env
NEXT_PUBLIC_MEETINGS_URL=http://localhost:4003
NEXT_PUBLIC_MEETINGS_PUBLIC_URL=http://localhost:4003
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
- `src/components/meetings/PaginatedMeetingGrid.tsx` and `src/components/meetings/PaginatedRecordingGrid.tsx` own client-side paging for seeded list pages.
- `src/components/meetings/MeetingRoom.tsx` owns the custom Gracon meeting room surface used for the user-facing meeting experience.
- `src/components/meetings/MeetingRoom.tsx` owns Stream session setup for API-backed meetings and local browser mic/camera fallback for seeded rooms.
- Stream-backed rooms must keep the custom Gracon stage, controls, collaboration panel, and invite dialog instead of mounting Stream's default call UI.
- Stream participant normalization must prefer screen share, active camera, dominant speaker, speaking state, then local participant status when duplicate sessions exist.
- Stream camera tiles must use cover-fit inside the Gracon stage. Only screen-share tracks should use contain-fit to avoid cropping shared content.
- Local fallback rooms must stop browser media tracks when users disable media or leave the room.
- `src/components/meetings/MeetingControlDock.tsx` owns the static room action controls so media actions can evolve independently from room layout.
- `src/components/meetings/MeetingCollaborationPanel.tsx` owns the animated Members/Chat tab shell, while `MeetingMembersPanel.tsx`, `MeetingChatPanel.tsx`, and `MeetingInviteDialog.tsx` keep their focused room responsibilities.
- `src/components/meetings/MeetingRoom.tsx` owns Stream-backed screen share toggles, audited recording calls, and room-level chat state for the custom live room.
- `src/components/meetings/MeetingRoom.tsx` also owns lightweight live-room UI states such as raised hand and recording elapsed time until those states are backed by provider webhooks or dedicated API events.
- `src/components/meetings/MeetingStage.tsx`, `MeetingEndedState.tsx`, and `RecordingStopDialog.tsx` keep the live room layout, closed-room state, and stop-recording confirmation isolated from provider wiring.
- `src/components/meetings/MeetingRoomHeader.tsx` owns room status chips and the invite entry point so the room body can focus on media and collaboration state.
- `src/components/meetings/MeetingRoomNotice.tsx` owns persistent room notices that should remain visible after toast feedback fades.
- `src/components/meetings/EndMeetingDialog.tsx` owns the destructive end-meeting confirmation and must stay in front of direct room closing.
- `src/components/meetings/MeetingShortcutsDialog.tsx` owns keyboard shortcut discoverability for room controls.
- `src/components/meetings/MeetingSettingsDialog.tsx` owns the lightweight room settings surface for microphone and camera controls.
- `src/components/ui/Toast.tsx` mirrors the document workspace toast design and is the required feedback surface for meeting room success/error messages.
- `MeetingInviteDialog.tsx` builds public meeting links from `NEXT_PUBLIC_MEETINGS_PUBLIC_URL` or the current localhost origin, and API-backed rooms send invitations through same-origin proxy routes.
- `src/components/invitations/MeetingInvitationAcceptance.tsx` owns the public invite acceptance flow and must keep backend verification gates authoritative.
- `src/components/ui/MeetingsLoadingState.tsx` owns branded loading UI and should be reused instead of adding local spinners.
- Stream tokens returned to the browser are short-lived and call-scoped. `STREAM_API_SECRET` remains only in `api/meetings`.
- Recording start/stop is explicit host action. The frontend may show immediate status feedback, but the backend audit event is the source of truth.

## Styling Rules

- Use CSS modules for page and component styling.
- Use the same DM Sans variable as `app/documents`: `--font-dm-sans`.
- Keep `globals.css` limited to tokens and base styles.
- Keep Gracon primary purple as the action color, but avoid purple page backgrounds.
- Avoid gradients on cards or layout backgrounds.

## Next Milestones

- Add invite link acceptance and email notification surfaces.
- Add recording library and access checks.
- Add recording playback and access checks for completed meeting files.
