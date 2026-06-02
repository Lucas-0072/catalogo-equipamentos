import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Save, Loader2, X, AlertCircle, Key } from "lucide-react";
import { toast } from "sonner";

interface Departamento {
  id: number;
  nome: string;
  login: string;
  ativo: "sim" | "nao";
  createdAt: Date;
}

export default function DepartamentosManager() {
  const utils = trpc.useUtils();
  const { data: departamentos, isLoading } = trpc.departamentos.list.useQuery();

  const createMutation = trpc.departamentos.create.useMutation({
    onSuccess: () => utils.departamentos.list.invalidate(),
  });
  const updateMutation = trpc.departamentos.update.useMutation({
    onSuccess: () => utils.departamentos.list.invalidate(),
  });
  const deleteMutation = trpc.departamentos.delete.useMutation({
    onSuccess: () => utils.departamentos.list.invalidate(),
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", login: "", senha: "" });
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleCreate = async () => {
    if (!form.nome.trim() || !form.login.trim() || !form.senha.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    setSaving(true);
    try {
      await createMutation.mutateAsync({
        nome: form.nome.trim(),
        login: form.login.trim(),
        senha: form.senha.trim(),
      });
      toast.success("Departamento criado com sucesso!");
      setForm({ nome: "", login: "", senha: "" });
      setShowForm(false);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar departamento");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (dept: Departamento) => {
    try {
      await updateMutation.mutateAsync({
        id: dept.id,
        ativo: dept.ativo === "sim" ? "nao" : "sim",
      });
      toast.success(`Departamento ${dept.ativo === "sim" ? "desativado" : "ativado"}`);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar departamento");
    }
  };

  const handleDelete = async (id: number, nome: string) => {
    if (!confirm(`Tem certeza que deseja deletar "${nome}"?`)) return;

    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Departamento deletado com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao deletar departamento");
    }
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "oklch(0.85 0.18 95)" }}>
            Gerenciar Departamentos
          </h2>
          <p className="text-xs mt-1" style={{ color: "oklch(0.50 0 0)" }}>
            Crie e gerencie logins de departamentos
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: "oklch(0.85 0.18 95)",
            color: "oklch(0.08 0 0)",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.70 0.18 95)")}
          onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.85 0.18 95)")}
        >
          <Plus size={16} />
          Novo Departamento
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div
          className="rounded-lg border p-4 space-y-4"
          style={{
            background: "oklch(0.12 0 0)",
            borderColor: "oklch(0.22 0 0)",
          }}
        >
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label style={labelStyle}>Nome do Departamento</label>
              <input
                type="text"
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Gestão"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)")}
                onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
              />
            </div>
            <div>
              <label style={labelStyle}>Login</label>
              <input
                type="text"
                value={form.login}
                onChange={e => setForm(f => ({ ...f, login: e.target.value }))}
                placeholder="Ex: gestao"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)")}
                onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
              />
            </div>
            <div>
              <label style={labelStyle}>Senha</label>
              <input
                type="password"
                value={form.senha}
                onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                placeholder="Digite uma senha segura"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = "oklch(0.85 0.18 95)")}
                onBlur={e => (e.currentTarget.style.borderColor = "oklch(0.28 0 0)")}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
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
              onClick={handleCreate}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
              style={{
                background: "oklch(0.85 0.18 95)",
                color: "oklch(0.08 0 0)",
              }}
              onMouseEnter={e => { if (!saving) (e.currentTarget.style.background = "oklch(0.70 0.18 95)"); }}
              onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.85 0.18 95)")}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Criando..." : "Criar"}
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin" style={{ color: "oklch(0.55 0 0)" }} />
        </div>
      ) : !departamentos || departamentos.length === 0 ? (
        <div
          className="rounded-lg border p-8 text-center"
          style={{
            background: "oklch(0.12 0 0)",
            borderColor: "oklch(0.22 0 0)",
          }}
        >
          <p style={{ color: "oklch(0.50 0 0)" }}>Nenhum departamento cadastrado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {departamentos.map(dept => (
            <div
              key={dept.id}
              className="rounded-lg border p-4 flex items-center justify-between"
              style={{
                background: "oklch(0.12 0 0)",
                borderColor: dept.ativo === "sim" ? "oklch(0.85 0.18 95 / 0.30)" : "oklch(0.22 0 0)",
              }}
            >
              <div className="flex-1">
                <p className="font-semibold" style={{ color: "oklch(0.85 0.18 95)" }}>
                  {dept.nome}
                </p>
                <p className="text-xs mt-1 flex items-center gap-2" style={{ color: "oklch(0.50 0 0)" }}>
                  <Key size={12} />
                  {dept.login}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(dept)}
                  className="px-3 py-1 rounded text-xs font-medium transition-all"
                  style={{
                    background: dept.ativo === "sim" ? "oklch(0.85 0.18 95 / 0.15)" : "oklch(0.45 0.15 25 / 0.15)",
                    color: dept.ativo === "sim" ? "oklch(0.85 0.18 95)" : "oklch(0.70 0.18 15)",
                  }}
                >
                  {dept.ativo === "sim" ? "Ativo" : "Inativo"}
                </button>

                <button
                  onClick={() => handleDelete(dept.id, dept.nome)}
                  className="p-2 rounded text-xs transition-all"
                  style={{ color: "oklch(0.55 0 0)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "oklch(0.70 0.18 15)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "oklch(0.55 0 0)")}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
