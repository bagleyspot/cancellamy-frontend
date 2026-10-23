# Frontend notes

Decisions taken while building the frontend and the contract questions found on the way.
Contract reference: `cancellamy-backend/docs/API-CONTRACT.md` and `docs/api-types.ts` (copied verbatim to `src/api/types.ts`, v1 + v2).

## Decisions

- **One HTTP layer.** `src/api/http.ts` is the only place that calls `fetch`; `endpoints.ts` maps each contract endpoint to a typed function;
  `queries.ts` / `mutations.ts` wrap them in TanStack Query hooks. A contract fix is a change in those files only.
- **Auth.** Access token in memory only. Session restored on load with `POST /auth/refresh` (cookie `cnc_rt`, `credentials: 'include'`) followed by `GET /me`.
  On a 401 the client performs one shared refresh (concurrent requests await the same promise because refresh tokens rotate) and retries once; if that fails the
  session is cleared and the router sends the user to `/accedi` (with the original path in router state).
  `/auth/login|register|refresh|logout|verify-email|forgot-password|reset-password` never trigger a refresh.
- **PDFs** (signed delega, complaint) and the data export are fetched as blobs with the Bearer header; PDFs open in a tab opened synchronously from the click (popup-blocker safe), with a download fallback.
- **Routing.** React Router declarative mode. The authenticated area (`/app/*`) and the admin area are lazy-loaded chunks. Vendor code is split in `vite.config.ts`.
- **Dependency pins that differ from the brief:** `@hookform/resolvers@^5` (6.x declares an optional peer on `effect@^4` that makes `npm install` fail with ERESOLVE) and
  `@vitejs/plugin-react@^5.2` (6.x requires Vite 8; 5.2 supports Vite 7). msw is 3.x, whose unhandled-request option is `onUnhandledFrame`.
- **Selected profile** (profile switcher) is kept in React context and remembered in `localStorage` (a profile id only, in try/catch). Dashboard, requests and reports always use the selected profile.
- **Onboarding wizard.** Steps 1-2 (personal data, contacts) live on `/app/profili/nuovo` and create the profile (`POST /profiles`) when step 2 is submitted. Steps 3-4 (authorization, summary and activation)
  continue on `/app/profili/:id`, driven by the profile status (`draft` shows step 3, `ready` shows step 4). The activation result stays visible after the status changes to `active`.
- **Request detail actions** (`features/requests/permissions.ts`): `provide-id`, `reminder`, `escalate` and `simulate-reply` follow the server flags (`canProvideId`, `canRemind`, `canEscalate`, `canSimulateReply`).
  The contract has no flags for the other three, so the UI derives them:
  - mark-done: `status === 'action_required'`, reason is not `reply_review`, and `canProvideId` is false;
  - outcome buttons: `status === 'replied'`, or `action_required` with reason `reply_review`;
  - cancel: any status except `completed`, `refused`, `cancelled`.
- **Escalation.** `POST /requests/:id/escalate` returns the complaint text and steps once. They are kept in the Query cache for the session so the user can reopen them; after a reload only the PDF can be downloaded again (see questions).
- **Accessibility.** Skip link, labelled fields with `aria-describedby`/`aria-invalid`, `role="alert"` errors, accessible tabs (arrow keys), a custom modal with focus trap/Escape/focus return (jsdom does not implement `<dialog>.showModal`),
  chart with a screen-reader table, colour tokens checked for contrast in both schemes, `prefers-reduced-motion` respected.
- **Notification bell** is a link with an unread badge (polling `/notifications/unread-count` every 60 s) to `/app/notifiche`, not a dropdown.
- **Charts** are hand-written SVG (no recharts).

## Contract questions and assumptions

1. **`/auth/refresh` returns only `{ accessToken }`**, no user. The app calls `GET /me` after every refresh (one extra request per page load).
2. **Wrong password on authenticated endpoints.** `POST /me/change-password` and `DELETE /me` with a wrong password: the status is not specified. If the backend answers `401` the client would try a refresh and could log the user out.
   Mitigation: a 401 whose body has `code: 'INVALID_CREDENTIALS'` is treated as a business error (no refresh, no logout). Please confirm the status/code used, ideally 403 or 400 with `INVALID_CREDENTIALS`.
