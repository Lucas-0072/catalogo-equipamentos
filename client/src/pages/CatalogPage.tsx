import { useState, useCallback } from "react";
import { useUndoRedo } from "../hooks/useUndoRedo";
import { trpc } from "@/lib/trpc";
import Header from "../components/Header";
import EquipamentoCard from "../components/EquipamentoCard";
import { Search, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, X, Hash, FileText, SlidersHorizontal, Plus } from "lucide-react";
import { useRef } from "react";
import NovoEquipamentoModal from "../components/NovoEquipamentoModal";

// ── Componentes auxiliares ──────────────────────────────────────────────────

function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all"
      style={{
        background: active ? "oklch(0.85 0.18 95)" : "oklch(0.16 0 0)",
        color: active ? "oklch(0.08 0 0)" : "oklch(0.70 0 0)",
        border: `1px solid ${active ? "oklch(0.85 0.18 95)" : "oklch(0.24 0 0)"}`,
      }}
    >
      {label}
    </button>
  );
}

function ActiveTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        background: "oklch(0.85 0.18 95 / 0.15)",
        color: "oklch(0.85 0.18 95)",
        border: "1px solid oklch(0.85 0.18 95 / 0.35)",
      }}
    >
      {label}
      <button onClick={onRemove} className="opacity-70 hover:opacity-100 transition-opacity">
        <X size={10} />
      </button>
    </span>
  );
}

// ── Painel de filtros (usado no desktop sidebar e no drawer mobile) ──────────

