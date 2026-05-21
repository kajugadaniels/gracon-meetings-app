# UI And Design Rules

Purpose: keep the meetings app premium, responsive, compact, and understandable.

## App Shell

- Protected shell uses a flush top navbar and left sidebar.
- Navbar and sidebar live in `src/components/layout`.
- `/meetings/:id` live room should hide the normal shell when the meeting-room experience needs the full canvas.

## Cards And Lists

- Meeting cards should be compact and reusable.
- Avoid duplicated dates or redundant labels.
- Owner-only actions should be visible only when the user can use them.
- Put card actions on one line when space allows; use icons for secondary edit/delete actions.
- Delete icons should be red.

## Dialogs

- Every dialog should have its own component and `.module.css`.
- Dialog backgrounds should blur.
- Dialogs close on outside click unless the action is destructive or mid-submit.
- Use fast, reduced-motion-safe open/close animations.

## Room UI

- Control dock should sit centered at the bottom with compact spacing.
- Members and Chat live in a single collaboration panel with tabs.
- Opening Members or Chat should animate the stage resizing.
- Video tiles should fill available space and avoid awkward empty color blocks.
- Font sizes should stay compact; room controls should be easy to scan.

## Loading And Feedback

- Use `MeetingsLoadingState` for page, session, and room loading.
- Use the meetings toast component for success/error feedback.
- Avoid adding new local spinner designs.

## Responsive Rules

- Support mobile, tablet, laptop, and desktop.
- No horizontal scrolling.
- Meeting cards should reflow gracefully.
- Modals should become near-full-screen on mobile.
