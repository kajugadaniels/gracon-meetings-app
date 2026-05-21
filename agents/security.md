# Security Rules

Purpose: protect meeting access, invitations, recordings, Stream credentials, and cross-app session handoff.

## Authentication

- Browser components must call same-origin `/api/*` routes for meeting actions.
- Do not call `api/meetings` directly from browser components when an auth token is required.
- Keep Stream API secrets out of the frontend. The browser receives only short-lived, call-scoped tokens from `api/meetings`.
- Do not add new JavaScript-readable auth storage paths.

## Meeting Access

- Meeting visibility and mutation authorization belong to `api/meetings`.
- UI owner-only buttons are convenience only; endpoints must still enforce owner-only edit/delete/end behavior.
- Invited users should see accepted scheduled meetings but must not see owner-only mutation controls.
- Do not trust title query params or URL metadata for host identity, title, or participant state.

## Invitations

- Invitation acceptance must honor backend-required gates: none, email verification, identity verification, or both.
- Email search must use same-origin user search and should start only after at least 3 typed characters.
- Identity-gated invites must send users through `app/app` verification with a safe `next` return URL.
- Public invitation tokens must never be logged or exposed beyond the URL flow.

## Recordings

- Recording start/stop must go through audited same-origin backend routes.
- Recording playback URLs must come from backend metadata or refresh routes.
- Do not guess provider playback URLs on the client.
- Do not show playback controls as ready when the provider asset is still processing.

## Logging

- Never log access tokens, refresh tokens, Stream tokens, invitation tokens, recording playback URLs, or identity-verification payloads.
