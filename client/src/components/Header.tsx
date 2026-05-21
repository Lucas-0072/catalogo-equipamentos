import { Link, useLocation } from "wouter";
import { Settings, Undo2, Redo2 } from "lucide-react";

const PROCYTEK_LOGO = "/manus-storage/procytek-logo_bf3a0e53.png";

interface HeaderProps {
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export default function Header({ canUndo = false, canRedo = false, onUndo, onRedo }: HeaderProps) {
  const [location] = useLocation();

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{ background: "oklch(0.08 0 0)", borderColor: "oklch(0.85 0.18 95)" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">

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

        {/* Direita: botões + nav */}
        <div className="flex items-center gap-3">

          {/* ── Botões Desfazer / Refazer ── */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Desfazer (Ctrl+Z)"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            style={{
              background: canUndo ? "oklch(0.85 0.18 95 / 0.15)" : "oklch(0.15 0 0)",
              color: canUndo ? "oklch(0.85 0.18 95)" : "oklch(0.40 0 0)",
              border: `1px solid ${canUndo ? "oklch(0.85 0.18 95 / 0.40)" : "oklch(0.22 0 0)"}`,
            }}
            onMouseEnter={e => {
              if (canUndo) {
                (e.currentTarget as HTMLElement).style.background = "oklch(0.85 0.18 95 / 0.25)";
                (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.85 0.18 95 / 0.70)";
              }
            }}
            onMouseLeave={e => {
              if (canUndo) {
                (e.currentTarget as HTMLElement).style.background = "oklch(0.85 0.18 95 / 0.15)";
                (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.85 0.18 95 / 0.40)";
              }
            }}
          >
            <Undo2 size={16} />
            Desfazer
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Refazer (Ctrl+Y)"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            style={{
              background: canRedo ? "oklch(0.85 0.18 95)" : "oklch(0.15 0 0)",
              color: canRedo ? "oklch(0.08 0 0)" : "oklch(0.40 0 0)",
              border: `1px solid ${canRedo ? "oklch(0.85 0.18 95)" : "oklch(0.22 0 0)"}`,
            }}
            onMouseEnter={e => {
              if (canRedo) {
                (e.currentTarget as HTMLElement).style.background = "oklch(0.70 0.18 95)";
              }
            }}
            onMouseLeave={e => {
              if (canRedo) {
                (e.currentTarget as HTMLElement).style.background = "oklch(0.85 0.18 95)";
              }
            }}
          >
            <Redo2 size={16} />
            Refazer
          </button>

          {/* Separador */}
          <div className="w-px h-7 mx-1" style={{ background: "oklch(0.22 0 0)" }} />

          {/* Navegação */}
          <Link
            href="/"
            className="text-sm font-medium transition-colors no-underline px-3 py-2 rounded-md"
            style={{
              color: location === "/" ? "oklch(0.85 0.18 95)" : "oklch(0.65 0 0)",
              background: location === "/" ? "oklch(0.85 0.18 95 / 0.10)" : "transparent",
            }}
          >
            Catálogo
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-md transition-colors no-underline"
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
