# Stream And Media Rules

Purpose: keep Stream integration stable while preserving the custom Gracon meeting room UI.

## Stream Client

- Prefer `getOrCreateInstance` or the existing singleton strategy to avoid duplicate clients.
- Disconnect Stream clients on room cleanup, account switch, and route exit.
- Leave calls and stop media tracks explicitly.
- Do not leave previous-user media identity attached to a new room during development.

## Participants

- Normalize participants by Stream user identity before session identity.
- Collapse duplicate browser sessions for the same visible participant.
- Prefer richer tiles when duplicates exist: screen share, active camera, dominant speaker, speaking state, then local participant.
- Only render non-host attendees from active invitation/member state.

## Audio And Video

- Join with microphone and camera disabled by default.
- Mute/video buttons must control provider state when Stream is active and browser tracks when in fallback mode.
- Bind remote audio correctly so Stream does not report dangling audio bindings.
- Stop local browser tracks when users disable media or leave.

## Screen Share

- Screen share should preserve full aspect ratio.
- Camera video should cover its tile to avoid unused colored space.
- The stage layout must adapt for 1, 2, 3, 4, and more participants.

## Recording

- Recording is off by default.
- Start and stop recording through audited backend proxy routes.
- Show elapsed recording timer only while recording is active.
- Do not use webhooks in development unless explicitly requested.
