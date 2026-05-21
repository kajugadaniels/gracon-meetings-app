# Git Rules

Purpose: keep meetings-app commits reviewable and copy-paste safe.

Codex must never run git commands automatically. Present commands only.

## Required Format

Paths are relative to `app/meetings/`, where this app `package.json` lives.

```bash
git add "src/components/meetings/MeetingCard.tsx"
git commit -m "fix(meetings): simplify scheduled card metadata"
```

## Rules

- One file per `git add`.
- Always quote paths.
- Never use `git add .` or `git add -A`.
- Never include `cd app/meetings`.
- Never run `git push`.
- Use Conventional Commits.

## Common Scopes

- `meetings` - meeting lists, room, cards, schedule, previous/upcoming.
- `recordings` - recording cards, player, playback, metadata.
- `invitations` - invitation acceptance and invite dialogs.
- `auth` - login/session/logout behavior.
- `shared` - shell, layout, reusable shared components.
- `ui` - primitive UI and feedback components.
- `stream` - Stream media integration.
- `docs` - README and agent docs.
