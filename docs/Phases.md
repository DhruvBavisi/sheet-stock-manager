# Phases — StockLog

> The project broken into manageable build steps. Phases 0–7 are **shipped** (this is how the app
> was assembled and where each piece lives); Phase 8+ is **planned**.
> Last updated: 2026-08-27.

---

## Legend
✅ Done · 🟡 In progress · ⬜ Planned

---

## Phase 0 — Scaffold & tooling ✅

**Goal:** a working TanStack Start + Tailwind v4 + shadcn/ui project that builds and runs.

- TanStack Start + React Router + React Query wired (`router.tsx`, `__root.tsx`).
- Vite 8 config with `tsconfigPaths`, `tailwindcss`, `tanstackStart`, `nitro` (Vercel), `react`;
  `@` → `/src` alias; dev on port 8080 (`vite.config.ts`).
- Tailwind v4 (`@import "tailwindcss"`, `@theme inline`) + design tokens in `styles.css`.
- shadcn/ui installed (46 components in `src/components/ui/`), `cn()` helper, ESLint + Prettier.

**Done when:** `npm run dev` serves the app; `npm run build` succeeds; lint/format pass.

---

## Phase 1 — Core entry form + local log ✅

**Goal:** log an entry on one screen and keep a local history.

- Single-screen UI in `src/routes/index.tsx`: sheet selection, material, date, quantity inputs.
- Domain model in `src/lib/stocklog.ts`: `SheetType`, `LogEntry`, `SHEETS`, `PREDEFINED_MATERIALS`,
  `todayISO()`, `formatDateDDMMMYYYY()`.
- `localStorage` persistence: materials, log (`loadLog`/`saveLog`, capped at 100).
- Recent log list (latest 20), filter by sheet, delete via `delete-entry-dialog.tsx`.

**Done when:** a user can add/remove materials and log entries that persist across reloads, with no
network required.

---

## Phase 2 — Google Sheets sync (single account) ✅

**Goal:** append the entry as a row in a Google Sheet.

- `APPS_SCRIPT_CODE` in `stocklog.ts` — `doPost` appends a row, auto-creates the header;
  `doGet` health check.
- Same-origin server route `src/routes/api/sheets.ts` proxies the write to the Apps Script URL
  (`text/plain` content type to skip CORS preflight).
- `appendRow(config, payload)` on the client; success/failure toasts via `sonner`.
- Settings dialog exposes the Apps Script code with copy-to-clipboard + setup instructions.

**Done when:** a submit produces a correctly-formatted row in the configured Google Sheet.

---

## Phase 3 — Multi-sheet support (Machines) ✅

**Goal:** support different column shapes per sheet type.

- `MACHINE_SHEETS`: **PUL-32** / **PUL-25** (`Qty-40, Qty-25, Qty-20`) and **Sieving**
  (`1-No, 2-No, 3-No, 4-No`).
- Form renders the right quantity inputs per active sheet; `LogEntry` / `AppendRowPayload` carry
  both column sets.
- Apps Script writes the correct columns and header per `sheetName`.

**Done when:** switching the segmented control changes the inputs and the resulting sheet columns.

---

## Phase 4 — Dual-email simultaneous sync ✅

**Goal:** write the same row to two Google accounts/sheets at once.

- `AppConfig` gains optional `scriptUrl2` / `sheetId2`; `getConfiguredEndpoints()` returns
  `[Account 1, Account 2]`.
- Server route fans out with `Promise.allSettled(endpoints.map(retry(sendToEndpoint)))`.
- Aggregated result: `200` all-synced, `502` partial/total with `syncedCount` + `errors[]`.
- Toasts distinguish "dual-synced" vs "synced to N of M"; `LogEntry.syncedCount` records it.

**Done when:** one submit lands in both sheets, and a single-account failure still writes the other
and reports honestly.

---

## Phase 5 — PWA & installability ✅

**Goal:** installable, home-screen, native-feeling app.

