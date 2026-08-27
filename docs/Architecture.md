# Architecture — StockLog

> How the app is put together: the flow, the stack, the folder structure, and the key modules.
> Last updated: 2026-08-27.

---

## 1. High-level flow

```
┌──────────────────────────────────────────────────────────────────────┐
│  Browser / installed PWA                                               │
│                                                                        │
│  src/routes/index.tsx  (the one screen)                                │
│    • Step 1: pick task (Machines / Logistics)                          │
│    • Step 2 (Machines only): pick sheet (PUL-32 / PUL-25 / Sieving)    │
│    • pick material; enter quantities  OR  vehicle + transporter +      │
│      movement (In/Out) + in/out times                                  │
│    • submit()  → targetSheet = task === "Logistics" ? "Logistics"      │
│                                : machineSheet                          │
│         │                                                              │
│         ▼                                                              │
│  src/lib/stocklog.ts → appendRow(config, payload)                      │
│    • getConfiguredEndpoints(config) → [Account 1, Account 2]           │
│    • POST same-origin /api/sheets  { endpoints, payload }              │
│    • also writes entry to localStorage log                             │
└─────────────────────────────────┬──────────────────────────────────────┘
                                   │  (same-origin — no CORS, keeps Google
                                   │   URLs off the client network tab)
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│  Server route  src/routes/api/sheets.ts   (runs on Nitro/Vercel)       │
│    • validate endpoints + payload                                      │
│    • Promise.allSettled( endpoints.map(retry(sendToEndpoint)) )        │
│    • aggregate → { ok, syncedCount, totalEndpoints, errors }           │
│      200 = all synced · 502 = partial/total failure · 400 = bad input  │
└─────────────────────────────────┬──────────────────────────────────────┘
                                   │  POST text/plain (no preflight)
                    ┌──────────────┴──────────────┐
                    ▼                              ▼
        Apps Script Web App #1          Apps Script Web App #2
        (Account 1 / Email 1)           (Account 2 / Email 2)
        doPost → appendRow()            doPost → appendRow()
                    │                              │
                    ▼                              ▼
            Google Sheet #1                Google Sheet #2
  (tab: PUL-32 / PUL-25 / Sieving / Logistics; header auto-created per tab)
```

**Why the same-origin proxy?** The browser never calls Google directly. Posting from the client
to Apps Script would trigger CORS/preflight pain and expose the script URLs in the network tab.
Instead the client hits our own `/api/sheets`, and the **server** fans out to each Apps Script
URL. The server-to-Google call uses `Content-Type: text/plain;charset=utf-8` — Apps Script's
convention for avoiding a CORS preflight.

---

## 2. Technical stack

| Layer | Choice | Version | Role |
|-------|--------|---------|------|
| Meta-framework | **TanStack Start** | 1.168.x | Full-stack React, SSR, server routes |
| Routing | **TanStack React Router** | 1.170.x | File-based routing, type-safe |
| Data/cache | **TanStack React Query** | 5.101.x | QueryClient provided app-wide (light use today) |
| UI runtime | **React** | 19.2 | Components |
| Language | **TypeScript** | 5.8 | Strict typing |
| Build | **Vite** | 8.2 | Dev server + bundler |
| Server runtime | **Nitro** | 3.x beta | Deploy target — `preset: "vercel"` |
| Styling | **Tailwind CSS v4** | 4.2 | CSS-first `@theme`, oklch tokens |
| Components | **shadcn/ui** (46) on **Radix UI** | — | Accessible primitives |
| Utility | `cn()` = clsx + tailwind-merge | — | The single most-used helper (class merging) |
| Icons | **lucide-react** | — | Iconography |
| Toasts | **sonner** | — | `richColors`, top-center |
| Forms/validation | react-hook-form + zod | — | Available; main form uses controlled state |
| Backend (external) | **Google Apps Script** | — | The actual Sheets writer |
| Persistence (local) | **localStorage** | — | materials, config, log |
| PWA | manifest + service worker | — | Install + offline shell |

Dev server runs on **port 8080** (`host: "::"`). Path alias **`@` → `/src`**.

---

## 3. Folder structure

```
sheet-stock-manager-main/
├── docs/                        ← this documentation suite (incl. apps-script.gs — the pasteable backend)
├── public/
│   ├── manifest.webmanifest     PWA manifest (standalone, theme #0d3b3f)
│   ├── sw.js                    service worker
│   ├── favicon.png
│   ├── icons/icon-192.png · icon-512.png   (any + maskable)
│   ├── downloads/               prebuilt installers served by the app
│   │   ├── StockLog-Android.apk
│   │   └── StockLog-Desktop.zip
│   └── robots.txt
├── src/
│   ├── routes/
│   │   ├── __root.tsx           app shell: <html>, head meta, providers, Toaster,
│   │   │                        SW registration, 404 + error boundaries
│   │   ├── index.tsx            THE main screen — entry form, log history, settings dialog
│   │   ├── api/sheets.ts        server route POST /api/sheets — fan-out + retry + aggregate
│   │   └── README.md            file-based routing conventions (read before adding routes)
│   ├── components/
│   │   ├── delete-entry-dialog.tsx
│   │   └── ui/                  46 shadcn/ui components (button, card, dialog, select, …)
│   ├── hooks/
│   │   ├── use-install-prompt.ts   PWA beforeinstallprompt / appinstalled / standalone
│   │   └── use-mobile.tsx
│   ├── lib/
│   │   ├── stocklog.ts          ★ DOMAIN CORE: tasks, sheets, types, materials, config/log,
│   │   │                          appendRow(), getConfiguredEndpoints(), APPS_SCRIPT_CODE
│   │   ├── utils.ts             cn()
│   │   ├── error-capture.ts     global SSR error capture
│   │   └── error-page.ts        renderErrorPage() fallback HTML
│   ├── router.tsx              getRouter() — new QueryClient + createRouter
│   ├── server.ts               server entry — normalizes h3-swallowed SSR 500s to HTML
│   ├── start.ts                createStart — errorMiddleware + csrfMiddleware
│   ├── routeTree.gen.ts        AUTO-GENERATED route tree — DO NOT EDIT
│   └── styles.css              Tailwind v4 import + design tokens (oklch, light/dark)
├── components.json             shadcn/ui config
├── vite.config.ts              plugins: tsconfigPaths, tailwindcss, tanstackStart, nitro, react
├── eslint.config.js · tsconfig.json · package.json
├── AGENTS.md · README.md
```

