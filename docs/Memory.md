# Memory — StockLog

> **Running progress log for AI + developer continuity.** When you (or a new AI chat / tool) pick up
> this project, read this file first. It captures the current state, the *why* behind decisions, and
> the non-obvious gotchas — so you don't have to re-read the whole codebase or repeat past mistakes.
>
> **Update protocol:** after any meaningful change, append to §7 (Change log) and adjust §2 (Status)
> and §5 (Known limitations). Keep entries short and dated. Convert relative dates to absolute.

**Last updated:** 2026-09-01

---

## 1. What this project is (one paragraph)

**StockLog** is an installable PWA that logs stock entries (date, material, quantities) to Google
Sheets via a Google Apps Script Web App, with optional **dual-account** simultaneous sync. Built on
**TanStack Start** (SSR) + React 19 + Tailwind v4 + shadcn/ui, deployed on **Vercel** (Nitro). The
client never talks to Google directly — it posts to a same-origin server route (`/api/sheets`) that
fans out to each Apps Script endpoint. See [`PRD.md`](./PRD.md) and [`Architecture.md`](./Architecture.md).

---

## 2. Current status snapshot

**All core features are implemented and shipped** (Phases 0–7 in [`Phases.md`](./Phases.md)):

- ✅ **Two-task flow:** Step 1 picks the task (Machines / Logistics); the flow adapts.
- ✅ **Machines:** single-screen entry; 3 sheet types (PUL-32, PUL-25, Sieving) with distinct columns and a required Day/Night value in the `TIME` column after Date; neither option is selected initially.
- ✅ **Logistics:** truck / tempo IN–OUT logging — vehicle no + transporter (free-text, "SGL"
  quick-pick) + required movement toggle defaulting to **None** until In/Out is chosen + In/Out
  time pickers + material, on its own `Logistics` tab (`Date, Vehicle No, Transporter Name,
  Material, Movement, In-Time, Out-Time`). Vehicle number and movement are required; both time
  pickers are required.
- ✅ Predefined + custom materials and transporters; both are selected via persisted quick-select chips
  shown in a read-only input; all materials (incl. predefined) can be deleted via a confirmation
  dialog; local recent log (localStorage, capped 100, shows 20, filterable incl. Logistics).
- ✅ Google Sheets sync via Apps Script through `/api/sheets`; row shape per `sheetName`.
- ✅ Dual-email simultaneous sync with `Promise.allSettled` + retry + partial-failure reporting.
- ✅ PWA: manifest, service worker, install prompt, downloadable `.apk`/`.zip`.
- ✅ SSR error handling: CSRF + error middleware, h3-500 normalization, 404/error boundaries.

**Not built yet:** automated tests, offline auto-retry of failed syncs, in-app reporting/charts,
full dark-mode wiring, zod validation on the main form. See [`Phases.md`](./Phases.md) Phase 8.

---

## 3. Key decisions & rationale (the *why*)

| Decision | Why |
|----------|-----|
| **Google Apps Script as the backend**, not the Sheets API | Zero backend to host; the user pastes a script and deploys it themselves. Works with a personal Google account and no OAuth app registration. |
| **Same-origin `/api/sheets` proxy** instead of client→Google | Avoids CORS/preflight, keeps script URLs out of the client network tab, and lets the *server* fan out to multiple endpoints. |
| **`Content-Type: text/plain;charset=utf-8`** on the server→Apps Script POST | Apps Script Web Apps reject/338-redirect JSON preflights; `text/plain` is the standard way to POST JSON to them without a preflight. |
| **`Promise.allSettled` for dual sync** | One account failing must not block the other; we report "N of M synced" instead of all-or-nothing. |
| **localStorage for materials/config/log** | No accounts, no server DB; the app is a fast write client. Config can also come from `.env`. |
| **Env vars beat localStorage in `loadConfig`** | Lets a deployment hard-set the sheets while still allowing per-device Settings overrides in dev. |
| **Tailwind v4 + oklch tokens** | Modern CSS-first theming, perceptually-uniform colors, easy light/dark. |
| **TanStack Start + Nitro/Vercel** | SSR + file-based routing + a server route for the proxy, deployable serverless with no separate API. |

---

## 4. Non-obvious gotchas (read before editing)

