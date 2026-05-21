# Testing Rules

Purpose: prevent regressions in meeting scheduling, invites, room media, recordings, and auth handoff.

## Commands

```bash
npm run build
npm run lint
```

Use the smallest command that proves the change. For docs-only changes, no build is required.

## Priority Areas

1. Auth/session recovery: login, refresh, logout, cross-app handoff.
2. Meeting lists: home/upcoming/previous status filtering and ordering.
3. Meeting cards: start gating, copy URL, owner-only edit/delete actions.
4. Schedule dialog: past-date rejection, edit mode, new invite email behavior.
5. Invitation acceptance: email OTP, identity verification redirect/return, accept state.
6. Live room: duplicate participant collapse, host identity, ended state, media toggles.
7. Recordings: processing state, refresh, playback URL handling, duration formatting.

## UI Validation

- Check desktop, laptop, tablet, and mobile layouts.
- Verify no horizontal scroll.
- Verify dialogs close, animate, and preserve form state appropriately.
- Verify reduced-motion fallbacks for major animations.
