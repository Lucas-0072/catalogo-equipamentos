import { Link, useLocation } from "wouter";
import { Settings, Undo2, Redo2 } from "lucide-react";

const PROCYTEK_LOGO = "/manus-storage/procytek-logo_bf3a0e53.png";

interface HeaderProps {
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  showUndoRedo?: boolean;
}

export default function Header({ canUndo, canRedo, onUndo, onRedo, showUndoRedo }: HeaderProps) {
  const [location] = useLocation();

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ background: "oklch(0.08 0 0)", borderColor: "oklch(0.85 0.18 95)" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
        {/* Logo + Título */}
        <Link href="/" className="flex items-center gap-3 no-underline flex-shrink-0">
          <img
            src={PROCYTEK_LOGO}
            alt="Procytek"
            className="h-10 w-10 rounded-lg object-cover"
          />
          <div>
            <h1 className="text-lg font-bold leading-tight" style={{ color: "oklch(0.85 0.18 95)" }}>
              Catálogo de Equipamentos
            </h1>
            <p className="text-xs" style={{ color: "oklch(0.55 0 0)" }}>
              Procytek — Gestão de Produtos
            </p>
          </div>
        </Link>

        {/* Direita: Desfazer/Refazer + Nav */}
        <div className="flex items-center gap-3">
          {/* Botões Desfazer / Refazer */}
          {showUndoRedo && (
            <div className="flex items-center gap-1 border rounded-lg px-1 py-1"
              style={{ borderColor: "oklch(0.25 0 0)", background: "oklch(0.12 0 0)" }}>
              <button
                onClick={onUndo}
                disabled={!canUndo}
                title="Desfazer (Ctrl+Z)"
                className="p-1.5 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: canUndo ? "oklch(0.85 0.18 95)" : "oklch(0.45 0 0)" }}
                onMouseEnter={e => { if (canUndo) (e.currentTarget as HTMLElement).style.background = "oklch(0.85 0.18 95 / 0.15)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <Undo2 size={16} />
              </button>
              <div className="w-px h-4" style={{ background: "oklch(0.25 0 0)" }} />
              <button
                onClick={onRedo}
                disabled={!canRedo}
                title="Refazer (Ctrl+Y)"
                className="p-1.5 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ color: canRedo ? "oklch(0.85 0.18 95)" : "oklch(0.45 0 0)" }}
                onMouseEnter={e => { if (canRedo) (e.currentTarget as HTMLElement).style.background = "oklch(0.85 0.18 95 / 0.15)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <Redo2 size={16} />
              </button>
            </div>
          )}

          {/* Separador */}
          <div className="w-px h-6" style={{ background: "oklch(0.22 0 0)" }} />

          {/* Navegação */}
          <Link
            href="/"
            className="text-sm font-medium transition-colors no-underline px-3 py-1.5 rounded-md"
            style={{
              color: location === "/" ? "oklch(0.85 0.18 95)" : "oklch(0.65 0 0)",
              background: location === "/" ? "oklch(0.85 0.18 95 / 0.10)" : "transparent",
            }}
          >
            Catálogo
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-md transition-colors no-underline"
            style={{ background: "oklch(0.85 0.18 95)", color: "oklch(0.08 0 0)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.70 0.18 95)")}
            onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.85 0.18 95)")}
          >
            <Settings size={14} />
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}
