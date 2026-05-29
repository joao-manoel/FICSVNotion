import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  cancelLabel = "Cancelar",
  confirmLabel = "Confirmar",
  description,
  loading = false,
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 px-4 backdrop-blur-sm">
      <div
        aria-modal="true"
        className="w-full max-w-md rounded-xl border border-white/80 bg-white p-5 shadow-soft"
        role="dialog"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button disabled={loading} onClick={onCancel} variant="secondary">
            {cancelLabel}
          </Button>
          <Button disabled={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
