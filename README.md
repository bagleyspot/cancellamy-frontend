# Cancellamy frontend

[![CI](https://github.com/bagleyspot/cancellamy-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/bagleyspot/cancellamy-frontend/actions/workflows/ci.yml)
[![CodeQL](https://github.com/bagleyspot/cancellamy-frontend/actions/workflows/codeql.yml/badge.svg)](https://github.com/bagleyspot/cancellamy-frontend/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/bagleyspot/cancellamy-frontend/badge)](https://scorecard.dev/viewer/?uri=github.com/bagleyspot/cancellamy-frontend)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](./LICENSE)

Single-page web app for **Cancellamy**, a free and open-source Italian service that sends GDPR erasure requests
(arts. 17 and 21) to data brokers on behalf of its users and tracks their status. This repository is the frontend only;
the NestJS API lives in `cancellamy-backend` and the contract between the two is
`cancellamy-backend/docs/API-CONTRACT.md` + `docs/api-types.ts` (copied verbatim to `src/api/types.ts`).

Product documentation (Italian) lives in `cancellamy-backend/docs/README.md`.

All user-facing copy is Italian and lives in `src/i18n/it.ts`. Code, identifiers and comments are English.

## Stack

React 19, TypeScript (strict, `noUncheckedIndexedAccess`), Vite 7, React Router 7 (declarative mode), TanStack Query 5,
react-hook-form + zod, Tailwind CSS 4, lucide-react. Tests: Vitest, Testing Library, jsdom, msw.
There are no runtime calls to anything but the API: no CDN scripts, fonts or analytics.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on http://localhost:5173, `/api` proxied to `http://localhost:3000` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint 9 (flat config, typescript-eslint, react-hooks) |
| `npm run test` | Vitest, single run (`npm run test:watch` for watch mode) |
| `npm run build` | typecheck, then production build into `dist/` |
| `npm run preview` | Serves the production build locally |

## Environment

Copy nothing: there is no required `.env`. The only variable is documented in `.env.example`:

| Variable | Default | Meaning |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | Base URL of the API. Keep it same-origin: the refresh cookie `cnc_rt` has `path=/api/v1/auth` and `SameSite=Lax`. |

## Running against the backend

Cancellamy requires both repositories to be siblings in the same parent directory:

```bash
mkdir cancellamy-workspace && cd cancellamy-workspace
git clone https://github.com/bagleyspot/cancellamy-backend.git
git clone https://github.com/bagleyspot/cancellamy-frontend.git

# Rapid bootstrap: starts backend (port 3010) & frontend (port 5173) together
./start-dev.sh
# or from this directory:
npm run dev:all
```

When running services separately:
1. Start the backend (`cancellamy-backend`) on port 3010 (or 3000).
2. Run `npm install && npm run dev` (if on 3010, `VITE_PROXY_TARGET=http://127.0.0.1:3010 npm run dev`).
3. Open http://127.0.0.1:5173. The dev server proxies `/api/*` to the backend, so the cookie is first-party.

When the backend runs with `mailMode: 'dry-run'` the app shows a persistent banner and enables the
"simula risposta" controls on request detail pages.

For production, serve `dist/` and route `/api` to the backend on the same origin (any static host with an SPA
fallback to `index.html`).

## Screens

Public: `/` (landing), `/come-funziona`, `/broker` (catalogue), `/classifica` (broker leaderboard, feature `leaderboard`),
`/privacy`, `/termini`, auth pages (`/accedi`, `/registrati`, `/verifica-email`, `/password-dimenticata`, `/reimposta-password`).

Authenticated (`/app/*`): `/app` (overview), `/app/richieste` (+ `/nuova`, `/:id`), `/app/profili` (+ `/nuovo`, `/:id`),
`/app/report`, `/app/notifiche`, `/app/impostazioni`, `/app/admin/*` (admins), and the v2 screens:

| Route | Feature flag | What it does |
|---|---|---|
| `/app/accesso` ("Cosa sai di me") | `accessRequests` | art. 15 access requests: broker picker (max 20), data map. Blocked until the profile identity is verified |
| `/app/deindicizzazione` | `delisting` | search-engine delisting tracker: list, create, guide, allowed status transitions |
| `/app/telemarketing` | `nuisance` | RPO status, unwanted-contact reports, top callers, complaint to the Garante |
| `/classifica` | `leaderboard` | public leaderboard with privacy threshold |

On the profile page (`/app/profili/:id`): "Identità" (always), "Violazioni dei dati" (`breachCheck`) and "Mittente delle email" (`senderSmtp`).
On a request detail: evidence dossier download (`dossier`, with the timestamp option only when `dossierTimestamp`), per-message delivery label,
attachment downloads, scheduled dispatch batch badges, and for `kind: 'access'` requests a findings form.
On activation: clear feedback on automated requests queued and scheduled dispatch batches (max 5/day fair-share policy).

## Feature flags

`GET /config` returns `features` (see `FeatureFlags` in `src/api/types.ts`). `useFeatures()` (in `src/api/queries.ts`) exposes them; while the config is loading,
or if it cannot be loaded, every flag is treated as `false`. A disabled feature has no navigation entry, no public link, no profile card
(`<FeatureRoute>` shows a "funzione non disponibile" screen when someone opens the URL directly). Endpoints of a disabled feature answer
`404 FEATURE_DISABLED`: the UI shows that as "feature unavailable" (never as a failure with a retry button).

## Structure

```
src/
  api/          typed fetch client (http.ts), endpoint map (endpoints.ts), TanStack Query hooks (queries.ts, mutations.ts), types.ts (contract)
  app/          providers and the route tree
  components/   shared UI primitives (ui/) and small shared widgets
  features/     auth, shell (layouts, banners), public, brokers, dashboard, requests, profiles, reports, notifications, settings, admin,
                access, delisting, nuisance, leaderboard
  i18n/it.ts    every Italian string
  lib/          formatting (Intl it-IT), error mapping, status/group mapping, file helpers
  test/         msw handlers, contract-conformant fixtures, render helpers
```

See `docs/FRONTEND-NOTES.md` for design decisions and open questions about the API contract.

## Licence

Cancellamy is released under the **GNU Affero General Public License v3.0 only (AGPL-3.0-only)** (see `LICENSE`).
The legal pages (`/privacy`, `/termini`) are placeholders that must be
reviewed by a lawyer before the service goes public. Forks that serve the app must set `VITE_SOURCE_URL` to their own
repository (AGPL-3.0 section 13).
