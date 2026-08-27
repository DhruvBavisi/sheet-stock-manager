# Graph Report - sheet-stock-manager-main  (2026-08-27)

## Corpus Check
- Corpus is ~19,375 words - fits in a single context window. You may not need a graph.

## Summary
- 585 nodes · 955 edges · 79 communities (32 shown, 47 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.83)
- Token cost: 158,582 input · 0 output

## Community Hubs (Navigation)
- Lint & Dev Dependencies
- UI: Dialog, Select, Badge
- UI: Sidebar & Input
- UI: Card, Avatar, Context Menu
- App Core: Routing & Sheets Sync
- TypeScript & Vite Config
- UI: Alert Dialog & Delete Entry
- UI: Checkbox, Popover, Radio
- Server Entry & Error Handling
- shadcn Components Config
- UI: Menubar
- UI: Form & Label
- UI: Carousel
- Runtime Deps (cmdk, lucide)
- App Icon Imagery (PWA)
- UI: Chart (Recharts)
- UI: Command Palette
- Project Architecture Concepts
- UI: Sheet
- UI: Table
- UI: Breadcrumb
- UI: Drawer
- UI: Navigation Menu
- UI: Toggle Group
- UI: Alert
- UI: Input OTP
- Favicon Imagery
- UI: Accordion
- Dep: class-variance-authority
- Dep: clsx
- Dep: date-fns
- Dep: embla-carousel-react
- Dep: @hookform/resolvers
- Dep: input-otp
- Dep: @radix-ui/react-accordion
- Dep: @radix-ui/react-alert-dialog
- Dep: @radix-ui/react-aspect-ratio
- Dep: @radix-ui/react-avatar
- Dep: @radix-ui/react-collapsible
- Dep: @radix-ui/react-context-menu
- Dep: @radix-ui/react-dialog
- Dep: @radix-ui/react-dropdown-menu
- Dep: @radix-ui/react-hover-card
- Dep: @radix-ui/react-label
- Dep: @radix-ui/react-menubar
- Dep: @radix-ui/react-navigation-menu
- Dep: @radix-ui/react-popover
- Dep: @radix-ui/react-radio-group
- Dep: @radix-ui/react-scroll-area
- Dep: @radix-ui/react-select
- Dep: @radix-ui/react-separator
- Dep: @radix-ui/react-slider
- Dep: @radix-ui/react-slot
- Dep: @radix-ui/react-switch
- Dep: @radix-ui/react-tabs
- Dep: @radix-ui/react-toggle
- Dep: @radix-ui/react-toggle-group
- Dep: @radix-ui/react-tooltip
- Dep: react-day-picker
- Dep: react-dom
- Dep: react-hook-form
- Dep: react-resizable-panels
- Dep: recharts
- Dep: tailwind-merge
- Dep: tailwindcss
- Dep: @tailwindcss/vite
- Dep: @tanstack/react-query
- Dep: @tanstack/react-router
- Dep: @tanstack/react-start
- Dep: @tanstack/router-plugin
- Dep: tw-animate-css
- Dep: vaul
- Dep: vite-tsconfig-paths
- Dep: zod
- Service Worker (sw.js)

