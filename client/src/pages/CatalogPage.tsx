import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import Header from "../components/Header";
import EquipamentoCard from "../components/EquipamentoCard";
import { Search, Filter, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";

export default function CatalogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedGrupo, setSelectedGrupo] = useState("");
  const [selectedSubgrupo, setSelectedSubgrupo] = useState("");
  const pageSize = 24;

  const { data: grupos } = trpc.equipamentos.grupos.useQuery();
  const { data: subgrupos } = trpc.equipamentos.subgrupos.useQuery({ grupo: selectedGrupo || undefined });

  const { data, isLoading } = trpc.equipamentos.list.useQuery({
    page,
    pageSize,
    search: search || undefined,
    grupo: selectedGrupo || undefined,
    subgrupo: selectedSubgrupo || undefined,
  });

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleGrupoChange = (g: string) => {
    setSelectedGrupo(g);
    setSelectedSubgrupo("");
    setPage(1);
  };

  const handleSubgrupoChange = (s: string) => {
    setSelectedSubgrupo(s);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setSelectedGrupo("");
    setSelectedSubgrupo("");
    setPage(1);
  };

  const hasFilters = search || selectedGrupo || selectedSubgrupo;

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.10 0 0)" }}>
      <Header />

      {/* Hero */}
      <div className="border-b py-8 px-4" style={{ background: "oklch(0.12 0 0)", borderColor: "oklch(0.20 0 0)" }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-1" style={{ color: "oklch(0.85 0.18 95)" }}>
            Catálogo de Equipamentos
          </h2>
          <p className="text-sm mb-6" style={{ color: "oklch(0.60 0 0)" }}>
            {data?.total ? `${data.total.toLocaleString("pt-BR")} equipamentos cadastrados` : "Carregando..."}
          </p>

          {/* Barra de busca */}
          <div className="flex gap-2 max-w-2xl">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "oklch(0.55 0 0)" }} />
              <input
                type="text"
                placeholder="Buscar por código, referência ou descrição..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: "oklch(0.18 0 0)",
                  border: "1px solid oklch(0.28 0 0)",
                  color: "oklch(0.90 0 0)",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)")}
                onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              style={{ background: "oklch(0.85 0.18 95)", color: "oklch(0.08 0 0)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.70 0.18 95)")}
              onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.85 0.18 95)")}
            >
              Buscar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar de filtros */}
        <aside className="w-56 flex-shrink-0">
          <div className="sticky top-20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "oklch(0.85 0.18 95)" }}>
                <Filter size={14} /> Filtros
              </h3>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs flex items-center gap-1 transition-colors"
                  style={{ color: "oklch(0.65 0 0)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "oklch(0.85 0.18 95)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "oklch(0.65 0 0)")}>
                  <X size={10} /> Limpar
                </button>
              )}
            </div>

            {/* Grupos */}
            <div className="mb-4">
              <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: "oklch(0.55 0 0)" }}>Grupo</p>
              <div className="space-y-1">
                <button
                  onClick={() => handleGrupoChange("")}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg transition-colors"
                  style={{
                    background: !selectedGrupo ? "oklch(0.85 0.18 95 / 0.15)" : "transparent",
                    color: !selectedGrupo ? "oklch(0.85 0.18 95)" : "oklch(0.65 0 0)",
                    border: !selectedGrupo ? "1px solid oklch(0.85 0.18 95 / 0.3)" : "1px solid transparent",
                  }}
                >
                  Todos os grupos
                </button>
                {grupos?.map(g => (
                  <button
                    key={g.grupo}
                    onClick={() => handleGrupoChange(g.grupo!)}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg transition-colors"
                    style={{
                      background: selectedGrupo === g.grupo ? "oklch(0.85 0.18 95 / 0.15)" : "transparent",
                      color: selectedGrupo === g.grupo ? "oklch(0.85 0.18 95)" : "oklch(0.65 0 0)",
                      border: selectedGrupo === g.grupo ? "1px solid oklch(0.85 0.18 95 / 0.3)" : "1px solid transparent",
                    }}
                  >
                    {g.grupoNome || `Grupo ${g.grupo}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Subgrupos */}
            {subgrupos && subgrupos.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: "oklch(0.55 0 0)" }}>Subgrupo</p>
                <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                  <button
                    onClick={() => handleSubgrupoChange("")}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg transition-colors"
                    style={{
                      background: !selectedSubgrupo ? "oklch(0.85 0.18 95 / 0.15)" : "transparent",
                      color: !selectedSubgrupo ? "oklch(0.85 0.18 95)" : "oklch(0.65 0 0)",
                      border: !selectedSubgrupo ? "1px solid oklch(0.85 0.18 95 / 0.3)" : "1px solid transparent",
                    }}
                  >
                    Todos
                  </button>
                  {subgrupos.map(s => (
                    <button
                      key={s.subgrupo}
                      onClick={() => handleSubgrupoChange(s.subgrupo!)}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg transition-colors"
                      style={{
                        background: selectedSubgrupo === s.subgrupo ? "oklch(0.85 0.18 95 / 0.15)" : "transparent",
                        color: selectedSubgrupo === s.subgrupo ? "oklch(0.85 0.18 95)" : "oklch(0.65 0 0)",
                        border: selectedSubgrupo === s.subgrupo ? "1px solid oklch(0.85 0.18 95 / 0.3)" : "1px solid transparent",
                      }}
                    >
                      {s.subgrupoNome || `Sub ${s.subgrupo}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Grid de equipamentos */}
        <main className="flex-1 min-w-0">
          {/* Filtros ativos */}
          {hasFilters && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {search && (
                <span className="text-xs px-3 py-1 rounded-full flex items-center gap-1"
                  style={{ background: "oklch(0.85 0.18 95 / 0.15)", color: "oklch(0.85 0.18 95)", border: "1px solid oklch(0.85 0.18 95 / 0.3)" }}>
                  Busca: "{search}"
                  <button onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}>
                    <X size={10} />
                  </button>
                </span>
              )}
              {selectedGrupo && (
                <span className="text-xs px-3 py-1 rounded-full flex items-center gap-1"
                  style={{ background: "oklch(0.85 0.18 95 / 0.15)", color: "oklch(0.85 0.18 95)", border: "1px solid oklch(0.85 0.18 95 / 0.3)" }}>
                  {grupos?.find(g => g.grupo === selectedGrupo)?.grupoNome || selectedGrupo}
                  <button onClick={() => handleGrupoChange("")}><X size={10} /></button>
                </span>
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
              <button onClick={clearFilters} className="text-sm px-4 py-2 rounded-lg"
                style={{ background: "oklch(0.85 0.18 95)", color: "oklch(0.08 0 0)" }}>
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {data?.items.map((eq: any) => (
                  <EquipamentoCard key={eq.id} equipamento={eq} />
                ))}
              </div>

              {/* Paginação */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t" style={{ borderColor: "oklch(0.20 0 0)" }}>
                  <p className="text-sm" style={{ color: "oklch(0.55 0 0)" }}>
                    Página {data.page} de {data.totalPages} — {data.total.toLocaleString("pt-BR")} itens
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg transition-colors disabled:opacity-30"
                      style={{ background: "oklch(0.18 0 0)", color: "oklch(0.75 0 0)" }}
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                      let p: number;
                      if (data.totalPages <= 5) p = i + 1;
                      else if (page <= 3) p = i + 1;
                      else if (page >= data.totalPages - 2) p = data.totalPages - 4 + i;
                      else p = page - 2 + i;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                          style={{
                            background: page === p ? "oklch(0.85 0.18 95)" : "oklch(0.18 0 0)",
                            color: page === p ? "oklch(0.08 0 0)" : "oklch(0.65 0 0)",
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                      disabled={page === data.totalPages}
                      className="p-2 rounded-lg transition-colors disabled:opacity-30"
                      style={{ background: "oklch(0.18 0 0)", color: "oklch(0.75 0 0)" }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
