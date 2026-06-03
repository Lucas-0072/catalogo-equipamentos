import { AlertCircle, Trash2, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-200"
      style={{ opacity: isOpen ? 1 : 0 }}
      onClick={onCancel}
    >
      <div
        className="rounded-lg border p-6 max-w-md w-full mx-4 shadow-2xl transition-all duration-200 transform"
        style={{
          background: "oklch(0.12 0 0)",
          borderColor: isDangerous ? "oklch(0.70 0.18 15 / 0.50)" : "oklch(0.22 0 0)",
          borderWidth: isDangerous ? "2px" : "1px",
          transform: isOpen ? "scale(1) translateY(0)" : "scale(0.95) translateY(-20px)",
          opacity: isOpen ? 1 : 0,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header com ícone destacado */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="p-3 rounded-lg flex-shrink-0 animate-pulse"
            style={{
              background: isDangerous ? "oklch(0.70 0.18 15 / 0.20)" : "oklch(0.85 0.18 95 / 0.15)",
            }}
          >
            {isDangerous ? (
              <AlertTriangle size={24} style={{ color: "oklch(0.70 0.18 15)" }} />
            ) : (
              <AlertCircle size={24} style={{ color: "oklch(0.85 0.18 95)" }} />
            )}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg" style={{ color: isDangerous ? "oklch(0.70 0.18 15)" : "oklch(0.85 0 0)" }}>
              {title}
            </h2>
          </div>
        </div>

        {/* Message */}
        <p className="mb-3 text-base" style={{ color: "oklch(0.70 0 0)" }}>
          {message}
        </p>

        {/* Details com destaque para operações perigosas */}
        {details && (
          <div
            className="rounded p-3 mb-4 text-sm font-medium"
            style={{
              background: isDangerous ? "oklch(0.70 0.18 15 / 0.10)" : "oklch(0.10 0 0)",
              borderLeft: `4px solid ${isDangerous ? "oklch(0.70 0.18 15)" : "oklch(0.85 0.18 95)"}`,
              color: isDangerous ? "oklch(0.70 0.18 15)" : "oklch(0.60 0 0)",
            }}
          >
            {isDangerous && <AlertTriangle size={14} className="inline mr-2" />}
            {details}
          </div>
        )}

        {/* Aviso adicional para exclusão permanente */}
        {isDangerous && (
          <div
            className="rounded p-3 mb-4 text-xs flex items-start gap-2"
            style={{
              background: "oklch(0.70 0.18 15 / 0.08)",
              border: "1px dashed oklch(0.70 0.18 15 / 0.40)",
              color: "oklch(0.65 0.18 15)",
            }}
          >
            <Trash2 size={14} className="flex-shrink-0 mt-0.5" />
            <span>Esta ação é <strong>irreversível</strong> e não pode ser desfeita.</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 duration-150"
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
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2 duration-150"
            style={{
              background: isDangerous ? "oklch(0.70 0.18 15)" : "oklch(0.85 0.18 95)",
              color: isDangerous ? "oklch(0.98 0 0)" : "oklch(0.08 0 0)",
              boxShadow: isDangerous ? "0 0 12px oklch(0.70 0.18 15 / 0.30)" : "none",
            }}
            onMouseEnter={e => {
              if (!isLoading) {
                e.currentTarget.style.background = isDangerous ? "oklch(0.60 0.18 15)" : "oklch(0.70 0.18 95)";
                e.currentTarget.style.boxShadow = isDangerous ? "0 0 16px oklch(0.70 0.18 15 / 0.50)" : "none";
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = isDangerous ? "oklch(0.70 0.18 15)" : "oklch(0.85 0.18 95)";
              e.currentTarget.style.boxShadow = isDangerous ? "0 0 12px oklch(0.70 0.18 15 / 0.30)" : "none";
            }}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processando...
              </>
            ) : (
              <>
                {isDangerous && <Trash2 size={16} />}
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
