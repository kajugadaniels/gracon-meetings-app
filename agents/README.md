# App Meetings Agent Guide

Purpose: this directory gives AI agents project-local rules for working on the Gracon meetings frontend without breaking session handoff, Stream media cleanup, invitation gates, recording access, or the custom meeting-room UX.

Read this file first, then read the topic file that matches the change.

## Reading Order

1. `folder-structure.md` - where routes, components, clients, and proxies belong.
2. `file-structure.md` - naming, comments, exported APIs, and CSS-module expectations.
3. `security.md` - auth, invitations, recordings, Stream tokens, and browser safety.
4. `auth-session.md` - local login, cross-app login, cookies, and logout rules.
5. `meeting-lifecycle.md` - home/upcoming/previous/room/recording behavior.
6. `stream-media.md` - Stream client, media, recording, screen share, and cleanup rules.
7. `ui-design.md` - layout, cards, dialogs, loading, responsive, and room design rules.
8. `testing.md` - required validation and regression priorities.
9. `documentation.md` - when README and `.env.example` must change.
10. `git.md` - copy-paste commit format for this app.

## App Boundary

`app/meetings` owns the meeting workspace UI: local development login, protected shell, dashboard, upcoming/previous/recordings pages, schedule and invite dialogs, invitation acceptance UI, and the custom Gracon meeting room.

It must not own auth issuance, meeting authorization decisions, recording provider secrets, or identity verification proofs. Those remain in `api/auth`, `api/meetings`, and `app/app`.

## Conflict Rule

If a local rule here conflicts with root `AGENTS.md`, follow the stricter security rule and update documentation after the decision is made.