3. **`ComplaintDto.pdfUrl`** is a path including the `/api/v1` prefix and needs the Bearer header. It is ignored; the app calls `GET /requests/:id/complaint.pdf` through the API layer.
4. **No way to re-read a complaint** after `escalate` (no `GET` for the text/steps/`submitUrl`). Suggest including the `ComplaintDto` (or at least `submitUrl`) in `RequestDetail` when `status === 'escalated'`.
5. **Authorization PDF** exists only after signing, so the wizard cannot offer a pre-sign PDF preview: it shows the full text from `/authorization/text` and offers "Apri/Scarica il PDF firmato" once signed.
6. **Admin: assign unmatched inbound** takes `{ requestId }` (internal id). An admin has no endpoint to find another user's request by `shortRef` (`GET /requests` is per user), so the UI asks for the raw id.
   Suggest accepting `shortRef` (`CNC-...`) too. Likewise `OutboxItemDto` only has `requestId`, shown as text (no link, since the detail endpoint is per user).
7. **`GET /requests/summary?profileId=`**: behaviour without `profileId` is not specified, so the UI always sends the selected profile.
8. **`POST /notifications/read`**: "mark all" sends `{}` (no `ids`), as described.
9. **Field rules not in the contract.** The UI validates: names required (max 100), date `YYYY-MM-DD` not in the future, fiscal code 16 alphanumeric characters, phone `^\+?[0-9 ()./-]{6,20}$`,
   ZIP 5 digits when country is `IT`, province 2 letters, country 2 letters, password min 10, custom request name max 200 and notes max 2000. If the backend is more permissive, loosen `features/profiles/schemas.ts`;
   if stricter, its messages (400 with `message: string[]`) are shown as received.
10. **Custom request quota**: only `customRequestsPerMonth` is exposed, not how many were used, so the form shows the limit and relies on `CUSTOM_LIMIT_REACHED`.
11. **Profile limit**: `user.maxProfiles` is used (not `config.maxProfiles`).
12. **`VALIDATION_ERROR`** is listed as a code, but a plain 400 with `message: string[]` is handled the same way.
13. **Privacy text** claims only things the contract implies (documents are not stored, export and deletion exist). The lawyer must verify every sentence; nothing in the legal pages is binding.

---

# v2 (optional features)

## Decisions

- **Feature flags.** `useFeatures()` reads `GET /config`; everything is off until the config arrives (no flash of disabled entries on a slow network is traded for a short delay before the new entries appear).
  Routes use `<FeatureRoute feature="...">`; sections check the flag directly; `QueryBoundary` renders any `404 FEATURE_DISABLED` as an informational "unavailable" alert and the cards of the profile page hide themselves.
- **SMTP password handling.** The password input is uncontrolled and read from the DOM only when "Prova la connessione" or "Salva" is clicked; it never enters React state, react-hook-form or the TanStack Query mutation cache
  (`useSenderActions` exposes `save`/`test` as plain async functions for that reason). It is cleared after a successful save and never prefilled. A failed test keeps what the user typed so it can be corrected.
- **`POST /profiles/:id/sender/test`** is always called with the form values (the backend default "use the saved settings" cannot work: the password is never stored client-side).
- **Identity.** `IdentityDto.contacts` of type `phone` are shown only when `requiresPhone` is true. Confirming a code invalidates the profile queries (`identityVerified`) and the data map.
- **Breaches.** The card polls `GET /profiles/:id/breaches` every 5 s while some email has `status: 'pending'`. A `429` on `breaches/check` (with or without `code`) is shown as "riprova più tardi". The attribution string comes from the API and is always shown next to a link to https://haveibeenpwned.com.
- **Access page.** Blocked when `profile.identityVerified === false` (link to `/app/profili/:id#identita`; the profile page scrolls to the hash). Also asks for an `active` profile (the contract requires it) before showing the broker picker; a backend `IDENTITY_REQUIRED` is mapped anyway.
  The picker uses `GET /brokers?sendable=true` and filters `sendEnabled` client-side; the selection (max 20) survives pagination and search. Skipped brokers are shown with Italian reasons.
