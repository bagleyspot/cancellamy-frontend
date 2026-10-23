# Contributing

Thanks for helping people take their data back. Please read the [Code of Conduct](./CODE_OF_CONDUCT.md).
The full project documentation (Italian) lives in the
[backend repository](https://github.com/bagleyspot/cancellamy-backend/tree/main/docs); start with
[chapter 11](https://github.com/bagleyspot/cancellamy-backend/blob/main/docs/11-sviluppo-e-contributi.md).

## Workflow

1. Fork, branch from `main`, make a focused change.
2. Run `npm run lint && npm run typecheck && npm test && npm run build`.
3. Open a pull request. **The PR title becomes the commit message on `main`** (squash merge) and must follow
   [Conventional Commits](https://www.conventionalcommits.org): `feat(scope): ...`, `fix: ...`, `docs: ...`.
   Releases and the changelog are generated from these titles.
4. All required checks must pass and conversations must be resolved. `main` only accepts pull requests; there are no
   exceptions, including for maintainers.

## Ground rules

- TypeScript strict. User-facing text is Italian and lives in `src/i18n/`; code and comments are English.
- `src/api/types.ts` is a verbatim copy of the backend's `docs/api-types.ts`. Contract changes are made in the backend
  first; link the two pull requests.
- Optional backend capabilities are gated through `useFeatures()`; never assume they are on.
- The nginx CSP in `deploy/` is strict on purpose: do not add external fonts, scripts, images or inline code.
- Tests use msw with contract-conformant fixtures (`src/test/`); do not mock the API client directly.
- Never commit secrets or `.env` files. Nothing secret belongs in a `VITE_*` variable.
- New dependencies need a compatible license (`npm run check:licenses`) and a reason in the PR description.

## License

By contributing you agree that your code is released under AGPL-3.0-only.
