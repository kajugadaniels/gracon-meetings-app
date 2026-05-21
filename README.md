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
- Meeting invitation verification defaults consumed from the user-owned settings in `api/auth`

## Current Foundation

- Local `/login` route matches the `app/documents` developer-login pattern.
- Production can redirect to `app/app/login` by setting `MEETINGS_USE_MAIN_APP_LOGIN=true`.
- Same-origin `/api/session`, `/api/refresh`, and `/api/logout` routes validate shared cookies server-side.
- Loading states now use `MeetingsLoadingState` for session recovery, route transitions, and Stream room preparation.
- Protected `/meetings` route is available as the initial authenticated workspace.
- Same-origin `/api/meetings` route handlers proxy meeting actions to `api/meetings` with server-resolved auth tokens, so production HttpOnly cookies keep working.
- Same-origin `/api/users/preferences` reads auth-owned user defaults for meeting invitation gates. The values only preselect the live invite and schedule dialogs; `api/meetings` still enforces the selected gates on every invitation.
- Same-origin recording proxy routes live under `/api/meetings/:id/recordings/*`; browser components never call `api/meetings` directly for recording control.
- The `/meetings` workspace now creates scheduled meetings, lists visible meetings, starts/ends meetings, and requests short-lived Stream call tokens.
- `/meetings/:id` is the active meeting-room experience. Newly created instant meetings are routed here so users see the custom Gracon room instead of the raw Stream SDK surface.
- `/meetings/:id` renders the custom in-meeting room UI with mute, video, recording, share, members, chat, and invite controls.
- `/meetings/:id` now uses a full-screen participant stage, a fixed bottom `MeetingControlDock`, and a Framer Motion-powered collaboration panel that opens Members or Chat as tabs only when requested.
- `/meetings/:id` now includes an ended-room state so workflow validation matches the real meeting lifecycle.
- `/meetings/:id` polls persisted room status while open. When the host ends the room, other participants are notified and moved to the ended-room state without needing a page reload.
- `/meetings/:id` now fetches persisted meeting details from `api/meetings`, derives host identity from the authenticated session user, and connects API-backed UUID meetings to Stream behind the custom Gracon room surface.
- `/meetings/:id` routes must not include title query parameters. Room title and host identity are resolved after route entry from API/session data so stale shared links cannot show the wrong host.
- `/meetings/:id` collapses duplicate Stream browser sessions for the same visible participant and keeps the richest media tile, so a single local camera feed fills the stage instead of showing an avatar duplicate.
- `/meetings/:id` only renders non-host room attendees from active invitation states. Declined or removed participants must not inflate the visible member count.
- `/meetings/:id` overrides Stream's tall-camera containment inside the custom stage, so camera video always covers its tile while screen sharing still preserves its full aspect ratio.
- `/meetings/:id` now supports Stream-backed screen sharing from the custom Gracon control dock; local fallback rooms use browser `getDisplayMedia`.
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
- `/home` renders a light-mode dashboard with quick actions, real upcoming meeting cards from `api/meetings`, and a short skeleton loading state.
- `/home` uses a compact premium dashboard layout with smaller action cards and three meeting cards per desktop row.
- `/home` uses the same backend-backed meeting view models as the list pages and only renders the first 6 future meetings with `SCHEDULED` status.
- `/home` also shows scheduled meetings accepted by invited users, not only meetings they own, because `api/meetings` returns accepted participant meetings in the visible meeting list.
- Scheduled meeting invitation acceptance returns users to `/home` instead of dropping them into a room before the meeting time.
- Reusable meeting cards disable the Start action until the scheduled start time, show the scheduled readiness time, and copy the canonical meeting URL with a `Copy URL` action.
- Home quick-action dialogs are split into `NewMeetingDialog`, `JoinMeetingDialog`, and `ScheduleMeetingDialog`, each with its own scoped module CSS.
- `ScheduleMeetingDialog` now supports create and edit modes. Upcoming meeting cards can open it to update title, date, time, agenda, pending invite verification gates, and new invited guests without replacing the room workflow.
- `ScheduleMeetingDialog` starts from the user's saved meeting invitation defaults. The platform default is no extra verification, and choosing it disables email and identity checks until the user turns it off.
- In edit mode, `ScheduleMeetingDialog` sends emails only to newly selected guests. Existing pending invitees keep their original invite email/link while the backend silently updates their verification gates.
- Scheduled meeting edit and delete actions are owner-only in the UI. Invited users can still view accepted scheduled meetings but do not see schedule mutation controls.
- `NewMeetingDialog` starts instant meetings dynamically by creating a meeting, starting it through `api/meetings`, and navigating to the live room.
- Meeting dialogs blur the background, close on outside click, and use short CSS enter/exit animations with reduced-motion fallbacks.
- `/invitations/:token` renders a single-step secure invitation wizard. It starts with the invited account, sends email OTP only when required, uses six auto-verifying OTP boxes, sends identity-required users to `app/app` with `challenge=invitation` for ID-card plus face verification, and shows the accept action only after `api/meetings` confirms every gate.
- `/upcoming` renders a backend-backed scheduled-meetings dashboard using the reusable `MeetingCard` component.
- `/upcoming` only displays future meetings with `SCHEDULED` status, ordered by nearest scheduled date first.
- `/upcoming` follows the compact dashboard direction with smaller summary cards and three meeting cards per desktop row.
- `/upcoming` paginates real visible meeting data at 18 meeting cards per page.
- `/upcoming` uses `UpcomingMeetingsExplorer` for title search, active filters, custom date ranges, and paginated results.
- `/upcoming` keeps search, filters, custom dates, and scheduling on one compact desktop row with reduced-motion-safe filter feedback.
- `/upcoming` opens the reusable `ScheduleMeetingDialog` through `UpcomingScheduleButton` so the page can remain server-rendered.
- `/upcoming` uses the same dialog in edit mode for scheduled meeting updates and updates the visible list optimistically after the backend confirms the save.
- `/upcoming` supports owner-only scheduled meeting deletion through a dedicated confirmation dialog. A successful delete removes the card immediately and the backend revokes pending invite access.
- `/previous` renders a backend-backed completed-meetings dashboard using the reusable `MeetingCard` component.
- `/previous` only displays meetings with `ENDED` or `CANCELLED` status, ordered from newest to oldest.
- `/previous` hides live-room actions on history cards and shows a readable completed-meeting duration such as `1 hour, 3 minutes, 2 seconds`.
- `/previous` follows the same compact dashboard direction with smaller summary cards and three meeting cards per desktop row.
- `/previous` paginates real visible meeting data at 18 meeting cards per page.
- `/previous` uses `PreviousMeetingsExplorer` for title search, recorded/this-month/follow-up filters, custom date ranges, and one-row desktop controls.
- `/recordings` renders a backend-backed recordings library using the reusable `RecordingCard` component with Play and Share actions.
- `/recordings` follows the compact dashboard direction with minimal recording cards and three recordings per desktop row.
- `/recordings` fetches accessible recording metadata through same-origin recording routes and paginates it at 18 recording cards per page.
- `/recordings` uses `RecordingsExplorer` for title search, ready/shared/this-month filters, custom date ranges, and one-row desktop controls.
- `/recordings` opens recordings in `RecordingPlayerDialog`. The dialog plays provider asset URLs when available and shows a processing state when metadata exists before the media file is ready.
- `/recordings` can refresh a processing recording through the same-origin recording refresh route, which asks `api/meetings` to pull finalized Stream playback metadata without exposing provider credentials to the browser.
- Recording cards must display derived duration from `durationSeconds` or recording timestamps; avoid showing `00:00` for processing recordings.
- `src/lib/meetings/meeting-view-models.ts` converts backend meetings and recordings into card-ready UI contracts; local seeded meeting data has been removed from active pages.
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

