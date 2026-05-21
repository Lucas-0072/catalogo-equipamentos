import { useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "../components/Header";
import { useUndoRedo } from "../hooks/useUndoRedo";
import {
  ArrowLeft, Package, Building2, Upload, X, Loader2,
  Tag, Hash, Layers, FileText, Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EquipamentoDetail() {
  const { id } = useParams<{ id: string }>();
  const equipId = parseInt(id!);
  const { toast } = useToast();
  const { canUndo, canRedo, undo, redo, pushAction } = useUndoRedo();

  const utils = trpc.useUtils();
  const { data: equipamento, isLoading } = trpc.equipamentos.getById.useQuery({ id: equipId });
  const { data: fornecedoresList } = trpc.fornecedores.list.useQuery();
  const updateMutation = trpc.equipamentos.update.useMutation({
    onSuccess: () => utils.equipamentos.getById.invalidate({ id: equipId }),
  });
  const uploadMutation = trpc.equipamentos.uploadImagem.useMutation({
    onSuccess: () => utils.equipamentos.getById.invalidate({ id: equipId }),
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.10 0 0)" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "oklch(0.85 0.18 95)" }} />
      </div>
    );
  }

  if (!equipamento) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.10 0 0)" }}>
        <p style={{ color: "oklch(0.65 0 0)" }}>Equipamento não encontrado.</p>
      </div>
    );
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const oldImagem = equipamento.imagem;
        await uploadMutation.mutateAsync({ id: equipId, imageBase64: base64, mimeType: file.type });
        pushAction({
          label: "Upload de imagem",
          undo: async () => {
            await updateMutation.mutateAsync({ id: equipId, imagem: oldImagem });
          },
          redo: async () => {
            await uploadMutation.mutateAsync({ id: equipId, imageBase64: base64, mimeType: file.type });
          },
        });
        toast({ title: "Imagem atualizada com sucesso!" });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast({ title: "Erro ao fazer upload da imagem", variant: "destructive" });
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    const oldImagem = equipamento.imagem;
    await updateMutation.mutateAsync({ id: equipId, imagem: null });
    pushAction({
      label: "Remover imagem",
      undo: async () => { await updateMutation.mutateAsync({ id: equipId, imagem: oldImagem }); },
      redo: async () => { await updateMutation.mutateAsync({ id: equipId, imagem: null }); },
    });
    toast({ title: "Imagem removida." });
  };

  const handleFornecedorChange = async (slot: 1 | 2 | 3, fornecedorId: number | null) => {
    const field = `fornecedor${slot}Id` as "fornecedor1Id" | "fornecedor2Id" | "fornecedor3Id";
    const oldValue = equipamento[field];
    await updateMutation.mutateAsync({ id: equipId, [field]: fornecedorId });
    pushAction({
      label: `Alterar fornecedor ${slot}`,
      undo: async () => { await updateMutation.mutateAsync({ id: equipId, [field]: oldValue }); },
      redo: async () => { await updateMutation.mutateAsync({ id: equipId, [field]: fornecedorId }); },
    });
    toast({ title: `Fornecedor ${slot} atualizado!` });
  };

  const fornecedorSlots: (1 | 2 | 3)[] = [1, 2, 3];

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.10 0 0)" }}>
      <Header
        showUndoRedo
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Voltar */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm mb-6 no-underline transition-colors"
          style={{ color: "oklch(0.65 0 0)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "oklch(0.85 0.18 95)")}
          onMouseLeave={e => (e.currentTarget.style.color = "oklch(0.65 0 0)")}>
          <ArrowLeft size={16} /> Voltar ao catálogo
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coluna esquerda: imagem */}
          <div className="space-y-4">
            {/* Imagem principal */}
            <div className="rounded-xl border overflow-hidden aspect-square flex items-center justify-center relative"
              style={{ background: "oklch(0.12 0 0)", borderColor: "oklch(0.22 0 0)" }}>
              {equipamento.imagem ? (
                <>
                  <img src={equipamento.imagem} alt={equipamento.descricao} className="w-full h-full object-contain p-4" />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1.5 rounded-full transition-colors"
                    style={{ background: "oklch(0.20 0 0)", color: "oklch(0.75 0 0)" }}
                    title="Remover imagem"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 opacity-40">
                  <Package size={64} style={{ color: "oklch(0.85 0.18 95)" }} />
                  <span className="text-sm" style={{ color: "oklch(0.65 0 0)" }}>Sem imagem cadastrada</span>
                </div>
              )}
            </div>

            {/* Upload de imagem */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors border"
              style={{
                background: "oklch(0.85 0.18 95 / 0.10)",
                borderColor: "oklch(0.85 0.18 95 / 0.40)",
                color: "oklch(0.85 0.18 95)",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.85 0.18 95 / 0.20)")}
              onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.85 0.18 95 / 0.10)")}
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {uploading ? "Enviando..." : "Fazer upload de imagem"}
            </button>
          </div>

          {/* Coluna direita: informações */}
          <div className="space-y-4">
            {/* Cabeçalho */}
            <div className="rounded-xl border p-5 space-y-3" style={{ background: "oklch(0.13 0 0)", borderColor: "oklch(0.22 0 0)" }}>
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg"
                  style={{ background: "oklch(0.85 0.18 95)", color: "oklch(0.08 0 0)" }}>
                  #{equipamento.codigo}
                </span>
                <span className="text-xs px-2 py-1 rounded-full"
                  style={{ background: "oklch(0.20 0 0)", color: "oklch(0.65 0 0)" }}>
                  {equipamento.unidade}
                </span>
              </div>
              <h2 className="text-lg font-bold leading-snug" style={{ color: "oklch(0.92 0 0)" }}>
                {equipamento.descricao}
              </h2>
              {equipamento.referencia && (
                <p className="text-sm" style={{ color: "oklch(0.60 0 0)" }}>
                  Ref: {equipamento.referencia}
                </p>
              )}
            </div>

            {/* Detalhes técnicos */}
            <div className="rounded-xl border p-5 space-y-3" style={{ background: "oklch(0.13 0 0)", borderColor: "oklch(0.22 0 0)" }}>
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "oklch(0.85 0.18 95)" }}>
                <Info size={14} /> Informações Técnicas
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "oklch(0.50 0 0)" }}>Grupo</p>
                  <p style={{ color: "oklch(0.80 0 0)" }}>{equipamento.grupoNome || equipamento.grupo}</p>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "oklch(0.50 0 0)" }}>Subgrupo</p>
                  <p style={{ color: "oklch(0.80 0 0)" }}>{equipamento.subgrupoNome || equipamento.subgrupo}</p>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "oklch(0.50 0 0)" }}>NCM</p>
                  <p style={{ color: "oklch(0.80 0 0)" }}>{equipamento.ncm || "—"}</p>
                </div>
                <div>
                  <p className="text-xs mb-0.5" style={{ color: "oklch(0.50 0 0)" }}>IPI</p>
                  <p style={{ color: "oklch(0.80 0 0)" }}>{equipamento.ipi ? `${equipamento.ipi}%` : "—"}</p>
                </div>
              </div>
            </div>

            {/* Fornecedores */}
            <div className="rounded-xl border p-5 space-y-3" style={{ background: "oklch(0.13 0 0)", borderColor: "oklch(0.22 0 0)" }}>
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "oklch(0.85 0.18 95)" }}>
                <Building2 size={14} /> Fornecedores (até 3)
              </h3>
              <div className="space-y-2">
                {fornecedorSlots.map(slot => {
                  const fKey = `fornecedor${slot}` as "fornecedor1" | "fornecedor2" | "fornecedor3";
                  const fIdKey = `fornecedor${slot}Id` as "fornecedor1Id" | "fornecedor2Id" | "fornecedor3Id";
                  const currentId = equipamento[fIdKey];

                  return (
                    <div key={slot} className="flex items-center gap-2">
                      <span className="text-xs font-medium w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: "oklch(0.85 0.18 95 / 0.15)", color: "oklch(0.85 0.18 95)" }}>
                        {slot}
                      </span>
                      <select
                        value={currentId ?? ""}
                        onChange={e => handleFornecedorChange(slot, e.target.value ? parseInt(e.target.value) : null)}
                        className="flex-1 text-sm px-3 py-2 rounded-lg outline-none transition-all"
                        style={{
                          background: "oklch(0.18 0 0)",
                          border: "1px solid oklch(0.28 0 0)",
                          color: currentId ? "oklch(0.88 0 0)" : "oklch(0.50 0 0)",
                        }}
                        onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)")}
                        onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
                      >
                        <option value="">— Selecionar fornecedor —</option>
                        {fornecedoresList?.map((f: any) => (
                          <option key={f.id} value={f.id}>{f.nome}</option>
                        ))}
                      </select>
                      {currentId && (
                        <button
                          onClick={() => handleFornecedorChange(slot, null)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: "oklch(0.55 0 0)" }}
                          title="Remover fornecedor"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {(!fornecedoresList || fornecedoresList.length === 0) && (
                <p className="text-xs" style={{ color: "oklch(0.50 0 0)" }}>
                  Nenhum fornecedor cadastrado. <Link href="/admin" className="underline" style={{ color: "oklch(0.85 0.18 95)" }}>Cadastrar no Admin</Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
