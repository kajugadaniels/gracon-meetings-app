# Documentation Rules

Purpose: keep meetings-app behavior clear as scheduling, invitations, recordings, and live media evolve.

## Update Documentation When

- Auth/session or production login behavior changes.
- Meeting route behavior changes.
- Scheduling, edit/delete, or invite behavior changes.
- Invitation verification gates change.
- Stream token, media, recording, or cleanup behavior changes.
- Recording playback or refresh behavior changes.
- Environment variables are added, renamed, or removed.
- Static data is removed or replaced by backend data.

## Required Places

- `app/meetings/README.md` for app-local architecture and rules.
- `app/meetings/.env.example` for new configuration.
- `api/meetings/README.md` when frontend behavior depends on backend contract changes.
- Root `AGENTS.md` only when the cross-project platform picture changes.

## Documentation Quality

- Describe development and production differences clearly.
- Explain the security reason for proxy routes, invite gates, and Stream token handling.
- Keep room UI notes specific enough that another agent does not reintroduce raw Stream UI.
