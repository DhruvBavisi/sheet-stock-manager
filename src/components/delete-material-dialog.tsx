import { Trash2, AlertTriangle, Package } from "lucide-react";
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

interface DeleteMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialName: string | null;
  onConfirmDelete: () => void;
}

export function DeleteMaterialDialog({
  open,
  onOpenChange,
  materialName,
  onConfirmDelete,
}: DeleteMaterialDialogProps) {
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
                Delete Material
              </AlertDialogTitle>
              <p className="text-xs text-muted-foreground">
                This action is permanent for your material list.
              </p>
            </div>
          </div>

          <AlertDialogDescription className="pt-2 text-sm text-muted-foreground">
            <div className="space-y-2">
              <p>Are you sure you want to delete this material?</p>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-3 text-xs">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Package className="size-4" />
                </span>
                <span className="font-bold text-foreground">{materialName}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                It will be removed from the quick-select chips and the material list.
              </p>
            </div>
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
            Delete Material
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
