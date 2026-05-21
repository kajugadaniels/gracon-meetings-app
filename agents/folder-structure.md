# Folder Structure Rules

Purpose: keep meetings frontend code organized as the product grows from static UI into backend-backed scheduling, live calls, and recordings.

## Current Layout

```text
app/meetings/
  agents/                    AI-agent project rules
  src/
    app/
      (protected)/           authenticated home, upcoming, previous, recordings, meeting room
      api/                   same-origin session and meetings proxy route handlers
      invitations/[token]/   public invitation acceptance flow
      login/                 development login surface
    components/
      invitations/           public invite acceptance UI
      layout/                protected topbar/sidebar shell
      meetings/              cards, dialogs, explorers, room components
      meetings/live/         provider-backed live room wiring
      pages/auth/            login page UI
      ui/                    toast and loading primitives
    constants/               sidebar/nav definitions
    lib/
      auth/                  session cookie policy and login helpers
      meetings/              typed view models and browser clients
      server/                same-origin proxy helpers
```

## Placement Rules

- Put protected page routes under `src/app/(protected)/`.
- Put public invitation routes under `src/app/invitations/[token]/`.
- Put same-origin backend proxy handlers under `src/app/api/`.
- Put reusable meeting cards, dialogs, explorers, and room UI under `src/components/meetings/`.
- Put provider-specific live-room wiring under `src/components/meetings/live/` only when it cannot stay in the generic room components.
- Put authenticated shell components in `src/components/layout/`.
- Put typed backend-to-UI mapping in `src/lib/meetings/`.
- Put server-only API proxy code in `src/lib/server/`.

## New File Rules

- Split dialogs into their own component and `.module.css`.
- Keep card components reusable across home, upcoming, previous, and recordings where behavior allows.
- Keep `MeetingRoom.tsx` focused on orchestration; extract layout, controls, panels, dialogs, and notices.
- Do not reintroduce static meeting datasets for active pages once backend-backed data exists.
