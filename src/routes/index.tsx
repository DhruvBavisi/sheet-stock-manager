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
  Truck,
  Factory,
  Clock,
  Building2,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowDownUp,
  ChevronDown,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { DeleteEntryDialog } from "@/components/delete-entry-dialog";
import { DeleteMaterialDialog } from "@/components/delete-material-dialog";
import { DeleteTransporterDialog } from "../components/delete-transporter-dialog";
import {
  APPS_SCRIPT_CODE,
  MACHINE_SHEETS,
  TASKS,
  PREDEFINED_MATERIALS,
  PREDEFINED_TRANSPORTERS,
  appendRow,
  formatDateDDMMMYYYY,
  loadConfig,
  loadLog,
  loadMaterials,
  loadTransporters,
  saveConfig,
  saveLog,
  saveMaterials,
  saveTransporters,
  todayISO,
  type AppConfig,
  type LogEntry,
  type MachineSheet,
  type SheetType,
  type TaskType,
} from "@/lib/stocklog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StockLog - Multi-Sheet Stock Manager" },
      {
        name: "description",
        content:
          "Pick a task — Machines (PUL-32, PUL-25, Sieving) or Logistics (truck IN–OUT timings) — and log entries straight to your Google Sheets.",
      },
      { property: "og:title", content: "StockLog - Multi-Sheet Stock Manager" },
      {
        property: "og:description",
        content: "Log machine production and truck logistics entries directly to Google Sheets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  // Step 1: which task the user is doing. Step 2 (below) adapts to it.
  const [task, setTask] = useState<TaskType>("Machines");
  // Which machine tab is active (only relevant when task === "Machines").
  const [machineSheet, setMachineSheet] = useState<MachineSheet>("PUL-32");
  // The physical Google Sheet tab this entry targets.
  const targetSheet: SheetType = task === "Logistics" ? "Logistics" : machineSheet;
  const [materials, setMaterials] = useState<string[]>([...PREDEFINED_MATERIALS]);
  const [config, setConfig] = useState<AppConfig>({
    scriptUrl: "",
    sheetId: "",
    scriptUrl2: "",
    sheetId2: "",
    sheetName: "PUL-32",
  });
  const [log, setLog] = useState<LogEntry[]>([]);
  const [material, setMaterial] = useState("");
  const [date, setDate] = useState(todayISO());
  const [dayNight, setDayNight] = useState<"Day" | "Night" | "">("");

  // Fields for PUL-32 and PUL-25
  const [qty40, setQty40] = useState("");
  const [qty25, setQty25] = useState("");
  const [qty20, setQty20] = useState("");

  // Fields for Sieving
  const [qty1No, setQty1No] = useState("");
  const [qty2No, setQty2No] = useState("");
  const [qty3No, setQty3No] = useState("");
  const [qty4No, setQty4No] = useState("");

  // Fields for Logistics
  const [vehicleNo, setVehicleNo] = useState("");
  const [transporter, setTransporter] = useState("");
  const [transporters, setTransporters] = useState<string[]>([...PREDEFINED_TRANSPORTERS]);
  const [movement, setMovement] = useState<"In" | "Out" | "">("");
  const [inTime, setInTime] = useState("");
  const [outTime, setOutTime] = useState("");

  const [newMaterial, setNewMaterial] = useState("");
  const [newTransporter, setNewTransporter] = useState("");
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [logFilter, setLogFilter] = useState<"ALL" | SheetType>("ALL");

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<LogEntry | null>(null);
  const [isClearAll, setIsClearAll] = useState(false);
  const [deleteMaterialDialogOpen, setDeleteMaterialDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<string | null>(null);
  const [deleteTransporterDialogOpen, setDeleteTransporterDialogOpen] = useState(false);
  const [transporterToDelete, setTransporterToDelete] = useState<string | null>(null);

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
    setTransporters(loadTransporters());
    setConfig(loadConfig());
    setLog(loadLog());
    setReady(true);
  }, []);

  const configuredCount = useMemo(() => {
    let count = 0;
    if (config?.scriptUrl?.trim() && config?.sheetId?.trim()) count++;
    if (config?.scriptUrl2?.trim() && config?.sheetId2?.trim()) count++;
    return count;
  }, [config]);

  const configured = configuredCount > 0;

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
    setMaterialToDelete(name);
    setDeleteMaterialDialogOpen(true);
  };

  const addTransporter = () => {
    const name = newTransporter.trim();
    if (!name) return;
    if (transporters.some((item) => item.toLowerCase() === name.toLowerCase())) {
      toast.error("That transporter is already in the list");
      return;
    }
    const next = [...transporters, name];
    setTransporters(next);
    saveTransporters(next);
    setTransporter(name);
    setNewTransporter("");
    toast.success(`Added "${name}"`);
  };

  const removeTransporter = (name: string) => {
    setTransporterToDelete(name);
    setDeleteTransporterDialogOpen(true);
  };

  const confirmDeleteTransporter = () => {
    if (!transporterToDelete) return;
    const next = transporters.filter((item) => item !== transporterToDelete);
    setTransporters(next);
    saveTransporters(next);
    if (transporter === transporterToDelete) setTransporter("");
    toast.success(`Deleted transporter "${transporterToDelete}"`);
    setDeleteTransporterDialogOpen(false);
    setTransporterToDelete(null);
  };

  const confirmDeleteMaterial = () => {
    if (!materialToDelete) return;
    const next = materials.filter((m) => m !== materialToDelete);
    setMaterials(next);
    saveMaterials(next);
    if (material === materialToDelete) setMaterial("");
    toast.success(`Deleted material "${materialToDelete}"`);
    setDeleteMaterialDialogOpen(false);
    setMaterialToDelete(null);
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
    setDayNight("");
    setQty40("");
    setQty25("");
    setQty20("");
    setQty1No("");
    setQty2No("");
    setQty3No("");
    setQty4No("");
    setVehicleNo("");
    setTransporter("");
    setMovement("");
    setInTime("");
    setOutTime("");
  };

  const submit = async () => {
    if (!configured) {
      toast.error("Set Apps Script URL and Google Sheet ID in your .env file first");
      return;
    }
    if (!material) {
      toast.error(task === "Logistics" ? "Select the material the vehicle carried" : "Select a material");
      return;
    }

    if (task === "Logistics") {
      if (!vehicleNo.trim()) {
        toast.error("Enter the vehicle number");
        return;
      }
      if (!movement) {
        toast.error("Select the movement (In or Out)");
        return;
      }
      if (!inTime || !outTime) {
        toast.error("Enter both In-Time and Out-Time");
        return;
      }
    } else if (targetSheet === "Sieving") {
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

    if (task === "Machines" && !dayNight) {
      toast.error("Select Day or Night");
      return;
    }

    const formattedDate = formatDateDDMMMYYYY(date);
    setSaving(true);

    const fields =
      task === "Logistics"
        ? { vehicleNo: vehicleNo.trim(), transporter: transporter.trim(), movement, inTime, outTime }
        : targetSheet === "Sieving"
          ? { dayNight, qty1No, qty2No, qty3No, qty4No }
          : { dayNight, qty40, qty25, qty20 };

    const payload = {
      sheetName: targetSheet,
      date: formattedDate,
      material,
      ...fields,
    };

    const entry: LogEntry = {
      id: crypto.randomUUID(),
      task,
      sheetName: targetSheet,
      date: formattedDate,
      material,
      ...fields,
      synced: false,
    };

    const subject = task === "Logistics" ? vehicleNo.trim() : material;

    try {
      const res = await appendRow(config, payload);
      entry.synced = true;
      entry.syncedCount = res.syncedCount;

      if (res.syncedCount > 1) {
        toast.success(`Logged ${subject} to ${targetSheet} in 2 Google Sheets (Email 1 & Email 2)!`);
      } else {
        toast.success(`Logged ${subject} to ${targetSheet} in Google Sheet (${formattedDate})`);
      }
      if (res.errors && res.errors.length > 0) {
        toast.warning(`Note: ${res.errors.join("; ")}`);
      }
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
            <span>Please set <b>APPS_SCRIPT_URL</b> and <b>GOOGLE_SHEET_ID</b> in your <code>.env</code> file to enable Google Sheets sync.</span>
          </div>
        )}

        {/* Step 1 — Task Selection */}
        <section className="rounded-2xl border border-blue-100 bg-white p-3.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="size-3.5 text-primary" /> Select Task
            </h2>
            <span className="text-[11px] font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              {task}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-blue-50/60 p-1.5 rounded-xl border border-blue-100/60">
            {TASKS.map((t) => {
              const isActive = task === t.id;
              const Icon = t.id === "Logistics" ? Truck : Factory;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTask(t.id);
                    clearForm();
                  }}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-center transition-all ${
                    isActive
                      ? "bg-primary text-white font-bold shadow-md shadow-primary/25"
                      : "text-slate-600 hover:text-slate-900 font-medium hover:bg-white/50"
                  }`}
                >
                  <Icon className={`size-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                  <span className="text-sm font-bold">{t.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2 (Machines) — pick the machine sheet tab */}
        {task === "Machines" && (
          <section className="rounded-2xl border border-blue-100 bg-white p-3.5 shadow-sm space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileSpreadsheet className="size-3.5 text-primary" /> Machine Sheet
              </h2>
              <span className="text-[11px] font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Active: {machineSheet}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 bg-blue-50/60 p-1.5 rounded-xl border border-blue-100/60">
              {MACHINE_SHEETS.map((s) => {
                const isActive = machineSheet === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setMachineSheet(s.id);
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
        )}

        {/* Main Entry Form Card */}
        <section className="rounded-2xl border border-blue-100 bg-white p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-primary border border-blue-100 shrink-0">
                <Plus className="size-4" />
              </span>
              <h2 className="text-sm font-bold text-slate-900 truncate">
                New Entry for <span className="text-primary font-black">{targetSheet}</span>
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg shrink-0">
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
                  className="rounded-xl h-11 w-full min-w-0 border-slate-200 focus:border-primary focus:ring-primary/20 text-sm"
                />
              </div>

              {task === "Machines" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Shift <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["Day", "Night"] as const).map((shift) => (
                      <button
                        key={shift}
                        type="button"
                        onClick={() => setDayNight(shift)}
                        className={`h-11 rounded-xl border text-sm font-bold transition-all ${
                          dayNight === shift
                            ? shift === "Day"
                              ? "bg-sky-500 text-white border-sky-500 shadow-xs"
                              : "bg-slate-800 text-white border-slate-800 shadow-xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-primary"
                        }`}
                      >
                        {shift || "None"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="material" className="text-xs font-semibold text-slate-700">
                Material <span className="text-red-500">*</span>
              </Label>
              <Input
                id="material"
                type="text"
                value={material}
                readOnly
                tabIndex={-1}
                placeholder="Select from chips below..."
                onFocus={(e) => e.target.blur()}
                className="rounded-xl h-11 w-full min-w-0 border-slate-200 bg-slate-50 text-base sm:text-sm font-semibold text-primary cursor-default pointer-events-none select-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-slate-200"
              />
            </div>

            {/* Material quick-select chips */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-1.5">
                {materials.map((m) => {
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
            {task === "Logistics" ? (
              <div className="space-y-3.5 rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 sm:p-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-primary block">
                  Logistics Details
                </Label>

                {/* Vehicle / Number Plate */}
                <div className="space-y-1.5">
                  <Label htmlFor="vehicleNo" className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                    <Truck className="size-3.5 text-primary" /> Vehicle Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="vehicleNo"
                    type="text"
                    value={vehicleNo}
                    onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
                    autoCapitalize="characters"
                    className="rounded-xl h-11 bg-white border-blue-200 font-bold tracking-wider uppercase text-primary text-base"
                  />
                </div>

                {/* Transporter Name (+ quick picks) */}
                <div className="space-y-1.5">
                  <Label htmlFor="transporter" className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-primary" /> Transporter Name
                  </Label>
                  <Input
                    id="transporter"
                    type="text"
                    value={transporter}
                    onChange={(e) => setTransporter(e.target.value)}
                    className="rounded-xl h-11 bg-white border-blue-200 font-semibold text-primary text-base"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {transporters.map((t) => {
                      const isSelected = transporter === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTransporter(t)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                            isSelected
                              ? "bg-primary text-white border-primary shadow-xs"
                              : "bg-white text-slate-700 border-blue-200 hover:bg-blue-50 hover:text-primary"
                          }`}
                        >
                          {isSelected && <Check className="inline-block size-3 mr-1" />}
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Movement — goods arrived at facility (In) or sent out (Out) */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                    <ArrowDownUp className="size-3.5 text-primary" /> Movement <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["In", "Out"] as const).map((m) => {
                      const isSelected = movement === m;
                      const Icon = m === "In" ? ArrowDownToLine : ArrowUpFromLine;
                      const activeCls =
                        m === "In"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-red-500 text-white border-red-500 shadow-xs";
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMovement(m)}
                          className={`flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-bold transition-all border ${
                            isSelected ? activeCls : "bg-white text-slate-600 border-blue-200 hover:bg-blue-50"
                          }`}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span className="whitespace-nowrap">
                            {m}
                            <span className="hidden min-[360px]:inline font-medium">
                              {m === "In" ? " (Arrived)" : " (Sent)"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* In-Time / Out-Time */}
                <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2.5 sm:gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="inTime" className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                      <Clock className="size-3.5 text-emerald-600" /> In-Time *
                    </Label>
                    <Input
                      id="inTime"
                      type="time"
                      value={inTime}
                      onChange={(e) => setInTime(e.target.value)}
                      className="rounded-xl h-10 sm:h-11 w-full min-w-0 bg-white border-blue-200 font-bold text-primary text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="outTime" className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                      <Clock className="size-3.5 text-red-500" /> Out-Time
                    </Label>
                    <Input
                      id="outTime"
                      type="time"
                      value={outTime}
                      onChange={(e) => setOutTime(e.target.value)}
                      className="rounded-xl h-10 sm:h-11 w-full min-w-0 bg-white border-blue-200 font-bold text-primary text-sm"
                    />
                  </div>
                </div>
              </div>
            ) : targetSheet === "Sieving" ? (
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
                  {machineSheet} Quantities (Qty-40, Qty-25, Qty-20)
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
              {saving ? `Saving to ${targetSheet}...` : `Append Row to ${targetSheet}`}
            </Button>
          </div>
        </section>

        <Collapsible className="rounded-2xl border border-blue-100 bg-white p-4 sm:p-5 shadow-sm">
          <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
            <span className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Transporters List</h2>
              <span className="text-xs text-slate-400 font-medium">{transporters.length} available</span>
            </span>
            <ChevronDown className="size-4 text-slate-400 transition-transform data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="collapsible-content space-y-3 pt-3">
            <div className="flex gap-2">
            <Input
              placeholder="Add custom transporter"
              value={newTransporter}
              onChange={(e) => setNewTransporter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTransporter()}
              className="rounded-xl h-11 border-slate-200 text-base sm:text-sm"
            />
            <Button variant="secondary" onClick={addTransporter} className="rounded-xl h-11 px-3 font-semibold text-xs bg-blue-50 text-primary border border-blue-100 hover:bg-blue-100 shrink-0">
              <Plus className="size-3.5" /> Add
            </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
            {transporters.map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-3 pr-2 text-xs font-semibold text-slate-700">
                {item}
                <button aria-label={`Remove ${item}`} onClick={() => removeTransporter(item)} className="rounded-full p-0.5 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600">
                  <Trash2 className="size-3" />
                </button>
              </span>
            ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Predefined Materials List & Manager */}
        <Collapsible className="rounded-2xl border border-blue-100 bg-white p-4 sm:p-5 shadow-sm">
          <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
            <span className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Materials List</h2>
              <span className="text-xs text-slate-400 font-medium">{materials.length} available</span>
            </span>
            <ChevronDown className="size-4 text-slate-400 transition-transform data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="collapsible-content space-y-3 pt-3">

          <div className="flex gap-2">
            <Input
              placeholder="Add custom material"
              value={newMaterial}
              onChange={(e) => setNewMaterial(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMaterial()}
              className="rounded-xl h-11 border-slate-200 text-base sm:text-sm"
            />
            <Button variant="secondary" onClick={addMaterial} className="rounded-xl h-11 px-3 font-semibold text-xs bg-blue-50 text-primary border border-blue-100 hover:bg-blue-100 shrink-0">
              <Plus className="size-3.5" /> Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {materials.map((m) => {
              return (
                <span
                  key={m}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 py-1 pl-3 pr-2 text-xs font-semibold text-slate-700"
                >
                  {m}
                  <button
                    aria-label={`Remove ${m}`}
                    onClick={() => removeMaterial(m)}
                    className="rounded-full p-0.5 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </span>
              );
            })}
          </div>
          </CollapsibleContent>
        </Collapsible>

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

            <div className="flex items-center gap-2 justify-between">
              <Select value={logFilter} onValueChange={(val) => setLogFilter(val as any)}>
                <SelectTrigger className="flex-1 sm:flex-none sm:w-32 h-8 text-xs rounded-lg font-semibold border-slate-200">
                  <SelectValue placeholder="Filter Sheet" />
                </SelectTrigger>
                <SelectContent className="rounded-xl text-xs">
                  <SelectItem value="ALL">All Sheets</SelectItem>
                  <SelectItem value="PUL-32">PUL-32</SelectItem>
                  <SelectItem value="PUL-25">PUL-25</SelectItem>
                  <SelectItem value="Sieving">Sieving</SelectItem>
                  <SelectItem value="Logistics">Logistics</SelectItem>
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
                className="flex flex-col gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/30 transition-colors text-xs"
              >
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Badge variant="outline" className="font-mono text-[11px] font-extrabold border-blue-200 text-primary bg-white shrink-0">
                      {e.sheetName}
                    </Badge>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate text-sm">{e.material}</p>
                      <p className="text-[11px] text-slate-400">{e.date}{e.dayNight ? ` · ${e.dayNight}` : ""}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant={e.synced ? "secondary" : "destructive"} className={`text-[10px] rounded-md shrink-0 font-semibold ${e.synced ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : ""}`}>
                      {e.synced ? (e.syncedCount && e.syncedCount > 1 ? "Dual" : "Synced") : "Failed"}
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

                <div className="text-xs font-mono bg-white border border-blue-100 px-2.5 py-1.5 rounded-lg shadow-2xs">
                  {e.sheetName === "Logistics" ? (
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-slate-800">
                      {e.vehicleNo && <span className="font-extrabold tracking-wider text-primary">{e.vehicleNo}</span>}
                      {e.transporter && <span className="text-slate-500 font-semibold">{e.transporter}</span>}
                      {e.movement && (
                        <span className={`font-bold ${e.movement === "In" ? "text-emerald-600" : "text-red-500"}`}>
                          {e.movement}
                        </span>
                      )}
                      {e.inTime && <span>In: <b className="text-emerald-600">{e.inTime}</b></span>}
                      {e.outTime && <span>Out: <b className="text-red-500">{e.outTime}</b></span>}
                    </div>
                  ) : e.sheetName === "Sieving" ? (
                    <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-slate-800">
                      {e.qty1No != null && e.qty1No !== "" && <span>1-No: <b className="text-primary">{e.qty1No}</b></span>}
                      {e.qty2No != null && e.qty2No !== "" && <span>2-No: <b className="text-primary">{e.qty2No}</b></span>}
                      {e.qty3No != null && e.qty3No !== "" && <span>3-No: <b className="text-primary">{e.qty3No}</b></span>}
                      {e.qty4No != null && e.qty4No !== "" && <span>4-No: <b className="text-primary">{e.qty4No}</b></span>}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-slate-800">
                      {e.dayNight && <span>Shift: <b className="text-primary">{e.dayNight}</b></span>}
                      {e.qty40 != null && e.qty40 !== "" && <span>Q40: <b className="text-primary">{e.qty40}</b></span>}
                      {e.qty25 != null && e.qty25 !== "" && <span>Q25: <b className="text-primary">{e.qty25}</b></span>}
                      {e.qty20 != null && e.qty20 !== "" && <span>Q20: <b className="text-primary">{e.qty20}</b></span>}
                    </div>
                  )}
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

      <DeleteMaterialDialog
        open={deleteMaterialDialogOpen}
        onOpenChange={setDeleteMaterialDialogOpen}
        materialName={materialToDelete}
        onConfirmDelete={confirmDeleteMaterial}
      />

      <DeleteTransporterDialog
        open={deleteTransporterDialogOpen}
        onOpenChange={setDeleteTransporterDialogOpen}
        transporterName={transporterToDelete}
        onConfirmDelete={confirmDeleteTransporter}
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
            Google Sheets Dual Email Connection
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Link 2 separate Google Accounts / Emails to save data to both Google Sheets simultaneously.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Separator />

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-primary font-medium space-y-1">
            <p><b>Dual Email Instructions:</b></p>
            <p>1. Deploy the Apps Script in <b>Google Account 1</b> & paste its URL/Sheet ID as <code>APPS_SCRIPT_URL</code> & <code>GOOGLE_SHEET_ID</code>.</p>
            <p>2. Deploy the Apps Script in <b>Google Account 2</b> & paste its URL/Sheet ID as <code>APPS_SCRIPT_URL_2</code> & <code>GOOGLE_SHEET_ID_2</code>.</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-700">Apps Script Backend Code</Label>
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

