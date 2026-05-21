import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import Header from "../components/Header";
import { useUndoRedo } from "../hooks/useUndoRedo";
import {
  Plus, Trash2, Save, Building2, Loader2, X, Upload, FileSpreadsheet,
  CheckCircle2, AlertCircle, RefreshCw, History, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

// ── Tipos ────────────────────────────────────────────────────────────────────

interface SyncResult {
  syncId: number;
  adicionados: number;
  atualizados: number;
  ignorados: number;
  erros: number;
  total: number;
}

interface SyncHistoryItem {
  id: number;
  fileName: string;
  status: "processing" | "completed" | "error";
  totalRows: number | null;
  adicionados: number | null;
  atualizados: number | null;
  ignorados: number | null;
  erros: number | null;
  detalhes: string | null;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function AdminPage() {
  const { canUndo, canRedo, undo, redo, pushAction } = useUndoRedo();
  const utils = trpc.useUtils();

  const { data: fornecedores, isLoading } = trpc.fornecedores.list.useQuery();
  const { data: syncHistoryData, refetch: refetchHistory } = trpc.equipamentos.syncHistoryList.useQuery();

  const createMutation = trpc.fornecedores.create.useMutation({
    onSuccess: () => utils.fornecedores.list.invalidate(),
  });
  const updateMutation = trpc.fornecedores.update.useMutation({
    onSuccess: () => utils.fornecedores.list.invalidate(),
  });
  const deleteMutation = trpc.fornecedores.delete.useMutation({
    onSuccess: () => utils.fornecedores.list.invalidate(),
  });
  const syncMutation = trpc.equipamentos.syncExcel.useMutation();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", contato: "", email: "", telefone: "" });
  const [saving, setSaving] = useState(false);

  // Estado de sincronização
  const [syncStep, setSyncStep] = useState<"idle" | "reading" | "sending" | "done" | "error">("idle");
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    if (!form.nome.trim()) return;
    setSaving(true);
    try {
      const result = await createMutation.mutateAsync(form);
      pushAction({
        label: `Criar fornecedor "${form.nome}"`,
        undo: async () => { await deleteMutation.mutateAsync({ id: result.id }); },
        redo: async () => { await createMutation.mutateAsync(form); },
      });
      toast.success(`Fornecedor "${form.nome}" criado com sucesso!`);
      setForm({ nome: "", contato: "", email: "", telefone: "" });
      setShowForm(false);
    } catch {
      toast.error("Erro ao criar fornecedor");
    }
    setSaving(false);
  };

  const handleDelete = async (id: number, nome: string) => {
    if (!confirm(`Deseja remover o fornecedor "${nome}"?`)) return;
    const forn = fornecedores?.find(f => f.id === id);
    await deleteMutation.mutateAsync({ id });
    pushAction({
      label: `Remover fornecedor "${nome}"`,
      undo: async () => {
        if (forn) await createMutation.mutateAsync({ nome: forn.nome, contato: forn.contato ?? undefined, email: forn.email ?? undefined, telefone: forn.telefone ?? undefined });
      },
      redo: async () => { await deleteMutation.mutateAsync({ id }); },
    });
    toast.success(`Fornecedor "${nome}" removido.`);
  };

  // ── Sincronização com Excel ───────────────────────────────────────────────

  const parseExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const bytes = new Uint8Array(arrayBuffer);
          const XLSX = await import("xlsx");
          const workbook = XLSX.read(bytes, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
          const headers = rawData[0] as string[];
          const rows = rawData.slice(1).map(row => {
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => {
              obj[String(h).trim()] = row[i] !== undefined && row[i] !== null ? String(row[i]).trim() : "";
            });
            return obj;
          }).filter(row => row["CODIGO"] && row["CODIGO"] !== "");
          resolve(rows);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    setSyncStep("idle");
    setSyncResult(null);
    setSyncError(null);
    setSyncProgress(0);
  };

  const handleSync = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setSyncStep("reading");
    setSyncProgress(10);
    setSyncError(null);
    setSyncResult(null);

    try {
      // 1. Ler e parsear o arquivo
      const rawRows = await parseExcelFile(file);
      setSyncProgress(30);

      // 2. Mapear colunas para o formato esperado pelo backend
      const rows = rawRows.map((r: Record<string, string>) => ({
        codigo: String(r["CODIGO"] ?? "").trim(),
        referencia: String(r["REFERENCIA"] ?? "").trim() || null,
        descricao: String(r["DESCRICAO"] ?? "").trim(),
        unidade: String(r["UN"] ?? "").trim() || null,
        idTipo: String(r["ID"] ?? "").trim() || null,
        grupo: String(r["GRUPO"] ?? "").trim() || null,
        subgrupo: String(r["SUBGRUPO"] ?? "").trim() || null,
        ncm: String(r["NBM/NCM"] ?? "").trim() || null,
        ipi: String(r["%IPI"] ?? "").trim() || null,
      })).filter(r => r.codigo);

      setSyncProgress(50);
      setSyncStep("sending");

      // 3. Enviar tudo de uma vez para o backend com histórico
      const result = await syncMutation.mutateAsync({
        fileName: file.name,
        rows,
      });

      setSyncProgress(100);
      setSyncStep("done");
      setSyncResult(result);

      // Invalidar o catálogo para refletir as mudanças
      utils.equipamentos.list.invalidate();
      utils.equipamentos.grupos.invalidate();
      utils.equipamentos.subgrupos.invalidate();
      refetchHistory();

      toast.success(`Sincronização concluída! ${result.adicionados} adicionados, ${result.atualizados} atualizados.`);
    } catch (err: any) {
      setSyncStep("error");
      setSyncError(err?.message ?? "Erro desconhecido durante a sincronização.");
      toast.error("Erro na sincronização com a planilha.");
      refetchHistory();
    }
  };

  const resetSync = () => {
    setSyncStep("idle");
    setSyncResult(null);
    setSyncError(null);
    setSyncProgress(0);
    setSelectedFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isSyncing = syncStep === "reading" || syncStep === "sending";

  const formatDate = (d: Date | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.10 0 0)" }}>
      <Header canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} />

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">

        {/* ── Cabeçalho ── */}
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "oklch(0.85 0.18 95)" }}>Painel Admin</h2>
          <p className="text-sm mt-1" style={{ color: "oklch(0.55 0 0)" }}>Gerencie fornecedores e sincronize a planilha de equipamentos</p>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SEÇÃO: Sincronização com Excel
        ══════════════════════════════════════════════════════════════════ */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: "oklch(0.85 0.18 95 / 0.35)", background: "oklch(0.12 0 0)" }}
        >
          {/* Cabeçalho da seção */}
          <div
            className="px-5 py-4 border-b flex items-center gap-3"
            style={{ background: "oklch(0.85 0.18 95 / 0.08)", borderColor: "oklch(0.85 0.18 95 / 0.25)" }}
          >
            <div className="p-2 rounded-lg" style={{ background: "oklch(0.85 0.18 95 / 0.15)" }}>
              <FileSpreadsheet size={18} style={{ color: "oklch(0.85 0.18 95)" }} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold" style={{ color: "oklch(0.85 0.18 95)" }}>
                Sincronizar com Planilha Excel
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "oklch(0.60 0 0)" }}>
                Faça upload da planilha atualizada — o catálogo é atualizado automaticamente
              </p>
            </div>
            {/* Botão histórico */}
            <button
              onClick={() => setShowHistory(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: "oklch(0.18 0 0)", border: "1px solid oklch(0.28 0 0)", color: "oklch(0.65 0 0)" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95 / 0.40)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
            >
              <History size={13} />
              Histórico
              {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          <div className="p-5 space-y-4">

            {/* Área de upload */}
            {syncStep !== "done" && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="excel-upload"
                />
                <label
                  htmlFor="excel-upload"
                  className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all"
                  style={{
                    borderColor: selectedFileName ? "oklch(0.85 0.18 95 / 0.60)" : "oklch(0.28 0 0)",
                    background: selectedFileName ? "oklch(0.85 0.18 95 / 0.05)" : "oklch(0.14 0 0)",
                  }}
                  onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.85 0.18 95)"; }}
                  onDragLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = selectedFileName ? "oklch(0.85 0.18 95 / 0.60)" : "oklch(0.28 0 0)"; }}
                  onDrop={e => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    if (f && (f.name.endsWith(".xlsx") || f.name.endsWith(".xls"))) {
                      setSelectedFileName(f.name);
                      setSyncStep("idle");
                      setSyncResult(null);
                      setSyncError(null);
                      setSyncProgress(0);
                      // Atribuir ao input file para uso posterior
                      const dt = new DataTransfer();
                      dt.items.add(f);
                      if (fileInputRef.current) fileInputRef.current.files = dt.files;
                    }
                    (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.85 0.18 95 / 0.60)";
                  }}
                >
                  {selectedFileName ? (
                    <>
                      <FileSpreadsheet size={28} style={{ color: "oklch(0.85 0.18 95)" }} />
                      <div className="text-center">
                        <p className="text-sm font-semibold" style={{ color: "oklch(0.85 0.18 95)" }}>
                          {selectedFileName}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "oklch(0.55 0 0)" }}>
                          Clique para trocar o arquivo
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload size={28} style={{ color: "oklch(0.45 0 0)" }} />
                      <div className="text-center">
                        <p className="text-sm font-medium" style={{ color: "oklch(0.70 0 0)" }}>
                          Arraste o arquivo ou clique para selecionar
                        </p>
                        <p className="text-xs mt-1" style={{ color: "oklch(0.45 0 0)" }}>
                          Formatos aceitos: .xlsx, .xls
                        </p>
                      </div>
                    </>
                  )}
                </label>
              </div>
            )}

            {/* Barra de progresso */}
            {isSyncing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: "oklch(0.70 0 0)" }}>
                    {syncStep === "reading" ? "Lendo planilha..." : "Sincronizando com o banco de dados..."}
                  </span>
                  <span className="text-xs font-bold" style={{ color: "oklch(0.85 0.18 95)" }}>
                    {syncProgress}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.20 0 0)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${syncProgress}%`,
                      background: "linear-gradient(90deg, oklch(0.75 0.18 95), oklch(0.85 0.18 95))",
                    }}
                  />
                </div>
                <p className="text-xs text-center" style={{ color: "oklch(0.45 0 0)" }}>
                  Aguarde — imagens e fornecedores serão preservados
                </p>
              </div>
            )}

            {/* Resultado da sincronização */}
            {syncStep === "done" && syncResult && (
              <div className="space-y-4">
                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{ background: "oklch(0.55 0.15 145 / 0.12)", border: "1px solid oklch(0.55 0.15 145 / 0.30)" }}
                >
                  <CheckCircle2 size={20} style={{ color: "oklch(0.65 0.15 145)" }} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: "oklch(0.65 0.15 145)" }}>
                      Sincronização concluída com sucesso!
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0 0)" }}>
                      O catálogo foi atualizado com os dados da planilha. Registro #{syncResult.syncId} salvo no histórico.
                    </p>
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Adicionados", value: syncResult.adicionados, color: "oklch(0.65 0.15 145)" },
                    { label: "Atualizados", value: syncResult.atualizados, color: "oklch(0.85 0.18 95)" },
                    { label: "Ignorados", value: syncResult.ignorados, color: "oklch(0.55 0 0)" },
                    { label: "Erros", value: syncResult.erros, color: "oklch(0.65 0.18 25)" },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="rounded-xl p-3 text-center"
                      style={{ background: "oklch(0.16 0 0)", border: "1px solid oklch(0.22 0 0)" }}
                    >
                      <p className="text-2xl font-bold" style={{ color }}>{value.toLocaleString("pt-BR")}</p>
                      <p className="text-xs mt-1" style={{ color: "oklch(0.55 0 0)" }}>{label}</p>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-center" style={{ color: "oklch(0.45 0 0)" }}>
                  Total processado: {syncResult.total.toLocaleString("pt-BR")} linhas
                </p>

                <button
                  onClick={resetSync}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: "oklch(0.18 0 0)", border: "1px solid oklch(0.28 0 0)", color: "oklch(0.70 0 0)" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95 / 0.40)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
                >
                  <RefreshCw size={14} /> Sincronizar novamente
                </button>
              </div>
            )}

            {/* Erro */}
            {syncStep === "error" && (
              <div className="space-y-3">
                <div
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: "oklch(0.55 0.18 25 / 0.12)", border: "1px solid oklch(0.55 0.18 25 / 0.30)" }}
                >
                  <AlertCircle size={18} style={{ color: "oklch(0.65 0.18 25)" }} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold" style={{ color: "oklch(0.65 0.18 25)" }}>Erro na sincronização</p>
                    <p className="text-xs mt-1" style={{ color: "oklch(0.55 0 0)" }}>{syncError}</p>
                  </div>
                </div>
                <button
                  onClick={resetSync}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium"
                  style={{ background: "oklch(0.18 0 0)", border: "1px solid oklch(0.28 0 0)", color: "oklch(0.70 0 0)" }}
                >
                  <RefreshCw size={14} /> Tentar novamente
                </button>
              </div>
            )}

            {/* Botão de sincronizar */}
            {syncStep !== "done" && syncStep !== "error" && (
              <button
                onClick={handleSync}
                disabled={!selectedFileName || isSyncing}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
                style={{
                  background: selectedFileName && !isSyncing ? "oklch(0.85 0.18 95)" : "oklch(0.20 0 0)",
                  color: selectedFileName && !isSyncing ? "oklch(0.08 0 0)" : "oklch(0.45 0 0)",
                }}
                onMouseEnter={e => { if (selectedFileName && !isSyncing) (e.currentTarget.style.background = "oklch(0.70 0.18 95)"); }}
                onMouseLeave={e => { if (selectedFileName && !isSyncing) (e.currentTarget.style.background = "oklch(0.85 0.18 95)"); }}
              >
                {isSyncing ? (
                  <><Loader2 size={16} className="animate-spin" /> Sincronizando...</>
                ) : (
                  <><Upload size={16} /> Sincronizar Catálogo</>
                )}
              </button>
            )}

            {syncStep === "idle" && (
              <p className="text-xs text-center" style={{ color: "oklch(0.40 0 0)" }}>
                As imagens e fornecedores já cadastrados serão preservados. Somente campos alterados serão atualizados.
              </p>
            )}
          </div>

          {/* ── Histórico de sincronizações ── */}
          {showHistory && (
            <div
              className="border-t"
              style={{ borderColor: "oklch(0.85 0.18 95 / 0.20)", background: "oklch(0.11 0 0)" }}
            >
              <div className="px-5 py-3 flex items-center gap-2">
                <History size={14} style={{ color: "oklch(0.85 0.18 95)" }} />
                <span className="text-sm font-semibold" style={{ color: "oklch(0.85 0.18 95)" }}>
                  Últimas Sincronizações
                </span>
              </div>

              {!syncHistoryData || syncHistoryData.length === 0 ? (
                <div className="px-5 pb-5 text-center">
                  <p className="text-xs" style={{ color: "oklch(0.45 0 0)" }}>Nenhuma sincronização registrada ainda.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "oklch(0.18 0 0)" }}>
                  {(syncHistoryData as SyncHistoryItem[]).map((item) => {
                    const isExpanded = expandedHistoryId === item.id;
                    const detalhes = item.detalhes ? (() => { try { return JSON.parse(item.detalhes); } catch { return null; } })() : null;

                    return (
                      <div key={item.id} className="px-5 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Badge de status */}
                              <span
                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{
                                  background: item.status === "completed"
                                    ? "oklch(0.55 0.15 145 / 0.20)"
                                    : item.status === "error"
                                    ? "oklch(0.55 0.18 25 / 0.20)"
                                    : "oklch(0.55 0.15 220 / 0.20)",
                                  color: item.status === "completed"
                                    ? "oklch(0.65 0.15 145)"
                                    : item.status === "error"
                                    ? "oklch(0.65 0.18 25)"
                                    : "oklch(0.65 0.15 220)",
                                }}
                              >
                                {item.status === "completed" ? "Concluído" : item.status === "error" ? "Erro" : "Processando"}
                              </span>
                              <span className="text-xs font-medium truncate" style={{ color: "oklch(0.75 0 0)" }}>
                                {item.fileName}
                              </span>
                            </div>
                            <p className="text-xs mt-1" style={{ color: "oklch(0.45 0 0)" }}>
                              {formatDate(item.createdAt)}
                              {item.completedAt && ` — concluído em ${formatDate(item.completedAt)}`}
                            </p>
                            {item.status === "completed" && (
                              <div className="flex gap-3 mt-1.5 flex-wrap">
                                <span className="text-xs" style={{ color: "oklch(0.65 0.15 145)" }}>+{item.adicionados ?? 0} adicionados</span>
                                <span className="text-xs" style={{ color: "oklch(0.85 0.18 95)" }}>~{item.atualizados ?? 0} atualizados</span>
                                <span className="text-xs" style={{ color: "oklch(0.50 0 0)" }}>{item.ignorados ?? 0} sem alteração</span>
                                {(item.erros ?? 0) > 0 && <span className="text-xs" style={{ color: "oklch(0.65 0.18 25)" }}>{item.erros} erros</span>}
                              </div>
                            )}
                            {item.status === "error" && item.errorMessage && (
                              <p className="text-xs mt-1" style={{ color: "oklch(0.65 0.18 25)" }}>{item.errorMessage}</p>
                            )}
                          </div>

                          {/* Botão expandir detalhes */}
                          {detalhes && (
                            <button
                              onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                              className="flex-shrink-0 p-1.5 rounded-lg transition-colors"
                              style={{ color: "oklch(0.55 0 0)", background: "oklch(0.16 0 0)" }}
                              title="Ver detalhes"
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}
                        </div>

                        {/* Detalhes expandidos */}
                        {isExpanded && detalhes && (
                          <div
                            className="mt-3 rounded-lg p-3 space-y-3"
                            style={{ background: "oklch(0.14 0 0)", border: "1px solid oklch(0.22 0 0)" }}
                          >
                            {detalhes.adicionados?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold mb-1.5" style={{ color: "oklch(0.65 0.15 145)" }}>
                                  Itens adicionados ({detalhes.adicionados.length}{detalhes.adicionados.length === 100 ? "+" : ""}):
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {detalhes.adicionados.slice(0, 30).map((cod: string) => (
                                    <span key={cod} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "oklch(0.55 0.15 145 / 0.15)", color: "oklch(0.65 0.15 145)" }}>
                                      {cod}
                                    </span>
                                  ))}
                                  {detalhes.adicionados.length > 30 && (
                                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: "oklch(0.45 0 0)" }}>
                                      +{detalhes.adicionados.length - 30} mais...
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                            {detalhes.atualizados?.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold mb-1.5" style={{ color: "oklch(0.85 0.18 95)" }}>
                                  Itens atualizados ({detalhes.atualizados.length}{detalhes.atualizados.length === 100 ? "+" : ""}):
                                </p>
                                <div className="space-y-1">
                                  {detalhes.atualizados.slice(0, 15).map((item: { codigo: string; campos: string[] }) => (
                                    <div key={item.codigo} className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-mono" style={{ color: "oklch(0.75 0 0)" }}>{item.codigo}</span>
                                      <div className="flex gap-1 flex-wrap">
                                        {item.campos.map((campo: string) => (
                                          <span key={campo} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "oklch(0.85 0.18 95 / 0.12)", color: "oklch(0.85 0.18 95)" }}>
                                            {campo}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                  {detalhes.atualizados.length > 15 && (
                                    <p className="text-xs" style={{ color: "oklch(0.45 0 0)" }}>+{detalhes.atualizados.length - 15} mais...</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SEÇÃO: Fornecedores
        ══════════════════════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold" style={{ color: "oklch(0.85 0.18 95)" }}>Fornecedores</h3>
              <p className="text-xs mt-0.5" style={{ color: "oklch(0.50 0 0)" }}>Gerencie os fornecedores vinculados aos equipamentos</p>
            </div>
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{ background: "oklch(0.85 0.18 95)", color: "oklch(0.08 0 0)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.70 0.18 95)")}
              onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.85 0.18 95)")}
            >
              {showForm ? <X size={14} /> : <Plus size={14} />}
              {showForm ? "Cancelar" : "Novo Fornecedor"}
            </button>
          </div>

          {/* Formulário de novo fornecedor */}
          {showForm && (
            <div className="rounded-xl border p-5 mb-4 space-y-4" style={{ background: "oklch(0.13 0 0)", borderColor: "oklch(0.85 0.18 95 / 0.40)" }}>
              <h4 className="text-sm font-semibold" style={{ color: "oklch(0.85 0.18 95)" }}>Novo Fornecedor</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: "nome", label: "Nome *", placeholder: "Nome do fornecedor" },
                  { key: "contato", label: "Contato", placeholder: "Nome do contato" },
                  { key: "email", label: "E-mail", placeholder: "email@empresa.com" },
                  { key: "telefone", label: "Telefone", placeholder: "(11) 99999-9999" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs mb-1" style={{ color: "oklch(0.60 0 0)" }}>{label}</label>
                    <input
                      type="text"
                      placeholder={placeholder}
                      value={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "oklch(0.18 0 0)", border: "1px solid oklch(0.28 0 0)", color: "oklch(0.90 0 0)" }}
                      onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={handleCreate}
                disabled={!form.nome.trim() || saving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                style={{ background: "oklch(0.85 0.18 95)", color: "oklch(0.08 0 0)" }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Salvar Fornecedor
              </button>
            </div>
          )}

          {/* Lista de fornecedores */}
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0.22 0 0)" }}>
            <div className="px-5 py-3 border-b flex items-center gap-2"
              style={{ background: "oklch(0.13 0 0)", borderColor: "oklch(0.22 0 0)" }}>
              <Building2 size={14} style={{ color: "oklch(0.85 0.18 95)" }} />
              <span className="text-sm font-semibold" style={{ color: "oklch(0.85 0.18 95)" }}>
                Fornecedores Cadastrados
              </span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full"
                style={{ background: "oklch(0.20 0 0)", color: "oklch(0.65 0 0)" }}>
                {fornecedores?.length ?? 0}
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12" style={{ background: "oklch(0.12 0 0)" }}>
                <Loader2 size={24} className="animate-spin" style={{ color: "oklch(0.85 0.18 95)" }} />
              </div>
            ) : fornecedores?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2" style={{ background: "oklch(0.12 0 0)" }}>
                <Building2 size={32} style={{ color: "oklch(0.30 0 0)" }} />
                <p className="text-sm" style={{ color: "oklch(0.50 0 0)" }}>Nenhum fornecedor cadastrado</p>
              </div>
            ) : (
              <div style={{ background: "oklch(0.12 0 0)" }}>
                {fornecedores?.map((f) => (
                  <div key={f.id}
                    className="flex items-center justify-between px-5 py-3 border-b last:border-0"
                    style={{ borderColor: "oklch(0.18 0 0)" }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "oklch(0.88 0 0)" }}>{f.nome}</p>
                      <div className="flex flex-wrap gap-3 mt-0.5">
                        {f.contato && <span className="text-xs" style={{ color: "oklch(0.55 0 0)" }}>{f.contato}</span>}
                        {f.email && <span className="text-xs" style={{ color: "oklch(0.55 0 0)" }}>{f.email}</span>}
                        {f.telefone && <span className="text-xs" style={{ color: "oklch(0.55 0 0)" }}>{f.telefone}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(f.id, f.nome)}
                      className="p-2 rounded-lg transition-colors flex-shrink-0"
                      style={{ color: "oklch(0.55 0 0)" }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.color = "oklch(0.65 0.20 25)";
                        (e.currentTarget as HTMLElement).style.background = "oklch(0.65 0.20 25 / 0.10)";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.color = "oklch(0.55 0 0)";
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                      title="Remover fornecedor"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
