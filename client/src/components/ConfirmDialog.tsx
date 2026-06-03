import { AlertCircle, Trash2 } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  details,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="rounded-lg border p-6 max-w-md w-full mx-4 shadow-2xl"
        style={{
          background: "oklch(0.12 0 0)",
          borderColor: isDangerous ? "oklch(0.70 0.18 15 / 0.50)" : "oklch(0.22 0 0)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="p-2 rounded-lg"
            style={{
              background: isDangerous ? "oklch(0.70 0.18 15 / 0.15)" : "oklch(0.85 0.18 95 / 0.15)",
            }}
          >
            {isDangerous ? (
              <AlertCircle size={20} style={{ color: "oklch(0.70 0.18 15)" }} />
            ) : (
              <AlertCircle size={20} style={{ color: "oklch(0.85 0.18 95)" }} />
            )}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-base" style={{ color: "oklch(0.85 0 0)" }}>
              {title}
            </h2>
          </div>
        </div>

        {/* Message */}
        <p className="mb-3" style={{ color: "oklch(0.70 0 0)" }}>
          {message}
        </p>

        {/* Details */}
        {details && (
          <div
            className="rounded p-3 mb-4 text-sm"
            style={{
              background: "oklch(0.10 0 0)",
              borderLeft: `3px solid ${isDangerous ? "oklch(0.70 0.18 15)" : "oklch(0.85 0.18 95)"}`,
              color: "oklch(0.60 0 0)",
            }}
          >
            {details}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              background: "oklch(0.18 0 0)",
              border: "1px solid oklch(0.28 0 0)",
              color: "oklch(0.65 0 0)",
            }}
            onMouseEnter={e => { if (!isLoading) (e.currentTarget.style.color = "oklch(0.85 0 0)"); }}
            onMouseLeave={e => (e.currentTarget.style.color = "oklch(0.65 0 0)")}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
            style={{
              background: isDangerous ? "oklch(0.70 0.18 15)" : "oklch(0.85 0.18 95)",
              color: isDangerous ? "oklch(0.98 0 0)" : "oklch(0.08 0 0)",
            }}
            onMouseEnter={e => {
              if (!isLoading) {
                e.currentTarget.style.background = isDangerous ? "oklch(0.60 0.18 15)" : "oklch(0.70 0.18 95)";
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = isDangerous ? "oklch(0.70 0.18 15)" : "oklch(0.85 0.18 95)";
            }}
          >
            {isDangerous && <Trash2 size={16} />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