## AI Agent Rules

Project-local AI guidance lives in `agents/README.md`.

Read that guide before changing auth/session recovery, the protected meetings shell, home/upcoming/previous/recordings pages, scheduling and invite dialogs, invitation acceptance, Stream media wiring, recording playback, or the custom meeting-room UI. The guide is specific to this frontend so contributors preserve the meetings boundary while keeping `api/meetings`, `api/auth`, and `app/app` as the source of truth for authorization, credentials, and identity verification.

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
- `src/components/meetings/PaginatedMeetingGrid.tsx` and `src/components/meetings/PaginatedRecordingGrid.tsx` own client-side paging for backend-backed list pages.
- `src/components/meetings/MeetingCard.tsx` owns scheduled start gating, canonical room URL copying, and compact card interaction states for home, upcoming, and previous-compatible surfaces.
- `src/components/meetings/RecordingPlayerDialog.tsx` owns secure recording playback, metadata display, processing fallback states, and the user-triggered refresh action for provider playback readiness.
- `src/components/meetings/MeetingRoom.tsx` owns the custom Gracon meeting room surface used for the user-facing meeting experience.
- `src/components/meetings/MeetingRoom.tsx` owns meeting detail loading, authenticated host derivation, Stream session setup for API-backed meetings, and local browser mic/camera fallback.
- Stream-backed rooms must keep the custom Gracon stage, controls, collaboration panel, and invite dialog instead of mounting Stream's default call UI.
- Stream participant normalization must key by Stream user identity before session identity, then prefer screen share, active camera, dominant speaker, speaking state, and local participant status when duplicate sessions exist.
- Stream clients must disconnect on room cleanup, not just leave the call, so changing accounts during development cannot leave a previous user's media identity attached to a new room.
- Stream camera tiles must use cover-fit inside the Gracon stage. Only screen-share tracks should use contain-fit to avoid cropping shared content.
- Local fallback rooms must stop browser media tracks when users disable media or leave the room.
- `src/components/meetings/MeetingControlDock.tsx` owns the room action controls so media actions can evolve independently from room layout.
- `src/components/meetings/MeetingCollaborationPanel.tsx` owns the animated Members/Chat tab shell, while `MeetingMembersPanel.tsx`, `MeetingChatPanel.tsx`, and `MeetingInviteDialog.tsx` keep their focused room responsibilities.
- `src/components/meetings/MeetingRoom.tsx` owns Stream-backed screen share toggles, audited recording calls, and room-level chat state for the custom live room.
- `src/components/meetings/MeetingRoom.tsx` also owns lightweight live-room UI states such as raised hand and recording elapsed time until those states are backed by provider webhooks or dedicated API events.
- `src/components/meetings/MeetingStage.tsx`, `MeetingEndedState.tsx`, and `RecordingStopDialog.tsx` keep the live room layout, closed-room state, and stop-recording confirmation isolated from provider wiring.
- `MeetingEndedState.tsx` is shown both after the local host ends the meeting and after participant-side status polling detects that the host closed the room.
- `src/components/meetings/MeetingRoomHeader.tsx` owns room status chips and the invite entry point so the room body can focus on media and collaboration state.
- `src/components/meetings/MeetingRoomNotice.tsx` owns persistent room notices that should remain visible after toast feedback fades.
- `src/components/meetings/EndMeetingDialog.tsx` owns the destructive end-meeting confirmation and must stay in front of direct room closing.
- `src/components/meetings/MeetingShortcutsDialog.tsx` owns keyboard shortcut discoverability for room controls.
- `src/components/meetings/MeetingSettingsDialog.tsx` owns the lightweight room settings surface for microphone and camera controls.
- `src/components/ui/Toast.tsx` mirrors the document workspace toast design and is the required feedback surface for meeting room success/error messages.
- `MeetingInviteDialog.tsx` builds public meeting links from `NEXT_PUBLIC_MEETINGS_PUBLIC_URL` or the current localhost origin, and API-backed rooms send invitations through same-origin proxy routes.
- `MeetingInviteDialog.tsx` starts from `defaultMeetingInviteVerifications` returned by `app/app` settings through `api/auth`; live-room hosts can still override the gates before sending each invite.
- `MeetingInviteDialog.tsx` searches active verified invitees by email through the same-origin `/api/users/search` route after the user types at least 3 characters.
- `src/components/invitations/MeetingInvitationAcceptance.tsx` owns the public invite acceptance flow and must keep backend verification gates authoritative.
- Identity-gated invitations must use the same proof flow as documents: start the challenge in `api/meetings`, redirect to `app/app/verify-identity?challenge=invitation`, return to the invitation URL, then let `api/meetings` sync the fresh `id_verifications` proof.
- `src/components/ui/MeetingsLoadingState.tsx` owns branded loading UI and should be reused instead of adding local spinners.
- Stream tokens returned to the browser are short-lived and call-scoped. `STREAM_API_SECRET` remains only in `api/meetings`.
- Recording start/stop is explicit host action. The frontend may show immediate status feedback, but the backend audit event is the source of truth.
- Recording playback URLs are not guessed on the client. The recordings page must call the same-origin refresh route when a processing recording is opened and only play URLs returned by `api/meetings`.

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
