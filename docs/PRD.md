# PRD — StockLog (Sheet Stock Manager)

> **Product Requirements Document.** What we're building, who it's for, and what it must do.
> Living document — reflects the current shipped scope. Last updated: 2026-09-01.

---

## 1. Overview

**StockLog** is an installable Progressive Web App (PWA) for logging daily operations straight
into **Google Sheets**, with no spreadsheet app open and no manual typing into cells. Work is
split into **two separate tasks** the user picks first:

- **Machines** — production logging (**date, material, quantities**) on the PUL-32 / PUL-25 /
  Sieving tabs.
- **Logistics** — truck / tempo movement (**date, vehicle number, transporter, material, movement, IN-time, OUT-time**)
  on the Logistics tab.

The operator picks the task, fills the task-specific fields, and hits save. The entry is appended
as a new row to the matching Google Sheet tab via a **Google Apps Script Web App**, and mirrored to
a local history on the device. It can write to **two Google accounts / sheets at once** (dual-email
sync) so the same record lands in both the operator's book and the owner's book.

**One-line pitch:** *A phone-home-screen button that turns a stock count or a truck's IN/OUT into a Google Sheets row.*

---

## 2. Problem statement

Small manufacturing / materials operations (the concrete driver here is a grinding/sieving unit
tracking materials like *9T, 5T, Chamak, UC4, Putha*) record production **and truck movement** by
hand and later re-type it into spreadsheets. That is slow, error-prone, and easy to skip. Owners
want the numbers in Google Sheets — where they already do their accounting — but the person on the
floor or at the gate shouldn't have to fight the Sheets mobile UI, log into the right account, or
find the right tab and column.

**StockLog removes the friction:** open app → **pick the task** → fill the task's fields → save.
The row appears in the correct Google Sheet tab, on both accounts, formatted and in the right
columns. Production and logistics stay cleanly separated as two different workflows.

---

## 3. Target users

| User | Need | How StockLog serves them |
|------|------|--------------------------|
| **Floor operator / data-entry staff** | Log production quickly on a phone, offline-tolerant, no login friction | **Machines** task: home-screen PWA, big tap targets, material chips, works from one screen |
| **Gate / logistics staff** | Note a truck's vehicle number, transporter, direction and IN/OUT times as it arrives and leaves | **Logistics** task: vehicle number, transporter (with an "SGL" quick-pick), an In/Out movement toggle + time pickers, same one-screen flow |
| **Business owner** | See the same data in *their own* Google Sheet, in real time | Dual-email sync — a second account/sheet receives every row simultaneously |
| **Whoever sets it up (technical-ish)** | Point the app at their sheets without a backend | Settings dialog with copy-paste Apps Script, `.env` config, no server to run |

Primary usage context: **mobile, one-handed, possibly spotty connectivity.** Desktop is supported
but secondary.

---

## 4. Goals & non-goals

### Goals
- Let the user **pick between two clearly separated tasks** (Machines / Logistics) up front, then
  show only that task's flow.
- Capture an entry in **under 10 seconds** with minimal typing.
- Append rows to Google Sheets **reliably**, with clear success/failure feedback.
- Support **multiple sheet types** with different column shapes across both tasks (see §6).
- **Dual-account** simultaneous write, tolerating partial failure.
- Be **installable** and feel native (home-screen icon, standalone display).
- Keep a **local record** so nothing is lost if a sync fails or the user is offline.
- Require **no dedicated backend** — Google Apps Script is the write mechanism.

