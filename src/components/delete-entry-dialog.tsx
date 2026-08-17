import { Trash2, AlertTriangle, PackageCheck } from "lucide-react";
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
  const displayUnit = entry?.unit || "kg";

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
                <p>Are you sure you want to delete this recent entry?</p>
                <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs space-y-1.5 font-mono text-foreground">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Product:</span>
                    <span className="font-semibold text-foreground">{entry.product}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Quantity:</span>
                    <span className="font-bold text-primary">{entry.quantity} {displayUnit}</span>
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