- **`src/routeTree.gen.ts` is auto-generated** by the router plugin. Never edit it by hand; add
  route files and let it regenerate.
- **Task vs sheet:** `task` (Machines/Logistics) + `machineSheet` drive a derived
  `targetSheet` in `index.tsx`. Logistics always targets the `Logistics` tab and **hides Step 2**;
  Machines targets the chosen machine sheet. `submit()` branches validation per task. Keep that
  derivation — don't reintroduce a single `activeSheet`.
- **Adding a sheet/task = two files in lockstep:** `stocklog.ts` (types + `TASKS`/`SHEETS` +
  `LogEntry`/`AppendRowPayload`) **and** `APPS_SCRIPT_CODE` (mirrored in `docs/apps-script.gs`).
  Logistics times are stored as `HH:mm` strings — do **not** `Number()` them in the Apps Script.
- **Config precedence:** `import.meta.env.VITE_*` **overrides** the `localStorage` value in
  `loadConfig()`. Both are trimmed. If the Settings dialog "won't save," check for a stale `.env`.
- **Log is capped at 100** entries in `saveLog` (`l.slice(0, 100)`); the UI shows the latest ~20.
- **Apps Script deployment must be "Execute as: Me" + "Who has access: Anyone."** Otherwise Google
  returns an HTML login page; `stocklog.ts` / `api/sheets.ts` detect this and throw an explanatory
  error. Don't "fix" it by parsing the HTML — it's a deployment setting.
- **SSR guards everywhere:** `stocklog.ts` checks `typeof window === "undefined"` before touching
  `localStorage`. Keep that pattern in any new browser-only code.
- **h3 can swallow SSR 500s** into `{unhandled:true, message:"HTTPError"}` JSON; `server.ts`
  normalizes that into a real HTML error page. Don't remove `normalizeCatastrophicSsrResponse`.
- **CSRF middleware** is filtered to `serverFn` handler types in `start.ts` — the `/api/sheets`
  server route still works; be careful if you change middleware.
- **Dev server is port 8080**, host `::` (not the Vite default 5173).
- **Two content types in play:** client→`/api/sheets` is `application/json`; server→Apps Script is
  `text/plain`. Don't unify them.
- **Dark mode is only half-wired** — `.dark` tokens exist but `index.tsx` uses some hard-coded light
  utilities; toggling `.dark` won't fully restyle the main screen yet.

---

## 5. Known limitations / TODO

1. **No automated tests.** Highest-value first target: `stocklog.ts` (config precedence, endpoint
   building, `appendRow`) and `/api/sheets` aggregation.
2. **Failed/partial syncs aren't auto-retried.** They're saved locally with `synced`/`syncedCount`
   but not re-attempted when connectivity returns — no offline queue yet.
3. **Config is plaintext in localStorage** (acceptable for the threat model, but note it).
4. **Column schema is code-defined** for two tasks — Machines (PUL-32/PUL-25/Sieving) and Logistics
   — plus a fixed material list; new sheet shapes or tasks require changes in `stocklog.ts` + the
   Apps Script (`docs/apps-script.gs`).
5. **Brand color split** (blue UI vs. teal `#0d3b3f` chrome/icon) — unresolved.
6. **Dark mode not fully honored** on the main screen (see §4).

---

## 6. Where things live (fast index)

- Domain types + persistence + Apps Script code → [`src/lib/stocklog.ts`](../src/lib/stocklog.ts)
- Standalone pasteable Apps Script (mirrors `APPS_SCRIPT_CODE`) → [`docs/apps-script.gs`](./apps-script.gs)
- Sync proxy (server) → [`src/routes/api/sheets.ts`](../src/routes/api/sheets.ts)
- Main UI → [`src/routes/index.tsx`](../src/routes/index.tsx)
- App shell / head / providers → [`src/routes/__root.tsx`](../src/routes/__root.tsx)
- Design tokens → [`src/styles.css`](../src/styles.css)
- PWA install hook → [`src/hooks/use-install-prompt.ts`](../src/hooks/use-install-prompt.ts)
- Server plumbing → [`src/server.ts`](../src/server.ts), [`src/start.ts`](../src/start.ts)
- Routing rules → [`src/routes/README.md`](../src/routes/README.md)

