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
  Check,
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
    <main className="min-h-screen bg-background pb-20">
      {/* Spacious Mobile Header */}
      <header className="border-b border-blue-100 bg-white/95 backdrop-blur sticky top-0 z-20 shadow-xs">
        <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 shrink-0">
                <ClipboardList className="size-5" />
              </span>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2 truncate">
                  StockLog
                  <span className="hidden sm:inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-primary border border-blue-200">
                    White & Blue
                  </span>
                </h1>
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                  Google Sheet Stock Manager
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant={installed ? "ghost" : "secondary"}
                className="h-9 px-3 rounded-xl gap-1.5 font-semibold text-xs border border-blue-100 bg-blue-50/80 text-primary hover:bg-blue-100/80"
                onClick={handleInstallApp}
              >
                <Download className="size-4" />
                <span className="hidden sm:inline">{installed ? "App Installed" : "Download App"}</span>
              </Button>

              <SettingsDialog config={config} onSave={(c) => { setConfig(c); saveConfig(c); }} />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-5 px-4 sm:px-6 py-5">
        {ready && !configured && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs sm:text-sm text-amber-900 font-medium flex items-start sm:items-center gap-3 shadow-xs">
            <Lock className="size-4 shrink-0 text-amber-600 mt-0.5 sm:mt-0" />
            <span>Please set <b>VITE_APPS_SCRIPT_URL</b> and <b>VITE_GOOGLE_SHEET_ID</b> in your <code>.env</code> file to enable Google Sheets sync.</span>
          </div>
        )}

        {/* Sheet Selection Mobile Segmented Control */}
        <section className="rounded-2xl border border-blue-100 bg-white p-3.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="size-3.5 text-primary" /> Target Sheet Tab
            </h2>
            <span className="text-[11px] font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              Active: {activeSheet}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 bg-blue-50/60 p-1.5 rounded-xl border border-blue-100/60">
            {SHEETS.map((s) => {
              const isActive = activeSheet === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSheet(s.id);
                    clearForm();
                  }}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg text-center transition-all ${
                    isActive
                      ? "bg-primary text-white font-bold shadow-md shadow-primary/25"
                      : "text-slate-600 hover:text-slate-900 font-medium hover:bg-white/50"
                  }`}
                >
                  <FileSpreadsheet className={`size-4 mb-0.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                  <span className="text-xs font-bold">{s.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Main Entry Form Card */}
        <section className="rounded-2xl border border-blue-100 bg-white p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-primary border border-blue-100">
                <Plus className="size-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-900">
                New Entry for <span className="text-primary font-black">{activeSheet}</span>
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              {date}
            </span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs font-semibold text-slate-700">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl h-11 border-slate-200 focus:border-primary focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Material Select</Label>
                <Select value={material} onValueChange={setMaterial}>
                  <SelectTrigger className="w-full rounded-xl h-11 font-medium border-slate-200 focus:border-primary focus:ring-primary/20">
                    <SelectValue placeholder="Choose material..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-blue-100">
                    {materials.map((m) => (
                      <SelectItem key={m} value={m} className="font-medium text-slate-800">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Material Tap Chips for Mobile */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Quick Select Material:
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {PREDEFINED_MATERIALS.map((m) => {
                  const isSelected = material === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMaterial(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        isSelected
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:text-primary hover:border-blue-200"
                      }`}
                    >
                      {isSelected && <Check className="inline-block size-3 mr-1" />}
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Column Inputs */}
            {activeSheet === "Sieving" ? (
              <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 sm:p-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-primary block mb-2">
                  Sieving Quantities (1-No, 2-No, 3-No, 4-No)
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="qty1No" className="text-xs text-slate-600 font-semibold">1-No</Label>
                    <Input
                      id="qty1No"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={qty1No}
                      onChange={(e) => setQty1No(e.target.value)}
                      className="rounded-xl h-11 bg-white border-blue-200 font-bold text-center text-primary text-base"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="qty2No" className="text-xs text-slate-600 font-semibold">2-No</Label>
                    <Input
                      id="qty2No"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={qty2No}
                      onChange={(e) => setQty2No(e.target.value)}
                      className="rounded-xl h-11 bg-white border-blue-200 font-bold text-center text-primary text-base"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="qty3No" className="text-xs text-slate-600 font-semibold">3-No</Label>
                    <Input
                      id="qty3No"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={qty3No}
                      onChange={(e) => setQty3No(e.target.value)}
                      className="rounded-xl h-11 bg-white border-blue-200 font-bold text-center text-primary text-base"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="qty4No" className="text-xs text-slate-600 font-semibold">4-No</Label>
                    <Input
                      id="qty4No"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={qty4No}
                      onChange={(e) => setQty4No(e.target.value)}
                      className="rounded-xl h-11 bg-white border-blue-200 font-bold text-center text-primary text-base"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 sm:p-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-primary block mb-2">
                  {activeSheet} Quantities (Qty-40, Qty-25, Qty-20)
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="qty40" className="text-xs text-slate-600 font-semibold">Qty-40</Label>
                    <Input
                      id="qty40"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={qty40}
                      onChange={(e) => setQty40(e.target.value)}
                      className="rounded-xl h-11 bg-white border-blue-200 font-bold text-center sm:text-left text-primary text-base"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="qty25" className="text-xs text-slate-600 font-semibold">Qty-25</Label>
                    <Input
                      id="qty25"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={qty25}
                      onChange={(e) => setQty25(e.target.value)}
                      className="rounded-xl h-11 bg-white border-blue-200 font-bold text-center sm:text-left text-primary text-base"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="qty20" className="text-xs text-slate-600 font-semibold">Qty-20</Label>
                    <Input
                      id="qty20"
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={qty20}
                      onChange={(e) => setQty20(e.target.value)}
                      className="rounded-xl h-11 bg-white border-blue-200 font-bold text-center sm:text-left text-primary text-base"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button className="h-12 w-full text-base font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20" onClick={submit} disabled={saving}>
              {saving ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
              {saving ? `Saving to ${activeSheet}...` : `Append Row to ${activeSheet}`}
            </Button>
          </div>
        </section>

        {/* Predefined Materials List & Manager */}
        <section className="rounded-2xl border border-blue-100 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Materials List
            </h2>
            <span className="text-xs text-slate-400 font-medium">{materials.length} available</span>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Add custom material"
              value={newMaterial}
              onChange={(e) => setNewMaterial(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMaterial()}
              className="rounded-xl h-10 border-slate-200 text-xs"
            />
            <Button variant="secondary" onClick={addMaterial} className="rounded-xl h-10 px-3 font-semibold text-xs bg-blue-50 text-primary border border-blue-100 hover:bg-blue-100 shrink-0">
              <Plus className="size-3.5" /> Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {materials.map((m) => {
              const isPredefined = PREDEFINED_MATERIALS.includes(m as any);
              return (
                <span
                  key={m}
                  className={`inline-flex items-center gap-1.5 rounded-full border py-1 pl-3 pr-2 text-xs font-semibold ${
                    isPredefined
                      ? "border-blue-200 bg-blue-50/80 text-primary"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  {m}
                  {!isPredefined && (
                    <button
                      aria-label={`Remove ${m}`}
                      onClick={() => removeMaterial(m)}
                      className="rounded-full p-0.5 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600"
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
        <section className="rounded-2xl border border-blue-100 bg-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Recent Log History
              </h2>
              <Badge variant="secondary" className="text-xs font-bold bg-blue-50 text-primary border border-blue-100">
                {filteredLog.length} {filteredLog.length === 1 ? "entry" : "entries"}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Select value={logFilter} onValueChange={(val) => setLogFilter(val as any)}>
                <SelectTrigger className="w-32 h-8 text-xs rounded-lg font-semibold border-slate-200">
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
                  className="h-8 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 gap-1 rounded-lg"
                  onClick={openClearAllDialog}
                >
                  <Trash2 className="size-3.5" /> Clear
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredLog.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">
                No entries found for {logFilter === "ALL" ? "any sheet" : logFilter}.
              </p>
            )}
            {filteredLog.slice(0, 20).map((e) => (
              <div
                key={e.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/30 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Badge variant="outline" className="font-mono text-xs font-extrabold border-blue-200 text-primary bg-white shrink-0">
                    {e.sheetName}
                  </Badge>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate text-sm">{e.material}</p>
                    <p className="text-[11px] text-slate-400">{e.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 justify-between sm:justify-end">
                  <div className="text-xs font-mono bg-white border border-blue-100 px-2.5 py-1 rounded-lg shadow-2xs">
                    {e.sheetName === "Sieving" ? (
                      <div className="flex gap-2 text-slate-800">
                        {e.qty1No != null && e.qty1No !== "" && <span>1-No: <b className="text-primary">{e.qty1No}</b></span>}
                        {e.qty2No != null && e.qty2No !== "" && <span>2-No: <b className="text-primary">{e.qty2No}</b></span>}
                        {e.qty3No != null && e.qty3No !== "" && <span>3-No: <b className="text-primary">{e.qty3No}</b></span>}
                        {e.qty4No != null && e.qty4No !== "" && <span>4-No: <b className="text-primary">{e.qty4No}</b></span>}
                      </div>
                    ) : (
                      <div className="flex gap-2 text-slate-800">
                        {e.qty40 != null && e.qty40 !== "" && <span>Q40: <b className="text-primary">{e.qty40}</b></span>}
                        {e.qty25 != null && e.qty25 !== "" && <span>Q25: <b className="text-primary">{e.qty25}</b></span>}
                        {e.qty20 != null && e.qty20 !== "" && <span>Q20: <b className="text-primary">{e.qty20}</b></span>}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge variant={e.synced ? "secondary" : "destructive"} className={`text-[10px] rounded-md shrink-0 font-semibold ${e.synced ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : ""}`}>
                      {e.synced ? "Synced" : "Failed"}
                    </Badge>
                    <button
                      onClick={() => openDeleteSingleDialog(e)}
                      title="Delete entry"
                      className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
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
        <Button size="icon" variant="outline" aria-label="Settings" className="size-9 rounded-xl border-blue-100 text-slate-600 hover:text-primary hover:bg-blue-50">
          <Settings className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg rounded-2xl border-blue-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold">
            <ShieldCheck className="size-5 text-primary" />
            Google Sheets connection
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Your connection details are encrypted & loaded securely from your project <b>.env</b> file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Separator />

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-primary font-medium">
            <b>Apps Script Code:</b> Make sure your Google Apps Script is updated with this code to support <b>PUL-32</b>, <b>PUL-25</b>, and <b>Sieving</b> tabs.
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-700">Apps Script Code</Label>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1 text-primary hover:bg-blue-50"
                onClick={() => {
                  navigator.clipboard.writeText(APPS_SCRIPT_CODE);
                  toast.success("Apps Script code copied!");
                }}
              >
                <Copy className="size-3.5" /> Copy Code
              </Button>
            </div>
            <pre className="max-h-56 overflow-auto rounded-lg bg-slate-900 text-slate-100 p-3 text-[11px] leading-relaxed font-mono border border-slate-800">
              <code>{APPS_SCRIPT_CODE}</code>
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
