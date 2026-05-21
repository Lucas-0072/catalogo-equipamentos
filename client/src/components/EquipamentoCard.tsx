import { useState } from "react";
import { Link } from "wouter";
import { Package, Building2, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import EquipamentoEditModal from "./EquipamentoEditModal";
import type { Equipamento, Fornecedor } from "../../../drizzle/schema";

type EquipamentoWithFornecedores = Equipamento & {
  fornecedor1: Fornecedor | null;
  fornecedor2: Fornecedor | null;
  fornecedor3: Fornecedor | null;
};

interface Props {
  equipamento: EquipamentoWithFornecedores;
  onDeleted?: (id: number) => void;
  onUpdated?: (updated: EquipamentoWithFornecedores) => void;
}

export default function EquipamentoCard({ equipamento, onDeleted, onUpdated }: Props) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localData, setLocalData] = useState(equipamento);

  const utils = trpc.useUtils();
  const deleteMutation = trpc.equipamentos.delete.useMutation();

  const fornecedores = [
    localData.fornecedor1,
    localData.fornecedor2,
    localData.fornecedor3,
  ].filter(Boolean) as Fornecedor[];

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMutation.mutateAsync({ id: localData.id });
      await utils.equipamentos.list.invalidate();
      toast.success("Equipamento excluído.");
      onDeleted?.(localData.id);
    } catch {
      toast.error("Erro ao excluir equipamento.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSaved = (updated: any) => {
    setLocalData(prev => ({ ...prev, ...updated }));
    onUpdated?.({ ...localData, ...updated });
  };

  return (
    <>
      <div
        className="rounded-xl border overflow-hidden transition-all duration-200 h-full flex flex-col group/card relative"
        style={{
          background: "oklch(0.14 0 0)",
          borderColor: "oklch(0.22 0 0)",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.85 0.18 95)";
          (e.currentTarget as HTMLElement).style.background = "oklch(0.16 0 0)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "oklch(0.22 0 0)";
          (e.currentTarget as HTMLElement).style.background = "oklch(0.14 0 0)";
        }}
      >
        {/* Botões de ação — sempre visíveis no mobile, hover no desktop */}
        <div
          className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100 transition-opacity"
        >
          {/* Editar */}
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); setShowEdit(true); }}
            title="Editar equipamento"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95"
            style={{
              background: "oklch(0.85 0.18 95)",
              color: "oklch(0.08 0 0)",
              boxShadow: "0 2px 8px oklch(0 0 0 / 0.4)",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.70 0.18 95)")}
            onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.85 0.18 95)")}
          >
            <Pencil size={11} />
            Editar
          </button>

          {/* Excluir */}
          <button
            onClick={e => { e.preventDefault(); e.stopPropagation(); setShowDeleteConfirm(true); }}
            title="Excluir equipamento"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95"
            style={{
              background: "oklch(0.45 0.15 25)",
              color: "oklch(0.95 0 0)",
              boxShadow: "0 2px 8px oklch(0 0 0 / 0.4)",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.35 0.15 25)")}
            onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.45 0.15 25)")}
          >
            <Trash2 size={11} />
            Excluir
          </button>
        </div>

        {/* Link para detalhes — envolve o conteúdo */}
        <Link href={`/equipamento/${localData.id}`} className="block no-underline flex-1 flex flex-col">
          {/* Imagem */}
          <div
            className="relative w-full aspect-video flex items-center justify-center"
            style={{ background: "oklch(0.10 0 0)" }}
          >
            {localData.imagem ? (
              <img
                src={localData.imagem}
                alt={localData.descricao ?? ""}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 opacity-30">
                <Package size={40} style={{ color: "oklch(0.85 0.18 95)" }} />
                <span className="text-xs" style={{ color: "oklch(0.65 0 0)" }}>Sem imagem</span>
              </div>
            )}
            {/* Badge subgrupo */}
            <div className="absolute top-2 left-2">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: "oklch(0.85 0.18 95 / 0.15)",
                  color: "oklch(0.85 0.18 95)",
                  border: "1px solid oklch(0.85 0.18 95 / 0.3)",
                }}
              >
                {localData.subgrupoNome || `Sub ${localData.subgrupo}`}
              </span>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-4 flex flex-col flex-1 gap-2">
            {/* Código */}
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
                style={{ background: "oklch(0.20 0 0)", color: "oklch(0.85 0.18 95)" }}
              >
                #{localData.codigo}
              </span>
              <span className="text-xs" style={{ color: "oklch(0.55 0 0)" }}>
                {localData.unidade}
              </span>
            </div>

            {/* Descrição */}
            <h3
              className="text-sm font-medium leading-snug line-clamp-3 flex-1"
              style={{ color: "oklch(0.90 0 0)" }}
            >
              {localData.descricao}
            </h3>

            {/* NCM */}
            {localData.ncm && localData.ncm !== "nan" && (
              <p className="text-xs" style={{ color: "oklch(0.55 0 0)" }}>
                NCM: {localData.ncm}
              </p>
            )}

            {/* Fornecedores */}
            {fornecedores.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                <Building2 size={12} style={{ color: "oklch(0.65 0 0)" }} />
                {fornecedores.map((f, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "oklch(0.20 0 0)", color: "oklch(0.75 0 0)" }}
                  >
                    {f.nome}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-1">
                <Building2 size={12} style={{ color: "oklch(0.35 0 0)" }} />
                <span className="text-xs" style={{ color: "oklch(0.40 0 0)" }}>
                  Sem fornecedor
                </span>
              </div>
            )}

            {/* Ver detalhes */}
            <div
              className="flex items-center gap-1 text-xs font-medium mt-1 transition-colors"
              style={{ color: "oklch(0.85 0.18 95)" }}
            >
              Ver detalhes <ChevronRight size={12} />
            </div>
          </div>
        </Link>
      </div>

      {/* Modal de edição */}
      {showEdit && (
        <EquipamentoEditModal
          equipamento={localData}
          onClose={() => setShowEdit(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Confirmação de exclusão */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 0.75)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
            style={{
              background: "oklch(0.12 0 0)",
              border: "1px solid oklch(0.45 0.15 25 / 0.50)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "oklch(0.45 0.15 25 / 0.20)" }}
              >
                <Trash2 size={18} style={{ color: "oklch(0.65 0.15 25)" }} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: "oklch(0.90 0 0)" }}>
                  Excluir equipamento?
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0 0)" }}>
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <p
              className="text-xs px-3 py-2 rounded-lg"
              style={{
                background: "oklch(0.16 0 0)",
                color: "oklch(0.75 0 0)",
                border: "1px solid oklch(0.25 0 0)",
              }}
            >
              <span className="font-mono font-semibold" style={{ color: "oklch(0.85 0.18 95)" }}>
                #{localData.codigo}
              </span>{" "}
              — {localData.descricao?.slice(0, 60)}...
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: "oklch(0.18 0 0)",
                  border: "1px solid oklch(0.28 0 0)",
                  color: "oklch(0.65 0 0)",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "oklch(0.45 0.15 25)", color: "oklch(0.95 0 0)" }}
                onMouseEnter={e => { if (!deleting) (e.currentTarget.style.background = "oklch(0.35 0.15 25)"); }}
                onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.45 0.15 25)")}
              >
                {deleting ? (
                  <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Excluindo...</>
                ) : (
                  <><Trash2 size={13} /> Excluir</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
