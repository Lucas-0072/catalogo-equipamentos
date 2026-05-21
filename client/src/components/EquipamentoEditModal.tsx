import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { X, Save, Loader2, Upload, Package } from "lucide-react";
import { toast } from "sonner";

interface Props {
  equipamento: any;
  onClose: () => void;
  onSaved: (updated: any) => void;
}

export default function EquipamentoEditModal({ equipamento, onClose, onSaved }: Props) {
  const utils = trpc.useUtils();
  const { data: fornecedoresList } = trpc.fornecedores.list.useQuery();

  const [form, setForm] = useState({
    descricao: equipamento.descricao ?? "",
    codigo: equipamento.codigo ?? "",
    referencia: equipamento.referencia ?? "",
    ncm: equipamento.ncm ?? "",
    unidade: equipamento.unidade ?? "",
    grupo: equipamento.grupo ?? "",
    grupoNome: equipamento.grupoNome ?? "",
    subgrupo: equipamento.subgrupo ?? "",
    subgrupoNome: equipamento.subgrupoNome ?? "",
    fornecedor1Id: equipamento.fornecedor1Id ?? null as number | null,
    fornecedor2Id: equipamento.fornecedor2Id ?? null as number | null,
    fornecedor3Id: equipamento.fornecedor3Id ?? null as number | null,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(equipamento.imagem ?? null);
  const [saving, setSaving] = useState(false);

  const updateMutation = trpc.equipamentos.update.useMutation();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upload de imagem via multipart/form-data (suporta qualquer tamanho)
      if (imageFile) {
        const formData = new FormData();
        formData.append("imagem", imageFile);
        const resp = await fetch(`/api/equipamentos/${equipamento.id}/imagem`, {
          method: "POST",
          body: formData,
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: resp.statusText }));
          throw new Error(err.error ?? "Erro no upload da imagem");
        }
        const { url } = await resp.json();
        // Atualizar preview com URL real do storage
        setImagePreview(url);
      }

      // Atualizar dados do equipamento
      await updateMutation.mutateAsync({
        id: equipamento.id,
        ...form,
        ncm: form.ncm || null,
        unidade: form.unidade || null,
      });

      await utils.equipamentos.list.invalidate();
      toast.success("Equipamento atualizado com sucesso!");
      onSaved({ ...equipamento, ...form, imagem: imagePreview });
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao salvar equipamento.");
    } finally {
      setSaving(false);
    }
  };

  // Fechar com Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const inputStyle = {
    background: "oklch(0.18 0 0)",
    border: "1px solid oklch(0.28 0 0)",
    color: "oklch(0.90 0 0)",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
    width: "100%",
    outline: "none",
  };

  const labelStyle = {
    fontSize: "11px",
    fontWeight: 600,
    color: "oklch(0.55 0 0)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    marginBottom: "4px",
    display: "block",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "oklch(0 0 0 / 0.75)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-2xl flex flex-col"
        style={{ background: "oklch(0.12 0 0)", border: "1px solid oklch(0.85 0.18 95 / 0.30)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b sticky top-0"
          style={{ background: "oklch(0.12 0 0)", borderColor: "oklch(0.22 0 0)" }}
        >
          <div>
            <h2 className="text-base font-bold" style={{ color: "oklch(0.85 0.18 95)" }}>
              Editar Equipamento
            </h2>
            <p className="text-xs" style={{ color: "oklch(0.50 0 0)" }}>#{equipamento.codigo}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "oklch(0.55 0 0)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "oklch(0.85 0 0)")}
            onMouseLeave={e => (e.currentTarget.style.color = "oklch(0.55 0 0)")}
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">

          {/* Imagem */}
          <div>
            <label style={labelStyle}>Imagem do Produto</label>
            <div className="flex items-center gap-4">
              <div
                className="w-24 h-24 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ background: "oklch(0.10 0 0)", border: "1px solid oklch(0.22 0 0)" }}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <Package size={28} style={{ color: "oklch(0.35 0 0)" }} />
                )}
              </div>
              <label
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
                style={{
                  background: "oklch(0.85 0.18 95 / 0.12)",
                  border: "1px solid oklch(0.85 0.18 95 / 0.35)",
                  color: "oklch(0.85 0.18 95)",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.85 0.18 95 / 0.22)")}
                onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.85 0.18 95 / 0.12)")}
              >
                <Upload size={14} />
                Alterar imagem
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label style={labelStyle}>Descrição</label>
            <textarea
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)")}
              onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
            />
          </div>

          {/* Código + Referência */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Código</label>
              <input
                type="text"
                value={form.codigo}
                onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)")}
                onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
              />
            </div>
            <div>
              <label style={labelStyle}>Referência</label>
              <input
                type="text"
                value={form.referencia}
                onChange={e => setForm(f => ({ ...f, referencia: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)")}
                onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
              />
            </div>
          </div>

          {/* NCM + Unidade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>NCM</label>
              <input
                type="text"
                value={form.ncm}
                onChange={e => setForm(f => ({ ...f, ncm: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)")}
                onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
              />
            </div>
            <div>
              <label style={labelStyle}>Unidade</label>
              <input
                type="text"
                value={form.unidade}
                onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)")}
                onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
              />
            </div>
          </div>

          {/* Grupo + Subgrupo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Código do Grupo</label>
              <input
                type="text"
                value={form.grupo}
                onChange={e => setForm(f => ({ ...f, grupo: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)")}
                onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
              />
            </div>
            <div>
              <label style={labelStyle}>Nome do Grupo</label>
              <input
                type="text"
                value={form.grupoNome}
                onChange={e => setForm(f => ({ ...f, grupoNome: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)")}
                onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Código do Subgrupo</label>
              <input
                type="text"
                value={form.subgrupo}
                onChange={e => setForm(f => ({ ...f, subgrupo: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)")}
                onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
              />
            </div>
            <div>
              <label style={labelStyle}>Nome do Subgrupo</label>
              <input
                type="text"
                value={form.subgrupoNome}
                onChange={e => setForm(f => ({ ...f, subgrupoNome: e.target.value }))}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)")}
                onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
              />
            </div>
          </div>

          {/* Fornecedores */}
          <div>
            <label style={labelStyle}>Fornecedores (até 3)</label>
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map(n => {
                const key = `fornecedor${n}Id` as "fornecedor1Id" | "fornecedor2Id" | "fornecedor3Id";
                return (
                  <select
                    key={n}
                    value={form[key] ?? ""}
                    onChange={e => setForm(f => ({
                      ...f,
                      [key]: e.target.value ? Number(e.target.value) : null,
                    }))}
                    style={{ ...inputStyle }}
                    onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
                  >
                    <option value="">— Fornecedor {n} (opcional) —</option>
                    {fornecedoresList?.map(f => (
                      <option key={f.id} value={f.id}>{f.nome}</option>
                    ))}
                  </select>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4 border-t sticky bottom-0"
          style={{ background: "oklch(0.12 0 0)", borderColor: "oklch(0.22 0 0)" }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: "oklch(0.18 0 0)",
              border: "1px solid oklch(0.28 0 0)",
              color: "oklch(0.65 0 0)",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "oklch(0.85 0 0)")}
            onMouseLeave={e => (e.currentTarget.style.color = "oklch(0.65 0 0)")}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
            style={{ background: "oklch(0.85 0.18 95)", color: "oklch(0.08 0 0)" }}
            onMouseEnter={e => { if (!saving) (e.currentTarget.style.background = "oklch(0.70 0.18 95)"); }}
            onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.85 0.18 95)")}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}
