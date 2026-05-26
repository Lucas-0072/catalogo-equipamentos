import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { X, Save, Loader2, Upload, Package, Plus } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onClose: () => void;
  onCreated: (novo: any) => void;
}

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
  fontWeight: 600 as const,
  color: "oklch(0.55 0 0)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  marginBottom: "4px",
  display: "block",
};

export default function NovoEquipamentoModal({ onClose, onCreated }: Props) {
  const utils = trpc.useUtils();
  const { data: fornecedoresList } = trpc.fornecedores.list.useQuery();

  const createMutation = trpc.equipamentos.create.useMutation();

  const [form, setForm] = useState({
    codigo: "",
    descricao: "",
    referencia: "",
    ncm: "",
    unidade: "PC",
    grupo: "",
    grupoNome: "",
    subgrupo: "",
    subgrupoNome: "",
    fornecedor1Id: null as number | null,
    fornecedor2Id: null as number | null,
    fornecedor3Id: null as number | null,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fechar com Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.codigo.trim()) errs.codigo = "Código é obrigatório";
    if (!form.descricao.trim()) errs.descricao = "Descrição é obrigatória";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      // 1. Criar o equipamento
      const result = await createMutation.mutateAsync({
        codigo: form.codigo.trim(),
        descricao: form.descricao.trim(),
        referencia: form.referencia.trim() || null,
        ncm: form.ncm.trim() || null,
        unidade: form.unidade.trim() || null,
        grupo: form.grupo.trim() || null,
        grupoNome: form.grupoNome.trim() || null,
        subgrupo: form.subgrupo.trim() || null,
        subgrupoNome: form.subgrupoNome.trim() || null,
        fornecedor1Id: form.fornecedor1Id,
        fornecedor2Id: form.fornecedor2Id,
        fornecedor3Id: form.fornecedor3Id,
      });

      // 2. Upload de imagem via multipart/form-data se houver
      let imagemUrl: string | null = null;
      if (imageFile && result.id) {
        const formData = new FormData();
        formData.append("imagem", imageFile);
        const resp = await fetch(`/api/equipamentos/${result.id}/imagem`, {
          method: "POST",
          body: formData,
        });
        if (!resp.ok) {
          const text = await resp.text().catch(() => resp.statusText);
          let errMsg = "Erro no upload da imagem";
          try { errMsg = JSON.parse(text)?.error ?? errMsg; } catch {}
          throw new Error(errMsg);
        }
        const uploaded = await resp.json();
        imagemUrl = uploaded.url;
      }

      await utils.equipamentos.list.invalidate();
      await utils.equipamentos.grupos.invalidate();
      await utils.equipamentos.subgrupos.invalidate();

      toast.success(`Equipamento "${form.codigo}" cadastrado com sucesso!`);
      onCreated({
        id: result.id,
        ...form,
        imagem: imagemUrl,
        fornecedor1: null,
        fornecedor2: null,
        fornecedor3: null,
      });
      onClose();
    } catch (err: any) {
      const msg = err?.message ?? "Erro ao cadastrar equipamento.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const field = (
    key: keyof typeof form,
    label: string,
    placeholder?: string,
    type: "input" | "textarea" = "input"
  ) => (
    <div>
      <label style={labelStyle}>
        {label}
        {(key === "codigo" || key === "descricao") && (
          <span style={{ color: "oklch(0.65 0.18 25)", marginLeft: 4 }}>*</span>
        )}
      </label>
      {type === "textarea" ? (
        <textarea
          value={form[key] as string}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
          onFocus={e => (e.currentTarget.style.borderColor = errors[key] ? "oklch(0.65 0.18 25)" : "oklch(0.85 0.18 95)")}
          onBlur={e => (e.currentTarget.style.borderColor = errors[key] ? "oklch(0.65 0.18 25)" : "oklch(0.28 0 0)")}
        />
      ) : (
        <input
          type="text"
          value={form[key] as string}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          style={{
            ...inputStyle,
            borderColor: errors[key] ? "oklch(0.65 0.18 25)" : "oklch(0.28 0 0)",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = errors[key] ? "oklch(0.65 0.18 25)" : "oklch(0.85 0.18 95)")}
          onBlur={e => (e.currentTarget.style.borderColor = errors[key] ? "oklch(0.65 0.18 25)" : "oklch(0.28 0 0)")}
        />
      )}
      {errors[key] && (
        <p style={{ fontSize: "11px", color: "oklch(0.65 0.18 25)", marginTop: 3 }}>{errors[key]}</p>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "oklch(0 0 0 / 0.80)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-2xl flex flex-col"
        style={{ background: "oklch(0.12 0 0)", border: "1px solid oklch(0.85 0.18 95 / 0.40)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
          style={{ background: "oklch(0.12 0 0)", borderColor: "oklch(0.22 0 0)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ background: "oklch(0.85 0.18 95 / 0.15)" }}
            >
              <Plus size={16} style={{ color: "oklch(0.85 0.18 95)" }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: "oklch(0.85 0.18 95)" }}>
                Novo Equipamento
              </h2>
              <p className="text-xs" style={{ color: "oklch(0.50 0 0)" }}>
                Cadastro manual de item no catálogo
              </p>
            </div>
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
                {imagePreview ? "Trocar imagem" : "Adicionar imagem"}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          {/* Descrição */}
          {field("descricao", "Descrição", "Descrição completa do equipamento", "textarea")}

          {/* Código + Referência */}
          <div className="grid grid-cols-2 gap-4">
            {field("codigo", "Código", "Ex: 701099")}
            {field("referencia", "Referência", "Ex: ESTACOES-MP")}
          </div>

          {/* NCM + Unidade */}
          <div className="grid grid-cols-2 gap-4">
            {field("ncm", "NCM", "Ex: 39251000")}
            {field("unidade", "Unidade", "Ex: PC, KG, UN")}
          </div>

          {/* Grupo */}
          <div className="grid grid-cols-2 gap-4">
            {field("grupo", "Código do Grupo", "Ex: 700")}
            {field("grupoNome", "Nome do Grupo", "Ex: ESTACOES-MP")}
          </div>

          {/* Subgrupo */}
          <div className="grid grid-cols-2 gap-4">
            {field("subgrupo", "Código do Subgrupo", "Ex: 701")}
            {field("subgrupoNome", "Nome do Subgrupo", "Ex: 701 - ESTACOES-MP")}
          </div>

          {/* Fornecedores */}
          <div>
            <label style={labelStyle}>Fornecedores (até 3)</label>
            <div className="flex flex-col gap-2">
              {([1, 2, 3] as const).map(n => {
                const key = `fornecedor${n}Id` as "fornecedor1Id" | "fornecedor2Id" | "fornecedor3Id";
                return (
                  <select
                    key={n}
                    value={form[key] ?? ""}
                    onChange={e => setForm(f => ({
                      ...f,
                      [key]: e.target.value ? Number(e.target.value) : null,
                    }))}
                    style={inputStyle}
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

          {/* Aviso campos obrigatórios */}
          <p style={{ fontSize: "11px", color: "oklch(0.45 0 0)" }}>
            Campos marcados com <span style={{ color: "oklch(0.65 0.18 25)" }}>*</span> são obrigatórios.
          </p>
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
            {saving ? "Cadastrando..." : "Cadastrar Equipamento"}
          </button>
        </div>
      </div>
    </div>
  );
}
