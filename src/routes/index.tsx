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
  CheckCircle2,
  Scale,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Lock,
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
  appendRow,
  convertKgToTons,
  formatDateDDMMMYYYY,
  loadConfig,
  loadLog,
  loadProducts,
  saveConfig,
  saveLog,
  saveProducts,
  todayISO,
  type AppConfig,
  type LogEntry,
} from "@/lib/stocklog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StockLog - Log Products to Google Sheets" },
      {
        name: "description",
        content:
          "Installable app to record date, product and quantity, appended as rows to your Google Sheet via Apps Script.",
      },
      { property: "og:title", content: "StockLog - Log Products to Google Sheets" },
      {
        property: "og:description",
        content: "Pick a product, enter quantity, and append the row to your Google Sheet instantly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [products, setProducts] = useState<string[]>([]);
  const [config, setConfig] = useState<AppConfig>({ scriptUrl: "", sheetId: "", sheetName: "Sheet1" });
  const [log, setLog] = useState<LogEntry[]>([]);
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [date, setDate] = useState(todayISO());
  const [newProduct, setNewProduct] = useState("");
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<LogEntry | null>(null);
  const [isClearAll, setIsClearAll] = useState(false);

  const { canInstall, installed, promptInstall } = useInstallPrompt();

  const handleInstallApp = async () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const downloadFileName = isMobile ? "StockLog-Android.apk" : "StockLog-Desktop.zip";
    const downloadPath = `/downloads/${downloadFileName}`;

    // 1. Direct Original App Installer Download
    const link = document.createElement("a");
    link.href = downloadPath;
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 2. Also trigger native browser PWA install prompt if supported
    if (canInstall) {
      promptInstall().catch(() => {});
    }

    toast.success(
      isMobile
        ? "Downloading StockLog original Android App (.apk)..."
        : "Downloading StockLog Desktop Application Package (.zip)...",
    );
  };

  useEffect(() => {
    setProducts(loadProducts());
    setConfig(loadConfig());
    setLog(loadLog());
    setReady(true);
  }, []);

  const configured = useMemo(
    () => config.scriptUrl.trim().length > 0 && config.sheetId.trim().length > 0,
    [config],
  );

  const handleQuantityInput = (val: string) => {
    setQuantity(val);
  };

  const handleUnitSelect = (selectedUnit: string) => {
    setUnit(selectedUnit);
  };

  const addProduct = () => {
    const name = newProduct.trim();
    if (!name) return;
    if (products.some((p) => p.toLowerCase() === name.toLowerCase())) {
      toast.error("That product is already in the list");
      return;
    }
    const next = [...products, name].sort((a, b) => a.localeCompare(b));
    setProducts(next);
    saveProducts(next);
    setProduct(name);
    setNewProduct("");
    toast.success(`Added "${name}"`);
  };

  const removeProduct = (name: string) => {
    const next = products.filter((p) => p !== name);
    setProducts(next);
    saveProducts(next);
    if (product === name) setProduct("");
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
      toast.success(`Deleted entry for "${entryToDelete.product}"`);
    }
    setDeleteDialogOpen(false);
    setEntryToDelete(null);
  };

  const submit = async () => {
    if (!configured) {
      toast.error("Set VITE_APPS_SCRIPT_URL and VITE_GOOGLE_SHEET_ID in your .env file first");
      return;
    }
    let rawQty = Number(quantity);
    let finalQty = rawQty;
    let finalUnit = unit;

    if (!product) {
      toast.error("Select a product");
      return;
    }
    if (!quantity || Number.isNaN(rawQty) || rawQty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }

    // Convert >= 1000 kgs to Tons for backend and Google Sheets update
    if (rawQty >= 1000 && (finalUnit === "kg" || finalUnit === "kgs")) {
      const converted = convertKgToTons(rawQty, finalUnit);
      finalQty = converted.quantity;
      finalUnit = converted.unit;
    }

    // Format date as dd-mmm-yyyy (e.g. 12-Aug-2026)
    const formattedDate = formatDateDDMMMYYYY(date);

    setSaving(true);
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      date: formattedDate,
      product,
      quantity: finalQty,
      unit: finalUnit,
      synced: false,
    };

    try {
      await appendRow(config, { date: formattedDate, product, quantity: finalQty, unit: finalUnit });
      entry.synced = true;
      toast.success(`Appended ${finalQty} ${finalUnit} to Google Sheet (${formattedDate})`);
      setQuantity("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reach the Apps Script");
    } finally {
      const next = [entry, ...log];
      setLog(next);
      saveLog(next);
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-16">
      <header className="border-b border-border/60 bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ClipboardList className="size-5" />
          </span>
          <div className="flex-1">
            <h1 className="text-lg font-bold tracking-tight">StockLog</h1>
            <p className="text-xs text-muted-foreground">Entries append straight to your Google Sheet</p>
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

      <div className="mx-auto max-w-2xl space-y-6 px-5 py-6">
        {ready && !configured && (
          <div className="rounded-xl border border-dashed border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive font-medium flex items-center gap-2">
            <Lock className="size-4 shrink-0" />
            <span>Please add <b>VITE_APPS_SCRIPT_URL</b> and <b>VITE_GOOGLE_SHEET_ID</b> to your <code>.env</code> file to enable Google Sheets sync.</span>
          </div>
        )}

        <section className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <Plus className="size-4 text-primary" /> New entry
            </h2>
            <span className="text-xs text-muted-foreground font-mono">{date}</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={product} onValueChange={setProduct}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="qty">Quantity</Label>
                <span className="text-[11px] text-muted-foreground">
                  ≥ 1000 kg auto-converts to Tons
                </span>
              </div>
              <div className="flex gap-2">
                <Input
                  id="qty"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  placeholder="0"
                  className="flex-1"
                  value={quantity}
                  onChange={(e) => handleQuantityInput(e.target.value)}
                />
                <Select value={unit} onValueChange={handleUnitSelect}>
                  <SelectTrigger className="w-28 font-medium">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="Ton">Ton / Tons</SelectItem>
                    <SelectItem value="Pcs">Pcs</SelectItem>
                    <SelectItem value="Bag">Bag</SelectItem>
                    <SelectItem value="Box">Box</SelectItem>
                    <SelectItem value="L">Liters (L)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="h-12 w-full text-base font-semibold rounded-xl" onClick={submit} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {saving ? "Saving to Sheet..." : "Add to Google Sheet"}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Product list
          </h2>
          <div className="mt-4 flex gap-2">
            <Input
              placeholder="New product name"
              value={newProduct}
              onChange={(e) => setNewProduct(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addProduct()}
            />
            <Button variant="secondary" onClick={addProduct} className="rounded-xl font-medium">
              <Plus className="size-4" /> Add
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {products.length === 0 && (
              <p className="text-sm text-muted-foreground">No products yet — add your first one.</p>
            )}
            {products.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 py-1 pl-3 pr-1.5 text-sm"
              >
                {p}
                <button
                  aria-label={`Remove ${p}`}
                  onClick={() => removeProduct(p)}
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Recent entries
            </h2>
            {log.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
                onClick={openClearAllDialog}
              >
                <Trash2 className="size-3.5" /> Clear all
              </Button>
            )}
          </div>

          <ul className="divide-y divide-border/60">
            {log.length === 0 && (
              <li className="py-4 text-center text-sm text-muted-foreground">Nothing logged yet.</li>
            )}
            {log.slice(0, 15).map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-foreground">{e.product}</p>
                  <p className="text-xs text-muted-foreground">{e.date}</p>
                </div>
                <div className="text-right">
                  <span className="tabular-nums font-bold text-foreground">
                    {e.quantity} <span className="text-xs font-normal text-muted-foreground">{e.unit || "kg"}</span>
                  </span>
                </div>
                <Badge variant={e.synced ? "secondary" : "destructive"} className="text-[11px] rounded-lg">
                  {e.synced ? "Synced" : "Failed"}
                </Badge>
                <button
                  onClick={() => openDeleteSingleDialog(e)}
                  title="Delete this recent entry"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>



      {/* Customized Delete Confirmation Dialog */}
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
  const isConfigured = Boolean(config.scriptUrl && config.sheetId);

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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Apps Script backend code</Label>
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
              <li>Open <b>script.google.com</b> and create a new project.</li>
              <li>Paste the code above and click save.</li>
              <li>
                Deploy → New deployment → Web app → Execute as <b>Me</b>, access{" "}
                <b>Anyone</b>.
              </li>
              <li>Paste the Web App URL into your <code>.env</code> file as <code>VITE_APPS_SCRIPT_URL</code>.</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

