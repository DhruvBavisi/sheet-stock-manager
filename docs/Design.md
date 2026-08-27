# Design — StockLog

> The visual system: colors, theme, radius, typography, components, and layout.
> All values below are the real tokens from [`src/styles.css`](../src/styles.css).
> Last updated: 2026-08-27.

---

## 1. Principles

- **Mobile-first, one-handed.** The primary device is a phone on a factory floor. Large tap targets,
  a single scrollable screen, thumb-reachable actions.
- **Card-based, calm, high-contrast.** White cards on a near-white background, blue accents, clear
  labels. Nothing decorative competes with the numbers.
- **Semantic tokens over raw colors.** Components use `bg-primary`, `text-foreground`, `border-input`
  etc. — never hex. **All colors are `oklch`** (mandated in `styles.css`).

---

## 2. Color system (oklch)

Tailwind v4 CSS-first theming: `:root` holds light values, `.dark` holds dark values, and
`@theme inline` maps each `--<name>` to a `--color-<name>` utility (`bg-*`, `text-*`, `border-*`).

### Core — light (`:root`)

| Token | oklch | Use |
|-------|-------|-----|
| `--background` | `0.985 0.005 250` | app background (near-white, faint blue) |
| `--foreground` | `0.20 0.05 260` | body text (near-black blue) |
| `--card` / `--popover` | `1 0 0` | pure white surfaces |
| **`--primary`** | **`0.52 0.22 255`** | **brand blue** — primary buttons, active states, `--ring` |
| `--primary-foreground` | `1 0 0` | text on primary (white) |
| `--secondary` | `0.95 0.03 250` | subtle blue-tint fill |
| `--secondary-foreground` | `0.32 0.12 255` | text on secondary |
| `--muted` | `0.965 0.015 250` | muted surface |
| `--muted-foreground` | `0.48 0.05 255` | secondary text |
| `--accent` | `0.92 0.05 250` | hover/accent fill |
| `--accent-foreground` | `0.25 0.14 255` | text on accent |
| `--destructive` | `0.58 0.2 27` | delete/error (red) |
| `--border` / `--input` | `0.92 0.02 250` | borders & input outlines |
| `--ring` | `0.52 0.22 255` | focus ring (= primary) |

### Core — dark (`.dark`)

| Token | oklch |
|-------|-------|
| `--background` | `0.14 0.04 255` (deep blue-black) |
| `--foreground` | `0.98 0.005 250` |
| `--card` / `--popover` | `0.18 0.04 255` |
| **`--primary`** | **`0.62 0.22 250`** (brighter blue) |
| `--destructive` | `0.65 0.2 25` |
| `--border` / `--input` | `0.26 0.03 255` |
| `--ring` | `0.62 0.22 250` |

### Charts (both modes)
Blue→purple ramp for `recharts`: `chart-1` blue `0.52 0.22 255` → `chart-5` purple `0.55 0.20 280`
(dark mode brightens each). Sidebar tokens mirror the core palette.

**Rule:** to add a color, define it in **both** `:root` and `.dark`, then register
`--color-<name>: var(--<name>)` in `@theme inline`. Never introduce hex/rgb/hsl.

---

## 3. PWA / brand chrome

- **`theme_color` / `background_color`: `#0d3b3f`** — a **dark teal** used for the manifest,
  the browser status bar (`<meta name="theme-color">`), and the PWA splash. Set in
  `public/manifest.webmanifest` and `__root.tsx`.
- **App icon:** a teal rounded square with a white clipboard/notepad and a **green leaf sprout**
  motif (192 & 512, `any` + `maskable`).

> ⚠️ **Known brand inconsistency:** the in-app UI primary is **blue** (`oklch(0.52 0.22 255)`),
> while the PWA chrome and icon are **teal + green** (`#0d3b3f`). This is intentional to note, not
> yet reconciled — see [`Phases.md`](./Phases.md) Phase 8. Pick one direction before treating either
> as "the brand color."

---

## 4. Radius & shape

Base **`--radius: 0.75rem`**, with a derived scale:

| Token | Value |
|-------|-------|
| `--radius-sm` | `radius − 4px` |
| `--radius-md` | `radius − 2px` |
| `--radius-lg` | `radius` (0.75rem) |
| `--radius-xl` | `radius + 4px` |
| `--radius-2xl` | `radius + 8px` |
| `--radius-3xl` / `--radius-4xl` | `+12px` / `+16px` |

In practice the UI leans on **`rounded-xl` / `rounded-2xl`** for cards, inputs, chips, and buttons —
soft, friendly, touch-oriented.

---

## 5. Typography

- **Font family:** *none is defined.* There is no `@font-face`, no font `<link>`, and no `--font`
  token — the app renders in **Tailwind v4's default system font stack** (the OS UI sans-serif:
  Segoe UI / San Francisco / Roboto, etc.). This is fast and native-feeling but means there is **no
  custom brand typeface** today.
- **Scale:** Tailwind text utilities — `text-xs`/`text-sm` for labels and log rows, `text-base` for
  inputs, `text-lg`/`text-xl` for headings, with `font-medium`/`font-semibold`/`font-bold` for
  emphasis. `tracking-tight` on headings.
- **If a brand font is wanted:** add it via a font `<link>` in `__root.tsx` head + a `--font-sans`
  token, and set it once in `@theme`. (Backlog — see Phase 8.)

---

## 6. Components & feedback

- **Component library:** shadcn/ui (46 components in `src/components/ui/`) on **Radix UI** — dialogs,
  selects, popovers, badges, cards, alert-dialog, etc. Compose these; don't hand-roll.
- **Icons:** `lucide-react` (e.g. `ClipboardList` in the header).
- **Toasts:** `sonner` — `<Toaster richColors position="top-center" />` mounted in `__root.tsx`.
  Use `toast.success` (synced) and `toast.error` (failed / partial).
- **Class merging:** always via `cn()` (`src/lib/utils.ts`).
- **Status colors:** success reads as green/emerald, failure via `--destructive` red, partial via an
  amber/warning tone — used on per-entry sync badges in the log.

---

## 7. Layout

- **Container:** centered, ~`max-w-3xl`, generous vertical spacing.
- **Sticky header:** clipboard icon + "StockLog" title, stays pinned while the log scrolls.
- **Step 1 · task selector:** a 2-up segmented control (Machines / Logistics) with `Factory` /
  `Truck` icons; the active task chip shows the current choice.
- **Step 2 · machine-sheet selector:** a 3-up control (PUL-32 / PUL-25 / Sieving) shown **only** for
  the Machines task; hidden entirely for Logistics.
- **Entry card:** header reads "New Entry for `{targetSheet}`". Material chips (quick-select) →
  **task-specific fields**: quantity inputs per machine sheet, or (Logistics) a vehicle/number-plate
  input + In-Time / Out-Time `type="time"` pickers → date → Append.
- **Materials manager:** add/remove custom material chips (shared by both tasks).
- **Recent log:** latest 20 entries as cards with date, material, and either quantities or
  vehicle/In/Out; a sync badge; filter by sheet (incl. Logistics); delete via confirmation dialog.
- **Settings dialog:** dual-account setup guide + copyable Apps Script code.

---

## 8. Accessibility

- Focus rings via `--ring` (= primary); inputs use `--input` borders.
- Radix primitives provide keyboard nav, focus management, and ARIA semantics out of the box.
- High foreground/background contrast in both light and dark token sets.

---

## 9. Known design issues (honest list)

1. **Blue vs. teal brand split** — UI primary is blue; PWA chrome/icon are teal+green (see §3).
2. **Dark mode not fully wired** — `.dark` tokens are complete, but the main screen
   (`src/routes/index.tsx`) uses some hard-coded light utilities (e.g. `bg-white`, `border-blue-100`,
   `text-slate-*`) rather than semantic tokens, so it doesn't fully switch to dark. Migrate those to
   tokens to enable true dark mode.
3. **No brand typeface** — relies on the system stack (see §5).

These are tracked in [`Phases.md`](./Phases.md) Phase 8.