function FilterPanel({
  grupos, subgrupos, selectedGrupo, selectedSubgrupo,
  hasFilters, onGrupoChange, onSubgrupoChange, onClearFilters,
  onClose,
}: {
  grupos: any[]; subgrupos: any[];
  selectedGrupo: string; selectedSubgrupo: string;
  hasFilters: boolean;
  onGrupoChange: (g: string) => void;
  onSubgrupoChange: (s: string) => void;
  onClearFilters: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "oklch(0.85 0.18 95)" }}>
          <Filter size={14} /> Filtros
        </h3>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs flex items-center gap-1 transition-colors"
              style={{ color: "oklch(0.65 0 0)" }}
            >
              <X size={10} /> Limpar
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-1 rounded-md" style={{ color: "oklch(0.55 0 0)" }}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Grupos */}
      <div>
        <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: "oklch(0.55 0 0)" }}>
          Grupo
        </p>
        <div className="space-y-1">
          <FilterBtn label="Todos os grupos" active={!selectedGrupo} onClick={() => { onGrupoChange(""); onClose?.(); }} />
          {grupos?.map(g => (
            <FilterBtn
              key={g.grupo}
              label={`${g.grupo} — ${g.grupoNome}`}
              active={selectedGrupo === g.grupo}
              onClick={() => { onGrupoChange(g.grupo!); onClose?.(); }}
            />
          ))}
        </div>
      </div>

      {/* Subgrupos */}
      {subgrupos && subgrupos.length > 0 && (
        <div>
          <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: "oklch(0.55 0 0)" }}>
            Subgrupo
          </p>
          <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
            <FilterBtn label="Todos" active={!selectedSubgrupo} onClick={() => { onSubgrupoChange(""); onClose?.(); }} />
            {subgrupos.map(s => (
              <FilterBtn
                key={s.subgrupo}
                label={s.subgrupoNome || s.subgrupo || ""}
                active={selectedSubgrupo === s.subgrupo}
                onClick={() => { onSubgrupoChange(s.subgrupo!); onClose?.(); }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ────────────────────────────────────────────────────────

export default function CatalogPage() {
  const [page, setPage] = useState(1);
  const [searchNome, setSearchNome] = useState("");
  const [searchCodigo, setSearchCodigo] = useState("");
  const [searchNomeInput, setSearchNomeInput] = useState("");
  const [searchCodigoInput, setSearchCodigoInput] = useState("");
  const [selectedGrupo, setSelectedGrupo] = useState("");
  const [selectedSubgrupo, setSelectedSubgrupo] = useState("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [novoModalOpen, setNovoModalOpen] = useState(false);

  const [pageSize, setPageSize] = useState(24);
  const [goToPage, setGoToPage] = useState("");
  const mainRef = useRef<HTMLDivElement>(null);

  const { canUndo, canRedo, undo, redo } = useUndoRedo();
  const utils = trpc.useUtils();

  const scrollToTop = () => {
    mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goToPageNum = (p: number, total: number) => {
    const clamped = Math.max(1, Math.min(p, total));
    setPage(clamped);
    setGoToPage("");
    scrollToTop();
  };

  const { data: grupos } = trpc.equipamentos.grupos.useQuery();
  const { data: subgrupos } = trpc.equipamentos.subgrupos.useQuery({ grupo: selectedGrupo || undefined });
  const { data, isLoading } = trpc.equipamentos.list.useQuery({
    page, pageSize,
    searchNome: searchNome || undefined,
    searchCodigo: searchCodigo || undefined,
    grupo: selectedGrupo || undefined,
    subgrupo: selectedSubgrupo || undefined,
  });

  const applySearch = useCallback(() => {
    setSearchNome(searchNomeInput.trim());
    setSearchCodigo(searchCodigoInput.trim());
    setPage(1);
    scrollToTop();
  }, [searchNomeInput, searchCodigoInput]);

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") applySearch(); };

  const handleGrupoChange = (g: string) => { setSelectedGrupo(g); setSelectedSubgrupo(""); setPage(1); };
  const handleSubgrupoChange = (s: string) => { setSelectedSubgrupo(s); setPage(1); };

  const clearFilters = () => {
    setSearchNome(""); setSearchCodigo("");
    setSearchNomeInput(""); setSearchCodigoInput("");
    setSelectedGrupo(""); setSelectedSubgrupo("");
    setPage(1);
  };

  const hasFilters = !!(searchNome || searchCodigo || selectedGrupo || selectedSubgrupo);

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.10 0 0)" }}>
      <Header canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} />

      {/* Hero / Busca */}
      <div className="border-b py-5 px-4" style={{ background: "oklch(0.12 0 0)", borderColor: "oklch(0.20 0 0)" }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: "oklch(0.85 0.18 95)" }}>
            Catálogo de Equipamentos
          </h2>
          <p className="text-sm mb-4" style={{ color: "oklch(0.60 0 0)" }}>
            {data?.total !== undefined
              ? `${data.total.toLocaleString("pt-BR")} equipamentos encontrados`
              : "Carregando..."}
          </p>

          {/* Linha: busca + botão novo */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          {/* Campos de busca */}
          <div className="flex flex-col sm:flex-row gap-2 flex-1 max-w-3xl">
            <div className="flex-1 relative">
              <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "oklch(0.55 0 0)" }} />
              <input
                type="text"
                placeholder="Buscar por nome / descrição..."
                value={searchNomeInput}
                onChange={e => setSearchNomeInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{ background: "oklch(0.18 0 0)", border: "1px solid oklch(0.28 0 0)", color: "oklch(0.90 0 0)" }}
                onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)")}
                onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
              />
            </div>
            <div className="flex-1 relative">
              <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "oklch(0.55 0 0)" }} />
              <input
                type="text"
                placeholder="Buscar por código..."
                value={searchCodigoInput}
                onChange={e => setSearchCodigoInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{ background: "oklch(0.18 0 0)", border: "1px solid oklch(0.28 0 0)", color: "oklch(0.90 0 0)" }}
                onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)")}
                onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
              />
            </div>
            <button
              onClick={applySearch}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 flex-shrink-0"
              style={{ background: "oklch(0.85 0.18 95)", color: "oklch(0.08 0 0)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.70 0.18 95)")}
              onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.85 0.18 95)")}
            >
              <Search size={15} /> Buscar
            </button>
          </div>

          {/* Botão Novo Equipamento */}
          <button
            onClick={() => setNovoModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex-shrink-0 active:scale-95"
            style={{
              background: "oklch(0.08 0 0)",
              border: "2px solid oklch(0.85 0.18 95)",
              color: "oklch(0.85 0.18 95)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "oklch(0.85 0.18 95)";
              e.currentTarget.style.color = "oklch(0.08 0 0)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "oklch(0.08 0 0)";
              e.currentTarget.style.color = "oklch(0.85 0.18 95)";
            }}
          >
            <Plus size={16} />
            Novo Equipamento
          </button>
          </div>
        </div>
      </div>

      {/* Barra mobile de filtros */}
      <div className="md:hidden px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "oklch(0.20 0 0)" }}>
        <button
          onClick={() => setFilterDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium flex-1 justify-center transition-colors"
          style={{
            background: hasFilters ? "oklch(0.85 0.18 95 / 0.15)" : "oklch(0.16 0 0)",
            border: `1px solid ${hasFilters ? "oklch(0.85 0.18 95 / 0.40)" : "oklch(0.24 0 0)"}`,
            color: hasFilters ? "oklch(0.85 0.18 95)" : "oklch(0.70 0 0)",
          }}
        >
          <SlidersHorizontal size={15} />
          Filtros
          {hasFilters && (
            <span
              className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
              style={{ background: "oklch(0.85 0.18 95)", color: "oklch(0.08 0 0)" }}
            >
              {[searchNome, searchCodigo, selectedGrupo, selectedSubgrupo].filter(Boolean).length}
            </span>
          )}
        </button>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ background: "oklch(0.16 0 0)", border: "1px solid oklch(0.24 0 0)", color: "oklch(0.55 0 0)" }}
          >
            <X size={14} /> Limpar
          </button>
        )}
      </div>

      {/* Drawer de filtros mobile */}
      {filterDrawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="md:hidden fixed inset-0 z-40"
            style={{ background: "oklch(0 0 0 / 0.60)" }}
            onClick={() => setFilterDrawerOpen(false)}
          />
          {/* Drawer */}
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl overflow-y-auto"
            style={{
              background: "oklch(0.12 0 0)",
              border: "1px solid oklch(0.85 0.18 95 / 0.25)",
              maxHeight: "80vh",
              padding: "20px 16px 32px",
            }}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "oklch(0.30 0 0)" }} />
            <FilterPanel
              grupos={grupos ?? []}
              subgrupos={subgrupos ?? []}
              selectedGrupo={selectedGrupo}
              selectedSubgrupo={selectedSubgrupo}
              hasFilters={hasFilters}
              onGrupoChange={handleGrupoChange}
              onSubgrupoChange={handleSubgrupoChange}
              onClearFilters={clearFilters}
              onClose={() => setFilterDrawerOpen(false)}
            />
          </div>
        </>
      )}

      {/* Layout principal */}
      <div className="max-w-7xl mx-auto px-4 py-5 flex gap-6">

        {/* Sidebar desktop */}
        <aside className="hidden md:block w-60 flex-shrink-0">
          <div className="sticky top-20">
            <FilterPanel
              grupos={grupos ?? []}
              subgrupos={subgrupos ?? []}
              selectedGrupo={selectedGrupo}
              selectedSubgrupo={selectedSubgrupo}
              hasFilters={hasFilters}
              onGrupoChange={handleGrupoChange}
              onSubgrupoChange={handleSubgrupoChange}
              onClearFilters={clearFilters}
            />
          </div>
        </aside>

        {/* Grid de equipamentos */}
        <main className="flex-1 min-w-0" ref={mainRef}>
          {/* Tags de filtros ativos */}
          {hasFilters && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {searchNome && (
                <ActiveTag label={`Nome: "${searchNome}"`} onRemove={() => { setSearchNome(""); setSearchNomeInput(""); setPage(1); }} />
              )}
              {searchCodigo && (
                <ActiveTag label={`Código: "${searchCodigo}"`} onRemove={() => { setSearchCodigo(""); setSearchCodigoInput(""); setPage(1); }} />
              )}
              {selectedGrupo && (
                <ActiveTag
                  label={`Grupo: ${selectedGrupo} — ${grupos?.find(g => g.grupo === selectedGrupo)?.grupoNome ?? ""}`}
                  onRemove={() => handleGrupoChange("")}
                />
              )}
              {selectedSubgrupo && (
                <ActiveTag
                  label={`Sub: ${subgrupos?.find(s => s.subgrupo === selectedSubgrupo)?.subgrupoNome ?? selectedSubgrupo}`}
                  onRemove={() => handleSubgrupoChange("")}
                />
              )}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin" style={{ color: "oklch(0.85 0.18 95)" }} />
            </div>
          ) : data?.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Search size={40} style={{ color: "oklch(0.35 0 0)" }} />
              <p style={{ color: "oklch(0.55 0 0)" }}>Nenhum equipamento encontrado</p>
              <button
                onClick={clearFilters}
                className="text-sm px-4 py-2 rounded-lg"
                style={{ background: "oklch(0.85 0.18 95)", color: "oklch(0.08 0 0)" }}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              {/* Grid responsivo: 1 col mobile, 2 sm, 3 lg, 4 xl */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {data?.items.map((eq: any) => (
                  <EquipamentoCard
                    key={eq.id}
                    equipamento={eq}
                    onDeleted={() => utils.equipamentos.list.invalidate()}
                    onUpdated={() => utils.equipamentos.list.invalidate()}
                  />
                ))}
              </div>

              {/* Paginação aprimorada */}
              {data && data.totalPages > 1 && (
                <div
                  className="mt-8 pt-6 border-t flex flex-col gap-4"
                  style={{ borderColor: "oklch(0.20 0 0)" }}
                >
                  {/* Linha superior: info + seletor de itens por página */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-sm" style={{ color: "oklch(0.55 0 0)" }}>
                      Mostrando{" "}
                      <span style={{ color: "oklch(0.85 0.18 95)", fontWeight: 600 }}>
                        {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, data.total)}
                      </span>
                      {" "}de{" "}
                      <span style={{ color: "oklch(0.85 0.18 95)", fontWeight: 600 }}>
                        {data.total.toLocaleString("pt-BR")}
                      </span>
                      {" "}equipamentos
                    </p>

                    {/* Seletor de itens por página */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "oklch(0.50 0 0)" }}>Itens por página:</span>
                      <div className="flex gap-1">
                        {[12, 24, 48, 96].map(size => (
                          <button
                            key={size}
                            onClick={() => { setPageSize(size); setPage(1); scrollToTop(); }}
                            className="px-2.5 py-1 rounded text-xs font-medium transition-colors"
                            style={{
                              background: pageSize === size ? "oklch(0.85 0.18 95)" : "oklch(0.18 0 0)",
                              color: pageSize === size ? "oklch(0.08 0 0)" : "oklch(0.55 0 0)",
                              border: `1px solid ${pageSize === size ? "oklch(0.85 0.18 95)" : "oklch(0.26 0 0)"}`,
                            }}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  <div className="w-full rounded-full overflow-hidden" style={{ height: 3, background: "oklch(0.20 0 0)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(page / data.totalPages) * 100}%`,
                        background: "oklch(0.85 0.18 95)",
                      }}
                    />
                  </div>

                  {/* Linha inferior: navegação */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">

                    {/* Botões de navegação */}
                    <div className="flex items-center gap-1">
                      {/* Primeira página */}
                      <button
                        onClick={() => goToPageNum(1, data.totalPages)}
                        disabled={page === 1}
                        title="Primeira página"
                        className="p-2 rounded-lg transition-colors disabled:opacity-30"
                        style={{ background: "oklch(0.18 0 0)", color: "oklch(0.65 0 0)" }}
                        onMouseEnter={e => { if (page !== 1) e.currentTarget.style.color = "oklch(0.85 0.18 95)"; }}
                        onMouseLeave={e => (e.currentTarget.style.color = "oklch(0.65 0 0)")}
                      >
                        <ChevronsLeft size={16} />
                      </button>

                      {/* Página anterior */}
                      <button
                        onClick={() => goToPageNum(page - 1, data.totalPages)}
                        disabled={page === 1}
                        title="Página anterior"
                        className="p-2 rounded-lg transition-colors disabled:opacity-30"
                        style={{ background: "oklch(0.18 0 0)", color: "oklch(0.65 0 0)" }}
                        onMouseEnter={e => { if (page !== 1) e.currentTarget.style.color = "oklch(0.85 0.18 95)"; }}
                        onMouseLeave={e => (e.currentTarget.style.color = "oklch(0.65 0 0)")}
                      >
                        <ChevronLeft size={16} />
                      </button>

                      {/* Números de página com elipses */}
                      {(() => {
                        const total = data.totalPages;
                        const delta = 2;
                        const range: (number | "...")[] = [];
                        const pages = new Set<number>();
                        pages.add(1);
                        pages.add(total);
                        for (let i = Math.max(2, page - delta); i <= Math.min(total - 1, page + delta); i++) pages.add(i);
                        const sorted = Array.from(pages).sort((a, b) => a - b);
                        let prev = 0;
                        for (const p of sorted) {
                          if (p - prev > 1) range.push("...");
                          range.push(p);
                          prev = p;
                        }
                        return range.map((item, idx) =>
                          item === "..." ? (
                            <span key={`ellipsis-${idx}`} className="px-1 text-sm" style={{ color: "oklch(0.40 0 0)" }}>…</span>
                          ) : (
                            <button
                              key={item}
                              onClick={() => goToPageNum(item as number, data.totalPages)}
                              className="w-9 h-9 rounded-lg text-sm font-medium transition-all active:scale-95"
                              style={{
                                background: page === item ? "oklch(0.85 0.18 95)" : "oklch(0.18 0 0)",
                                color: page === item ? "oklch(0.08 0 0)" : "oklch(0.65 0 0)",
                                border: `1px solid ${page === item ? "oklch(0.85 0.18 95)" : "oklch(0.26 0 0)"}`,
                                fontWeight: page === item ? 700 : 400,
                              }}
                            >
                              {item}
                            </button>
                          )
                        );
                      })()}

                      {/* Próxima página */}
                      <button
                        onClick={() => goToPageNum(page + 1, data.totalPages)}
                        disabled={page === data.totalPages}
                        title="Próxima página"
                        className="p-2 rounded-lg transition-colors disabled:opacity-30"
                        style={{ background: "oklch(0.18 0 0)", color: "oklch(0.65 0 0)" }}
                        onMouseEnter={e => { if (page !== data.totalPages) e.currentTarget.style.color = "oklch(0.85 0.18 95)"; }}
                        onMouseLeave={e => (e.currentTarget.style.color = "oklch(0.65 0 0)")}
                      >
                        <ChevronRight size={16} />
                      </button>

                      {/* Última página */}
                      <button
                        onClick={() => goToPageNum(data.totalPages, data.totalPages)}
                        disabled={page === data.totalPages}
                        title="Última página"
                        className="p-2 rounded-lg transition-colors disabled:opacity-30"
                        style={{ background: "oklch(0.18 0 0)", color: "oklch(0.65 0 0)" }}
                        onMouseEnter={e => { if (page !== data.totalPages) e.currentTarget.style.color = "oklch(0.85 0.18 95)"; }}
                        onMouseLeave={e => (e.currentTarget.style.color = "oklch(0.65 0 0)")}
                      >
                        <ChevronsRight size={16} />
                      </button>
                    </div>

                    {/* Campo "Ir para página" */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs hidden sm:inline" style={{ color: "oklch(0.50 0 0)" }}>Ir para:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          max={data.totalPages}
                          value={goToPage}
                          onChange={e => setGoToPage(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter" && goToPage) {
                              goToPageNum(Number(goToPage), data.totalPages);
                            }
                          }}
                          placeholder={String(page)}
                          className="w-16 text-center text-sm rounded-lg outline-none"
                          style={{
                            background: "oklch(0.18 0 0)",
                            border: "1px solid oklch(0.28 0 0)",
                            color: "oklch(0.85 0 0)",
                            padding: "6px 8px",
                          }}
                          onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)")}
                          onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
                        />
                        <span className="text-xs" style={{ color: "oklch(0.40 0 0)" }}>/ {data.totalPages}</span>
                        <button
                          onClick={() => goToPage && goToPageNum(Number(goToPage), data.totalPages)}
                          disabled={!goToPage}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-30"
                          style={{ background: "oklch(0.85 0.18 95)", color: "oklch(0.08 0 0)" }}
                          onMouseEnter={e => { if (goToPage) e.currentTarget.style.background = "oklch(0.70 0.18 95)"; }}
                          onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.85 0.18 95)")}
                        >
                          Ir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal de Novo Equipamento */}
      {novoModalOpen && (
        <NovoEquipamentoModal
          onClose={() => setNovoModalOpen(false)}
          onCreated={() => {
            utils.equipamentos.list.invalidate();
            utils.equipamentos.grupos.invalidate();
            utils.equipamentos.subgrupos.invalidate();
          }}
        />
      )}
    </div>
  );
}