### Non-goals (current version)
- ❌ User accounts / authentication inside the app.
- ❌ Editing or deleting rows already in Google Sheets (local log entries can be deleted; the sheet row cannot from here).
- ❌ Reading / reporting / charting data back *from* the sheet.
- ❌ Multi-device sync of the local log or config (config lives in `.env` / this device's `localStorage`).
- ❌ Real-time collaboration or a shared server database.

---

## 5. Core features (current status)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| F0 | **Task selection** (Machines vs Logistics) | ✅ Shipped | Step 1 chooses the task; the flow (Step 2 + fields) adapts. Production and logistics kept separate. |
| F1 | **Machines multi-sheet entry** (PUL-32, PUL-25, Sieving) | ✅ Shipped | Step 2 segmented control switches active machine sheet; columns change per sheet |
| F1b | **Logistics entry** (vehicle no + transporter + movement + IN/OUT times + material) | ✅ Shipped | Own tab `Logistics`; vehicle number auto-uppercased and required; transporter free-text with an "SGL" quick-pick; required movement toggle defaults to **None** until the user chooses In or Out; `type="time"` pickers for both IN and OUT are required |
| F2 | **Material selection** — quick-select chips + read-only input | ✅ Shipped | Materials chosen via quick-select chips; a read-only input reflects the selection; all materials (incl. predefined) can be deleted via a confirmation dialog; persisted in `localStorage`; shared by both tasks |
| F3 | **Date entry** with `dd-MMM-yyyy` display | ✅ Shipped | Defaults to today (`todayISO()`) |
| F4 | **Append row to Google Sheets** via Apps Script | ✅ Shipped | Same-origin `/api/sheets` proxy → Apps Script Web App; row shape per `sheetName` |
| F5 | **Dual-email simultaneous sync** | ✅ Shipped | Account 1 + Account 2; `Promise.allSettled` with retry |
| F6 | **Partial-failure handling** + toast feedback | ✅ Shipped | Reports "synced to N of M sheets" |
| F7 | **Local recent log** (history) | ✅ Shipped | `localStorage`, capped at 100, shows latest 20, filterable by sheet (incl. Logistics) |
| F8 | **Delete / clear log entries** (local only) | ✅ Shipped | Confirmation dialog |
| F9 | **Synced / failed / dual-synced badges** | ✅ Shipped | Per-entry sync state stored on `LogEntry` |
| F10 | **Settings dialog** with embedded Apps Script code + copy | ✅ Shipped | Guides dual-account setup |
| F11 | **PWA install** + download prebuilt app | ✅ Shipped | `.apk` on mobile UA, `.zip` on desktop; `beforeinstallprompt` |
| F12 | **SSR error handling / hardening** | ✅ Shipped | CSRF + error middleware, SSR error normalization |

---

## 6. Domain model (tasks, sheets, and entries)

A **task** is the top-level choice, defined in [`src/lib/stocklog.ts`](../src/lib/stocklog.ts) as
`TaskType = "Machines" | "Logistics"`. Each task maps to one or more Google Sheet tabs:

**Machines** (production) — three sheet types (`MACHINE_SHEETS`):
- **PUL-32** — columns: `Date, Material, Qty-40, Qty-25, Qty-20`
- **PUL-25** — columns: `Date, Material, Qty-40, Qty-25, Qty-20`
- **Sieving** — columns: `Date, Material, 1-No, 2-No, 3-No, 4-No`

**Logistics** (truck / tempo movement) — one sheet tab:
- **Logistics** — columns: `Date, Vehicle No, Transporter Name, Material, Movement, In-Time, Out-Time`

`taskForSheet(sheet)` maps any tab back to its task. The selected task decides whether the machine-
sheet picker (Step 2) shows and which fields the form renders; the resolved `targetSheet` decides
which columns the row fills. The Apps Script auto-creates the correct header row per tab on an empty
sheet.

**Predefined materials:** `9T, 5T, 3T, 20T, Chamak, UC4, Putha, CB-DN, CB-PW, Pen`
(users can add their own; the merged set is deduplicated). Materials are shared by both tasks — for
Logistics the material is *what the truck carried*. Material is selected via **quick-select chips**
and shown in a **read-only input**; any material (including predefined) can be removed from the
list via a **confirmation dialog**. **Predefined transporters:** `SGL` — a one-tap
quick-pick on the Logistics form; the transporter field itself is free text.

A **log entry** carries: `id, task, sheetName, date, material`, the relevant quantity fields
(Machines) **or** `vehicleNo, transporter, movement, inTime, outTime` (Logistics), plus `synced` and
`syncedCount` (how many of the configured accounts accepted the row).

---

## 7. Key user stories

1. *As an operator*, I open StockLog from my home screen, keep the **Machines** task, tap
   **PUL-32**, tap **Chamak**, type the three quantities, and press **Append Row** — a row appears
   in Google Sheets and in my recent log, and I get a green toast.
2. *As gate staff*, a tempo arrives; I switch to the **Logistics** task, type its number plate,
   tap the **SGL** transporter chip, set **Movement** to **In** (arrived) or **Out** (sent), set the
   **In-Time** and **Out-Time**, choose the material it brought, and save. The movement field
   starts at **None** and is required, and the vehicle number is required before the save can happen.
   Both rows land on the Logistics tab, kept separate from production numbers.
3. *As an operator*, I need to log a material that isn't in the list, so I type it into the
   material manager and it's saved as a chip for next time.
4. *As an owner*, every entry the operator or gate staff logs also lands in **my** Google Sheet
   because Account 2 is configured — I never touch the app.
5. *As an operator with bad signal*, my save fails to reach one account; I still see the entry in
   my local log marked as partially synced, and a toast tells me exactly what happened.
6. *As the setup person*, I open Settings, copy the Apps Script, paste it into
   script.google.com, deploy it, and paste the URL + Sheet ID back — no server, no build step.

---

## 8. Success metrics

- **Time-to-log** ≤ 10 s from app open to confirmed row.
- **Sync success rate** — % of submits that reach *all* configured endpoints (visible via toasts).
- **Zero data loss** — every submit is written to the local log regardless of sync outcome.
- **Install rate** — operators using the installed PWA vs. the browser tab.

---

## 9. Constraints & assumptions

- Google Sheets is the **system of record**; the app is a fast write client, not a database.
- The Apps Script Web App must be deployed **"Execute as: Me"** and **"Who has access: Anyone"**
  for anonymous server-side calls to succeed (enforced by the error messaging in `stocklog.ts`).
- Config (script URLs, sheet IDs) is provided via **`.env` (`VITE_*`)** or the **Settings dialog**
  (stored in `localStorage`). Env values take precedence.
- Sensitive values (Apps Script URLs, Sheet IDs) **must never be committed** — see
  [`Rules.md`](./Rules.md).

---

## 10. Related documents

- [`Architecture.md`](./Architecture.md) — how it's built and how data flows.
- [`Rules.md`](./Rules.md) — engineering boundaries and conventions.
- [`Phases.md`](./Phases.md) — build phases and what's next.
- [`Design.md`](./Design.md) — colors, type, and visual system.
- [`Memory.md`](./Memory.md) — running progress log for AI/dev continuity.