---

## 7. Change log

> Append newest at the top. Dates absolute.

- **2026-09-01** — **Final Logistics validation + materials UX.** Replaced the material
  dropdown with a **read-only Material input** that reflects the chip selection; the quick-select
  chips now include all custom materials. Removed the "Quick Select Material" label. The
  **Materials manager** now allows deleting **any** material via a custom **`DeleteMaterialDialog`**
  confirmation. Finalized Logistics field rules: **movement defaults to None**, the field shows an
  asterisk and is required, **vehicle number is required**, and **both In-Time and Out-Time are
  required**. Also increased the custom add-material input to a minimum 16px font size so iOS
  Safari does not auto-zoom when the operator taps into the field. Updated docs to match the final
  state.
- **2026-08-31** — **Logistics columns + mobile responsiveness.** Added two Logistics columns —
  **Transporter Name** (free-text `<Input>` with an `SGL` quick-pick chip, backed by new
  `PREDEFINED_TRANSPORTERS`) and **Movement** (an In/Out segmented toggle; In = goods arrived, Out =
  goods sent). Locked the Logistics column order to `Date, Vehicle No, Transporter Name, Material,
  Movement, In-Time, Out-Time` in `LOGISTICS_SHEET`, `APPS_SCRIPT_CODE`, and `docs/apps-script.gs`.
  Extended `LogEntry`/`AppendRowPayload` (`transporter`, `movement`) and both sync bodies
  (`stocklog.ts` client + `api/sheets.ts` server). Removed the vehicle-number placeholder and the
  literal "Step 1 ·"/"Step 2 ·" heading text. **Responsiveness pass:** rebuilt the recent-log card
  as a stacked single-column layout (top row = badge/material/date + sync/delete; full-width detail
  chip below) so it never overflows on a phone; added `min-w-0`/`truncate`/`flex-wrap`/`shrink-0`
  guards on the entry header and log filter; the Movement toggle hides its "(Arrived)/(Sent)" suffix
  below 360px. Verified `npm run build` passes. Could not run the in-app mobile preview (port 8080
  was held by a running dev server and URL-attach preview is disabled on this install). Docs updated.
- **2026-08-27** — **Phase 7: task separation & Logistics.** Introduced `TaskType`
  (Machines/Logistics) + `MachineSheet`; added the two-step Step 1 (task) / Step 2 (machine sheet)
  flow in `index.tsx` with a derived `targetSheet`. Added the **Logistics** tab
  (`Date, Vehicle No, Material, In-Time, Out-Time`) with a vehicle/number-plate field (auto-upper)
  and In/Out `type="time"` pickers; task-aware validation, log filter, and log rendering. Extended
  `LogEntry`/`AppendRowPayload` (`task`, `vehicleNo`, `inTime`, `outTime`), the client + server sync
  bodies, and `APPS_SCRIPT_CODE`; added standalone [`docs/apps-script.gs`](./apps-script.gs).
  Verified: `npm run build` passes; mobile UI checked in-browser (task switch, hidden Step 2,
  vehicle uppercase, no console errors). Docs suite updated for the new structure.
- **2026-08-27** — Added the `docs/` documentation suite (PRD, Architecture, Rules, Phases, Design,
  Memory) reverse-engineered from the current codebase. No source code changed.
- **(from git history, most recent first):**
  - `075ae65` — "fixed errors"
  - `7a7c7f0` — "update dual link email" (dual-account link handling)
  - `1a828a5` — "Fix SSR property access and add null checks for `loadConfig` and `appendRow`"
  - `2603ef4` — "Add dual email Google Sheets simultaneous synchronization support" (Phase 4)
  - `6dd641e` — "updated ui"

---

## 8. How to use these docs together

1. **[`PRD.md`](./PRD.md)** — what & who (scope, users, features).
2. **[`Architecture.md`](./Architecture.md)** — how it's built (flow, stack, structure).
3. **[`Rules.md`](./Rules.md)** — boundaries you must respect while coding.
4. **[`Phases.md`](./Phases.md)** — what's done and what's next.
5. **[`Design.md`](./Design.md)** — the visual system (tokens, type, layout).
6. **`Memory.md`** (this file) — the running state; update it as you go.
