# Meeting Lifecycle Rules

Purpose: preserve consistent behavior across home, upcoming, previous, recordings, invitations, and live rooms.

## Home

- `/home` is the post-login landing page.
- It should show quick actions and only the first 6 future meetings with `SCHEDULED` status.
- It should include accepted invited meetings, not only owned meetings.

## Upcoming

- `/upcoming` shows future meetings with `SCHEDULED` status, ordered by nearest date first.
- Search should be title-based and start after 3 typed characters when backed by live search.
- Filters, custom dates, and schedule action should remain compact and responsive.
- Start must stay disabled until the scheduled time arrives.

## Previous

- `/previous` shows `ENDED` and `CANCELLED` meetings, newest first.
- History cards should not expose Start or Copy Invitation actions when they no longer apply.
- Show readable duration when available.

## Scheduling

- Past dates must be rejected in scheduling UI and by the backend.
- Owners can update title, date, time, agenda, new invitees, and verification gates.
- Existing invitees should not receive duplicate emails on update; new invitees should receive emails.
- Only creators can edit or delete future scheduled meetings.

## Live Room

- `/meetings/:id` must use the custom Gracon room, not raw Stream default UI.
- The room must fetch title, host, status, attendees, and permissions from API/session data.
- The URL must not rely on title query params.
- When the host ends the meeting, all other participants should enter the ended-room state.

## Recordings

- `/recordings` shows backend-backed recording metadata.
- Playback opens in `RecordingPlayerDialog`.
- Duration should come from `durationSeconds` or timestamps, not `00:00` placeholders.
- Processing recordings should show clear processing state and optional refresh behavior.