- `manifest.webmanifest` (standalone, portrait, `#0d3b3f`, 192/512 icons any+maskable).
- Service worker `sw.js`, registered in `__root.tsx`.
- `useInstallPrompt()` hook (`beforeinstallprompt` / `appinstalled` / standalone detection).
- Install button downloads a prebuilt `.apk` (mobile) / `.zip` (desktop) then triggers the prompt.

**Done when:** the app can be installed to the home screen and launches standalone.

---

## Phase 6 — Error handling & hardening ✅

**Goal:** graceful failures on both client and server.

- `start.ts`: `errorMiddleware` + `csrfMiddleware` via `createStart`.
- `server.ts`: `normalizeCatastrophicSsrResponse` turns h3-swallowed 500 JSON into a real HTML page.
- `error-capture.ts` / `error-page.ts`: global capture + `renderErrorPage()` fallback.
- Route-level `errorComponent` + `notFoundComponent` (404) in `__root.tsx`.
- SSR guards + null checks in `loadConfig` / `appendRow`.

**Done when:** bad input, sync failures, SSR crashes, and unknown routes all render friendly UI.

---

## Phase 7 — Task separation & Logistics ✅

**Goal:** split the app into two distinct tasks and add truck / tempo IN–OUT logging.

- New top-level `TaskType = "Machines" | "Logistics"`; `MachineSheet` narrows the three production
  tabs. `TASKS`, `MACHINE_SHEETS`, `LOGISTICS_SHEET`, `SHEETS`, and `taskForSheet()` in
  `stocklog.ts`.
- **Two-step flow** in `index.tsx`: **Step 1** picks the task; **Step 2** (machine-sheet picker)
  shows only for Machines. `targetSheet` is derived from `task` + `machineSheet`.
- **Logistics** tab — columns `Date, Vehicle No, Material, In-Time, Out-Time`. Form adds a
  vehicle/number-plate field (auto-uppercased) and `type="time"` In/Out pickers; `submit()`
  validates per task (vehicle + at least one time for Logistics).
- `LogEntry` / `AppendRowPayload` gain `task`, `vehicleNo`, `inTime`, `outTime`; the recent-log
  filter and rows render a Logistics branch (vehicle no + In/Out).
- `APPS_SCRIPT_CODE` + [`docs/apps-script.gs`](./apps-script.gs) handle the Logistics header/row
  (times kept as `HH:mm` strings, not `Number()`).
- UI kept clean and mobile-first; production and logistics stay separate workflows.

**Done when:** the user can pick a task, the flow adapts, and a Logistics entry lands on the
Logistics tab in both accounts while Machines entries are unaffected.

---

## Phase 8 — Next up ⬜ (planned / backlog)

Not yet built. Candidate work, roughly prioritized:

1. **Offline queue & auto-retry** — persist failed/partial entries and re-attempt sync when back
   online (today they're saved locally but not automatically retried).
2. **zod + react-hook-form on the main form** — replace controlled `useState` with schema-validated
   fields (libraries already installed).
3. **Automated tests** — none currently. Add unit tests for `stocklog.ts` (config precedence,
   `appendRow`, endpoint building) and the `/api/sheets` aggregation logic.
4. **In-app reporting** — read data back and chart it (`recharts` is already a dependency).
5. **Config UX** — validate/verify the Apps Script URL (`doGet` health check) from Settings before
   saving; guide the dual-account setup more.
6. **Dark mode wiring** — tokens exist in `styles.css`, but the main screen uses some hard-coded
   light colors; make it honor the theme (see [`Design.md`](./Design.md) known-issues).
7. **Theme/brand consistency** — reconcile the blue UI primary with the teal (`#0d3b3f`) PWA chrome
   and the teal+green icon.

**Suggested acceptance for Phase 8 items:** each ships behind the existing patterns (server route
returns structured errors, user feedback via toasts, types centralized in `stocklog.ts`) and passes
lint/format.

---

See [`Memory.md`](./Memory.md) for the running status log and [`Rules.md`](./Rules.md) for the
boundaries any of this work must respect.
