<!-- The PR title becomes the commit message on main: use Conventional Commits, e.g. "fix(profile): ..." -->

## What and why

## How it was tested

- [ ] `npm run lint && npm run typecheck && npm test && npm run build`
- [ ] New behaviour has a test (msw handlers in `src/test/`)

## Checklist

- [ ] No secrets, `.env` files or personal data in the diff
- [ ] The strict CSP in `deploy/` still holds: no external scripts, fonts, images or inline code were added
- [ ] API change: `src/api/types.ts` is a verbatim copy of the backend `docs/api-types.ts`, and the backend PR is linked
- [ ] User-facing text is Italian and lives in `src/i18n/`
- [ ] Feature switches (`useFeatures()`) are respected for optional capabilities
