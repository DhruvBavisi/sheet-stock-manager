import { Trash2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { LogEntry } from "@/lib/stocklog";

interface DeleteEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: LogEntry | null;
  isClearAll?: boolean;
  totalEntriesCount?: number;
  onConfirmDelete: () => void;
}

export function DeleteEntryDialog({
  open,
  onOpenChange,
  entry,
  isClearAll = false,
  totalEntriesCount = 0,
  onConfirmDelete,
}: DeleteEntryDialogProps) {
  const getQtySummary = (item: LogEntry) => {
    if (item.sheetName === "Sieving") {
      const parts = [];
      if (item.qty1No != null && item.qty1No !== "") parts.push(`1-No: ${item.qty1No}`);
      if (item.qty2No != null && item.qty2No !== "") parts.push(`2-No: ${item.qty2No}`);
      if (item.qty3No != null && item.qty3No !== "") parts.push(`3-No: ${item.qty3No}`);
      if (item.qty4No != null && item.qty4No !== "") parts.push(`4-No: ${item.qty4No}`);
      return parts.join(" | ") || "None";
    } else {
      const parts = [];
      if (item.qty40 != null && item.qty40 !== "") parts.push(`Qty-40: ${item.qty40}`);
      if (item.qty25 != null && item.qty25 !== "") parts.push(`Qty-25: ${item.qty25}`);
      if (item.qty20 != null && item.qty20 !== "") parts.push(`Qty-20: ${item.qty20}`);
      return parts.join(" | ") || "None";
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md rounded-2xl border-destructive/30 bg-card p-6 shadow-2xl">
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-destructive/15 text-destructive ring-8 ring-destructive/5">
              <AlertTriangle className="size-6 animate-pulse" />
            </span>
            <div>
              <AlertDialogTitle className="text-lg font-bold text-foreground">
                {isClearAll ? "Clear All Recent Entries?" : "Delete Entry Confirmation"}
              </AlertDialogTitle>
              <p className="text-xs text-muted-foreground">
                This action is permanent for your local log history.
              </p>
            </div>
          </div>

          <AlertDialogDescription className="pt-2 text-sm text-muted-foreground">
            {isClearAll ? (
              <span className="block rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 text-xs text-destructive font-medium">
                ⚠️ You are about to delete all <b>{totalEntriesCount}</b> recent entry logs. Are you sure you want to proceed?
              </span>
            ) : entry ? (
              <div className="space-y-2">
                <p>Are you sure you want to delete this entry?</p>
                <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs space-y-1.5 font-mono text-foreground">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Sheet:</span>
                    <span className="font-semibold text-foreground">{entry.sheetName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Material:</span>
                    <span className="font-semibold text-foreground">{entry.material}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Quantities:</span>
                    <span className="font-bold text-primary">{getQtySummary(entry)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Date:</span>
                    <span>{entry.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Status:</span>
                    <span className={entry.synced ? "text-emerald-500" : "text-amber-500"}>
                      {entry.synced ? "Synced to Google Sheet" : "Local Log"}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
          <AlertDialogCancel className="rounded-xl border-border hover:bg-muted font-medium">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirmDelete}
            className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold gap-1.5 shadow-sm"
          >
            <Trash2 className="size-4" />
            {isClearAll ? "Yes, Clear All Logs" : "Delete Entry"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

