# File Structure Rules

Purpose: keep meetings frontend files typed, scoped, and maintainable.

## Required File Shape

- Every file must start with a short top-level comment explaining its purpose.
- Every exported function, component, hook, and public helper must have JSDoc explaining what it does, parameters, and return value.
- Use `const` by default. Use `let` only when reassignment is necessary.
- Do not use `any`; create interfaces, DTOs, or narrow generics.
- Delete dead code instead of commenting it out.
- Keep one primary React component per file.

## Naming

- React components: `PascalCase.tsx`
- CSS modules: `component-name.module.css`
- Helpers: `kebab-case.ts`
- Hooks: `useSomething.ts`
- Route handlers: follow App Router route conventions.

## Styling Rules

- Every non-trivial component owns a `.module.css` file.
- Keep `globals.css` limited to tokens and base styles.
- Do not add large inline style objects.
- Use DM Sans and shared CSS variables.
- Keep Gracon primary purple for actions, but avoid purple-dominant page backgrounds.

## Component Rules

- Keep client components explicit about loading, error, empty, and disabled states.
- Keep destructive actions behind confirmation dialogs.
- Keep long-running actions visible with toast or inline status feedback.
