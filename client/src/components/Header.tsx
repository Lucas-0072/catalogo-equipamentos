import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Settings, Undo2, Redo2, Menu, X, LayoutGrid } from "lucide-react";

const PROCYTEK_LOGO = "/manus-storage/procytek-logo_bf3a0e53.png";

interface HeaderProps {
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export default function Header({ canUndo = false, canRedo = false, onUndo, onRedo }: HeaderProps) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b"
        style={{ background: "oklch(0.08 0 0)", borderColor: "oklch(0.85 0.18 95)" }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">

          {/* Logo + Título */}
          <Link href="/" className="flex items-center gap-2 no-underline flex-shrink-0" onClick={() => setMenuOpen(false)}>
            <img
              src={PROCYTEK_LOGO}
              alt="Procytek"
              className="h-9 w-9 rounded-lg object-cover flex-shrink-0"
            />
            <div className="hidden sm:block">
              <h1 className="text-base font-bold leading-tight" style={{ color: "oklch(0.85 0.18 95)" }}>
                Catálogo de Equipamentos
              </h1>
              <p className="text-xs" style={{ color: "oklch(0.55 0 0)" }}>
                Procytek — Catálogo de Equipamentos
              </p>
            </div>
            <div className="block sm:hidden">
              <h1 className="text-sm font-bold leading-tight" style={{ color: "oklch(0.85 0.18 95)" }}>
                Catálogo
              </h1>
              <p className="text-xs" style={{ color: "oklch(0.55 0 0)" }}>Procytek</p>
            </div>
          </Link>

          {/* Desktop: botões + nav */}
          <div className="hidden md:flex items-center gap-2">
            {/* Desfazer */}
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Desfazer (Ctrl+Z)"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
              style={{
                background: canUndo ? "oklch(0.85 0.18 95 / 0.15)" : "oklch(0.15 0 0)",
                color: canUndo ? "oklch(0.85 0.18 95)" : "oklch(0.40 0 0)",
                border: `1px solid ${canUndo ? "oklch(0.85 0.18 95 / 0.40)" : "oklch(0.22 0 0)"}`,
              }}
            >
              <Undo2 size={15} />
              Desfazer
            </button>

            {/* Refazer */}
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Refazer (Ctrl+Y)"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
              style={{
                background: canRedo ? "oklch(0.85 0.18 95)" : "oklch(0.15 0 0)",
                color: canRedo ? "oklch(0.08 0 0)" : "oklch(0.40 0 0)",
                border: `1px solid ${canRedo ? "oklch(0.85 0.18 95)" : "oklch(0.22 0 0)"}`,
              }}
            >
              <Redo2 size={15} />
              Refazer
            </button>

            <div className="w-px h-6 mx-1" style={{ background: "oklch(0.22 0 0)" }} />

            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-medium transition-colors no-underline px-3 py-2 rounded-md"
              style={{
                color: location === "/" ? "oklch(0.85 0.18 95)" : "oklch(0.65 0 0)",
                background: location === "/" ? "oklch(0.85 0.18 95 / 0.10)" : "transparent",
              }}
            >
              <LayoutGrid size={14} />
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

          {/* Mobile: undo/redo compactos + hamburguer */}
          <div className="flex md:hidden items-center gap-2">
            {/* Desfazer ícone */}
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Desfazer"
              className="p-2 rounded-lg transition-all disabled:opacity-30 active:scale-95"
              style={{
                background: canUndo ? "oklch(0.85 0.18 95 / 0.15)" : "oklch(0.15 0 0)",
                color: canUndo ? "oklch(0.85 0.18 95)" : "oklch(0.40 0 0)",
                border: `1px solid ${canUndo ? "oklch(0.85 0.18 95 / 0.40)" : "oklch(0.22 0 0)"}`,
              }}
            >
              <Undo2 size={16} />
            </button>

            {/* Refazer ícone */}
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Refazer"
              className="p-2 rounded-lg transition-all disabled:opacity-30 active:scale-95"
              style={{
                background: canRedo ? "oklch(0.85 0.18 95)" : "oklch(0.15 0 0)",
                color: canRedo ? "oklch(0.08 0 0)" : "oklch(0.40 0 0)",
                border: `1px solid ${canRedo ? "oklch(0.85 0.18 95)" : "oklch(0.22 0 0)"}`,
              }}
            >
              <Redo2 size={16} />
            </button>

            {/* Hamburguer */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-2 rounded-lg transition-colors"
              style={{
                background: menuOpen ? "oklch(0.85 0.18 95 / 0.15)" : "oklch(0.15 0 0)",
                color: "oklch(0.85 0.18 95)",
                border: "1px solid oklch(0.22 0 0)",
              }}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Menu mobile dropdown */}
      {menuOpen && (
        <div
          className="md:hidden fixed top-[57px] left-0 right-0 z-40 border-b"
          style={{
            background: "oklch(0.10 0 0)",
            borderColor: "oklch(0.85 0.18 95 / 0.30)",
          }}
        >
          <div className="flex flex-col p-4 gap-2">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl no-underline font-medium text-sm transition-colors"
              style={{
                background: location === "/" ? "oklch(0.85 0.18 95 / 0.12)" : "oklch(0.14 0 0)",
                color: location === "/" ? "oklch(0.85 0.18 95)" : "oklch(0.75 0 0)",
                border: `1px solid ${location === "/" ? "oklch(0.85 0.18 95 / 0.30)" : "oklch(0.22 0 0)"}`,
              }}
            >
              <LayoutGrid size={16} />
              Catálogo de Equipamentos
            </Link>

            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl no-underline font-semibold text-sm transition-colors"
              style={{
                background: "oklch(0.85 0.18 95)",
                color: "oklch(0.08 0 0)",
              }}
            >
              <Settings size={16} />
              Painel Admin — Fornecedores
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
