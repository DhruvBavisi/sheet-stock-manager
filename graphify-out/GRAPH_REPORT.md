# Graph Report - sheet-stock-manager-main  (2026-08-27)

## Corpus Check
- 77 files · ~27,678 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 664 nodes · 1044 edges · 80 communities (33 shown, 47 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `075ae658`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- devDependencies
- index.tsx
- sidebar.tsx
- cn
- routeTree.gen.ts
- compilerOptions
- utils.ts
- Phases — StockLog
- Design — StockLog
- components.json
- menubar.tsx
- form.tsx
- carousel.tsx
- dependencies
- Sheet Stock Manager App Icon (192px)
- chart.tsx
- command.tsx
- StockLog (Sheet Stock Manager)
- sheet.tsx
- table.tsx
- breadcrumb.tsx
- drawer.tsx
- navigation-menu.tsx
- toggle-group.tsx
- alert.tsx
- input-otp.tsx
- Sheet Stock Manager Favicon
- PRD — StockLog (Sheet Stock Manager)
- class-variance-authority
- clsx
- date-fns
- embla-carousel-react
- @hookform/resolvers
- input-otp
- @radix-ui/react-accordion
- @radix-ui/react-alert-dialog
- @radix-ui/react-aspect-ratio
- @radix-ui/react-avatar
- @radix-ui/react-collapsible
- @radix-ui/react-context-menu
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-hover-card
- @radix-ui/react-label
- @radix-ui/react-menubar
- @radix-ui/react-navigation-menu
- @radix-ui/react-popover
- @radix-ui/react-radio-group
- @radix-ui/react-scroll-area
- @radix-ui/react-select
- @radix-ui/react-separator
- @radix-ui/react-slider
- @radix-ui/react-slot
- @radix-ui/react-switch
- @radix-ui/react-tabs
- @radix-ui/react-toggle
- @radix-ui/react-toggle-group
- @radix-ui/react-tooltip
- react-day-picker
- react-dom
- react-hook-form
- react-resizable-panels
- recharts
- tailwind-merge
- tailwindcss
- @tailwindcss/vite
- @tanstack/react-query
- @tanstack/react-router
- @tanstack/react-start
- @tanstack/router-plugin
- tw-animate-css
- vaul
- vite-tsconfig-paths
- zod
- sw.js
- card.tsx

## God Nodes (most connected - your core abstractions)
1. `cn()` - 220 edges
2. `compilerOptions` - 22 edges
3. `Index()` - 11 edges
4. `PRD — StockLog (Sheet Stock Manager)` - 11 edges
5. `Phases — StockLog` - 11 edges
6. `Design — StockLog` - 10 edges
7. `buttonVariants` - 9 edges
8. `Memory — StockLog` - 9 edges
9. `Rules — StockLog` - 9 edges
10. `Architecture — StockLog` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Sheet Stock Manager (project marker)` --references--> `StockLog (Sheet Stock Manager)`  [INFERRED]
  AGENTS.md → README.md
- `Crawler Access Policy` --conceptually_related_to--> `StockLog (Sheet Stock Manager)`  [INFERRED]
  public/robots.txt → README.md
- `StockLog (Sheet Stock Manager)` --conceptually_related_to--> `TanStack Start`  [INFERRED]
  README.md → src/routes/README.md
- `AlertDialogOverlay` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/alert-dialog.tsx → src/lib/utils.ts
- `AlertTitle` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/alert.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Stock Logging Data Flow (App to Sheets via Apps Script)** — readme_stocklog, readme_google_apps_script, readme_google_sheets [EXTRACTED 0.95]

## Communities (80 total, 47 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.04
Nodes (44): eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, nitro (+36 more)

### Community 1 - "index.tsx"
Cohesion: 0.07
Nodes (46): Badge(), BadgeProps, badgeVariants, DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay (+38 more)

### Community 2 - "sidebar.tsx"
Cohesion: 0.07
Nodes (32): Input, Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup (+24 more)

### Community 3 - "cn"
Cohesion: 0.09
Nodes (34): AccordionContent, AccordionItem, AccordionTrigger, Avatar, AvatarFallback, AvatarImage, ContextMenuCheckboxItem, ContextMenuContent (+26 more)

### Community 4 - "routeTree.gen.ts"
Cohesion: 0.06
Nodes (31): Toaster(), ToasterProps, consumeLastCapturedError(), describeError(), describeStatus(), originalConsoleError, safeStringify(), renderErrorPage() (+23 more)

### Community 5 - "compilerOptions"
Cohesion: 0.06
Nodes (31): DOM, DOM.Iterable, ES2022, eslint.config.js, src/**/*.ts, src/**/*.tsx, vite/client, vite.config.ts (+23 more)

### Community 6 - "utils.ts"
Cohesion: 0.07
Nodes (31): DeleteEntryDialog(), DeleteEntryDialogProps, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader() (+23 more)

### Community 7 - "Phases — StockLog"
Cohesion: 0.05
Nodes (41): 1. High-level flow, 2. Technical stack, 3. Folder structure, 4. Key modules, 5. Rendering, deploy & config, 6. PWA architecture, 7. Commands, App shell & server plumbing (+33 more)

### Community 8 - "Design — StockLog"
Cohesion: 0.15
Nodes (13): 1. Principles, 2. Color system (oklch), 3. PWA / brand chrome, 4. Radius & shape, 5. Typography, 6. Components & feedback, 7. Layout, 8. Accessibility (+5 more)

### Community 9 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 10 - "menubar.tsx"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 11 - "form.tsx"
Cohesion: 0.19
Nodes (12): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+4 more)

### Community 12 - "carousel.tsx"
Cohesion: 0.19
Nodes (13): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+5 more)

### Community 13 - "dependencies"
Cohesion: 0.15
Nodes (13): cmdk, lucide-react, dependencies, cmdk, lucide-react, @radix-ui/react-checkbox, @radix-ui/react-progress, react (+5 more)

### Community 14 - "Sheet Stock Manager App Icon (192px)"
Cohesion: 0.23
Nodes (12): Sheet Stock Manager App Icon (192px), Clipboard Motif, Flat Material Long-Shadow Style, PWA Home-Screen Icon Role, Green Plant Sprout Motif, Sheet Stock Manager Application, Sheet Stock Manager App Icon (512px), Clipboard (record / inventory sheet) (+4 more)

### Community 15 - "chart.tsx"
Cohesion: 0.25
Nodes (9): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, getPayloadConfigFromPayload(), THEMES (+1 more)

### Community 16 - "command.tsx"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 17 - "StockLog (Sheet Stock Manager)"
Cohesion: 0.25
Nodes (9): Sheet Stock Manager (project marker), Crawler Access Policy, Google Apps Script, Google Sheets, Progressive Web App (PWA), StockLog (Sheet Stock Manager), File-Based Routing, Root Layout (__root.tsx) (+1 more)

### Community 18 - "sheet.tsx"
Cohesion: 0.25
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 19 - "table.tsx"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 20 - "breadcrumb.tsx"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 21 - "drawer.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 22 - "navigation-menu.tsx"
Cohesion: 0.29
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 23 - "toggle-group.tsx"
Cohesion: 0.43
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 24 - "alert.tsx"
Cohesion: 0.50
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 25 - "input-otp.tsx"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 26 - "Sheet Stock Manager Favicon"
Cohesion: 0.83
Nodes (4): Clipboard / Notepad, Sheet Stock Manager Favicon, Green Leaf Sprout, Stock / Inventory Management

### Community 27 - "PRD — StockLog (Sheet Stock Manager)"
Cohesion: 0.15
Nodes (13): 10. Related documents, 1. Overview, 2. Problem statement, 3. Target users, 4. Goals & non-goals, 5. Core features (current status), 6. Domain model (tasks, sheets, and entries), 7. Key user stories (+5 more)

### Community 79 - "card.tsx"
Cohesion: 0.29
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

## Ambiguous Edges - Review These
- `Green Plant Sprout Motif` → `Sheet Stock Manager Application`  [AMBIGUOUS]
  public/icons/icon-192.png · relation: conceptually_related_to

## Knowledge Gaps
- **228 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `css` (+223 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **47 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Green Plant Sprout Motif` and `Sheet Stock Manager Application`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `cn()` connect `cn` to `index.tsx`, `sidebar.tsx`, `utils.ts`, `menubar.tsx`, `form.tsx`, `carousel.tsx`, `card.tsx`, `chart.tsx`, `command.tsx`, `sheet.tsx`, `table.tsx`, `breadcrumb.tsx`, `drawer.tsx`, `navigation-menu.tsx`, `toggle-group.tsx`, `alert.tsx`, `input-otp.tsx`?**
  _High betweenness centrality (0.221) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `devDependencies`, `class-variance-authority`, `clsx`, `date-fns`, `embla-carousel-react`, `@hookform/resolvers`, `input-otp`, `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-avatar`, `@radix-ui/react-collapsible`, `@radix-ui/react-context-menu`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-hover-card`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-slot`, `@radix-ui/react-switch`, `@radix-ui/react-tabs`, `@radix-ui/react-toggle`, `@radix-ui/react-toggle-group`, `@radix-ui/react-tooltip`, `react-day-picker`, `react-dom`, `react-hook-form`, `react-resizable-panels`, `recharts`, `tailwind-merge`, `tailwindcss`, `@tailwindcss/vite`, `@tanstack/react-query`, `@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/router-plugin`, `tw-animate-css`, `vaul`, `vite-tsconfig-paths`, `zod`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _228 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `index.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06688311688311688 - nodes in this community are weakly interconnected._
- **Should `sidebar.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06827880512091039 - nodes in this community are weakly interconnected._