**Do not** introduce `src/pages/`, Next.js, or Remix conventions — routing is TanStack file-based.
See [`src/routes/README.md`](../src/routes/README.md).

---

## 4. Key modules

### `src/lib/stocklog.ts` — the domain core
Everything that defines *what StockLog is* lives here:
- **Types:** `TaskType`, `MachineSheet`, `SheetType`, `AppConfig`, `LogEntry`, `AppendRowPayload`, `SyncEndpoint`.
- **Constants:** `TASKS` (the two tasks), `MACHINE_SHEETS` + `LOGISTICS_SHEET` (column definitions),
  `SHEETS` (all tabs), `PREDEFINED_MATERIALS`, `PREDEFINED_TRANSPORTERS`; `taskForSheet(sheet)` maps a tab to its task.
- **Persistence:** `loadMaterials/saveMaterials`, `loadConfig/saveConfig`, `loadLog/saveLog`
  (log capped to 100 via `slice(0, 100)`). All guard `typeof window === "undefined"` for SSR.
- **Config precedence:** `import.meta.env.VITE_*` **beats** stored `localStorage` value, both trimmed.
- **Sync:** `getConfiguredEndpoints()` builds the endpoint list; `appendRow()` POSTs to `/api/sheets`.
- **`APPS_SCRIPT_CODE`** — the exact Google Apps Script the user pastes into script.google.com
  (handles all four tabs incl. Logistics). Mirrored standalone at [`docs/apps-script.gs`](./apps-script.gs).

### `src/routes/api/sheets.ts` — the sync proxy (server)
- `retry(task, attempts = 2)` with `250ms * attempt` backoff.
- `Promise.allSettled(...)` so one failing account never blocks the other.
- Returns `200` (all), `502` (partial/total, with `syncedCount`), or `400` (bad input).
- `sendToEndpoint()` throws descriptive errors when Apps Script returns HTML (a Google login page),
  pointing the user at the correct deployment settings.

### `src/routes/index.tsx` — the UI
Single-screen, controlled-component form. Manages `task` + `machineSheet` (deriving
`targetSheet`), `materials`, `config`, `log`, the quantity fields per machine sheet, the Logistics
fields (`vehicleNo`, `inTime`, `outTime`), and dialog/loading state. Uses `useInstallPrompt()`;
`submit()` validates the active task's fields → builds payload → `appendRow()` → toasts → saves to
local log.

### App shell & server plumbing
- [`__root.tsx`](../src/routes/__root.tsx) — `<html>` shell, head meta (viewport, `theme-color #0d3b3f`,
  apple/mobile web-app tags), manifest/icon links, `QueryClientProvider`, `<Toaster/>`, SW registration,
  and the 404 + error-boundary components.
- [`router.tsx`](../src/router.tsx) — `getRouter()` wires a fresh `QueryClient` into router context,
  `scrollRestoration: true`, `defaultPreloadStaleTime: 0`.
- [`start.ts`](../src/start.ts) — `createStart` with `requestMiddleware: [errorMiddleware, csrfMiddleware]`;
  CSRF is filtered to `serverFn` handler types.
- [`server.ts`](../src/server.ts) — `normalizeCatastrophicSsrResponse` detects h3-swallowed 500 JSON
  errors and renders a real HTML error page instead.

---

## 5. Rendering, deploy & config

- **SSR** via TanStack Start; the same routes render on server and hydrate on client.
- **Deploy:** Nitro `preset: "vercel"` — builds to Vercel's serverless output.
- **Config sources** (read in `loadConfig`): env vars
  `APPS_SCRIPT_URL`, `GOOGLE_SHEET_ID`, `APPS_SCRIPT_URL_2`,
  `GOOGLE_SHEET_ID_2`, `GOOGLE_SHEET_NAME` — falling back to `localStorage` (Settings dialog).

---

## 6. PWA architecture

- **Manifest** (`public/manifest.webmanifest`): `display: standalone`, `orientation: portrait-primary`,
  `theme_color`/`background_color` `#0d3b3f`, 192 + 512 icons (`any` + `maskable`).
- **Service worker** (`public/sw.js`): registered in `__root.tsx` on mount.
- **Install prompt** (`src/hooks/use-install-prompt.ts`): captures `beforeinstallprompt`, exposes
  `{ canInstall, installed, promptInstall }`, detects standalone display-mode.
- **Downloadable apps:** the install button serves `StockLog-Android.apk` (mobile UA) or
  `StockLog-Desktop.zip` (desktop) from `public/downloads/`, then triggers the native install prompt.

---

## 7. Commands

```bash
npm run dev        # Vite dev server on http://localhost:8080
npm run build      # production build (Nitro → Vercel output)
npm run build:dev  # build in development mode
npm run preview    # preview the production build
npm run lint       # eslint .
npm run format     # prettier --write .
```

See [`Rules.md`](./Rules.md) for the boundaries when changing any of this.
