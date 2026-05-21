import { useState } from "react";
import { trpc } from "@/lib/trpc";
import Header from "../components/Header";
import { useUndoRedo } from "../hooks/useUndoRedo";
import { Plus, Trash2, Save, Building2, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const { toast } = useToast();
  const { canUndo, canRedo, undo, redo, pushAction } = useUndoRedo();
  const utils = trpc.useUtils();

  const { data: fornecedores, isLoading } = trpc.fornecedores.list.useQuery();
  const createMutation = trpc.fornecedores.create.useMutation({
    onSuccess: () => utils.fornecedores.list.invalidate(),
  });
  const updateMutation = trpc.fornecedores.update.useMutation({
    onSuccess: () => utils.fornecedores.list.invalidate(),
  });
  const deleteMutation = trpc.fornecedores.delete.useMutation({
    onSuccess: () => utils.fornecedores.list.invalidate(),
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", contato: "", email: "", telefone: "" });
  const [saving, setSaving] = useState(false);

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
      toast({ title: `Fornecedor "${form.nome}" criado!` });
      setForm({ nome: "", contato: "", email: "", telefone: "" });
      setShowForm(false);
    } catch {
      toast({ title: "Erro ao criar fornecedor", variant: "destructive" });
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
    toast({ title: `Fornecedor "${nome}" removido.` });
  };

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.10 0 0)" }}>
      <Header canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "oklch(0.85 0.18 95)" }}>Painel Admin</h2>
            <p className="text-sm mt-1" style={{ color: "oklch(0.55 0 0)" }}>Gerencie os fornecedores do catálogo</p>
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
          <div className="rounded-xl border p-5 mb-6 space-y-4" style={{ background: "oklch(0.13 0 0)", borderColor: "oklch(0.85 0.18 95 / 0.40)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "oklch(0.85 0.18 95)" }}>Novo Fornecedor</h3>
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
                    style={{
                      background: "oklch(0.18 0 0)",
                      border: "1px solid oklch(0.28 0 0)",
                      color: "oklch(0.90 0 0)",
                    }}
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
              {fornecedores?.map((f, i) => (
                <div key={f.id}
                  className="flex items-center justify-between px-5 py-3 border-b last:border-0"
                  style={{ borderColor: "oklch(0.18 0 0)" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "oklch(0.88 0 0)" }}>{f.nome}</p>
                    <div className="flex gap-3 mt-0.5">
                      {f.contato && <span className="text-xs" style={{ color: "oklch(0.55 0 0)" }}>{f.contato}</span>}
                      {f.email && <span className="text-xs" style={{ color: "oklch(0.55 0 0)" }}>{f.email}</span>}
                      {f.telefone && <span className="text-xs" style={{ color: "oklch(0.55 0 0)" }}>{f.telefone}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(f.id, f.nome)}
                    className="p-2 rounded-lg transition-colors"
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
  );
}