- **Requests lists** (`GET /requests`) mix `erasure` and `access` requests (no `kind` filter in the UI); access requests carry a "Richiesta di accesso" badge. For access requests the outcome button "Dati cancellati" reads "Il broker ha risposto".
- **Findings form** is shown only with `features.accessRequests`; already recorded findings are always shown read-only. With `found: false` no categories are sent.
- **Attachments.** Incoming + `downloadable` -> download button (authenticated blob) with the expiry date; incoming + not downloadable -> muted "non più disponibile"; outgoing -> plain label. A 404/410 on download says the file may have expired.
  `config.attachmentRetentionDays` is shown as a one-line note on requests that have incoming attachments.
- **Dossier.** `GET /requests/:id/dossier.zip?timestamp=true|false` through the same authenticated blob helper (`requestBlob` now accepts a query). `timestamp=false` is sent explicitly when the checkbox is not offered. `502 TIMESTAMP_UNAVAILABLE` is mapped to a friendly message.
- **Delisting transitions** live in `src/lib/delisting.ts` (unit-tested) and mirror the contract. The detail opens in the shared modal (`Dialog`), not on a separate route; confirm dialogs are siblings of it (not nested) so focus traps do not interfere.
- **Telemarketing complaint** reuses `ComplaintDialog`, which now takes `fetchPdf` and `pdfFileName` instead of a request id. The complaint always covers all reports (no selection UI).
- **Leaderboard** sorting/filtering is server-side through `sort`, `order`, `category` (URL query params of the page, so views are shareable). Percentages are rounded to whole numbers (`it-IT`); medians have at most one decimal ("3,5 gg").
- **Public links** to `/classifica` (header, footer, home teaser "Chi risponde davvero?") exist only with `features.leaderboard`. "Come funziona" lists only the capabilities that are enabled.
- **msw/fixtures:** `makeConfig()` has every feature on by default (`makeFeatures()`); the default handlers include neutral answers for the new read endpoints. Note for msw: in one `server.use(a, b)` call `a` wins over `b`; use separate calls to override.

## Contract questions and assumptions (v2)

1. **`order` for `GET /brokers/leaderboard`** appears in the contract URL (`sort=responseRate&order=desc&category=`) but not in `api-types.ts` (only `LeaderboardSort`). Defined as `'asc' | 'desc'` in `src/api/endpoints.ts`.
2. **"any open -> cancelled" (delisting)** does not say which statuses are "open". The UI offers cancel from `to_submit`, `submitted` and `appealed`, not from `denied` / `partially_approved` (there the only action is the appeal). Offering it there too is a one-line change in `src/lib/delisting.ts`.
3. **`GET /profiles/:id/sender` for a feature that is off** is expected to answer `404 FEATURE_DISABLED`; the card hides itself. The same holds for every v2 endpoint.
4. **`RequestDetail.findings`** is only meaningful for `kind: 'access'`; the card is rendered for that kind only.
5. **Phone contacts**: if `requiresPhone` is false the backend may still list phone contacts; the UI ignores them (they cannot be verified).
6. **Rate limit of `breaches/check`**: the contract says "429 otherwise" without a code; the UI keys on the status, not on `RATE_LIMITED`.
7. **`PublicConfigDto.leaderboardMinUsers`** is not used: `LeaderboardDto.minUsers` carries the same value together with the data.
8. **Access requests and the 30-day deadline**: the list/detail UI reuses the erasure wording for the status and the due date ("Scadenza ...").
9. **Timestamp (`manifest.tsr`)**: the UI does not verify it; the ZIP contains the instructions (`LEGGIMI.txt`).
10. **`MessageDto.via === 'resend'`** is labelled "Inviata da Cancellamy" (also for the reminder emails).
