import type { ReactNode } from "react";

import { Loader2, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type ConfirmationDialogProps = {
  open: boolean;
  title?: ReactNode;
  description: ReactNode;
  confirmLabel?: string;
  confirmPendingLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmationDialog({
  open,
  title = "Confirmar exclusao",
  description,
  confirmLabel = "Excluir",
  confirmPendingLabel,
  cancelLabel = "Cancelar",
  isConfirming = false,
  onCancel,
  onConfirm
}: ConfirmationDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,15,28,0.45)] p-4"
      role="dialog"
    >
      <div className="w-full max-w-[340px] rounded-[28px] bg-[var(--color-surface)] px-7 py-8 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 inline-flex size-11 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-muted-foreground)]">
            <Trash2 className="size-5" />
          </div>
          <p className="text-[1.65rem] font-semibold leading-tight text-[var(--color-foreground)]">{title}</p>
          <div className="mt-3 max-w-[240px] text-sm leading-6 text-[var(--color-muted-foreground)]">
            {description}
          </div>
        </div>

        <div className="mt-9 flex flex-col items-center gap-3">
          <Button
            className="h-12 w-full max-w-[240px] justify-center"
            disabled={isConfirming}
            leadingIcon={isConfirming ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            onClick={onConfirm}
            variant="danger-outline"
          >
            {isConfirming ? (confirmPendingLabel ?? confirmLabel) : confirmLabel}
          </Button>
          <Button
            className="h-12 w-full max-w-[240px] justify-center"
            disabled={isConfirming}
            leadingIcon={<X className="size-4" />}
            onClick={onCancel}
            variant="outline"
          >
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