## God Nodes (most connected - your core abstractions)
1. `cn()` - 220 edges
2. `compilerOptions` - 22 edges
3. `Index()` - 11 edges
4. `buttonVariants` - 9 edges
5. `scripts` - 7 edges
6. `Button` - 7 edges
7. `aliases` - 6 edges
8. `renderErrorPage()` - 6 edges
9. `StockLog (Sheet Stock Manager)` - 6 edges
10. `Sheet Stock Manager App Icon (192px)` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Sheet Stock Manager (project marker)` --references--> `StockLog (Sheet Stock Manager)`  [INFERRED]
  AGENTS.md → README.md
- `Crawler Access Policy` --conceptually_related_to--> `StockLog (Sheet Stock Manager)`  [INFERRED]
  public/robots.txt → README.md
- `StockLog (Sheet Stock Manager)` --conceptually_related_to--> `TanStack Start`  [INFERRED]
  README.md → src/routes/README.md
- `AccordionItem` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/accordion.tsx → src/lib/utils.ts
- `AccordionTrigger` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/accordion.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Stock Logging Data Flow (App to Sheets via Apps Script)** — readme_stocklog, readme_google_apps_script, readme_google_sheets [EXTRACTED 0.95]

## Communities (79 total, 47 thin omitted)

### Community 0 - "Lint & Dev Dependencies"
Cohesion: 0.04
Nodes (44): eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, nitro (+36 more)

### Community 1 - "UI: Dialog, Select, Badge"
Cohesion: 0.09
Nodes (35): Badge(), BadgeProps, badgeVariants, DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay (+27 more)

### Community 2 - "UI: Sidebar & Input"
Cohesion: 0.07
Nodes (32): Input, Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup (+24 more)

### Community 3 - "UI: Card, Avatar, Context Menu"
Cohesion: 0.10
Nodes (31): Avatar, AvatarFallback, AvatarImage, Card, CardContent, CardDescription, CardFooter, CardHeader (+23 more)

### Community 4 - "App Core: Routing & Sheets Sync"
Cohesion: 0.09
Nodes (24): Toaster(), ToasterProps, AppendRowPayload, SyncEndpoint, getRouter(), retry(), Route, sendToEndpoint() (+16 more)

### Community 5 - "TypeScript & Vite Config"
Cohesion: 0.06
Nodes (31): DOM, DOM.Iterable, ES2022, eslint.config.js, src/**/*.ts, src/**/*.tsx, vite/client, vite.config.ts (+23 more)

### Community 6 - "UI: Alert Dialog & Delete Entry"
Cohesion: 0.12
Nodes (24): DeleteEntryDialog(), DeleteEntryDialogProps, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader() (+16 more)

### Community 7 - "UI: Checkbox, Popover, Radio"
Cohesion: 0.08
Nodes (13): Checkbox, HoverCardContent, PopoverContent, Progress, RadioGroup, RadioGroupItem, ResizableHandle(), ResizablePanelGroup() (+5 more)

### Community 8 - "Server Entry & Error Handling"
Cohesion: 0.16
Nodes (13): consumeLastCapturedError(), describeError(), describeStatus(), originalConsoleError, safeStringify(), renderErrorPage(), fetch(), getServerEntry() (+5 more)

### Community 9 - "shadcn Components Config"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 10 - "UI: Menubar"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 11 - "UI: Form & Label"
Cohesion: 0.19
Nodes (12): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+4 more)

### Community 12 - "UI: Carousel"
Cohesion: 0.19
Nodes (13): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+5 more)

### Community 13 - "Runtime Deps (cmdk, lucide)"
Cohesion: 0.15
Nodes (13): cmdk, lucide-react, dependencies, cmdk, lucide-react, @radix-ui/react-checkbox, @radix-ui/react-progress, react (+5 more)

### Community 14 - "App Icon Imagery (PWA)"
Cohesion: 0.23
Nodes (12): Sheet Stock Manager App Icon (192px), Clipboard Motif, Flat Material Long-Shadow Style, PWA Home-Screen Icon Role, Green Plant Sprout Motif, Sheet Stock Manager Application, Sheet Stock Manager App Icon (512px), Clipboard (record / inventory sheet) (+4 more)

### Community 15 - "UI: Chart (Recharts)"
Cohesion: 0.25
Nodes (9): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, getPayloadConfigFromPayload(), THEMES (+1 more)

### Community 16 - "UI: Command Palette"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 17 - "Project Architecture Concepts"
Cohesion: 0.25
Nodes (9): Sheet Stock Manager (project marker), Crawler Access Policy, Google Apps Script, Google Sheets, Progressive Web App (PWA), StockLog (Sheet Stock Manager), File-Based Routing, Root Layout (__root.tsx) (+1 more)

### Community 18 - "UI: Sheet"
Cohesion: 0.25
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 19 - "UI: Table"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 20 - "UI: Breadcrumb"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 21 - "UI: Drawer"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 22 - "UI: Navigation Menu"
Cohesion: 0.29
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 23 - "UI: Toggle Group"
Cohesion: 0.43
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 24 - "UI: Alert"
Cohesion: 0.50
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 25 - "UI: Input OTP"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 26 - "Favicon Imagery"
Cohesion: 0.83
Nodes (4): Clipboard / Notepad, Sheet Stock Manager Favicon, Green Leaf Sprout, Stock / Inventory Management

### Community 27 - "UI: Accordion"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

## Ambiguous Edges - Review These
- `Green Plant Sprout Motif` → `Sheet Stock Manager Application`  [AMBIGUOUS]
  public/icons/icon-192.png · relation: conceptually_related_to

## Knowledge Gaps
- **168 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `css` (+163 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **47 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Green Plant Sprout Motif` and `Sheet Stock Manager Application`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `cn()` connect `UI: Card, Avatar, Context Menu` to `UI: Dialog, Select, Badge`, `UI: Sidebar & Input`, `UI: Alert Dialog & Delete Entry`, `UI: Checkbox, Popover, Radio`, `UI: Menubar`, `UI: Form & Label`, `UI: Carousel`, `UI: Chart (Recharts)`, `UI: Command Palette`, `UI: Sheet`, `UI: Table`, `UI: Breadcrumb`, `UI: Drawer`, `UI: Navigation Menu`, `UI: Toggle Group`, `UI: Alert`, `UI: Input OTP`, `UI: Accordion`?**
  _High betweenness centrality (0.279) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Runtime Deps (cmdk, lucide)` to `Lint & Dev Dependencies`, `Dep: class-variance-authority`, `Dep: clsx`, `Dep: date-fns`, `Dep: embla-carousel-react`, `Dep: @hookform/resolvers`, `Dep: input-otp`, `Dep: @radix-ui/react-accordion`, `Dep: @radix-ui/react-alert-dialog`, `Dep: @radix-ui/react-aspect-ratio`, `Dep: @radix-ui/react-avatar`, `Dep: @radix-ui/react-collapsible`, `Dep: @radix-ui/react-context-menu`, `Dep: @radix-ui/react-dialog`, `Dep: @radix-ui/react-dropdown-menu`, `Dep: @radix-ui/react-hover-card`, `Dep: @radix-ui/react-label`, `Dep: @radix-ui/react-menubar`, `Dep: @radix-ui/react-navigation-menu`, `Dep: @radix-ui/react-popover`, `Dep: @radix-ui/react-radio-group`, `Dep: @radix-ui/react-scroll-area`, `Dep: @radix-ui/react-select`, `Dep: @radix-ui/react-separator`, `Dep: @radix-ui/react-slider`, `Dep: @radix-ui/react-slot`, `Dep: @radix-ui/react-switch`, `Dep: @radix-ui/react-tabs`, `Dep: @radix-ui/react-toggle`, `Dep: @radix-ui/react-toggle-group`, `Dep: @radix-ui/react-tooltip`, `Dep: react-day-picker`, `Dep: react-dom`, `Dep: react-hook-form`, `Dep: react-resizable-panels`, `Dep: recharts`, `Dep: tailwind-merge`, `Dep: tailwindcss`, `Dep: @tailwindcss/vite`, `Dep: @tanstack/react-query`, `Dep: @tanstack/react-router`, `Dep: @tanstack/react-start`, `Dep: @tanstack/router-plugin`, `Dep: tw-animate-css`, `Dep: vaul`, `Dep: vite-tsconfig-paths`, `Dep: zod`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _168 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Lint & Dev Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `UI: Dialog, Select, Badge` be split into smaller, more focused modules?**
  _Cohesion score 0.09191583610188261 - nodes in this community are weakly interconnected._
- **Should `UI: Sidebar & Input` be split into smaller, more focused modules?**
  _Cohesion score 0.06827880512091039 - nodes in this community are weakly interconnected._