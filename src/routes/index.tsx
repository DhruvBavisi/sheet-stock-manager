import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ClipboardList,
  Download,
  Loader2,
  Plus,
  Settings,
  Trash2,
  Copy,
  ShieldCheck,
  Lock,
  Layers,
  FileSpreadsheet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { DeleteEntryDialog } from "@/components/delete-entry-dialog";
import {
  APPS_SCRIPT_CODE,
  SHEETS,
  PREDEFINED_MATERIALS,
  appendRow,
  formatDateDDMMMYYYY,
  loadConfig,
  loadLog,
  loadMaterials,
  saveConfig,
  saveLog,
  saveMaterials,
  todayISO,
  type AppConfig,
  type LogEntry,
  type SheetType,
} from "@/lib/stocklog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StockLog - Multi-Sheet Stock Manager" },
      {
        name: "description",
        content:
          "Record Date, Material, and sheet-specific quantities directly to PUL-32, PUL-25, or Sieving tabs in your Google Sheets.",
      },
      { property: "og:title", content: "StockLog - Multi-Sheet Stock Manager" },
      {
        property: "og:description",
        content: "Log PUL-32, PUL-25, and Sieving stock entries directly to Google Sheets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [activeSheet, setActiveSheet] = useState<SheetType>("PUL-32");
  const [materials, setMaterials] = useState<string[]>([...PREDEFINED_MATERIALS]);
  const [config, setConfig] = useState<AppConfig>({ scriptUrl: "", sheetId: "", sheetName: "PUL-32" });
  const [log, setLog] = useState<LogEntry[]>([]);
  const [material, setMaterial] = useState("");
  const [date, setDate] = useState(todayISO());

  // Fields for PUL-32 and PUL-25
  const [qty40, setQty40] = useState("");
  const [qty25, setQty25] = useState("");
  const [qty20, setQty20] = useState("");

  // Fields for Sieving
  const [qty1No, setQty1No] = useState("");
  const [qty2No, setQty2No] = useState("");
  const [qty3No, setQty3No] = useState("");
  const [qty4No, setQty4No] = useState("");

  const [newMaterial, setNewMaterial] = useState("");
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [logFilter, setLogFilter] = useState<"ALL" | SheetType>("ALL");

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<LogEntry | null>(null);
  const [isClearAll, setIsClearAll] = useState(false);

  const { canInstall, installed, promptInstall } = useInstallPrompt();

  const handleInstallApp = async () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const downloadFileName = isMobile ? "StockLog-Android.apk" : "StockLog-Desktop.zip";
    const downloadPath = `/downloads/${downloadFileName}`;

    const link = document.createElement("a");
    link.href = downloadPath;
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (canInstall) {
      promptInstall().catch(() => {});
    }

    toast.success(
      isMobile
        ? "Downloading StockLog Android App (.apk)..."
        : "Downloading StockLog Desktop Application Package (.zip)...",
    );
  };

  useEffect(() => {
    setMaterials(loadMaterials());
    setConfig(loadConfig());
    setLog(loadLog());
    setReady(true);
  }, []);

  const configured = useMemo(
    () => config.scriptUrl.trim().length > 0 && config.sheetId.trim().length > 0,
    [config],
  );

  const addMaterial = () => {
    const name = newMaterial.trim();
    if (!name) return;
    if (materials.some((m) => m.toLowerCase() === name.toLowerCase())) {
      toast.error("That material is already in the list");
      return;
    }
    const next = [...materials, name];
    setMaterials(next);
    saveMaterials(next);
    setMaterial(name);
    setNewMaterial("");
    toast.success(`Added "${name}"`);
  };

  const removeMaterial = (name: string) => {
    if (PREDEFINED_MATERIALS.includes(name as any)) {
      toast.error("Predefined materials cannot be removed");
      return;
    }
    const next = materials.filter((m) => m !== name);
    setMaterials(next);
    saveMaterials(next);
    if (material === name) setMaterial("");
  };

  const openDeleteSingleDialog = (e: LogEntry) => {
    setEntryToDelete(e);
    setIsClearAll(false);
    setDeleteDialogOpen(true);
  };

  const openClearAllDialog = () => {
    setEntryToDelete(null);
    setIsClearAll(true);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (isClearAll) {
      setLog([]);
      saveLog([]);
      toast.success("All recent entries cleared");
    } else if (entryToDelete) {
      const next = log.filter((item) => item.id !== entryToDelete.id);
      setLog(next);
      saveLog(next);
      toast.success(`Deleted entry for "${entryToDelete.material}"`);
    }
    setDeleteDialogOpen(false);
    setEntryToDelete(null);
  };

  const clearForm = () => {
    setQty40("");
    setQty25("");
    setQty20("");
    setQty1No("");
    setQty2No("");
    setQty3No("");
    setQty4No("");
  };

  const submit = async () => {
    if (!configured) {
      toast.error("Set VITE_APPS_SCRIPT_URL and VITE_GOOGLE_SHEET_ID in your .env file first");
      return;
    }
    if (!material) {
      toast.error("Select a material");
      return;
    }

    if (activeSheet === "Sieving") {
      if (!qty1No && !qty2No && !qty3No && !qty4No) {
        toast.error("Enter at least one quantity value (1-No, 2-No, 3-No, or 4-No)");
        return;
      }
    } else {
      if (!qty40 && !qty25 && !qty20) {
        toast.error("Enter at least one quantity value (Qty-40, Qty-25, or Qty-20)");
        return;
      }
    }

    const formattedDate = formatDateDDMMMYYYY(date);
    setSaving(true);

    const payload = {
      sheetName: activeSheet,
      date: formattedDate,
      material,
      ...(activeSheet === "Sieving"
        ? { qty1No, qty2No, qty3No, qty4No }
        : { qty40, qty25, qty20 }),
    };

    const entry: LogEntry = {
      id: crypto.randomUUID(),
      sheetName: activeSheet,
      date: formattedDate,
      material,
      ...(activeSheet === "Sieving"
        ? { qty1No, qty2No, qty3No, qty4No }
        : { qty40, qty25, qty20 }),
      synced: false,
    };

    try {
      await appendRow(config, payload);
      entry.synced = true;
      toast.success(`Appended ${material} entry to ${activeSheet} in Google Sheet (${formattedDate})`);
      clearForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reach the Apps Script");
    } finally {
      const next = [entry, ...log];
      setLog(next);
      saveLog(next);
      setSaving(false);
    }
  };

  const filteredLog = useMemo(() => {
    if (logFilter === "ALL") return log;
    return log.filter((e) => e.sheetName === logFilter);
  }, [log, logFilter]);

  return (
    <main className="min-h-screen bg-background pb-16">
      <header className="border-b border-border/60 bg-card/95 backdrop-blur sticky top-0 z-10 shadow-xs">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ClipboardList className="size-5" />
          </span>
          <div className="flex-1">
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              StockLog <Badge variant="outline" className="text-xs font-mono font-medium">Multi-Sheet</Badge>
            </h1>
            <p className="text-xs text-muted-foreground">Entries append to PUL-32, PUL-25, or Sieving sheets</p>
          </div>

          <Button
            size="sm"
            variant={installed ? "ghost" : "secondary"}
            className="gap-1.5 font-medium rounded-xl shadow-xs"
            onClick={handleInstallApp}
          >
            <Download className="size-4 text-primary" />
            <span className="hidden sm:inline">{installed ? "App Installed" : "Download App"}</span>
            <span className="sm:hidden">App</span>
          </Button>

          <SettingsDialog config={config} onSave={(c) => { setConfig(c); saveConfig(c); }} />
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-6 px-5 py-6">
        {ready && !configured && (
          <div className="rounded-xl border border-dashed border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive font-medium flex items-center gap-2">
            <Lock className="size-4 shrink-0" />
            <span>Please set <b>VITE_APPS_SCRIPT_URL</b> and <b>VITE_GOOGLE_SHEET_ID</b> in your <code>.env</code> file to enable Google Sheets sync.</span>
          </div>
        )}

        {/* Tab Selection */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="size-4 text-primary" /> Select Target Sheet
            </h2>
            <Badge variant="secondary" className="font-mono text-xs">
              Active: {activeSheet}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {SHEETS.map((s) => {
              const isActive = activeSheet === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSheet(s.id);
                    clearForm();
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/30"
                      : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60 font-medium"
                  }`}
                >
                  <FileSpreadsheet className={`size-5 mb-1 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm font-semibold">{s.label}</span>
                  {/* <span className="text-[10px] opacity-75 hidden sm:inline">{s.id === "Sieving" ? "4 Columns" : "3 Columns"}</span> */}
                </button>
              );
            })}
          </div>
        </section>

        {/* New Entry Form */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-foreground flex items-center gap-2">
              New Entry for <span className="text-primary font-black">{activeSheet}</span>
            </h2>
            <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded-md">{date}</span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-xs font-semibold">Date</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Material</Label>
                <Select value={material} onValueChange={setMaterial}>
                  <SelectTrigger className="w-full rounded-xl font-medium">
                    <SelectValue placeholder="Select a material" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {materials.map((m) => (
                      <SelectItem key={m} value={m} className="font-medium">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dynamic Column Inputs */}
            {activeSheet === "Sieving" ? (
              <div className="space-y-2 rounded-xl border border-border/80 bg-muted/20 p-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  Sieving Quantities (1-No, 2-No, 3-No, 4-No)
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="qty1No" className="text-xs text-muted-foreground font-medium">1-No</Label>
                    <Input
                      id="qty1No"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={qty1No}
                      onChange={(e) => setQty1No(e.target.value)}
                      className="rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="qty2No" className="text-xs text-muted-foreground font-medium">2-No</Label>
                    <Input
                      id="qty2No"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={qty2No}
                      onChange={(e) => setQty2No(e.target.value)}
                      className="rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="qty3No" className="text-xs text-muted-foreground font-medium">3-No</Label>
                    <Input
                      id="qty3No"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={qty3No}
                      onChange={(e) => setQty3No(e.target.value)}
                      className="rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="qty4No" className="text-xs text-muted-foreground font-medium">4-No</Label>
                    <Input
                      id="qty4No"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={qty4No}
                      onChange={(e) => setQty4No(e.target.value)}
                      className="rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 rounded-xl border border-border/80 bg-muted/20 p-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                  {activeSheet} Quantities (Qty-40, Qty-25, Qty-20)
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="qty40" className="text-xs text-muted-foreground font-medium">Qty-40</Label>
                    <Input
                      id="qty40"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={qty40}
                      onChange={(e) => setQty40(e.target.value)}
                      className="rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="qty25" className="text-xs text-muted-foreground font-medium">Qty-25</Label>
                    <Input
                      id="qty25"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={qty25}
                      onChange={(e) => setQty25(e.target.value)}
                      className="rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="qty20" className="text-xs text-muted-foreground font-medium">Qty-20</Label>
                    <Input
                      id="qty20"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={qty20}
                      onChange={(e) => setQty20(e.target.value)}
                      className="rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button className="h-12 w-full text-base font-semibold rounded-xl" onClick={submit} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {saving ? `Saving to ${activeSheet}...` : `Append Row to ${activeSheet}`}
            </Button>
          </div>
        </section>

        {/* Predefined Materials List & Manager */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Materials List
            </h2>
            <span className="text-xs text-muted-foreground">{materials.length} available</span>
          </div>

          <div className="mt-3 flex gap-2">
            <Input
              placeholder="Add custom material name"
              value={newMaterial}
              onChange={(e) => setNewMaterial(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMaterial()}
              className="rounded-xl"
            />
            <Button variant="secondary" onClick={addMaterial} className="rounded-xl font-medium shrink-0">
              <Plus className="size-4" /> Add
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {materials.map((m) => {
              const isPredefined = PREDEFINED_MATERIALS.includes(m as any);
              return (
                <span
                  key={m}
                  className={`inline-flex items-center gap-1.5 rounded-full border py-1 pl-3 pr-2 text-xs font-medium ${
                    isPredefined
                      ? "border-primary/30 bg-primary/5 text-primary"
                      : "border-border bg-muted/50 text-foreground"
                  }`}
                >
                  {m}
                  {!isPredefined && (
                    <button
                      aria-label={`Remove ${m}`}
                      onClick={() => removeMaterial(m)}
                      className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </section>

        {/* Recent Log Entries */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
                Recent Log History
              </h2>
              <Badge variant="secondary" className="text-xs font-mono">
                {filteredLog.length} {filteredLog.length === 1 ? "entry" : "entries"}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Select value={logFilter} onValueChange={(val) => setLogFilter(val as any)}>
                <SelectTrigger className="w-32 h-8 text-xs rounded-lg font-medium">
                  <SelectValue placeholder="Filter Sheet" />
                </SelectTrigger>
                <SelectContent className="rounded-xl text-xs">
                  <SelectItem value="ALL">All Sheets</SelectItem>
                  <SelectItem value="PUL-32">PUL-32</SelectItem>
                  <SelectItem value="PUL-25">PUL-25</SelectItem>
                  <SelectItem value="Sieving">Sieving</SelectItem>
                </SelectContent>
              </Select>

              {log.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1 rounded-lg"
                  onClick={openClearAllDialog}
                >
                  <Trash2 className="size-3.5" /> Clear
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {filteredLog.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No entries found for {logFilter === "ALL" ? "any sheet" : logFilter}.
              </p>
            )}
            {filteredLog.slice(0, 20).map((e) => (
              <div
                key={e.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-muted/20 text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant="outline" className="font-mono text-xs font-bold shrink-0">
                    {e.sheetName}
                  </Badge>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{e.material}</p>
                    <p className="text-xs text-muted-foreground">{e.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <div className="text-xs font-mono bg-background border border-border/80 px-2.5 py-1 rounded-lg">
                    {e.sheetName === "Sieving" ? (
                      <div className="flex gap-2 text-foreground">
                        {e.qty1No != null && e.qty1No !== "" && <span>1-No: <b>{e.qty1No}</b></span>}
                        {e.qty2No != null && e.qty2No !== "" && <span>2-No: <b>{e.qty2No}</b></span>}
                        {e.qty3No != null && e.qty3No !== "" && <span>3-No: <b>{e.qty3No}</b></span>}
                        {e.qty4No != null && e.qty4No !== "" && <span>4-No: <b>{e.qty4No}</b></span>}
                      </div>
                    ) : (
                      <div className="flex gap-2 text-foreground">
                        {e.qty40 != null && e.qty40 !== "" && <span>Q40: <b>{e.qty40}</b></span>}
                        {e.qty25 != null && e.qty25 !== "" && <span>Q25: <b>{e.qty25}</b></span>}
                        {e.qty20 != null && e.qty20 !== "" && <span>Q20: <b>{e.qty20}</b></span>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={e.synced ? "secondary" : "destructive"} className="text-[10px] rounded-lg shrink-0">
                      {e.synced ? "Synced" : "Failed"}
                    </Badge>
                    <button
                      onClick={() => openDeleteSingleDialog(e)}
                      title="Delete this entry"
                      className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <DeleteEntryDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entry={entryToDelete}
        isClearAll={isClearAll}
        totalEntriesCount={log.length}
        onConfirmDelete={confirmDelete}
      />
    </main>
  );
}

function SettingsDialog({
  config,
  onSave,
}: {
  config: AppConfig;
  onSave: (c: AppConfig) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="outline" aria-label="Settings" className="rounded-xl">
          <Settings className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground font-bold">
            <ShieldCheck className="size-5 text-emerald-500" />
            Google Sheets connection
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Your connection details are encrypted & loaded securely from your project <b>.env</b> file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Separator />

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 font-medium">
            <b>Important Update Notice:</b> Please update your Google Apps Script code with the new code below to support <b>PUL-32</b>, <b>PUL-25</b>, and <b>Sieving</b> sheets and their specific column structures.
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Updated Apps Script backend code</Label>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1"
                onClick={() => {
                  navigator.clipboard.writeText(APPS_SCRIPT_CODE);
                  toast.success("Apps Script code copied!");
                }}
              >
                <Copy className="size-3.5" /> Copy Code
              </Button>
            </div>
            <pre className="max-h-56 overflow-auto rounded-lg bg-muted/80 p-3 text-[11px] leading-relaxed font-mono border border-border">
              <code>{APPS_SCRIPT_CODE}</code>
            </pre>
            <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
              <li>Open <b>script.google.com</b> and select your project.</li>
              <li>Paste the updated code above into <code>Code.gs</code> and click save.</li>
              <li>
                Click <b>Deploy → New deployment</b> (or Manage deployments → Edit → New version) → Web app → Execute as <b>Me</b>, access <b>Anyone</b>.
              </li>
              <li>Ensure your Web App URL is set in your <code>.env</code> file as <code>VITE_APPS_SCRIPT_URL</code>.</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


